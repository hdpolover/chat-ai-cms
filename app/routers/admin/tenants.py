"""Admin tenant management routes."""

from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy import select, func, desc, asc
from sqlalchemy.orm import Session

from ...db import get_sync_db
from ...models import AdminUser, Tenant
from .auth import get_current_admin_user

router = APIRouter(prefix="/admin/tenants", tags=["admin-tenants"])


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
    description: Optional[str]
    owner_email: str
    plan: str
    is_active: bool
    last_activity: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class CreateTenantRequest(BaseModel):
    name: str
    slug: str
    description: Optional[str]
    owner_email: str
    plan: str = "free"


class UpdateTenantRequest(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    owner_email: Optional[str] = None
    plan: Optional[str] = None
    is_active: Optional[bool] = None


class PaginatedTenantsResponse(BaseModel):
    items: List[TenantResponse]
    total: int
    page: int
    per_page: int
    pages: int


def get_tenant_usage_stats(db: Session, tenant_id: str) -> TenantUsageStats:
    """Get usage statistics for a tenant."""
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
    
    # Mock other stats (implement actual calculations as needed)
    return TenantUsageStats(
        total_chats=total_chats,
        total_messages=total_messages,
        total_tokens_used=0,  # Implement token counting
        active_users=0,  # Implement user counting
        storage_used_mb=0.0,  # Implement storage calculation
        last_activity=latest_message.isoformat() if latest_message else None
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
        tenant_response = TenantResponse(
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
    
    # Create new tenant
    tenant = Tenant(
        id=str(uuid4()),
        name=tenant_data.name,
        slug=tenant_data.slug,
        description=tenant_data.description,
        owner_email=tenant_data.owner_email,
        plan=tenant_data.plan,
        is_active=tenant_data.is_active
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
        owner_email=tenant.owner_email,
        plan=tenant.plan,
        is_active=tenant.is_active,
        created_at=tenant.created_at.isoformat(),
        updated_at=tenant.updated_at.isoformat(),
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