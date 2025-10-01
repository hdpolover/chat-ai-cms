"""Tenant document management routes."""

import hashlib
import mimetypes
import os
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from ...db import get_sync_db
from ...models import Tenant, Dataset, Document, Chunk
from ...schemas import DocumentCreate, DocumentUpdate, DocumentResponse
from ...services.job_queue_service import job_queue_service
from .auth import get_current_tenant

router = APIRouter(prefix="/v1/tenant", tags=["Tenant - Documents"])


def generate_content_hash(content: str) -> str:
    """Generate SHA-256 hash of content."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


def extract_text_from_file(file_content: bytes, filename: str) -> str:
    """Extract text content from uploaded file."""
    # Get file extension
    _, ext = os.path.splitext(filename.lower())
    
    if ext in ['.txt', '.md', '.py', '.js', '.json', '.csv', '.log']:
        # Plain text files
        try:
            return file_content.decode('utf-8')
        except UnicodeDecodeError:
            try:
                return file_content.decode('latin-1')
            except UnicodeDecodeError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot decode text from file {filename}"
                )
    
    elif ext == '.pdf':
        # TODO: Implement PDF extraction using PyPDF2 or similar
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="PDF extraction not yet implemented. Please upload as text for now."
        )
    
    elif ext in ['.doc', '.docx']:
        # TODO: Implement Word document extraction using python-docx
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Word document extraction not yet implemented. Please upload as text for now."
        )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {ext}. Supported types: .txt, .md, .py, .js, .json, .csv, .log"
        )


@router.get("/datasets/{dataset_id}/documents", response_model=List[DocumentResponse])
async def list_documents(
    dataset_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None, description="Search in title and content"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """List documents in a dataset."""
    
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
    
    query = db.query(Document).filter(Document.dataset_id == dataset_id)
    
    if status_filter:
        query = query.filter(Document.status == status_filter)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Document.title.ilike(search_term)) | 
            (Document.content.ilike(search_term))
        )
    
    if tags:
        # Filter documents that contain any of the specified tags
        for tag in tags:
            query = query.filter(Document.tags.op('@>')([tag]))
    
    documents = query.offset(skip).limit(limit).all()
    
    return [
        DocumentResponse(
            id=str(doc.id),
            dataset_id=str(doc.dataset_id),
            title=doc.title,
            source_type=doc.source_type,
            source_url=doc.source_url,
            tags=doc.tags,
            metadata=doc.meta_data,
            content_hash=doc.content_hash,
            status=doc.status,
            error_message=doc.error_message,
            file_size=doc.file_size,
            created_at=doc.created_at,
            updated_at=doc.updated_at
        )
        for doc in documents
    ]


@router.get("/documents", response_model=List[DocumentResponse])
async def list_all_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None, description="Search documents by title or content"),
    dataset_id: Optional[UUID] = Query(None, description="Filter by dataset ID"),
    status: Optional[str] = Query(None, description="Filter by processing status"),
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """List all documents for the current tenant across all datasets."""
    
    # Base query for tenant's documents with dataset info
    query = db.query(Document).join(Dataset).filter(
        Dataset.tenant_id == current_tenant.id
    ).options(joinedload(Document.dataset))
    
    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Document.title.ilike(search_term)) | 
            (Document.content.ilike(search_term))
        )
    
    if dataset_id:
        query = query.filter(Document.dataset_id == dataset_id)
    
    if status:
        query = query.filter(Document.status == status)
    
    # Order by created_at desc and apply pagination
    query = query.order_by(Document.created_at.desc())
    documents = query.offset(skip).limit(limit).all()
    
    # Convert to response format
    return [
        DocumentResponse(
            id=str(doc.id),
            dataset_id=str(doc.dataset_id),
            title=doc.title,
            source_type=doc.source_type,
            source_url=doc.source_url,
            tags=doc.tags,
            metadata=doc.meta_data,
            content_hash=doc.content_hash,
            status=doc.status,
            error_message=doc.error_message,
            file_size=doc.file_size,
            created_at=doc.created_at,
            updated_at=doc.updated_at,
            dataset_name=doc.dataset.name if doc.dataset else None
        )
        for doc in documents
    ]


@router.post("/datasets/{dataset_id}/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document_text(
    dataset_id: UUID,
    document_data: DocumentCreate,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Create a new document with text content."""
    
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
    
    # Generate content hash
    content_hash = generate_content_hash(document_data.content)
    
    # Check for duplicate content
    existing_doc = db.query(Document).filter(
        Document.dataset_id == dataset_id,
        Document.content_hash == content_hash
    ).first()
    
    if existing_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Document with identical content already exists: {existing_doc.title}"
        )
    
    # Create document
    document = Document(
        dataset_id=dataset_id,
        title=document_data.title,
        content=document_data.content,
        source_type=document_data.source_type,
        source_url=document_data.source_url,
        tags=document_data.tags,
        meta_data=document_data.metadata,
        content_hash=content_hash,
        file_size=len(document_data.content.encode('utf-8')),
        status="pending",  # Will be processed to generate chunks
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    # Enqueue document processing in background
    try:
        job_id = job_queue_service.enqueue_document_processing(str(document.id))
        print(f"Text document processing job enqueued: {job_id}")  # Temporary logging
    except Exception as e:
        print(f"Failed to enqueue text processing job: {e}")  # Temporary logging
        # Don't fail the document creation if job queueing fails
    
    return DocumentResponse(
        id=str(document.id),
        dataset_id=str(document.dataset_id),
        title=document.title,
        source_type=document.source_type,
        source_url=document.source_url,
        tags=document.tags,
        metadata=document.meta_data,
        content_hash=document.content_hash,
        status=document.status,
        error_message=document.error_message,
        file_size=document.file_size,
        created_at=document.created_at,
        updated_at=document.updated_at
    )


@router.post("/datasets/{dataset_id}/documents/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document_file(
    dataset_id: UUID,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    source_url: Optional[str] = Form(None),
    tags: Optional[str] = Form(None, description="Comma-separated tags"),
    metadata: Optional[str] = Form(None, description="JSON metadata"),
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Upload a document file."""
    
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
    
    # Read file content
    file_content = await file.read()
    
    # Extract text from file
    try:
        content = extract_text_from_file(file_content, file.filename)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing file: {str(e)}"
        )
    
    # Generate content hash
    content_hash = generate_content_hash(content)
    
    # Check for duplicate content
    existing_doc = db.query(Document).filter(
        Document.dataset_id == dataset_id,
        Document.content_hash == content_hash
    ).first()
    
    if existing_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Document with identical content already exists: {existing_doc.title}"
        )
    
    # Parse optional fields
    document_title = title or file.filename
    document_tags = []
    if tags:
        document_tags = [tag.strip() for tag in tags.split(',') if tag.strip()]
    
    document_metadata = {}
    if metadata:
        import json
        try:
            document_metadata = json.loads(metadata)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON metadata"
            )
    
    # Add file info to metadata
    document_metadata.update({
        "original_filename": file.filename,
        "file_type": file.content_type,
        "upload_size": len(file_content)
    })
    
    # Create upload directory if it doesn't exist
    upload_dir = "/app/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save file
    file_path = os.path.join(upload_dir, f"{dataset_id}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Create document
    document = Document(
        dataset_id=dataset_id,
        title=document_title,
        content=content,
        source_type="file",
        source_url=source_url,
        file_path=file_path,
        tags=document_tags,
        meta_data=document_metadata,
        content_hash=content_hash,
        file_size=len(file_content),
        status="pending",  # Will be processed to generate chunks
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    # Enqueue document processing in background
    try:
        job_id = job_queue_service.enqueue_document_processing(str(document.id))
        print(f"Text document processing job enqueued: {job_id}")  # Temporary logging
    except Exception as e:
        print(f"Failed to enqueue text processing job: {e}")  # Temporary logging
        # Don't fail the document creation if job queueing fails
    
    return DocumentResponse(
        id=str(document.id),
        dataset_id=str(document.dataset_id),
        title=document.title,
        source_type=document.source_type,
        source_url=document.source_url,
        tags=document.tags,
        metadata=document.meta_data,
        content_hash=document.content_hash,
        status=document.status,
        error_message=document.error_message,
        file_size=document.file_size,
        created_at=document.created_at,
        updated_at=document.updated_at
    )


@router.get("/documents/{document_id}")
async def get_document(
    document_id: UUID,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Get a specific document by ID with enhanced details."""
    
    # Query with join to verify tenant ownership
    document = db.query(Document).join(Dataset).filter(
        Document.id == document_id,
        Dataset.tenant_id == current_tenant.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Get chunk statistics
    chunk_count = db.query(Chunk).filter(Chunk.document_id == document.id).count()
    chunks_with_embeddings = db.query(Chunk).filter(
        Chunk.document_id == document.id,
        Chunk.embedding.isnot(None)
    ).count()
    
    # Get dataset with full details
    dataset = db.query(Dataset).filter(Dataset.id == document.dataset_id).first()
    dataset_info = None
    if dataset:
        # Get other documents in this dataset
        other_documents = db.query(Document).filter(
            Document.dataset_id == dataset.id,
            Document.id != document.id
        ).all()
        
        # Calculate dataset statistics
        total_docs = db.query(Document).filter(Document.dataset_id == dataset.id).count()
        completed_docs = db.query(Document).filter(
            Document.dataset_id == dataset.id,
            Document.status == "completed"
        ).count()
        total_chunks = db.query(Chunk).join(Document).filter(
            Document.dataset_id == dataset.id
        ).count()
        
        dataset_info = {
            "id": str(dataset.id),
            "name": dataset.name,
            "description": dataset.description,
            "tags": dataset.tags or [],
            "metadata": dataset.meta_data or {},
            "created_at": dataset.created_at,
            "updated_at": dataset.updated_at,
            "total_documents": total_docs,
            "completed_documents": completed_docs,
            "total_chunks": total_chunks,
            "other_documents": [
                {
                    "id": str(doc.id),
                    "title": doc.title,
                    "status": doc.status,
                    "file_size": doc.file_size,
                    "created_at": doc.created_at
                }
                for doc in other_documents[:10]  # Limit to 10 for performance
            ]
        }
    
    return {
        "id": str(document.id),
        "dataset_id": str(document.dataset_id),
        "dataset_name": dataset.name if dataset else None,
        "title": document.title or "Untitled",
        "source_type": document.source_type or "unknown",
        "source_url": document.source_url,
        "tags": document.tags or [],
        "metadata": document.meta_data or {},
        "content_hash": document.content_hash,
        "status": document.status or "unknown",
        "error_message": document.error_message,
        "file_size": document.file_size or 0,
        "created_at": document.created_at,
        "updated_at": document.updated_at,
        "chunk_count": chunk_count,
        "chunks_with_embeddings": chunks_with_embeddings,
        "processing_complete": document.status == "completed",
        "dataset": dataset_info
    }


@router.get("/documents/{document_id}/content")
async def get_document_content(
    document_id: UUID,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Get the full content of a document."""
    
    # Query with join to verify tenant ownership
    document = db.query(Document).join(Dataset).filter(
        Document.id == document_id,
        Dataset.tenant_id == current_tenant.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return {
        "id": str(document.id),
        "title": document.title,
        "content": document.content,
        "content_hash": document.content_hash
    }


@router.put("/documents/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: UUID,
    document_data: DocumentUpdate,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Update a document."""
    
    # Query with join to verify tenant ownership
    document = db.query(Document).join(Dataset).filter(
        Document.id == document_id,
        Dataset.tenant_id == current_tenant.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Update document fields (content cannot be updated, only metadata)
    update_data = document_data.dict(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        for field, value in update_data.items():
            if field == "metadata":
                setattr(document, "meta_data", value)
            else:
                setattr(document, field, value)
    
    db.commit()
    db.refresh(document)
    
    return DocumentResponse(
        id=str(document.id),
        dataset_id=str(document.dataset_id),
        title=document.title,
        source_type=document.source_type,
        source_url=document.source_url,
        tags=document.tags,
        metadata=document.meta_data,
        content_hash=document.content_hash,
        status=document.status,
        error_message=document.error_message,
        file_size=document.file_size,
        created_at=document.created_at,
        updated_at=document.updated_at
    )


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: UUID,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Delete a document and its associated chunks."""
    
    # Query with join to verify tenant ownership
    document = db.query(Document).join(Dataset).filter(
        Document.id == document_id,
        Dataset.tenant_id == current_tenant.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Delete associated file if it exists
    if document.file_path and os.path.exists(document.file_path):
        try:
            os.remove(document.file_path)
        except OSError:
            pass  # File might already be deleted
    
    # Delete chunks (will cascade due to foreign key)
    chunk_count = db.query(func.count(Chunk.id)).filter(
        Chunk.document_id == document_id
    ).scalar()
    
    # Delete document (chunks will cascade)
    db.delete(document)
    db.commit()
    
    return {
        "message": "Document deleted successfully",
        "chunks_deleted": chunk_count
    }


@router.get("/documents/{document_id}/chunks")
async def get_document_chunks(
    document_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Get chunks for a document."""
    
    # Query with join to verify tenant ownership
    document = db.query(Document).join(Dataset).filter(
        Document.id == document_id,
        Dataset.tenant_id == current_tenant.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    chunks = db.query(Chunk).filter(
        Chunk.document_id == document_id
    ).order_by(Chunk.chunk_index).offset(skip).limit(limit).all()
    
    return [
        {
            "id": str(chunk.id),
            "content": chunk.content,
            "token_count": chunk.token_count,
            "chunk_index": chunk.chunk_index,
            "start_char": chunk.start_char,
            "end_char": chunk.end_char,
            "metadata": chunk.meta_data,
            "has_embedding": chunk.embedding is not None,
            "created_at": chunk.created_at
        }
        for chunk in chunks
    ]


@router.post("/documents/{document_id}/reprocess")
async def reprocess_document(
    document_id: UUID,
    db: Session = Depends(get_sync_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    """Trigger reprocessing of a document to regenerate chunks and embeddings."""
    
    # Query with join to verify tenant ownership
    document = db.query(Document).join(Dataset).filter(
        Document.id == document_id,
        Dataset.tenant_id == current_tenant.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Reset status to trigger reprocessing
    document.status = "pending"
    document.error_message = None
    document.updated_at = datetime.utcnow()
    
    # Delete existing chunks
    db.query(Chunk).filter(Chunk.document_id == document_id).delete()
    
    db.commit()
    
    # TODO: Trigger document processing service
    # This will be implemented in the next todo item
    
    return {
        "message": "Document queued for reprocessing",
        "document_id": str(document_id),
        "status": "pending"
    }