"""Admin settings management routes."""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...db import get_sync_db
from ...models import SystemSettings, GlobalAIProvider
from .auth import get_current_admin_user, AdminUser

router = APIRouter(prefix="/admin/settings", tags=["admin-settings"])

# Schemas
class SystemSettingResponse(BaseModel):
    id: str
    key: str
    value: Any
    description: Optional[str] = None

class SystemSettingUpdate(BaseModel):
    value: Any
    description: Optional[str] = None

class GlobalAIProviderResponse(BaseModel):
    id: str
    name: str
    provider_type: str
    config: Dict[str, Any]
    is_active: bool
    is_default: bool

class GlobalAIProviderCreate(BaseModel):
    name: str
    provider_type: str
    config: Dict[str, Any]
    is_active: bool = True
    is_default: bool = False

class GlobalAIProviderUpdate(BaseModel):
    name: Optional[str] = None
    provider_type: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None

# System Settings Routes
@router.get("/system", response_model=List[SystemSettingResponse])
async def get_system_settings(
    db: Session = Depends(get_sync_db),
    current_user: AdminUser = Depends(get_current_admin_user)
):
    """Get all system settings."""
    settings = db.query(SystemSettings).all()
    
    return [
        SystemSettingResponse(
            id=setting.id,
            key=setting.key,
            value=setting.value,
            description=setting.description
        )
        for setting in settings
    ]

@router.get("/system/{setting_key}", response_model=SystemSettingResponse)
async def get_system_setting(
    setting_key: str,
    db: Session = Depends(get_sync_db),
    current_user: AdminUser = Depends(get_current_admin_user)
):
    """Get a specific system setting by key."""
    setting = db.query(SystemSettings).filter(SystemSettings.key == setting_key).first()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Setting with key '{setting_key}' not found"
        )
    
    return SystemSettingResponse(
        id=setting.id,
        key=setting.key,
        value=setting.value,
        description=setting.description
    )

@router.put("/system/{setting_key}", response_model=SystemSettingResponse)
async def update_system_setting(
    setting_key: str,
    update_data: SystemSettingUpdate,
    db: Session = Depends(get_sync_db),
    current_user: AdminUser = Depends(get_current_admin_user)
):
    """Update a system setting."""
    # Only super_admin can update system settings
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super administrators can update system settings"
        )
    
    setting = db.query(SystemSettings).filter(SystemSettings.key == setting_key).first()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Setting with key '{setting_key}' not found"
        )
    
    # Update setting
    setting.value = update_data.value
    if update_data.description is not None:
        setting.description = update_data.description
    
    db.commit()
    db.refresh(setting)
    
    return SystemSettingResponse(
        id=setting.id,
        key=setting.key,
        value=setting.value,
        description=setting.description
    )

# Global AI Providers Routes
@router.get("/ai-providers", response_model=List[GlobalAIProviderResponse])
async def get_global_ai_providers(
    db: Session = Depends(get_sync_db),
    current_user: AdminUser = Depends(get_current_admin_user)
):
    """Get all global AI providers."""
    providers = db.query(GlobalAIProvider).all()
    
    return [
        GlobalAIProviderResponse(
            id=provider.id,
            name=provider.name,
            provider_type=provider.provider_type,
            config=provider.config,
            is_active=provider.is_active,
            is_default=provider.is_default
        )
        for provider in providers
    ]

@router.post("/ai-providers", response_model=GlobalAIProviderResponse)
async def create_global_ai_provider(
    provider_data: GlobalAIProviderCreate,
    db: Session = Depends(get_sync_db),
    current_user: AdminUser = Depends(get_current_admin_user)
):
    """Create a new global AI provider."""
    # Only super_admin can create providers
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super administrators can create AI providers"
        )
    
    # Check if provider with same name exists
    existing = db.query(GlobalAIProvider).filter(
        GlobalAIProvider.name == provider_data.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"AI provider with name '{provider_data.name}' already exists"
        )
    
    # If this is set as default, unset other defaults
    if provider_data.is_default:
        db.query(GlobalAIProvider).filter(
            GlobalAIProvider.is_default == True
        ).update({"is_default": False})
    
    # Create new provider
    provider = GlobalAIProvider(
        name=provider_data.name,
        provider_type=provider_data.provider_type,
        config=provider_data.config,
        is_active=provider_data.is_active,
        is_default=provider_data.is_default
    )
    
    db.add(provider)
    db.commit()
    db.refresh(provider)
    
    return GlobalAIProviderResponse(
        id=provider.id,
        name=provider.name,
        provider_type=provider.provider_type,
        config=provider.config,
        is_active=provider.is_active,
        is_default=provider.is_default
    )

@router.put("/ai-providers/{provider_id}", response_model=GlobalAIProviderResponse)
async def update_global_ai_provider(
    provider_id: str,
    update_data: GlobalAIProviderUpdate,
    db: Session = Depends(get_sync_db),
    current_user: AdminUser = Depends(get_current_admin_user)
):
    """Update a global AI provider."""
    # Only super_admin can update providers
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super administrators can update AI providers"
        )
    
    provider = db.query(GlobalAIProvider).filter(
        GlobalAIProvider.id == provider_id
    ).first()
    
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI provider not found"
        )
    
    # Update fields
    if update_data.name is not None:
        provider.name = update_data.name
    if update_data.provider_type is not None:
        provider.provider_type = update_data.provider_type
    if update_data.config is not None:
        provider.config = update_data.config
    if update_data.is_active is not None:
        provider.is_active = update_data.is_active
    if update_data.is_default is not None:
        if update_data.is_default:
            # Unset other defaults
            db.query(GlobalAIProvider).filter(
                GlobalAIProvider.id != provider_id,
                GlobalAIProvider.is_default == True
            ).update({"is_default": False})
        provider.is_default = update_data.is_default
    
    db.commit()
    db.refresh(provider)
    
    return GlobalAIProviderResponse(
        id=provider.id,
        name=provider.name,
        provider_type=provider.provider_type,
        config=provider.config,
        is_active=provider.is_active,
        is_default=provider.is_default
    )

@router.delete("/ai-providers/{provider_id}")
async def delete_global_ai_provider(
    provider_id: str,
    db: Session = Depends(get_sync_db),
    current_user: AdminUser = Depends(get_current_admin_user)
):
    """Delete a global AI provider."""
    # Only super_admin can delete providers
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super administrators can delete AI providers"
        )
    
    provider = db.query(GlobalAIProvider).filter(
        GlobalAIProvider.id == provider_id
    ).first()
    
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI provider not found"
        )
    
    db.delete(provider)
    db.commit()
    
    return {"message": "AI provider deleted successfully"}