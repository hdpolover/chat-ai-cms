"""Admin tenant management routes."""

from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy import select, func, desc, asc, Integer
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from ...db import get_sync_db
from ...models import AdminUser, Tenant, Bot, Conversation, Message, TenantAIProvider
from .auth import get_current_admin_user

router = APIRouter(prefix="/admin/tenants", tags=["Admin - Tenants"])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Pydantic models
class TenantUsageStats(BaseModel):
    total_chats: int
    total_messages: int
    total_tokens_used: int
    active_users: int
    storage_used_mb: float
    last_activity: str | None

    
class TenantResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    email: Optional[str] = None  # Tenant login email
    is_email_verified: Optional[bool] = None
    last_login_at: Optional[datetime] = None
    login_attempts: Optional[int] = None
    locked_until: Optional[datetime] = None
    owner_email: Optional[str] = None
    plan: str
    is_active: bool
    settings: Optional[dict] = None
    global_rate_limit: Optional[int] = None
    feature_flags: Optional[dict] = None
    last_activity: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    usage_stats: Optional[TenantUsageStats] = None

    class Config:
        from_attributes = True


class CreateTenantRequest(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    email: Optional[str] = None  # Tenant login email
    password: Optional[str] = None  # Tenant login password
    owner_email: Optional[str] = None
    plan: str = "free"
    is_active: bool = True
    global_rate_limit: Optional[int] = 1000
    settings: Optional[dict] = None
    feature_flags: Optional[dict] = None


class UpdateTenantRequest(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    email: Optional[str] = None  # Tenant login email
    password: Optional[str] = None  # New password (optional)
    owner_email: Optional[str] = None
    plan: Optional[str] = None
    is_active: Optional[bool] = None
    global_rate_limit: Optional[int] = None
    settings: Optional[dict] = None
    feature_flags: Optional[dict] = None


class PaginatedTenantsResponse(BaseModel):
    items: List[TenantResponse]
    total: int
    page: int
    per_page: int
    pages: int


class TenantBotInfo(BaseModel):
    id: str
    name: str
    model: str
    is_active: bool
    ai_provider_name: str
    created_at: datetime

    class Config:
        from_attributes = True


class TenantAIProviderInfo(BaseModel):
    id: str
    provider_name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TenantDetailsResponse(BaseModel):
    tenant: TenantResponse
    bots: List[TenantBotInfo]
    ai_providers: List[TenantAIProviderInfo]
    stats: TenantUsageStats

    class Config:
        from_attributes = True


def create_tenant_response(tenant, usage_stats: TenantUsageStats) -> TenantResponse:
    """Create a TenantResponse from a tenant model."""
    return TenantResponse(
        id=tenant.id,
        name=tenant.name,
        slug=tenant.slug,
        description=tenant.description,
        owner_email=tenant.owner_email,
        plan=tenant.plan,
        is_active=tenant.is_active,
        settings=tenant.settings,
        global_rate_limit=tenant.global_rate_limit,
        feature_flags=tenant.feature_flags,
        last_activity=None,
        created_at=tenant.created_at,
        updated_at=tenant.updated_at,
        usage_stats=usage_stats
    )


def get_tenant_usage_stats(db: Session, tenant_id: str) -> TenantUsageStats:
    """Get usage statistics for a tenant."""
    try:
        # Count conversations (chats)
        total_chats = db.query(func.count(Conversation.id)).join(Bot).filter(
            Bot.tenant_id == tenant_id
        ).scalar() or 0
        
        # Count messages
        total_messages = db.query(func.count(Message.id)).join(Conversation).join(Bot).filter(
            Bot.tenant_id == tenant_id
        ).scalar() or 0
        
        # Get latest activity
        latest_message = db.query(func.max(Message.created_at)).join(Conversation).join(Bot).filter(
            Bot.tenant_id == tenant_id
        ).scalar()
        
        # Calculate total tokens used (sum from message token_usage)
        token_result = db.query(func.sum(
            func.cast(Message.token_usage['total_tokens'].astext, Integer)
        )).join(Conversation).join(Bot).filter(
            Bot.tenant_id == tenant_id,
            Message.token_usage.has_key('total_tokens')
        ).scalar()
        total_tokens_used = token_result or 0
        
        # Count active users (unique session_ids in last 30 days)
        from datetime import datetime, timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        active_users = db.query(func.count(func.distinct(Conversation.session_id))).join(Bot).filter(
            Bot.tenant_id == tenant_id,
            Conversation.created_at >= cutoff_date,
            Conversation.session_id.isnot(None)
        ).scalar() or 0
        
        return TenantUsageStats(
            total_chats=total_chats,
            total_messages=total_messages,
            total_tokens_used=total_tokens_used,
            active_users=active_users,
            storage_used_mb=0.0,  # TODO: Implement storage calculation from documents
            last_activity=latest_message.isoformat() if latest_message else None
        )
    except Exception as e:
        # Return default stats if there's an error
        return TenantUsageStats(
            total_chats=0,
            total_messages=0,
            total_tokens_used=0,
            active_users=0,
            storage_used_mb=0.0,
            last_activity=None
        )


@router.get("/", response_model=PaginatedTenantsResponse)
async def get_tenants(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    plan: Optional[str] = Query(None),
    db: Session = Depends(get_sync_db),
    current_admin: AdminUser = Depends(get_current_admin_user)
):
    """Get all tenants with pagination and filtering."""
    query = db.query(Tenant)
    
    # Apply filters
    if search:
        query = query.filter(
            (Tenant.name.ilike(f"%{search}%")) |
            (Tenant.slug.ilike(f"%{search}%")) |
            (Tenant.owner_email.ilike(f"%{search}%"))
        )
    
    if is_active is not None:
        query = query.filter(Tenant.is_active == is_active)
        
    if plan:
        query = query.filter(Tenant.plan == plan)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * per_page
    tenants = query.order_by(Tenant.created_at.desc()).offset(offset).limit(per_page).all()
    
    # Calculate total pages
    pages = (total + per_page - 1) // per_page
    
    # Convert to response models
    tenant_responses = []
    for tenant in tenants:
        usage_stats = get_tenant_usage_stats(db, tenant.id)
        tenant_response = create_tenant_response(tenant, usage_stats)
        tenant_responses.append(tenant_response)
    
    return PaginatedTenantsResponse(
        items=tenant_responses,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: str,
    db: Session = Depends(get_sync_db),
    current_admin: AdminUser = Depends(get_current_admin_user)
):
    """Get a specific tenant by ID."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    usage_stats = get_tenant_usage_stats(db, tenant.id)
    
    return TenantResponse(
        id=tenant.id,
        name=tenant.name,
        slug=tenant.slug,
        description=tenant.description,
        owner_email=tenant.owner_email,
        plan=tenant.plan,
        is_active=tenant.is_active,
        created_at=tenant.created_at.isoformat(),
        updated_at=tenant.updated_at.isoformat(),
        usage_stats=usage_stats
    )


@router.post("/", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_data: CreateTenantRequest,
    db: Session = Depends(get_sync_db),
    current_admin: AdminUser = Depends(get_current_admin_user)
):
    """Create a new tenant."""
    # Check if slug already exists
    existing_tenant = db.query(Tenant).filter(Tenant.slug == tenant_data.slug).first()
    if existing_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant with this slug already exists"
        )
    
    # Check if email already exists (if provided)
    if tenant_data.email:
        existing_email = db.query(Tenant).filter(Tenant.email == tenant_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant with this email already exists"
            )
    
    # Hash password if provided
    password_hash = None
    if tenant_data.password:
        password_hash = pwd_context.hash(tenant_data.password)
    
    # Create new tenant
    tenant = Tenant(
        id=str(uuid4()),
        name=tenant_data.name,
        slug=tenant_data.slug,
        description=tenant_data.description,
        email=tenant_data.email,
        password_hash=password_hash,
        is_email_verified=True if tenant_data.email else False,
        owner_email=tenant_data.owner_email,
        plan=tenant_data.plan,
        is_active=tenant_data.is_active,
        settings=tenant_data.settings or {},
        global_rate_limit=tenant_data.global_rate_limit or 1000,
        feature_flags=tenant_data.feature_flags or {},
        login_attempts=0
    )
    
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    
    usage_stats = get_tenant_usage_stats(db, tenant.id)
    
    return TenantResponse(
        id=tenant.id,
        name=tenant.name,
        slug=tenant.slug,
        description=tenant.description,
        email=tenant.email,
        is_email_verified=tenant.is_email_verified,
        last_login_at=tenant.last_login_at,
        login_attempts=tenant.login_attempts,
        locked_until=tenant.locked_until,
        owner_email=tenant.owner_email,
        plan=tenant.plan,
        is_active=tenant.is_active,
        settings=tenant.settings,
        global_rate_limit=tenant.global_rate_limit,
        feature_flags=tenant.feature_flags,
        created_at=tenant.created_at,
        updated_at=tenant.updated_at,
        usage_stats=usage_stats
    )


@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: str,
    tenant_data: UpdateTenantRequest,
    db: Session = Depends(get_sync_db),
    current_admin: AdminUser = Depends(get_current_admin_user)
):
    """Update a tenant."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Check if slug is being changed and if it conflicts
    if tenant_data.slug and tenant_data.slug != tenant.slug:
        existing_tenant = db.query(Tenant).filter(Tenant.slug == tenant_data.slug).first()
        if existing_tenant:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant with this slug already exists"
            )
    
    # Update fields
    update_data = tenant_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tenant, field, value)
    
    db.commit()
    db.refresh(tenant)
    
    usage_stats = get_tenant_usage_stats(db, tenant.id)
    
    return TenantResponse(
        id=tenant.id,
        name=tenant.name,
        slug=tenant.slug,
        description=tenant.description,
        owner_email=tenant.owner_email,
        plan=tenant.plan,
        is_active=tenant.is_active,
        created_at=tenant.created_at.isoformat(),
        updated_at=tenant.updated_at.isoformat(),
        usage_stats=usage_stats
    )


@router.delete("/{tenant_id}")
async def delete_tenant(
    tenant_id: str,
    db: Session = Depends(get_sync_db),
    current_admin: AdminUser = Depends(get_current_admin_user)
):
    """Delete a tenant."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    db.delete(tenant)
    db.commit()
    
    return {"message": "Tenant deleted successfully"}


@router.get("/{tenant_id}/full", response_model=TenantDetailsResponse)
async def get_tenant_details(
    tenant_id: str,
    db: Session = Depends(get_sync_db),
    current_admin: AdminUser = Depends(get_current_admin_user)
):
    """Get detailed tenant information including bots and AI providers."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Get usage stats
    usage_stats = get_tenant_usage_stats(db, tenant.id)
    
    # Get tenant bots with AI provider info
    bots_query = db.query(
        Bot.id,
        Bot.name,
        Bot.model,
        Bot.is_active,
        Bot.created_at,
        TenantAIProvider.provider_name
    ).join(
        TenantAIProvider, Bot.tenant_ai_provider_id == TenantAIProvider.id
    ).filter(
        Bot.tenant_id == tenant_id
    ).all()
    
    bots = [
        TenantBotInfo(
            id=bot.id,
            name=bot.name,
            model=bot.model,
            is_active=bot.is_active,
            ai_provider_name=bot.provider_name,
            created_at=bot.created_at
        )
        for bot in bots_query
    ]
    
    # Get tenant AI providers
    ai_providers_query = db.query(TenantAIProvider).filter(
        TenantAIProvider.tenant_id == tenant_id
    ).all()
    
    ai_providers = [
        TenantAIProviderInfo(
            id=provider.id,
            provider_name=provider.provider_name,
            is_active=provider.is_active,
            created_at=provider.created_at
        )
        for provider in ai_providers_query
    ]
    
    # Create tenant response
    tenant_response = create_tenant_response(tenant, usage_stats)
    
    return TenantDetailsResponse(
        tenant=tenant_response,
        bots=bots,
        ai_providers=ai_providers,
        stats=usage_stats
    )


@router.get("/{tenant_id}/stats", response_model=TenantUsageStats)
async def get_tenant_stats(
    tenant_id: str,
    db: Session = Depends(get_sync_db),
    current_admin: AdminUser = Depends(get_current_admin_user)
):
    """Get detailed usage statistics for a tenant."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return get_tenant_usage_stats(db, tenant_id)