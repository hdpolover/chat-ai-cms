"""Tenant AI provider management routes."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from ...db import get_sync_db
from ...models import Tenant, TenantAIProvider, GlobalAIProvider
from ...schemas import TenantAIProviderCreate, TenantAIProviderUpdate, TenantAIProviderResponse
from .auth import get_current_tenant

router = APIRouter(prefix="/v1/tenant/ai-providers", tags=["Tenant - AI Providers"])


@router.get("/", response_model=List[TenantAIProviderResponse])
async def list_ai_providers(
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """List AI providers for the current tenant."""
    
    query = db.query(TenantAIProvider).filter(TenantAIProvider.tenant_id == current_tenant.id)
    
    if is_active is not None:
        query = query.filter(TenantAIProvider.is_active == is_active)
    
    providers = query.all()
    
    return [
        TenantAIProviderResponse(
            id=provider.id,
            tenant_id=provider.tenant_id,
            global_ai_provider_id=provider.global_ai_provider_id,
            provider_name=provider.provider_name,
            base_url=provider.base_url,
            custom_settings=provider.custom_settings,
            is_active=provider.is_active,
            created_at=provider.created_at,
            updated_at=provider.updated_at
        )
        for provider in providers
    ]


@router.post("/", response_model=TenantAIProviderResponse, status_code=status.HTTP_201_CREATED)
async def create_ai_provider(
    provider_data: TenantAIProviderCreate,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Create a new AI provider configuration for the current tenant."""
    
    # Check if provider with this name already exists for this tenant
    existing_provider = db.query(TenantAIProvider).filter(
        TenantAIProvider.tenant_id == current_tenant.id,
        TenantAIProvider.provider_name == provider_data.provider_name
    ).first()
    
    if existing_provider:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"AI provider '{provider_data.provider_name}' already configured for this tenant"
        )
    
    # Verify the global AI provider exists
    global_provider = db.query(GlobalAIProvider).filter(
        GlobalAIProvider.id == provider_data.global_ai_provider_id,
        GlobalAIProvider.is_active == True
    ).first()
    
    if not global_provider:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid global AI provider ID"
        )
    
    # Create the tenant AI provider
    tenant_provider = TenantAIProvider(
        tenant_id=current_tenant.id,
        global_ai_provider_id=provider_data.global_ai_provider_id,
        provider_name=provider_data.provider_name,
        api_key=provider_data.api_key,  # This should be encrypted in production
        base_url=provider_data.base_url,
        custom_settings=provider_data.custom_settings,
        is_active=provider_data.is_active,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(tenant_provider)
    db.commit()
    db.refresh(tenant_provider)
    
    return TenantAIProviderResponse(
        id=tenant_provider.id,
        tenant_id=tenant_provider.tenant_id,
        global_ai_provider_id=tenant_provider.global_ai_provider_id,
        provider_name=tenant_provider.provider_name,
        base_url=tenant_provider.base_url,
        custom_settings=tenant_provider.custom_settings,
        is_active=tenant_provider.is_active,
        created_at=tenant_provider.created_at,
        updated_at=tenant_provider.updated_at
    )


@router.get("/{provider_id}", response_model=TenantAIProviderResponse)
async def get_ai_provider(
    provider_id: UUID,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Get a specific AI provider by ID."""
    
    provider = db.query(TenantAIProvider).filter(
        TenantAIProvider.id == provider_id,
        TenantAIProvider.tenant_id == current_tenant.id
    ).first()
    
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI provider not found"
        )
    
    return TenantAIProviderResponse(
        id=provider.id,
        tenant_id=provider.tenant_id,
        global_ai_provider_id=provider.global_ai_provider_id,
        provider_name=provider.provider_name,
        base_url=provider.base_url,
        custom_settings=provider.custom_settings,
        is_active=provider.is_active,
        created_at=provider.created_at,
        updated_at=provider.updated_at
    )


@router.put("/{provider_id}", response_model=TenantAIProviderResponse)
async def update_ai_provider(
    provider_id: UUID,
    provider_data: TenantAIProviderUpdate,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Update an AI provider configuration."""
    
    provider = db.query(TenantAIProvider).filter(
        TenantAIProvider.id == provider_id,
        TenantAIProvider.tenant_id == current_tenant.id
    ).first()
    
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI provider not found"
        )
    
    # Check for duplicate provider name if updating
    if provider_data.provider_name and provider_data.provider_name != provider.provider_name:
        existing_provider = db.query(TenantAIProvider).filter(
            TenantAIProvider.tenant_id == current_tenant.id,
            TenantAIProvider.provider_name == provider_data.provider_name,
            TenantAIProvider.id != provider_id
        ).first()
        
        if existing_provider:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"AI provider '{provider_data.provider_name}' already configured for this tenant"
            )
    
    # Update provider fields
    update_data = provider_data.dict(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        for field, value in update_data.items():
            setattr(provider, field, value)
    
    db.commit()
    db.refresh(provider)
    
    return TenantAIProviderResponse(
        id=provider.id,
        tenant_id=provider.tenant_id,
        global_ai_provider_id=provider.global_ai_provider_id,
        provider_name=provider.provider_name,
        base_url=provider.base_url,
        custom_settings=provider.custom_settings,
        is_active=provider.is_active,
        created_at=provider.created_at,
        updated_at=provider.updated_at
    )


@router.delete("/{provider_id}")
async def delete_ai_provider(
    provider_id: UUID,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Delete an AI provider configuration."""
    
    provider = db.query(TenantAIProvider).filter(
        TenantAIProvider.id == provider_id,
        TenantAIProvider.tenant_id == current_tenant.id
    ).first()
    
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI provider not found"
        )
    
    # Check if provider is being used by any bots
    from ...models import Bot
    active_bots = db.query(func.count(Bot.id)).filter(
        Bot.tenant_ai_provider_id == provider_id
    ).scalar()
    
    if active_bots > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete AI provider that is being used by {active_bots} bot(s). Please reassign or delete the bots first."
        )
    
    db.delete(provider)
    db.commit()
    
    return {"message": "AI provider deleted successfully"}


@router.get("/global/available", response_model=List[dict])
async def list_available_global_providers(
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """List available global AI providers that can be configured."""
    
    global_providers = db.query(GlobalAIProvider).filter(
        GlobalAIProvider.is_active == True
    ).all()
    
    # Get already configured providers
    configured_provider_ids = db.query(TenantAIProvider.global_ai_provider_id).filter(
        TenantAIProvider.tenant_id == current_tenant.id
    ).all()
    configured_ids = [str(pid[0]) for pid in configured_provider_ids]
    
    return [
        {
            "id": str(provider.id),
            "name": provider.name,
            "provider_type": provider.provider_type,
            "config": provider.config,
            "is_configured": str(provider.id) in configured_ids
        }
        for provider in global_providers
    ]


@router.get("/global/available", response_model=List[dict])
async def list_available_global_providers(
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """List available global AI providers that can be configured."""
    
    global_providers = db.query(GlobalAIProvider).filter(
        GlobalAIProvider.is_active == True
    ).all()
    
    # Get already configured providers
    configured_provider_ids = db.query(TenantAIProvider.global_ai_provider_id).filter(
        TenantAIProvider.tenant_id == current_tenant.id
    ).all()
    configured_ids = [str(pid[0]) for pid in configured_provider_ids]
    
    return [
        {
            "id": str(provider.id),
            "name": provider.name,
            "provider_type": provider.provider_type,
            "api_endpoint": provider.api_endpoint,
            "supported_models": provider.supported_models,
            "pricing": provider.pricing,
            "is_configured": str(provider.id) in configured_ids
        }
        for provider in global_providers
    ]