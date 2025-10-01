"""Tenant conversation management routes."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

import structlog
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session, joinedload

from ...db import get_sync_db
from ...models import Tenant, Bot, Conversation, Message
from ...schemas import ChatRequest, ChatResponse, ChatMessage
from .auth import get_current_tenant

logger = structlog.get_logger()

router = APIRouter(prefix="/v1/tenant", tags=["Tenant - Conversations"])


# Response schemas
class ConversationResponse(BaseModel):
    id: str
    bot_id: str
    title: Optional[str] = None
    session_id: Optional[str] = None
    is_active: bool
    message_count: int
    last_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    citations: Optional[List[dict]] = None
    token_usage: Optional[dict] = None
    sequence_number: int
    created_at: datetime

    class Config:
        from_attributes = True


class StartConversationRequest(BaseModel):
    message: str
    metadata: Optional[dict] = None


class SendMessageRequest(BaseModel):
    message: str


class StartConversationResponse(BaseModel):
    conversation_id: str
    message: MessageResponse


@router.get("/bots/{bot_id}/conversations", response_model=List[ConversationResponse])
async def get_bot_conversations(
    bot_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Get conversations for a specific bot."""
    
    # Verify bot belongs to tenant
    bot = db.query(Bot).filter(
        Bot.id == bot_id,
        Bot.tenant_id == current_tenant.id
    ).first()
    
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot not found"
        )
    
    # Get conversations with message counts
    conversations = db.query(Conversation).filter(
        Conversation.bot_id == bot_id
    ).order_by(desc(Conversation.updated_at)).offset(skip).limit(limit).all()
    
    # Build response with message counts and last message
    result = []
    for conv in conversations:
        # Get message count
        message_count = db.query(func.count(Message.id)).filter(
            Message.conversation_id == conv.id
        ).scalar() or 0
        
        # Get last message
        last_message_obj = db.query(Message).filter(
            Message.conversation_id == conv.id
        ).order_by(desc(Message.sequence_number)).first()
        
        last_message = last_message_obj.content[:100] + "..." if last_message_obj and len(last_message_obj.content) > 100 else (last_message_obj.content if last_message_obj else None)
        
        result.append(ConversationResponse(
            id=str(conv.id),
            bot_id=str(conv.bot_id),
            title=conv.title,
            session_id=conv.session_id,
            is_active=conv.is_active,
            message_count=message_count,
            last_message=last_message,
            created_at=conv.created_at,
            updated_at=conv.updated_at
        ))
    
    return result


@router.post("/bots/{bot_id}/conversations", response_model=StartConversationResponse)
async def start_conversation(
    bot_id: UUID,
    request: StartConversationRequest,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Start a new conversation with a bot."""
    
    # Verify bot belongs to tenant and is active
    bot = db.query(Bot).options(
        joinedload(Bot.ai_provider)
    ).filter(
        Bot.id == bot_id,
        Bot.tenant_id == current_tenant.id,
        Bot.is_active == True
    ).first()
    
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot not found or not active"
        )
    
    if not bot.ai_provider or not bot.ai_provider.is_active:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Bot's AI provider is not available"
        )
    
    # Create new conversation
    conversation = Conversation(
        id=uuid4(),
        bot_id=bot_id,
        title=f"Chat with {bot.name}",
        is_active=True,
        metadata=request.metadata or {}
    )
    
    db.add(conversation)
    db.flush()  # Get the ID without committing
    
    # Use the existing chat service to handle the message
    from ...services.chat_service import ChatService
    from ...services.retrieval_service import RetrievalService
    
    chat_service = ChatService(db)
    retrieval_service = RetrievalService(db)
    
    # Create chat message
    user_message = ChatMessage(role="user", content=request.message)
    
    # Get context for the message
    citations = await retrieval_service.retrieve_context(
        query=request.message,
        tenant_id=current_tenant.id,
        bot_scopes=bot.scopes,
        bot_datasets=bot.datasets,
        limit=5,
    )
    
    # Generate response
    response_message, token_usage = await chat_service.generate_response(
        bot=bot,
        messages=[user_message],
        context_citations=citations,
        metadata=request.metadata,
    )
    
    # Save messages
    # Save user message
    user_msg = Message(
        id=uuid4(),
        conversation_id=conversation.id,
        role="user",
        content=request.message,
        sequence_number=1,
        metadata=request.metadata or {}
    )
    
    # Save bot response
    bot_msg = Message(
        id=uuid4(),
        conversation_id=conversation.id,
        role="assistant",
        content=response_message.content,
        citations=[c.dict() for c in citations] if citations else [],
        token_usage=token_usage.dict() if token_usage else {},
        sequence_number=2
    )
    
    db.add(user_msg)
    db.add(bot_msg)
    db.commit()
    
    return StartConversationResponse(
        conversation_id=str(conversation.id),
        message=MessageResponse(
            id=str(bot_msg.id),
            conversation_id=str(conversation.id),
            role=bot_msg.role,
            content=bot_msg.content,
            citations=bot_msg.citations,
            token_usage=bot_msg.token_usage,
            sequence_number=bot_msg.sequence_number,
            created_at=bot_msg.created_at
        )
    )


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(
    conversation_id: UUID,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Get all messages in a conversation."""
    
    # Verify conversation belongs to tenant
    conversation = db.query(Conversation).join(Bot).filter(
        Conversation.id == conversation_id,
        Bot.tenant_id == current_tenant.id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Get messages
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.sequence_number).all()
    
    return [
        MessageResponse(
            id=str(msg.id),
            conversation_id=str(msg.conversation_id),
            role=msg.role,
            content=msg.content,
            citations=msg.citations,
            token_usage=msg.token_usage,
            sequence_number=msg.sequence_number,
            created_at=msg.created_at
        ) for msg in messages
    ]


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: UUID,
    request: SendMessageRequest,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Send a message to an existing conversation."""
    
    # Verify conversation belongs to tenant
    conversation = db.query(Conversation).options(
        joinedload(Conversation.bot).joinedload(Bot.ai_provider),
        joinedload(Conversation.bot).joinedload(Bot.scopes),
        joinedload(Conversation.bot).joinedload(Bot.datasets)
    ).join(Bot).filter(
        Conversation.id == conversation_id,
        Bot.tenant_id == current_tenant.id,
        Conversation.is_active == True
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or not active"
        )
    
    bot = conversation.bot
    
    if not bot.ai_provider or not bot.ai_provider.is_active:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Bot's AI provider is not available"
        )
    
    # Get conversation history
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.sequence_number).all()
    
    # Convert to chat messages
    chat_messages = [
        ChatMessage(role=msg.role, content=msg.content) for msg in messages
    ]
    
    # Add new user message
    user_message = ChatMessage(role="user", content=request.message)
    chat_messages.append(user_message)
    
    # Use chat service to generate response
    from ...services.chat_service import ChatService
    from ...services.retrieval_service import RetrievalService
    
    chat_service = ChatService(db)
    retrieval_service = RetrievalService(db)
    
    # Get context for the message
    citations = await retrieval_service.retrieve_context(
        query=request.message,
        tenant_id=current_tenant.id,
        bot_scopes=bot.scopes,
        bot_datasets=bot.datasets,
        limit=5,
    )
    
    # Generate response
    response_message, token_usage = await chat_service.generate_response(
        bot=bot,
        messages=chat_messages,
        context_citations=citations,
    )
    
    # Get next sequence numbers
    last_message = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(desc(Message.sequence_number)).first()
    
    next_seq = (last_message.sequence_number + 1) if last_message else 1
    
    # Save user message
    user_msg = Message(
        id=uuid4(),
        conversation_id=conversation_id,
        role="user",
        content=request.message,
        sequence_number=next_seq
    )
    
    # Save bot response
    bot_msg = Message(
        id=uuid4(),
        conversation_id=conversation_id,
        role="assistant",
        content=response_message.content,
        citations=[c.dict() for c in citations] if citations else [],
        token_usage=token_usage.dict() if token_usage else {},
        sequence_number=next_seq + 1
    )
    
    db.add(user_msg)
    db.add(bot_msg)
    
    # Update conversation timestamp
    conversation.updated_at = datetime.utcnow()
    
    db.commit()
    
    return MessageResponse(
        id=str(bot_msg.id),
        conversation_id=str(conversation_id),
        role=bot_msg.role,
        content=bot_msg.content,
        citations=bot_msg.citations,
        token_usage=bot_msg.token_usage,
        sequence_number=bot_msg.sequence_number,
        created_at=bot_msg.created_at
    )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Delete a conversation."""
    
    # Verify conversation belongs to tenant
    conversation = db.query(Conversation).join(Bot).filter(
        Conversation.id == conversation_id,
        Bot.tenant_id == current_tenant.id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Delete all messages first
    db.query(Message).filter(Message.conversation_id == conversation_id).delete()
    
    # Delete conversation
    db.delete(conversation)
    db.commit()
    
    return {"message": "Conversation deleted successfully"}


# Title Management Endpoints

class UpdateTitleRequest(BaseModel):
    title: str

    class Config:
        str_strip_whitespace = True

class RegenerateTitleResponse(BaseModel):
    conversation_id: str
    old_title: Optional[str]
    new_title: Optional[str]
    success: bool
    message: str


@router.put("/conversations/{conversation_id}/title")
async def update_conversation_title(
    conversation_id: UUID,
    request: UpdateTitleRequest,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Manually update conversation title."""
    
    # Verify conversation belongs to tenant
    conversation = db.query(Conversation).join(Bot).filter(
        Conversation.id == conversation_id,
        Bot.tenant_id == current_tenant.id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Validate title
    if len(request.title) < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title cannot be empty"
        )
    
    if len(request.title) > 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title cannot exceed 200 characters"
        )
    
    # Update title
    old_title = conversation.title
    conversation.title = request.title
    conversation.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "conversation_id": str(conversation_id),
        "old_title": old_title,
        "new_title": conversation.title,
        "message": "Title updated successfully"
    }


@router.post("/conversations/{conversation_id}/regenerate-title", response_model=RegenerateTitleResponse)
async def regenerate_conversation_title(
    conversation_id: UUID,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Automatically regenerate conversation title using AI."""
    
    # Verify conversation belongs to tenant
    conversation = db.query(Conversation).join(Bot).filter(
        Conversation.id == conversation_id,
        Bot.tenant_id == current_tenant.id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Check if conversation has enough messages
    message_count = db.query(func.count(Message.id)).filter(
        Message.conversation_id == conversation_id
    ).scalar()
    
    if message_count < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Conversation needs at least 2 messages to generate a title"
        )
    
    # Use title generation service with new async session
    from ...services.title_generation_service import TitleGenerationService
    from ...deps import get_db
    
    old_title = conversation.title
    
    # Create async session for title generation
    async for async_db in get_db():
        try:
            title_service = TitleGenerationService(async_db)
            new_title = await title_service.generate_title_for_conversation(
                str(conversation_id), force_regenerate=True
            )
            break
        except Exception as title_error:
            logger.error("Title generation service error", error=str(title_error))
            new_title = None
        finally:
            await async_db.close()
    
    try:
        pass  # Title generation completed
        
        if new_title:
            return RegenerateTitleResponse(
                conversation_id=str(conversation_id),
                old_title=old_title,
                new_title=new_title,
                success=True,
                message="Title regenerated successfully"
            )
        else:
            return RegenerateTitleResponse(
                conversation_id=str(conversation_id),
                old_title=old_title,
                new_title=None,
                success=False,
                message="Failed to generate new title"
            )
            
    except Exception as e:
        return RegenerateTitleResponse(
            conversation_id=str(conversation_id),
            old_title=old_title,
            new_title=None,
            success=False,
            message=f"Error generating title: {str(e)}"
        )


@router.post("/conversations/regenerate-titles-batch")
async def regenerate_titles_batch(
    conversation_ids: List[UUID],
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Regenerate titles for multiple conversations in batch."""
    
    if len(conversation_ids) > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot regenerate more than 20 titles at once"
        )
    
    # Verify all conversations belong to tenant
    valid_conversations = db.query(Conversation.id).join(Bot).filter(
        Conversation.id.in_(conversation_ids),
        Bot.tenant_id == current_tenant.id
    ).all()
    
    valid_ids = [str(conv.id) for conv in valid_conversations]
    
    if len(valid_ids) != len(conversation_ids):
        invalid_ids = set(str(cid) for cid in conversation_ids) - set(valid_ids)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Some conversations not found: {list(invalid_ids)}"
        )
    
    # Use title generation service for batch processing with async session
    from ...services.title_generation_service import TitleGenerationService
    from ...deps import get_db
    
    # Create async session for title generation
    async for async_db in get_db():
        try:
            title_service = TitleGenerationService(async_db)
            results = await title_service.regenerate_titles_batch(
                valid_ids, max_concurrent=3
            )
            break
        except Exception as batch_error:
            logger.error("Batch title generation error", error=str(batch_error))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Batch title regeneration failed: {str(batch_error)}"
            )
        finally:
            await async_db.close()
    
    try:
        pass  # Batch processing completed
        
        return {
            "total_requested": len(conversation_ids),
            "success_count": len(results["success"]),
            "failed_count": len(results["failed"]),
            "success_results": results["success"],
            "failed_results": results["failed"],
            "message": f"Batch regeneration completed: {len(results['success'])} successful, {len(results['failed'])} failed"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch title regeneration failed: {str(e)}"
        )