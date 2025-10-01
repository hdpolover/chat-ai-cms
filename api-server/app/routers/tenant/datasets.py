"""Tenant dataset management routes."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from ...db import get_sync_db
from ...models import Tenant, Dataset, Document, Chunk
from ...schemas import DatasetCreate, DatasetUpdate, DatasetResponse
from .auth import get_current_tenant

router = APIRouter(prefix="/v1/tenant/datasets", tags=["Tenant - Datasets"])


@router.get("/")
async def list_datasets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None, description="Search in name and description"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """List datasets for the current tenant."""
    
    query = db.query(Dataset).filter(Dataset.tenant_id == current_tenant.id)
    
    if is_active is not None:
        query = query.filter(Dataset.is_active == is_active)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Dataset.name.ilike(search_term)) | 
            (Dataset.description.ilike(search_term))
        )
    
    if tags:
        # Filter datasets that contain any of the specified tags
        for tag in tags:
            query = query.filter(Dataset.tags.op('@>')([tag]))
    
    datasets = query.offset(skip).limit(limit).all()
    
    # Enhanced response with statistics
    result = []
    for dataset in datasets:
        # Get basic statistics for list view
        document_count = db.query(Document).filter(Document.dataset_id == dataset.id).count()
        chunk_count = db.query(Chunk).join(Document).filter(Document.dataset_id == dataset.id).count()
        completed_documents = db.query(Document).filter(
            Document.dataset_id == dataset.id,
            Document.status == "completed"
        ).count()
        
        result.append({
            "id": str(dataset.id),
            "tenant_id": str(dataset.tenant_id),
            "name": dataset.name,
            "description": dataset.description,
            "tags": dataset.tags or [],
            "metadata": dataset.meta_data or {},
            "is_active": dataset.is_active,
            "created_at": dataset.created_at,
            "updated_at": dataset.updated_at,
            "document_count": document_count,
            "chunk_count": chunk_count,
            "completed_documents": completed_documents,
            "processing_complete": completed_documents == document_count and document_count > 0
        })
    
    return result


@router.post("/", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
async def create_dataset(
    dataset_data: DatasetCreate,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Create a new dataset for the current tenant."""
    
    # Check if dataset with same name already exists for this tenant
    existing_dataset = db.query(Dataset).filter(
        Dataset.tenant_id == current_tenant.id,
        Dataset.name == dataset_data.name
    ).first()
    
    if existing_dataset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dataset with name '{dataset_data.name}' already exists"
        )
    
    # Create dataset
    dataset = Dataset(
        tenant_id=current_tenant.id,
        name=dataset_data.name,
        description=dataset_data.description,
        tags=dataset_data.tags,
        meta_data=dataset_data.metadata,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    
    return DatasetResponse(
        id=str(dataset.id),
        tenant_id=str(dataset.tenant_id),
        name=dataset.name,
        description=dataset.description,
        tags=dataset.tags,
        metadata=dataset.meta_data,
        is_active=dataset.is_active,
        created_at=dataset.created_at,
        updated_at=dataset.updated_at
    )


@router.get("/{dataset_id}")
async def get_dataset(
    dataset_id: UUID,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Get comprehensive dataset details with all related data."""
    
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.tenant_id == current_tenant.id
    ).first()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    # Get document statistics
    documents = db.query(Document).filter(Document.dataset_id == dataset.id).all()
    total_documents = len(documents)
    
    documents_by_status = {}
    total_file_size = 0
    latest_document = None
    latest_update = None
    
    for doc in documents:
        # Count by status
        status = doc.status or "unknown"
        documents_by_status[status] = documents_by_status.get(status, 0) + 1
        
        # Sum file sizes
        if doc.file_size:
            total_file_size += doc.file_size
            
        # Track latest document
        if not latest_document or doc.created_at > latest_document.created_at:
            latest_document = doc
            
        # Track latest update
        if not latest_update or doc.updated_at > latest_update:
            latest_update = doc.updated_at
    
    # Get chunk statistics
    total_chunks = db.query(Chunk).join(Document).filter(
        Document.dataset_id == dataset.id
    ).count()
    
    chunks_with_embeddings = db.query(Chunk).join(Document).filter(
        Document.dataset_id == dataset.id,
        Chunk.embedding.isnot(None)
    ).count()
    
    # Get bot assignments
    from ...models import BotDataset, Bot
    assigned_bots = db.query(Bot).join(BotDataset).filter(
        BotDataset.dataset_id == dataset.id,
        Bot.tenant_id == current_tenant.id
    ).all()
    
    # Get document details for comprehensive view
    document_details = []
    for doc in documents[:20]:  # Limit to 20 most recent for performance
        chunk_count = db.query(Chunk).filter(Chunk.document_id == doc.id).count()
        doc_chunks_with_embeddings = db.query(Chunk).filter(
            Chunk.document_id == doc.id,
            Chunk.embedding.isnot(None)
        ).count()
        
        document_details.append({
            "id": str(doc.id),
            "title": doc.title,
            "source_type": doc.source_type,
            "status": doc.status,
            "file_size": doc.file_size,
            "chunk_count": chunk_count,
            "chunks_with_embeddings": doc_chunks_with_embeddings,
            "processing_complete": doc.status == "completed",
            "created_at": doc.created_at,
            "updated_at": doc.updated_at,
            "tags": doc.tags or []
        })
    
    # Calculate processing progress
    processing_progress = 0
    if total_chunks > 0:
        processing_progress = (chunks_with_embeddings / total_chunks) * 100
    
    return {
        "id": str(dataset.id),
        "tenant_id": str(dataset.tenant_id),
        "name": dataset.name,
        "description": dataset.description,
        "tags": dataset.tags or [],
        "metadata": dataset.meta_data or {},
        "is_active": dataset.is_active,
        "created_at": dataset.created_at,
        "updated_at": dataset.updated_at,
        "statistics": {
            "total_documents": total_documents,
            "documents_by_status": documents_by_status,
            "total_chunks": total_chunks,
            "chunks_with_embeddings": chunks_with_embeddings,
            "total_file_size": total_file_size,
            "processing_progress": round(processing_progress, 2),
            "processing_complete": chunks_with_embeddings == total_chunks and total_chunks > 0
        },
        "documents": document_details,
        "assigned_bots": [
            {
                "id": str(bot.id),
                "name": bot.name,
                "description": getattr(bot, 'description', None),
                "is_active": getattr(bot, 'is_active', True),
                "created_at": getattr(bot, 'created_at', None)
            }
            for bot in assigned_bots
        ],
        "latest_document": {
            "id": str(latest_document.id),
            "title": latest_document.title,
            "created_at": latest_document.created_at
        } if latest_document else None,
        "last_activity": latest_update or dataset.updated_at
    }


@router.put("/{dataset_id}", response_model=DatasetResponse)
async def update_dataset(
    dataset_id: UUID,
    dataset_data: DatasetUpdate,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Update a dataset."""
    
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.tenant_id == current_tenant.id
    ).first()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    # Check for name conflicts if name is being updated
    if dataset_data.name and dataset_data.name != dataset.name:
        existing_dataset = db.query(Dataset).filter(
            Dataset.tenant_id == current_tenant.id,
            Dataset.name == dataset_data.name,
            Dataset.id != dataset_id
        ).first()
        
        if existing_dataset:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Dataset with name '{dataset_data.name}' already exists"
            )
    
    # Update dataset fields
    update_data = dataset_data.dict(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        for field, value in update_data.items():
            if field == "metadata":
                setattr(dataset, "meta_data", value)
            else:
                setattr(dataset, field, value)
    
    db.commit()
    db.refresh(dataset)
    
    return DatasetResponse(
        id=str(dataset.id),
        tenant_id=str(dataset.tenant_id),
        name=dataset.name,
        description=dataset.description,
        tags=dataset.tags,
        metadata=dataset.meta_data,
        is_active=dataset.is_active,
        created_at=dataset.created_at,
        updated_at=dataset.updated_at
    )


@router.delete("/{dataset_id}")
async def delete_dataset(
    dataset_id: UUID,
    force: bool = Query(False, description="Force delete even if dataset has documents or is assigned to bots"),
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Delete a dataset."""
    
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.tenant_id == current_tenant.id
    ).first()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    if not force:
        # Check if dataset has documents
        document_count = db.query(func.count(Document.id)).filter(
            Document.dataset_id == dataset_id
        ).scalar()
        
        if document_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete dataset with {document_count} documents. Use force=true to delete anyway."
            )
        
        # Check if dataset is assigned to any bots
        from ...models import BotDataset
        bot_assignment_count = db.query(func.count(BotDataset.id)).filter(
            BotDataset.dataset_id == dataset_id
        ).scalar()
        
        if bot_assignment_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete dataset assigned to {bot_assignment_count} bots. Use force=true to delete anyway."
            )
    
    db.delete(dataset)
    db.commit()
    
    return {"message": "Dataset deleted successfully"}


@router.get("/{dataset_id}/statistics")
async def get_dataset_statistics(
    dataset_id: UUID,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Get statistics for a specific dataset."""
    
    # Verify dataset belongs to tenant
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.tenant_id == current_tenant.id
    ).first()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    # Get document statistics
    total_documents = db.query(func.count(Document.id)).filter(
        Document.dataset_id == dataset_id
    ).scalar()
    
    documents_by_status = db.query(
        Document.status,
        func.count(Document.id).label('count')
    ).filter(
        Document.dataset_id == dataset_id
    ).group_by(Document.status).all()
    
    # Get chunk statistics
    total_chunks = db.query(func.count(Chunk.id)).join(Document).filter(
        Document.dataset_id == dataset_id
    ).scalar()
    
    # Get total file size
    total_size = db.query(func.sum(Document.file_size)).filter(
        Document.dataset_id == dataset_id
    ).scalar() or 0
    
    # Get bot assignments
    from ...models import BotDataset, Bot
    assigned_bots = db.query(
        Bot.id,
        Bot.name
    ).join(BotDataset).filter(
        BotDataset.dataset_id == dataset_id,
        Bot.tenant_id == current_tenant.id
    ).all()
    
    return {
        "dataset_id": str(dataset_id),
        "total_documents": total_documents,
        "total_chunks": total_chunks,
        "total_size_bytes": total_size,
        "documents_by_status": {
            status: count for status, count in documents_by_status
        },
        "assigned_bots": [
            {
                "id": str(bot.id),
                "name": bot.name
            }
            for bot in assigned_bots
        ]
    }


@router.get("/statistics/overview")
async def get_datasets_overview(
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Get overview statistics for all datasets in the tenant."""
    
    total_datasets = db.query(func.count(Dataset.id)).filter(
        Dataset.tenant_id == current_tenant.id
    ).scalar()
    
    active_datasets = db.query(func.count(Dataset.id)).filter(
        Dataset.tenant_id == current_tenant.id,
        Dataset.is_active == True
    ).scalar()
    
    total_documents = db.query(func.count(Document.id)).join(Dataset).filter(
        Dataset.tenant_id == current_tenant.id
    ).scalar()
    
    total_chunks = db.query(func.count(Chunk.id)).join(Document).join(Dataset).filter(
        Dataset.tenant_id == current_tenant.id
    ).scalar()
    
    # Get processing status breakdown
    documents_by_status = db.query(
        Document.status,
        func.count(Document.id).label('count')
    ).join(Dataset).filter(
        Dataset.tenant_id == current_tenant.id
    ).group_by(Document.status).all()
    
    # Get largest datasets
    largest_datasets = db.query(
        Dataset.id,
        Dataset.name,
        func.count(Document.id).label('document_count')
    ).outerjoin(Document).filter(
        Dataset.tenant_id == current_tenant.id
    ).group_by(Dataset.id, Dataset.name).order_by(
        func.count(Document.id).desc()
    ).limit(5).all()
    
    return {
        "total_datasets": total_datasets,
        "active_datasets": active_datasets,
        "total_documents": total_documents,
        "total_chunks": total_chunks,
        "documents_by_status": {
            status: count for status, count in documents_by_status
        },
        "largest_datasets": [
            {
                "id": str(dataset.id),
                "name": dataset.name,
                "document_count": dataset.document_count
            }
            for dataset in largest_datasets
        ]
    }