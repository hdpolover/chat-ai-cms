"""Chat router for handling chat requests."""
import uuid
from typing import AsyncGenerator, Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import select

from ..deps import APIKeyDep, DatabaseDep, RateLimitDep, TenantDep
from ..models import Bot, Conversation, Message
from ..schemas import ChatRequest, ChatResponse, ChatMessage, Citation, TokenUsage
from ..services.ai_provider_service import AIProviderService
from ..services.chat_service import ChatService
from ..services.retrieval_service import RetrievalService

router = APIRouter(tags=["Chat"])
logger = structlog.get_logger()


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
            selectinload(Bot.tenant)
        )
        .where(Bot.id == request.bot_id, Bot.is_active == True)
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


async def _chat_completion_public(
    request: ChatRequest,
    bot: Bot,
    db: DatabaseDep,
) -> ChatResponse:
    """Handle non-streaming public chat completion."""
    ai_provider_service = AIProviderService(db)
    retrieval_service = RetrievalService(db)
    
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
                tenant_id=bot.tenant_id,
                bot_scopes=bot.scopes,
                limit=5,
            )
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
        conversation, request.messages, response_message, citations, token_usage, db
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
        conversation, request.messages, response_message, citations, token_usage, db
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
        .options(selectinload(Bot.scopes))
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
        conversation, request.messages, response_message, citations, token_usage, db
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
        conversation, request.messages, response_message, citations, token_usage, db
    )
    
    # Send completion event
    yield f"data: {json.dumps({'type': 'done', 'usage': token_usage.dict()})}\n\n"


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
) -> None:
    """Save conversation messages to database."""
    # Get current message count for sequence numbering
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.sequence_number.desc())
        .limit(1)
    )
    last_message = result.scalar_one_or_none()
    next_sequence = (last_message.sequence_number + 1) if last_message else 1
    
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