"""Admin dashboard routes with statistics and analytics."""

from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, func, text
from sqlalchemy.orm import Session

from ...db import get_sync_db
from ...models import AdminUser, Tenant, Bot, Conversation, Message, SystemSettings, GlobalAIProvider
from .auth import get_current_admin_user
from typing import Dict, Any

router = APIRouter(prefix="/admin", tags=["Admin - Dashboard"])


# Pydantic models
class DashboardStats(BaseModel):
    total_tenants: int
    active_tenants: int
    total_users: int
    total_chats_today: int
    total_messages_today: int
    system_health: str


class SystemSettingsResponse(BaseModel):
    ai_provider_default: str
    max_tenants_per_plan: Dict[str, int]
    rate_limits: Dict[str, int]
    maintenance_mode: bool
    registration_enabled: bool


class SystemSettingsUpdateRequest(BaseModel):
    ai_provider_default: Optional[str] = None
    max_tenants_per_plan: Optional[Dict[str, int]] = None
    rate_limits: Optional[Dict[str, int]] = None
    maintenance_mode: Optional[bool] = None
    registration_enabled: Optional[bool] = None


class SystemMetrics(BaseModel):
    total_tenants: int
    active_tenants: int
    total_bots: int
    total_conversations: int
    total_messages: int
    ai_provider_default: Optional[str] = None
    uptime: str
    database_status: str


class AIProviderResponse(BaseModel):
    id: str
    name: str
    type: str
    is_active: bool
    is_default: bool
    config: Dict[str, Any]

    class Config:
        from_attributes = True


class AIProviderCreateRequest(BaseModel):
    name: str
    type: str
    config: Dict[str, Any]
    is_active: bool = True
    is_default: bool = False


class AIProviderUpdateRequest(BaseModel):
    name: str | None = None
    type: str | None = None
    config: Dict[str, Any] | None = None
    is_active: bool | None = None
    is_default: bool | None = None


@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_sync_db),
    current_admin: AdminUser = Depends(get_current_admin_user)
):
    """Get dashboard statistics."""
    # Count tenants
    total_tenants = db.query(func.count(Tenant.id)).scalar() or 0
    active_tenants = db.query(func.count(Tenant.id)).filter(Tenant.is_active == True).scalar() or 0
    
    # Count conversations (chats) for today
    from datetime import datetime, date
    today = date.today()
    total_chats_today = db.query(func.count(Conversation.id)).filter(
        func.date(Conversation.created_at) == today
    ).scalar() or 0
    
    # Count messages for today
    total_messages_today = db.query(func.count(Message.id)).filter(
        func.date(Message.created_at) == today
    ).scalar() or 0
    
    # Mock user count (implement as needed)
    total_users = 0
    
    # Mock system health (implement health checks)
    system_health = "healthy"
    
    return DashboardStats(
        total_tenants=total_tenants,
        active_tenants=active_tenants,
        total_users=total_users,
        total_chats_today=total_chats_today,
        total_messages_today=total_messages_today,
        system_health=system_health
    )


@router.get("/dashboard/metrics")
async def get_dashboard_metrics(
    period: str = "day",
    db: Session = Depends(get_sync_db),
    current_admin: AdminUser = Depends(get_current_admin_user)
):
    """Get dashboard metrics for charts."""
    # Mock data for now - implement actual metrics collection
    if period == "day":
        return [
            {"name": "00:00", "chats": 4, "messages": 24, "users": 12},
            {"name": "04:00", "chats": 3, "messages": 18, "users": 9},
            {"name": "08:00", "chats": 8, "messages": 45, "users": 23},
            {"name": "12:00", "chats": 15, "messages": 89, "users": 41},
            {"name": "16:00", "chats": 22, "messages": 124, "users": 67},
            {"name": "20:00", "chats": 18, "messages": 96, "users": 52},
        ]
    elif period == "week":
        return [
            {"name": "Mon", "chats": 45, "messages": 234, "users": 123},
            {"name": "Tue", "chats": 52, "messages": 287, "users": 145},
            {"name": "Wed", "chats": 38, "messages": 198, "users": 98},
            {"name": "Thu", "chats": 67, "messages": 345, "users": 178},
            {"name": "Fri", "chats": 78, "messages": 456, "users": 234},
            {"name": "Sat", "chats": 34, "messages": 167, "users": 89},
            {"name": "Sun", "chats": 23, "messages": 123, "users": 67},
        ]
    else:  # month
        return [
            {"name": "Week 1", "chats": 234, "messages": 1234, "users": 567},
            {"name": "Week 2", "chats": 287, "messages": 1456, "users": 634},
            {"name": "Week 3", "chats": 345, "messages": 1789, "users": 723},
            {"name": "Week 4", "chats": 298, "messages": 1567, "users": 689},
        ]


def get_system_setting(db: Session, key: str, default_value: Any = None) -> Any:
    """Get a system setting by key."""
    setting = db.query(SystemSettings).filter(SystemSettings.key == key).first()
    return setting.value if setting else default_value


def set_system_setting(db: Session, key: str, value: Any, description: str = None):
    """Set a system setting."""
    setting = db.query(SystemSettings).filter(SystemSettings.key == key).first()
    if setting:
        setting.value = value
        if description:
            setting.description = description
    else:
        from uuid import uuid4
        setting = SystemSettings(
            id=str(uuid4()),
            key=key,
            value=value,
            description=description
        )
        db.add(setting)
    db.commit()


@router.get("/settings/system", response_model=SystemSettingsResponse)
async def get_system_settings(
    db: Session = Depends(get_sync_db),
    current_admin: AdminUser = Depends(get_current_admin_user)
):
    """Get system settings."""
    return SystemSettingsResponse(
        ai_provider_default=get_system_setting(db, "ai_provider_default", "openai"),
        max_tenants_per_plan=get_system_setting(db, "max_tenants_per_plan", {
            "free": 1,
            "pro": 10,
            "enterprise": -1  # unlimited
        }),
        rate_limits=get_system_setting(db, "rate_limits", {
            "requests_per_minute": 60,
            "tokens_per_day": 100000
        }),
        maintenance_mode=get_system_setting(db, "maintenance_mode", False),
        registration_enabled=get_system_setting(db, "registration_enabled", True)
    )


@router.put("/settings/system", response_model=SystemSettingsResponse)
async def update_system_settings(
    settings_data: SystemSettingsUpdateRequest,
    db: Session = Depends(get_sync_db),
    current_admin: AdminUser = Depends(get_current_admin_user)
):
    """Update system settings."""
    update_data = settings_data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        set_system_setting(db, key, value)
    
    # Return updated settings
    return await get_system_settings(db, current_admin)


@router.get("/settings/ai-providers", response_model=List[AIProviderResponse])
async def get_ai_providers(
    db: Session = Depends(get_sync_db),
    current_admin: AdminUser = Depends(get_current_admin_user)
):
    """Get all global AI providers."""
    providers = db.query(GlobalAIProvider).all()
    return [
        AIProviderResponse(
            id=provider.id,
            name=provider.name,
            type=provider.provider_type,
            is_active=provider.is_active,
            is_default=provider.is_default,
            config=provider.config
        )
        for provider in providers
    ]


@router.post("/settings/ai-providers", response_model=AIProviderResponse, status_code=status.HTTP_201_CREATED)
async def create_ai_provider(
    provider_data: AIProviderCreateRequest,
    db: Session = Depends(get_sync_db),
    current_admin: AdminUser = Depends(get_current_admin_user)
):
    """Create a new global AI provider."""
    from uuid import uuid4
    
    # If this is set as default, unset other defaults
    if provider_data.is_default:
        db.query(GlobalAIProvider).update({GlobalAIProvider.is_default: False})
    
    provider = GlobalAIProvider(
        id=str(uuid4()),
        name=provider_data.name,
        provider_type=provider_data.type,
        config=provider_data.config,
        is_active=provider_data.is_active,
        is_default=provider_data.is_default
    )
    
    db.add(provider)
    db.commit()
    db.refresh(provider)
    
    return AIProviderResponse(
        id=provider.id,
        name=provider.name,
        type=provider.provider_type,
        is_active=provider.is_active,
        is_default=provider.is_default,
        config=provider.config
    )


@router.put("/settings/ai-providers/{provider_id}", response_model=AIProviderResponse)
async def update_ai_provider(
    provider_id: str,
    provider_data: AIProviderUpdateRequest,
    db: Session = Depends(get_sync_db),
    current_admin: AdminUser = Depends(get_current_admin_user)
):
    """Update a global AI provider."""
    provider = db.query(GlobalAIProvider).filter(GlobalAIProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="AI provider not found")
    
    # If this is being set as default, unset other defaults
    if provider_data.is_default:
        db.query(GlobalAIProvider).update({GlobalAIProvider.is_default: False})
    
    # Update fields
    update_data = provider_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "type":
            setattr(provider, "provider_type", value)
        else:
            setattr(provider, field, value)
    
    db.commit()
    db.refresh(provider)
    
    return AIProviderResponse(
        id=provider.id,
        name=provider.name,
        type=provider.provider_type,
        is_active=provider.is_active,
        is_default=provider.is_default,
        config=provider.config
    )


@router.delete("/settings/ai-providers/{provider_id}")
async def delete_ai_provider(
    provider_id: str,
    db: Session = Depends(get_sync_db),
    current_admin: AdminUser = Depends(get_current_admin_user)
):
    """Delete a global AI provider."""
    provider = db.query(GlobalAIProvider).filter(GlobalAIProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="AI provider not found")
    
    # Don't allow deletion of default provider
    if provider.is_default:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the default AI provider"
        )
    
    db.delete(provider)
    db.commit()
    
    return {"message": "AI provider deleted successfully"}