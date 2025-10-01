"""Scope management router for bot access control."""
import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ...db import get_sync_db
from ...models import Bot, Scope, Tenant
from ...schemas import ScopeCreate, ScopeUpdate, ScopeResponse
from .auth import get_current_tenant

router = APIRouter(prefix="/v1/tenant/bots", tags=["Bot Scopes"])
logger = structlog.get_logger()


@router.get("/{bot_id}/scopes", response_model=List[ScopeResponse])
async def get_bot_scopes(
    bot_id: str,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Get all scopes for a specific bot."""
    try:
        # Verify bot exists and belongs to tenant
        bot = db.query(Bot).filter(
            Bot.id == bot_id, 
            Bot.tenant_id == current_tenant.id, 
            Bot.is_active == True
        ).first()
        
        if not bot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bot not found"
            )
        
        # Get scopes for the bot
        scopes = db.query(Scope).filter(
            Scope.bot_id == bot_id
        ).order_by(Scope.created_at).all()
        
        return [ScopeResponse.model_validate(scope) for scope in scopes]
        
    except Exception as e:
        logger.error("Error retrieving bot scopes", bot_id=bot_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve bot scopes"
        )


@router.post("/{bot_id}/scopes", response_model=ScopeResponse)
async def create_bot_scope(
    bot_id: str,
    scope_data: ScopeCreate,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Create a new scope for a bot."""
    try:
        # Verify bot exists and belongs to tenant
        bot = db.query(Bot).filter(
            Bot.id == bot_id, 
            Bot.tenant_id == current_tenant.id, 
            Bot.is_active == True
        ).first()
        
        if not bot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bot not found"
            )
        
        # Check if scope name already exists for this bot
        existing_scope = db.query(Scope).filter(
            Scope.bot_id == bot_id, 
            Scope.name == scope_data.name
        ).first()
        
        if existing_scope:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Scope with this name already exists for this bot"
            )
        
        # Create new scope
        new_scope = Scope(
            bot_id=bot_id,
            name=scope_data.name,
            description=scope_data.description,
            dataset_filters=scope_data.dataset_filters or {},
            guardrails=scope_data.guardrails.model_dump() if scope_data.guardrails else {},
            is_active=scope_data.is_active
        )
        
        db.add(new_scope)
        db.commit()
        db.refresh(new_scope)
        
        logger.info("Created bot scope", bot_id=bot_id, scope_id=str(new_scope.id))
        return ScopeResponse.model_validate(new_scope)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error("Error creating bot scope", bot_id=bot_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create bot scope"
        )


@router.get("/{bot_id}/scopes/{scope_id}", response_model=ScopeResponse)
async def get_bot_scope(
    bot_id: str,
    scope_id: str,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Get a specific scope for a bot."""
    try:
        # Verify bot exists and belongs to tenant
        bot = db.query(Bot).filter(
            Bot.id == bot_id, 
            Bot.tenant_id == current_tenant.id, 
            Bot.is_active == True
        ).first()
        
        if not bot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bot not found"
            )
        
        # Get the scope
        scope = db.query(Scope).filter(
            Scope.id == scope_id, 
            Scope.bot_id == bot_id
        ).first()
        
        if not scope:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scope not found"
            )
        
        return ScopeResponse.model_validate(scope)
        
    except Exception as e:
        logger.error("Error retrieving bot scope", bot_id=bot_id, scope_id=scope_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve bot scope"
        )


@router.put("/{bot_id}/scopes/{scope_id}", response_model=ScopeResponse)
async def update_bot_scope(
    bot_id: str,
    scope_id: str,
    scope_update: ScopeUpdate,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Update an existing scope for a bot."""
    try:
        # Verify bot exists and belongs to tenant
        bot = db.query(Bot).filter(
            Bot.id == bot_id, 
            Bot.tenant_id == current_tenant.id, 
            Bot.is_active == True
        ).first()
        
        if not bot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bot not found"
            )
        
        # Get the scope
        scope = db.query(Scope).filter(
            Scope.id == scope_id, 
            Scope.bot_id == bot_id
        ).first()
        
        if not scope:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scope not found"
            )
        
        # Update scope fields
        update_data = scope_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "guardrails" and value:
                setattr(scope, field, value.model_dump() if hasattr(value, 'model_dump') else value)
            else:
                setattr(scope, field, value)
        
        db.commit()
        db.refresh(scope)
        
        logger.info("Updated bot scope", bot_id=bot_id, scope_id=scope_id)
        return ScopeResponse.model_validate(scope)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error("Error updating bot scope", bot_id=bot_id, scope_id=scope_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update bot scope"
        )


@router.delete("/{bot_id}/scopes/{scope_id}")
async def delete_bot_scope(
    bot_id: str,
    scope_id: str,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Delete a scope from a bot."""
    try:
        # Verify bot exists and belongs to tenant
        bot = db.query(Bot).filter(
            Bot.id == bot_id, 
            Bot.tenant_id == current_tenant.id, 
            Bot.is_active == True
        ).first()
        
        if not bot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bot not found"
            )
        
        # Get the scope
        scope = db.query(Scope).filter(
            Scope.id == scope_id, 
            Scope.bot_id == bot_id
        ).first()
        
        if not scope:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scope not found"
            )
        
        # Delete the scope
        db.delete(scope)
        db.commit()
        
        logger.info("Deleted bot scope", bot_id=bot_id, scope_id=scope_id)
        return {"message": "Scope deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error("Error deleting bot scope", bot_id=bot_id, scope_id=scope_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete bot scope"
        )
