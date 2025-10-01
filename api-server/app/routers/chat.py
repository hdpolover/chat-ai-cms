"""Chat router for handling chat requests."""
import asyncio
import uuid
from typing import AsyncGenerator, Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import select

from ..deps import APIKeyDep, DatabaseDep, RateLimitDep, TenantDep
from ..models import Bot, Conversation, Message
from ..schemas import ChatRequest, ChatResponse, ChatMessage, Citation, TokenUsage
from ..services.ai_provider_service import AIProviderService
from ..services.chat_service import ChatService
from ..services.retrieval_service import RetrievalService
from ..services.guardrail_service import GuardrailService
from ..services.title_generation_service import TitleGenerationService

router = APIRouter(tags=["Chat"])
logger = structlog.get_logger()


# New efficient chat request schema
class EfficientChatRequest(BaseModel):
    """Efficient chat request - only sends new message, server retrieves context."""
    bot_id: uuid.UUID
    message: str
    session_id: Optional[str] = None
    context_limit: int = 10
    stream: bool = False
    metadata: Optional[dict] = None


@router.post("/chat/public", response_model=ChatResponse)
async def chat_public(
    request: ChatRequest,
    db: DatabaseDep,
):
    """Public chat endpoint for embedded chatbots (no authentication required)."""
    # Validate bot exists and get AI provider
    result = await db.execute(
        select(Bot)
        .options(
            selectinload(Bot.scopes),
            selectinload(Bot.ai_provider),
            selectinload(Bot.tenant),
            selectinload(Bot.datasets)  # Load bot's datasets
        )
        .where(Bot.id == request.bot_id, Bot.is_active == True)
    )
    
    # Auto-retrieve conversation context if session_id is provided
    if request.session_id and len(request.messages) == 1:
        # Widget is sending single message - retrieve conversation context
        try:
            context_messages = await _get_conversation_context(
                session_id=request.session_id,
                bot_id=request.bot_id,
                limit=10,
                db=db
            )
            # Combine context with new message
            if context_messages:
                request.messages = context_messages + request.messages
                logger.info(
                    "Retrieved conversation context for public chat",
                    session_id=request.session_id,
                    context_messages=len(context_messages),
                    total_messages=len(request.messages)
                )
        except Exception as e:
            logger.warning(
                "Failed to retrieve conversation context, continuing with single message",
                session_id=request.session_id,
                error=str(e)
            )
    bot = result.scalar_one_or_none()
    
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot not found or not active",
        )
    
    if not bot.ai_provider:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Bot has no AI provider configured",
        )
    
    if not bot.ai_provider.is_active:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Bot's AI provider is not active",
        )
    
    # Handle streaming vs non-streaming
    if request.stream:
        return StreamingResponse(
            _chat_stream_public(request, bot, db),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        )
    else:
        return await _chat_completion_public(request, bot, db)


@router.post("/chat/efficient", response_model=ChatResponse)
async def chat_efficient(
    request: EfficientChatRequest,
    db: DatabaseDep,
):
    """Efficient chat endpoint - server retrieves conversation context automatically."""
    # Validate bot exists and get AI provider
    result = await db.execute(
        select(Bot)
        .options(
            selectinload(Bot.scopes),
            selectinload(Bot.ai_provider),
            selectinload(Bot.tenant),
            selectinload(Bot.datasets)
        )
        .where(Bot.id == request.bot_id, Bot.is_active == True)
    )
    bot = result.scalar_one_or_none()
    
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot not found or not active",
        )
    
    if not bot.ai_provider or not bot.ai_provider.is_active:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Bot has no active AI provider configured",
        )
    
    # 🚀 Server retrieves conversation context automatically
    context_messages = await _get_conversation_context(
        session_id=request.session_id,
        bot_id=request.bot_id,
        limit=request.context_limit,
        db=db
    )
    
    # Add new user message to context
    context_messages.append(ChatMessage(
        role="user",
        content=request.message
    ))
    
    # Validate user query against bot guardrails (using new message)
    guardrail_service = GuardrailService(db)
    is_allowed, refusal_message = await guardrail_service.validate_query(
        bot, request.message
    )
    
    if not is_allowed:
        # Return refusal message without processing
        return ChatResponse(
            message=ChatMessage(role="assistant", content=refusal_message),
            citations=[],
            session_id=request.session_id or str(uuid.uuid4()),
            usage=TokenUsage(prompt_tokens=0, completion_tokens=0, total_tokens=0)
        )
    
    # Get or create conversation for session management
    conversation = await _get_or_create_conversation(
        request.session_id, bot, db
    )
    
    # Retrieve relevant context from knowledge base
    retrieval_service = RetrievalService(db)
    citations = await retrieval_service.retrieve_context(
        query=request.message,
        tenant_id=bot.tenant_id,
        bot_scopes=bot.scopes,
        bot_datasets=bot.datasets,
        limit=5,
    )
    
    # Generate response using AI provider service with full context
    ai_provider_service = AIProviderService(db)
    response_message, token_usage = await ai_provider_service.generate_response(
        bot=bot,
        messages=context_messages,  # Full context retrieved from database
        context_citations=citations,
        metadata=request.metadata,
    )
    
    # Save conversation messages
    await _save_conversation_messages(
        conversation, [context_messages[-1]], response_message, citations, token_usage, db, bot
    )
    
    logger.info(
        "Efficient chat completed",
        bot_id=bot.id,
        session_id=conversation.id,
        context_messages=len(context_messages),
        new_message_length=len(request.message)
    )
    
    return ChatResponse(
        session_id=conversation.id,
        message=response_message,
        citations=citations,
        usage=token_usage,
        metadata=request.metadata or {},
    )


async def _chat_completion_public(
    request: ChatRequest,
    bot: Bot,
    db: DatabaseDep,
) -> ChatResponse:
    """Handle non-streaming public chat completion."""
    ai_provider_service = AIProviderService(db)
    retrieval_service = RetrievalService(db)
    guardrail_service = GuardrailService(db)
    
    # Validate user query against bot guardrails
    if request.messages:
        last_user_message = next(
            (msg for msg in reversed(request.messages) if msg.role == "user"),
            None
        )
        if last_user_message:
            logger.info("🛡️ GUARDRAIL CHECK", query=last_user_message.content[:50], bot_id=bot.id)
            is_allowed, refusal_message = await guardrail_service.validate_query(
                bot, last_user_message.content
            )
            logger.info("🛡️ GUARDRAIL RESULT", is_allowed=is_allowed, has_refusal=bool(refusal_message))
            # Check if guardrails are being too restrictive
            if not is_allowed and refusal_message:
                # Log the specific issue for debugging
                logger.warning("Query blocked by guardrails - investigating if legitimate", 
                             query=last_user_message.content[:50], 
                             bot_name=bot.name,
                             refusal_preview=refusal_message[:100])
            
            if not is_allowed:
                # Return refusal message without processing
                logger.info("🛡️ QUERY BLOCKED BY GUARDRAILS", query=last_user_message.content[:50])
                return ChatResponse(
                    message=ChatMessage(role="assistant", content=refusal_message),
                    citations=[],
                    session_id=request.session_id or str(uuid.uuid4()),
                    usage=TokenUsage(prompt_tokens=0, completion_tokens=0, total_tokens=0)
                )
    
    # Get or create conversation
    conversation = await _get_or_create_conversation(
        request.session_id, bot, db
    )
    
    # Retrieve relevant context
    if request.messages:
        last_user_message = next(
            (msg for msg in reversed(request.messages) if msg.role == "user"),
            None
        )
        if last_user_message:
            logger.info("📚 CALLING RETRIEVAL SERVICE", 
                       query=last_user_message.content[:50],
                       bot_id=bot.id,
                       tenant_id=bot.tenant_id,
                       has_scopes=len(bot.scopes) if bot.scopes else 0,
                       has_datasets=len(bot.datasets) if bot.datasets else 0)
            
            citations = await retrieval_service.retrieve_context(
                query=last_user_message.content,
                tenant_id=bot.tenant_id,
                bot_scopes=bot.scopes,
                bot_datasets=bot.datasets,
                limit=5,
            )
            
            logger.info("📚 RETRIEVAL RESULT", 
                       query=last_user_message.content[:50],
                       citations_found=len(citations),
                       bot_id=bot.id)
        else:
            citations = []
    else:
        citations = []
    
    # Generate response using AI provider service
    response_message, token_usage = await ai_provider_service.generate_response(
        bot=bot,
        messages=request.messages,
        context_citations=citations,
        metadata=request.metadata,
    )
    
    # Save conversation messages
    await _save_conversation_messages(
        conversation, request.messages, response_message, citations, token_usage, db, bot
    )
    
    return ChatResponse(
        session_id=conversation.id,
        message=response_message,
        citations=citations,
        usage=token_usage,
        metadata=request.metadata or {},
    )


async def _chat_stream_public(
    request: ChatRequest,
    bot: Bot,
    db: DatabaseDep,
) -> AsyncGenerator[str, None]:
    """Handle streaming public chat completion."""
    import json
    
    ai_provider_service = AIProviderService(db)
    retrieval_service = RetrievalService(db)
    guardrail_service = GuardrailService(db)
    
    # Validate user query against bot guardrails
    if request.messages:
        last_user_message = next(
            (msg for msg in reversed(request.messages) if msg.role == "user"),
            None
        )
        if last_user_message:
            is_allowed, refusal_message = await guardrail_service.validate_query(
                bot, last_user_message.content
            )
            if not is_allowed:
                # Stream refusal message
                yield f"data: {json.dumps({'type': 'start', 'session_id': request.session_id or 'temp'})}\n\n"
                yield f"data: {json.dumps({'type': 'content', 'content': refusal_message})}\n\n"
                yield f"data: {json.dumps({'type': 'end', 'usage': {'prompt_tokens': 0, 'completion_tokens': 0, 'total_tokens': 0}})}\n\n"
                return
    
    # Get or create conversation
    conversation = await _get_or_create_conversation(
        request.session_id, bot, db
    )
    
    # Send initial event
    yield f"data: {json.dumps({'type': 'start', 'session_id': conversation.id})}\n\n"
    
    # Retrieve relevant context
    if request.messages:
        last_user_message = next(
            (msg for msg in reversed(request.messages) if msg.role == "user"),
            None
        )
        if last_user_message:
            citations = await retrieval_service.retrieve_context(
                query=last_user_message.content,
                tenant_id=bot.tenant_id,
                bot_scopes=bot.scopes,
                limit=5,
            )
        else:
            citations = []
    else:
        citations = []
    
    # Send citations if available
    if citations:
        yield f"data: {json.dumps({'type': 'citations', 'citations': [c.dict() for c in citations]})}\n\n"
    
    # Stream response
    full_content = ""
    token_usage = TokenUsage()
    
    async for chunk in ai_provider_service.generate_response_stream(
        bot=bot,
        messages=request.messages,
        context_citations=citations,
        metadata=request.metadata,
    ):
        if chunk.content:
            full_content += chunk.content
            yield f"data: {json.dumps({'type': 'token', 'content': chunk.content})}\n\n"
        
        if chunk.usage:
            token_usage = chunk.usage
    
    # Create final response message
    response_message = ChatMessage(role="assistant", content=full_content)
    
    # Save conversation messages
    await _save_conversation_messages(
        conversation, request.messages, response_message, citations, token_usage, db, bot
    )
    
    # Send completion event
    yield f"data: {json.dumps({'type': 'done', 'usage': token_usage.dict()})}\n\n"


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: DatabaseDep,
    api_key: APIKeyDep,
    tenant: TenantDep,
    _: RateLimitDep,  # Rate limiting dependency
):
    """Chat endpoint for conversing with bots."""
    # Validate bot access
    result = await db.execute(
        select(Bot)
        .options(
            selectinload(Bot.scopes),
            selectinload(Bot.datasets)
        )
        .where(Bot.id == request.bot_id, Bot.tenant_id == tenant.id, Bot.is_active == True)
    )
    bot = result.scalar_one_or_none()
    
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot not found or not accessible",
        )
    
    # Handle streaming vs non-streaming
    if request.stream:
        return StreamingResponse(
            _chat_stream(request, bot, db, api_key, tenant),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        )
    else:
        return await _chat_completion(request, bot, db, api_key, tenant)


async def _chat_completion(
    request: ChatRequest,
    bot: Bot,
    db: DatabaseDep,
    api_key: APIKeyDep,
    tenant: TenantDep,
) -> ChatResponse:
    """Handle non-streaming chat completion."""
    chat_service = ChatService(db)
    retrieval_service = RetrievalService(db)
    guardrail_service = GuardrailService(db)
    
    # Validate user query against bot guardrails
    if request.messages:
        last_user_message = next(
            (msg for msg in reversed(request.messages) if msg.role == "user"),
            None
        )
        if last_user_message:
            is_allowed, refusal_message = await guardrail_service.validate_query(
                bot, last_user_message.content
            )
            if not is_allowed:
                # Return refusal message without processing
                return ChatResponse(
                    message=ChatMessage(role="assistant", content=refusal_message),
                    citations=[],
                    session_id=request.session_id or str(uuid.uuid4()),
                    usage=TokenUsage(prompt_tokens=0, completion_tokens=0, total_tokens=0)
                )
    
    # Get or create conversation
    conversation = await _get_or_create_conversation(
        request.session_id, bot, db
    )
    
    # Retrieve relevant context
    if request.messages:
        last_user_message = next(
            (msg for msg in reversed(request.messages) if msg.role == "user"),
            None
        )
        if last_user_message:
            citations = await retrieval_service.retrieve_context(
                query=last_user_message.content,
                tenant_id=tenant.id,
                bot_scopes=bot.scopes,
                bot_datasets=bot.datasets,
                limit=5,
            )
        else:
            citations = []
    else:
        citations = []
    
    # Generate response
    response_message, token_usage = await chat_service.generate_response(
        bot=bot,
        messages=request.messages,
        context_citations=citations,
        metadata=request.metadata,
    )
    
    # Save conversation messages
    await _save_conversation_messages(
        conversation, request.messages, response_message, citations, token_usage, db, bot
    )
    
    return ChatResponse(
        session_id=conversation.id,
        message=response_message,
        citations=citations,
        usage=token_usage,
        metadata=request.metadata or {},
    )


async def _chat_stream(
    request: ChatRequest,
    bot: Bot,
    db: DatabaseDep,
    api_key: APIKeyDep,
    tenant: TenantDep,
) -> AsyncGenerator[str, None]:
    """Handle streaming chat completion."""
    import json
    
    chat_service = ChatService(db)
    retrieval_service = RetrievalService(db)
    guardrail_service = GuardrailService(db)
    
    # Validate user query against bot guardrails
    if request.messages:
        last_user_message = next(
            (msg for msg in reversed(request.messages) if msg.role == "user"),
            None
        )
        if last_user_message:
            is_allowed, refusal_message = await guardrail_service.validate_query(
                bot, last_user_message.content
            )
            if not is_allowed:
                # Stream refusal message
                yield f"data: {json.dumps({'type': 'start', 'session_id': request.session_id or 'temp'})}\n\n"
                yield f"data: {json.dumps({'type': 'content', 'content': refusal_message})}\n\n"
                yield f"data: {json.dumps({'type': 'end', 'usage': {'prompt_tokens': 0, 'completion_tokens': 0, 'total_tokens': 0}})}\n\n"
                return
    
    # Get or create conversation
    conversation = await _get_or_create_conversation(
        request.session_id, bot, db
    )
    
    # Send initial event
    yield f"data: {json.dumps({'type': 'start', 'session_id': conversation.id})}\n\n"
    
    # Retrieve relevant context
    if request.messages:
        last_user_message = next(
            (msg for msg in reversed(request.messages) if msg.role == "user"),
            None
        )
        if last_user_message:
            citations = await retrieval_service.retrieve_context(
                query=last_user_message.content,
                tenant_id=tenant.id,
                bot_scopes=bot.scopes,
                bot_datasets=bot.datasets,
                limit=5,
            )
        else:
            citations = []
    else:
        citations = []
    
    # Send citations if available
    if citations:
        yield f"data: {json.dumps({'type': 'citations', 'citations': [c.dict() for c in citations]})}\n\n"
    
    # Stream response
    full_content = ""
    token_usage = TokenUsage()
    
    async for chunk in chat_service.generate_response_stream(
        bot=bot,
        messages=request.messages,
        context_citations=citations,
        metadata=request.metadata,
    ):
        if chunk.content:
            full_content += chunk.content
            yield f"data: {json.dumps({'type': 'token', 'content': chunk.content})}\n\n"
        
        if chunk.usage:
            token_usage = chunk.usage
    
    # Create final response message
    response_message = ChatMessage(role="assistant", content=full_content)
    
    # Save conversation messages
    await _save_conversation_messages(
        conversation, request.messages, response_message, citations, token_usage, db, bot
    )
    
    # Send completion event
    yield f"data: {json.dumps({'type': 'done', 'usage': token_usage.dict()})}\n\n"


async def _get_conversation_context(
    session_id: Optional[str],
    bot_id: uuid.UUID,
    limit: int,
    db: DatabaseDep,
) -> list[ChatMessage]:
    """Retrieve conversation context from database efficiently."""
    if not session_id:
        return []  # New conversation, no context
    
    try:
        # Validate session_id is a proper UUID
        try:
            uuid.UUID(session_id)
        except ValueError:
            logger.warning("Invalid session ID format", session_id=session_id)
            return []  # Invalid session ID format
            
        # Get recent messages from database
        result = await db.execute(
            select(Message)
            .join(Conversation)
            .where(
                Conversation.id == session_id,
                Conversation.bot_id == bot_id,
                Conversation.is_active == True
            )
            .order_by(Message.sequence_number.desc())
            .limit(limit * 2)  # Get last N exchanges (user + assistant pairs)
        )
        
        messages = result.scalars().all()
        
        # Convert to ChatMessage format in chronological order
        context_messages = []
        for msg in reversed(messages):  # Reverse to chronological order
            context_messages.append(ChatMessage(
                role=msg.role,
                content=msg.content
            ))
        
        logger.info(
            "Retrieved conversation context",
            session_id=session_id,
            message_count=len(context_messages)
        )
        
        return context_messages
        
    except Exception as e:
        logger.error(
            "Failed to retrieve conversation context",
            session_id=session_id,
            error=str(e)
        )
        return []  # Fallback to empty context


async def _get_or_create_conversation(
    session_id: Optional[str],
    bot: Bot,
    db: DatabaseDep,
) -> Conversation:
    """Get existing conversation or create new one."""
    if session_id:
        # Try to get existing conversation
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == session_id,
                Conversation.bot_id == bot.id,
                Conversation.is_active == True,
            )
        )
        conversation = result.scalar_one_or_none()
        if conversation:
            return conversation
    
    # Create new conversation
    conversation = Conversation(
        id=str(uuid.uuid4()),
        bot_id=bot.id,
        session_id=session_id,
        is_active=True,
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    
    return conversation


async def _save_conversation_messages(
    conversation: Conversation,
    request_messages: list[ChatMessage],
    response_message: ChatMessage,
    citations: list[Citation],
    token_usage: TokenUsage,
    db: DatabaseDep,
    bot: Optional[Bot] = None,
) -> None:
    """Save conversation messages to database and trigger title generation if needed."""
    # Get current message count for sequence numbering
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.sequence_number.desc())
        .limit(1)
    )
    last_message = result.scalar_one_or_none()
    next_sequence = (last_message.sequence_number + 1) if last_message else 1
    
    # Check if this is the first exchange (for title generation)
    is_first_exchange = next_sequence == 1
    
    # Save request messages (if not already saved)
    for msg in request_messages:
        message = Message(
            id=str(uuid.uuid4()),
            conversation_id=conversation.id,
            role=msg.role,
            content=msg.content,
            sequence_number=next_sequence,
        )
        db.add(message)
        next_sequence += 1
    
    # Save response message
    response_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation.id,
        role=response_message.role,
        content=response_message.content,
        citations=[c.dict() for c in citations],
        token_usage=token_usage.dict(),
        sequence_number=next_sequence,
    )
    db.add(response_msg)
    
    await db.commit()
    
    # Schedule title generation after first complete exchange (background task)
    if is_first_exchange and bot and not conversation.title:
        logger.info("Scheduling title generation for new conversation", 
                   conversation_id=conversation.id, bot_id=bot.id)
        
        # Use asyncio to schedule title generation without blocking
        asyncio.create_task(_generate_title_background(conversation.id))


async def _generate_title_background(conversation_id: str, db_session: DatabaseDep = None) -> None:
    """Generate conversation title in the background."""
    try:
        # Small delay to ensure message commit is fully processed
        await asyncio.sleep(2)
        
        # Create a new database session for the background task
        from ..deps import get_db
        async for new_db in get_db():
            try:
                title_service = TitleGenerationService(new_db)
                await title_service.generate_title_for_conversation(conversation_id)
                
                logger.info("Background title generation completed", conversation_id=conversation_id)
                break
            except Exception as e:
                logger.error("Background title generation failed in session", 
                            conversation_id=conversation_id, error=str(e))
            finally:
                await new_db.close()
                
    except Exception as e:
        logger.error("Background title generation setup failed", 
                    conversation_id=conversation_id, error=str(e))