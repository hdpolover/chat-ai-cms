"""Tenant dashboard routes with statistics and analytics."""

from datetime import datetime, timedelta, date
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, func, text
from sqlalchemy.orm import Session

from ...db import get_sync_db
from ...models import Tenant, Bot, Conversation, Message, Document, Chunk, Dataset, APIKey
from .auth import get_current_tenant

router = APIRouter(prefix="/v1/tenant", tags=["Tenant - Dashboard"])


class TenantDashboardStats(BaseModel):
    totalBots: int
    totalDocuments: int
    totalConversations: int
    totalApiKeys: int
    activeConversations: int
    documentsProcessed: int


class BotSummary(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    model: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    conversations_count: int = 0
    last_used_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ConversationSummary(BaseModel):
    id: str
    bot_id: str
    title: Optional[str] = None
    session_id: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    messages_count: int = 0

    class Config:
        from_attributes = True


class DocumentSummary(BaseModel):
    id: str
    title: str
    status: str
    created_at: datetime
    file_size: Optional[int] = None
    content_type: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/dashboard/stats", response_model=TenantDashboardStats)
async def get_tenant_dashboard_stats(
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    """Get tenant dashboard statistics."""
    tenant_id = current_tenant.id
    
    # Count bots
    total_bots = db.query(func.count(Bot.id)).filter(Bot.tenant_id == tenant_id).scalar() or 0
    
    # Count documents
    total_documents = db.query(func.count(Document.id)).join(Dataset).filter(
        Dataset.tenant_id == tenant_id
    ).scalar() or 0
    
    # Count conversations
    total_conversations = db.query(func.count(Conversation.id)).join(Bot).filter(
        Bot.tenant_id == tenant_id
    ).scalar() or 0
    
    # Count API keys
    total_api_keys = db.query(func.count(APIKey.id)).filter(
        APIKey.tenant_id == tenant_id
    ).scalar() or 0
    
    # Count active conversations (last 24 hours)
    yesterday = datetime.now() - timedelta(days=1)
    active_conversations = db.query(func.count(Conversation.id)).join(Bot).filter(
        Bot.tenant_id == tenant_id,
        Conversation.updated_at >= yesterday,
        Conversation.is_active == True
    ).scalar() or 0
    
    # Count processed documents
    documents_processed = db.query(func.count(Document.id)).join(Dataset).filter(
        Dataset.tenant_id == tenant_id,
        Document.status == 'completed'
    ).scalar() or 0
    
    return TenantDashboardStats(
        totalBots=total_bots,
        totalDocuments=total_documents,
        totalConversations=total_conversations,
        totalApiKeys=total_api_keys,
        activeConversations=active_conversations,
        documentsProcessed=documents_processed
    )


@router.get("/bots", response_model=List[BotSummary])
async def get_tenant_bots(
    limit: int = Query(10, ge=1, le=100),
    order_by: str = Query("updated_at", regex="^(name|created_at|updated_at)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    """Get tenant bots with conversation counts."""
    tenant_id = current_tenant.id
    
    # Build the query
    query = db.query(Bot).filter(Bot.tenant_id == tenant_id)
    
    # Apply ordering
    if order_by == "name":
        query = query.order_by(Bot.name.desc() if order == "desc" else Bot.name.asc())
    elif order_by == "created_at":
        query = query.order_by(Bot.created_at.desc() if order == "desc" else Bot.created_at.asc())
    else:  # updated_at
        query = query.order_by(Bot.updated_at.desc() if order == "desc" else Bot.updated_at.asc())
    
    bots = query.limit(limit).all()
    
    # Get conversation counts for each bot
    result = []
    for bot in bots:
        conv_count = db.query(func.count(Conversation.id)).filter(
            Conversation.bot_id == bot.id
        ).scalar() or 0
        
        # Get last conversation time
        last_conv = db.query(func.max(Conversation.created_at)).filter(
            Conversation.bot_id == bot.id
        ).scalar()
        
        result.append(BotSummary(
            id=bot.id,
            name=bot.name,
            description=bot.description,
            model=bot.model,
            is_active=bot.is_active,
            created_at=bot.created_at,
            updated_at=bot.updated_at,
            conversations_count=conv_count,
            last_used_at=last_conv
        ))
    
    return result


@router.get("/chats", response_model=List[ConversationSummary])
async def get_tenant_conversations(
    limit: int = Query(10, ge=1, le=100),
    order_by: str = Query("created_at", regex="^(created_at|updated_at)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    """Get tenant conversations."""
    tenant_id = current_tenant.id
    
    # Build the query
    query = db.query(Conversation).join(Bot).filter(Bot.tenant_id == tenant_id)
    
    # Apply ordering
    if order_by == "created_at":
        query = query.order_by(Conversation.created_at.desc() if order == "desc" else Conversation.created_at.asc())
    else:  # updated_at
        query = query.order_by(Conversation.updated_at.desc() if order == "desc" else Conversation.updated_at.asc())
    
    conversations = query.limit(limit).all()
    
    # Get message counts for each conversation
    result = []
    for conv in conversations:
        msg_count = db.query(func.count(Message.id)).filter(
            Message.conversation_id == conv.id
        ).scalar() or 0
        
        result.append(ConversationSummary(
            id=conv.id,
            bot_id=conv.bot_id,
            title=conv.title,
            session_id=conv.session_id,
            is_active=conv.is_active,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            messages_count=msg_count
        ))
    
    return result


@router.get("/documents", response_model=List[DocumentSummary])
async def get_tenant_documents(
    limit: int = Query(10, ge=1, le=100),
    order_by: str = Query("created_at", regex="^(created_at|title|status)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant)
):
    """Get tenant documents."""
    tenant_id = current_tenant.id
    
    # Build the query
    query = db.query(Document).join(Dataset).filter(Dataset.tenant_id == tenant_id)
    
    # Apply ordering
    if order_by == "title":
        query = query.order_by(Document.title.desc() if order == "desc" else Document.title.asc())
    elif order_by == "status":
        query = query.order_by(Document.status.desc() if order == "desc" else Document.status.asc())
    else:  # created_at
        query = query.order_by(Document.created_at.desc() if order == "desc" else Document.created_at.asc())
    
    documents = query.limit(limit).all()
    
    result = []
    for doc in documents:
        result.append(DocumentSummary(
            id=doc.id,
            title=doc.title,
            status=doc.status,
            created_at=doc.created_at,
            file_size=doc.file_size,
            content_type=getattr(doc, 'content_type', None)
        ))
    
    return result