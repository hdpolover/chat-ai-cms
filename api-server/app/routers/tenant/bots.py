"""Tenant bot management routes."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from ...db import get_sync_db
from ...models import Tenant, Bot, TenantAIProvider, Scope, Dataset, BotDataset, Document, Chunk
from ...schemas import BotCreate, BotUpdate, BotResponse
from .auth import get_current_tenant

router = APIRouter(prefix="/v1/tenant/bots", tags=["Tenant - Bots"])


@router.get("/", response_model=List[BotResponse])
async def list_bots(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """List bots for the current tenant."""
    
    query = db.query(Bot).options(
        joinedload(Bot.ai_provider),
        joinedload(Bot.scopes),
        joinedload(Bot.datasets)
    ).filter(Bot.tenant_id == current_tenant.id)
    
    if is_active is not None:
        query = query.filter(Bot.is_active == is_active)
    
    bots = query.offset(skip).limit(limit).all()
    
    return [
        BotResponse(
            id=str(bot.id),
            tenant_id=str(bot.tenant_id),
            tenant_ai_provider_id=str(bot.tenant_ai_provider_id),
            name=bot.name,
            description=bot.description,
            system_prompt=bot.system_prompt,
            model=bot.model,
            temperature=bot.temperature,
            max_tokens=bot.max_tokens,
            is_active=bot.is_active,
            settings=bot.settings,
            is_public=bot.is_public,
            allowed_domains=bot.allowed_domains,
            created_at=bot.created_at,
            updated_at=bot.updated_at,
            ai_provider_name=bot.ai_provider.provider_name if bot.ai_provider else None,
            scopes=[{
                "id": str(scope.id),
                "name": scope.name,
                "description": scope.description
            } for scope in bot.scopes] if bot.scopes else [],
            datasets=[{
                "id": str(dataset.id),
                "name": dataset.name,
                "description": dataset.description
            } for dataset in bot.datasets] if bot.datasets else []
        )
        for bot in bots
    ]


@router.post("/", response_model=BotResponse, status_code=status.HTTP_201_CREATED)
async def create_bot(
    bot_data: BotCreate,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Create a new bot for the current tenant."""
    
    # 1. Verify that the tenant has at least one active AI provider
    tenant_ai_providers_count = db.query(TenantAIProvider).filter(
        TenantAIProvider.tenant_id == current_tenant.id,
        TenantAIProvider.is_active == True
    ).count()
    
    if tenant_ai_providers_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create bot: Tenant must have at least one active AI provider configured. Please configure an AI provider first."
        )
    
    # 2. Verify that the specific AI provider belongs to this tenant
    ai_provider = db.query(TenantAIProvider).filter(
        TenantAIProvider.id == bot_data.tenant_ai_provider_id,
        TenantAIProvider.tenant_id == current_tenant.id,
        TenantAIProvider.is_active == True
    ).first()
    
    if not ai_provider:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid AI provider or provider not active"
        )
    
    # 3. Verify that at least one dataset is provided
    if not bot_data.dataset_ids or len(bot_data.dataset_ids) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create bot: At least one dataset must be assigned to the bot. Please create and assign a dataset first."
        )
    
    # 4. Verify datasets belong to this tenant and are active
    dataset_count = db.query(Dataset).filter(
        Dataset.id.in_(bot_data.dataset_ids),
        Dataset.tenant_id == current_tenant.id,
        Dataset.is_active == True
    ).count()
    
    if dataset_count != len(bot_data.dataset_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more datasets are invalid or not accessible"
        )
    
    # 5. Verify that assigned datasets have processed documents with embeddings
    datasets_with_content = db.query(Dataset.id).join(
        Document, Dataset.id == Document.dataset_id
    ).join(
        Chunk, Document.id == Chunk.document_id
    ).filter(
        Dataset.id.in_(bot_data.dataset_ids),
        Chunk.embedding.isnot(None)  # Has embeddings
    ).distinct().count()
    
    if datasets_with_content == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create bot: None of the assigned datasets have processed documents with embeddings. Please upload and process documents in the datasets first."
        )
    
    # Create bot
    bot = Bot(
        tenant_id=current_tenant.id,
        tenant_ai_provider_id=bot_data.tenant_ai_provider_id,
        name=bot_data.name,
        description=bot_data.description,
        system_prompt=bot_data.system_prompt,
        model=bot_data.model,
        temperature=bot_data.temperature or 0.7,
        max_tokens=bot_data.max_tokens or 1000,
        is_active=True,
        settings=bot_data.settings,
        is_public=bot_data.is_public or False,
        allowed_domains=bot_data.allowed_domains,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(bot)
    db.commit()
    db.refresh(bot)
    
    # Create bot-dataset relationships
    if bot_data.dataset_ids:
        for i, dataset_id in enumerate(bot_data.dataset_ids):
            bot_dataset = BotDataset(
                bot_id=bot.id,
                dataset_id=dataset_id,
                priority=i + 1,  # Set priority based on order
                is_active=True
            )
            db.add(bot_dataset)
        db.commit()
    
    # Load relationships
    bot = db.query(Bot).options(
        joinedload(Bot.ai_provider),
        joinedload(Bot.scopes),
        joinedload(Bot.datasets)
    ).filter(Bot.id == bot.id).first()
    
    return BotResponse(
        id=str(bot.id),
        tenant_id=str(bot.tenant_id),
        tenant_ai_provider_id=str(bot.tenant_ai_provider_id),
        name=bot.name,
        description=bot.description,
        system_prompt=bot.system_prompt,
        model=bot.model,
        temperature=bot.temperature,
        max_tokens=bot.max_tokens,
        is_active=bot.is_active,
        settings=bot.settings,
        is_public=bot.is_public,
        allowed_domains=bot.allowed_domains,
        created_at=bot.created_at,
        updated_at=bot.updated_at,
        ai_provider_name=bot.ai_provider.provider_name if bot.ai_provider else None,
        scopes=[],
        datasets=[{
            "id": str(dataset.id),
            "name": dataset.name,
            "description": dataset.description
        } for dataset in bot.datasets] if bot.datasets else []
    )


@router.get("/{bot_id}", response_model=BotResponse)
async def get_bot(
    bot_id: UUID,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Get a specific bot by ID."""
    
    bot = db.query(Bot).options(
        joinedload(Bot.ai_provider),
        joinedload(Bot.scopes)
    ).filter(
        Bot.id == bot_id,
        Bot.tenant_id == current_tenant.id
    ).first()
    
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot not found"
        )
    
    return BotResponse(
        id=str(bot.id),
        tenant_id=str(bot.tenant_id),
        tenant_ai_provider_id=str(bot.tenant_ai_provider_id),
        name=bot.name,
        description=bot.description,
        system_prompt=bot.system_prompt,
        model=bot.model,
        temperature=bot.temperature,
        max_tokens=bot.max_tokens,
        is_active=bot.is_active,
        settings=bot.settings,
        is_public=bot.is_public,
        allowed_domains=bot.allowed_domains,
        created_at=bot.created_at,
        updated_at=bot.updated_at,
        ai_provider_name=bot.ai_provider.provider_name if bot.ai_provider else None,
        scopes=[{
            "id": str(scope.id),
            "name": scope.name,
            "description": scope.description
        } for scope in bot.scopes] if bot.scopes else []
    )


@router.put("/{bot_id}", response_model=BotResponse)
async def update_bot(
    bot_id: UUID,
    bot_data: BotUpdate,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Update a bot."""
    
    bot = db.query(Bot).filter(
        Bot.id == bot_id,
        Bot.tenant_id == current_tenant.id
    ).first()
    
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot not found"
        )
    
    # If updating AI provider, verify it belongs to this tenant
    if bot_data.tenant_ai_provider_id:
        ai_provider = db.query(TenantAIProvider).filter(
            TenantAIProvider.id == bot_data.tenant_ai_provider_id,
            TenantAIProvider.tenant_id == current_tenant.id,
            TenantAIProvider.is_active == True
        ).first()
        
        if not ai_provider:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid AI provider or provider not active"
            )
    
    # Update bot fields
    update_data = bot_data.dict(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        for field, value in update_data.items():
            setattr(bot, field, value)
    
    db.commit()
    db.refresh(bot)
    
    # Load relationships
    bot = db.query(Bot).options(
        joinedload(Bot.ai_provider),
        joinedload(Bot.scopes)
    ).filter(Bot.id == bot.id).first()
    
    return BotResponse(
        id=str(bot.id),
        tenant_id=str(bot.tenant_id),
        tenant_ai_provider_id=str(bot.tenant_ai_provider_id),
        name=bot.name,
        description=bot.description,
        system_prompt=bot.system_prompt,
        model=bot.model,
        temperature=bot.temperature,
        max_tokens=bot.max_tokens,
        is_active=bot.is_active,
        settings=bot.settings,
        is_public=bot.is_public,
        allowed_domains=bot.allowed_domains,
        created_at=bot.created_at,
        updated_at=bot.updated_at,
        ai_provider_name=bot.ai_provider.provider_name if bot.ai_provider else None,
        scopes=[{
            "id": str(scope.id),
            "name": scope.name,
            "description": scope.description
        } for scope in bot.scopes] if bot.scopes else []
    )


@router.delete("/{bot_id}")
async def delete_bot(
    bot_id: UUID,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Delete a bot."""
    
    bot = db.query(Bot).filter(
        Bot.id == bot_id,
        Bot.tenant_id == current_tenant.id
    ).first()
    
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot not found"
        )
    
    # Check if bot has active conversations
    from ...models import Conversation
    active_conversations = db.query(func.count(Conversation.id)).filter(
        Conversation.bot_id == bot_id
    ).scalar()
    
    if active_conversations > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete bot with {active_conversations} conversations. Deactivate the bot instead."
        )
    
    db.delete(bot)
    db.commit()
    
    return {"message": "Bot deleted successfully"}


@router.get("/{bot_id}/ai-providers", response_model=List[dict])
async def list_tenant_ai_providers(
    bot_id: UUID,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Get available AI providers for the tenant."""
    
    providers = db.query(TenantAIProvider).filter(
        TenantAIProvider.tenant_id == current_tenant.id,
        TenantAIProvider.is_active == True
    ).all()
    
    return [
        {
            "id": str(provider.id),
            "provider_name": provider.provider_name,
            "config": provider.config
        }
        for provider in providers
    ]


@router.get("/{bot_id}/scopes", response_model=List[dict])
async def list_bot_scopes(
    bot_id: UUID,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Get scopes associated with a bot."""
    
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
    
    # Get bot scopes
    bot_with_scopes = db.query(Bot).options(
        joinedload(Bot.scopes)
    ).filter(Bot.id == bot_id).first()
    
    return [
        {
            "id": str(scope.id),
            "name": scope.name,
            "description": scope.description,
            "config": scope.config,
            "is_active": scope.is_active
        }
        for scope in bot_with_scopes.scopes
    ] if bot_with_scopes.scopes else []


@router.get("/statistics/overview")
async def get_bot_statistics(
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Get bot statistics for the tenant."""
    
    total_bots = db.query(func.count(Bot.id)).filter(
        Bot.tenant_id == current_tenant.id
    ).scalar()
    
    active_bots = db.query(func.count(Bot.id)).filter(
        Bot.tenant_id == current_tenant.id,
        Bot.is_active == True
    ).scalar()
    
    # Get conversations count
    from ...models import Conversation
    total_conversations = db.query(func.count(Conversation.id)).join(Bot).filter(
        Bot.tenant_id == current_tenant.id
    ).scalar()
    
    # Get top performing bots
    top_bots = db.query(
        Bot.id,
        Bot.name,
        func.count(Conversation.id).label('conversation_count')
    ).outerjoin(Conversation).filter(
        Bot.tenant_id == current_tenant.id
    ).group_by(Bot.id, Bot.name).order_by(
        func.count(Conversation.id).desc()
    ).limit(5).all()
    
    return {
        "total_bots": total_bots,
        "active_bots": active_bots,
        "total_conversations": total_conversations,
        "top_bots": [
            {
                "id": str(bot.id),
                "name": bot.name,
                "conversation_count": bot.conversation_count
            }
            for bot in top_bots
        ]
    }


@router.get("/datasets/available", response_model=List[dict])
async def list_available_datasets(
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Get available datasets for the tenant."""
    
    datasets = db.query(Dataset).filter(
        Dataset.tenant_id == current_tenant.id,
        Dataset.is_active == True
    ).all()
    
    return [
        {
            "id": str(dataset.id),
            "name": dataset.name,
            "description": dataset.description,
            "tags": dataset.tags,
            "created_at": dataset.created_at.isoformat(),
        }
        for dataset in datasets
    ]


@router.post("/{bot_id}/datasets/{dataset_id}")
async def assign_dataset_to_bot(
    bot_id: UUID,
    dataset_id: UUID,
    priority: int = 1,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Assign a dataset to a bot."""
    
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
    
    # Verify dataset belongs to tenant
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.tenant_id == current_tenant.id,
        Dataset.is_active == True
    ).first()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    # Check if relationship already exists
    existing = db.query(BotDataset).filter(
        BotDataset.bot_id == bot_id,
        BotDataset.dataset_id == dataset_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dataset already assigned to bot"
        )
    
    # Create relationship
    bot_dataset = BotDataset(
        bot_id=bot_id,
        dataset_id=dataset_id,
        priority=priority,
        is_active=True
    )
    
    db.add(bot_dataset)
    db.commit()
    
    return {"message": "Dataset assigned to bot successfully"}


@router.delete("/{bot_id}/datasets/{dataset_id}")
async def remove_dataset_from_bot(
    bot_id: UUID,
    dataset_id: UUID,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Remove a dataset from a bot."""
    
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
    
    # Find and delete the relationship
    bot_dataset = db.query(BotDataset).filter(
        BotDataset.bot_id == bot_id,
        BotDataset.dataset_id == dataset_id
    ).first()
    
    if not bot_dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not assigned to bot"
        )
    
    db.delete(bot_dataset)
    db.commit()
    
    return {"message": "Dataset removed from bot successfully"}


@router.get("/{bot_id}/datasets", response_model=List[dict])
async def list_bot_datasets(
    bot_id: UUID,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """List datasets assigned to a bot."""
    
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
    
    # Get bot-dataset relationships with dataset info
    assignments = db.query(BotDataset, Dataset).join(
        Dataset, BotDataset.dataset_id == Dataset.id
    ).filter(
        BotDataset.bot_id == bot_id
    ).order_by(BotDataset.priority).all()
    
    return [
        {
            "id": str(dataset.id),
            "name": dataset.name,
            "description": dataset.description,
            "tags": dataset.tags,
            "priority": assignment.priority,
            "is_active": assignment.is_active,
            "assigned_at": assignment.created_at.isoformat()
        }
        for assignment, dataset in assignments
    ]