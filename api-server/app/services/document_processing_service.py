"""Document processing service for chunking and embedding generation."""
import asyncio
import re
from datetime import datetime
from typing import List, Optional, Tuple

import openai
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import async_session
from ..models import Document, Chunk, TenantAIProvider, Tenant, Dataset

logger = structlog.get_logger()


class DocumentProcessingService:
    """Service for processing documents into chunks with embeddings."""

    def __init__(self):
        self.chunk_size = 1000  # Target chunk size in characters
        self.chunk_overlap = 200  # Overlap between chunks
        self.max_chunk_size = 1500  # Maximum chunk size
        self.embedding_model = "text-embedding-ada-002"  # OpenAI embedding model
        self.embedding_dimensions = 1536  # OpenAI ada-002 dimensions

    async def process_document(self, document_id: str) -> bool:
        """Process a document by generating chunks and embeddings."""
        async with async_session() as db:
            try:
                # Get document with dataset and tenant info
                result = await db.execute(
                    select(Document, Dataset, Tenant)
                    .join(Dataset, Document.dataset_id == Dataset.id)
                    .join(Tenant, Dataset.tenant_id == Tenant.id)
                    .filter(Document.id == document_id)
                )
                doc_info = result.first()
                
                if not doc_info:
                    logger.error("Document not found", document_id=document_id)
                    return False
                
                document, dataset, tenant = doc_info
                
                # Update status to processing
                document.status = "processing"
                document.error_message = None
                document.updated_at = datetime.utcnow()
                await db.commit()

                # Generate chunks
                chunks = await self._generate_chunks(document.content)
                
                # Get embedding client for tenant
                embedding_client = await self._get_embedding_client(tenant, db)
                
                # Process each chunk
                for i, chunk_content in enumerate(chunks):
                    try:
                        # Generate embedding
                        embedding = None
                        if embedding_client:
                            embedding = await self._generate_embedding(
                                embedding_client, chunk_content
                            )
                        
                        # Calculate character positions
                        start_char = document.content.find(chunk_content)
                        end_char = start_char + len(chunk_content)
                        
                        # Create chunk record
                        chunk = Chunk(
                            document_id=document.id,
                            content=chunk_content,
                            embedding=embedding,
                            token_count=self._estimate_tokens(chunk_content),
                            chunk_index=i,
                            start_char=start_char,
                            end_char=end_char,
                            meta_data={
                                "chunk_method": "recursive_text_splitting",
                                "chunk_size": len(chunk_content),
                                "embedding_model": self.embedding_model if embedding else None
                            },
                            created_at=datetime.utcnow()
                        )
                        
                        db.add(chunk)
                    
                    except Exception as e:
                        logger.error(
                            "Failed to process chunk",
                            document_id=document_id,
                            chunk_index=i,
                            error=str(e)
                        )
                        # Continue processing other chunks
                        continue
                
                # Update document status
                document.status = "completed"
                document.updated_at = datetime.utcnow()
                await db.commit()
                
                logger.info(
                    "Document processed successfully",
                    document_id=document_id,
                    chunk_count=len(chunks)
                )
                return True
                
            except Exception as e:
                # Update document status to failed
                try:
                    async with async_session() as error_db:
                        error_doc = await error_db.get(Document, document_id)
                        if error_doc:
                            error_doc.status = "failed"
                            error_doc.error_message = str(e)
                            error_doc.updated_at = datetime.utcnow()
                            await error_db.commit()
                except Exception:
                    pass  # Don't fail on error handling
                
                logger.error(
                    "Document processing failed",
                    document_id=document_id,
                    error=str(e)
                )
                return False

    async def _generate_chunks(self, content: str) -> List[str]:
        """Generate chunks from document content using recursive text splitting."""
        if not content or len(content) <= self.chunk_size:
            return [content] if content else []
        
        # Split on paragraphs first
        paragraphs = content.split('\n\n')
        chunks = []
        current_chunk = ""
        
        for paragraph in paragraphs:
            # If paragraph is too long, split it further
            if len(paragraph) > self.chunk_size:
                # Save current chunk if it has content
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    current_chunk = ""
                
                # Split long paragraph
                paragraph_chunks = await self._split_long_text(paragraph)
                chunks.extend(paragraph_chunks)
            else:
                # Check if adding this paragraph would exceed chunk size
                test_chunk = current_chunk + "\n\n" + paragraph if current_chunk else paragraph
                
                if len(test_chunk) <= self.chunk_size:
                    current_chunk = test_chunk
                else:
                    # Save current chunk and start new one
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    current_chunk = paragraph
        
        # Add final chunk
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        # Handle overlaps
        return await self._add_overlaps(chunks)

    async def _split_long_text(self, text: str) -> List[str]:
        """Split text that's longer than chunk_size."""
        # Try splitting on sentences first
        sentences = re.split(r'(?<=[.!?])\s+', text)
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            if len(sentence) > self.max_chunk_size:
                # Split very long sentences by words
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    current_chunk = ""
                
                words = sentence.split()
                word_chunk = ""
                for word in words:
                    test_chunk = word_chunk + " " + word if word_chunk else word
                    if len(test_chunk) <= self.chunk_size:
                        word_chunk = test_chunk
                    else:
                        if word_chunk:
                            chunks.append(word_chunk.strip())
                        word_chunk = word
                
                if word_chunk:
                    chunks.append(word_chunk.strip())
            else:
                test_chunk = current_chunk + " " + sentence if current_chunk else sentence
                if len(test_chunk) <= self.chunk_size:
                    current_chunk = test_chunk
                else:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    current_chunk = sentence
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks

    async def _add_overlaps(self, chunks: List[str]) -> List[str]:
        """Add overlaps between chunks for better context preservation."""
        if len(chunks) <= 1:
            return chunks
        
        overlapped_chunks = []
        
        for i, chunk in enumerate(chunks):
            if i == 0:
                # First chunk - no previous overlap needed
                overlapped_chunks.append(chunk)
            else:
                # Add overlap from previous chunk
                prev_chunk = chunks[i-1]
                overlap_words = prev_chunk.split()[-20:]  # Last 20 words of previous chunk
                overlap_text = " ".join(overlap_words)
                
                if len(overlap_text) <= self.chunk_overlap:
                    overlapped_chunk = overlap_text + " " + chunk
                else:
                    # Trim overlap if too long
                    overlap_text = overlap_text[-self.chunk_overlap:]
                    overlapped_chunk = overlap_text + " " + chunk
                
                overlapped_chunks.append(overlapped_chunk)
        
        return overlapped_chunks

    async def _get_embedding_client(self, tenant: Tenant, db: AsyncSession) -> Optional[openai.AsyncOpenAI]:
        """Get an embedding client for the tenant."""
        try:
            # Try to get OpenAI provider first
            result = await db.execute(
                select(TenantAIProvider).filter(
                    TenantAIProvider.tenant_id == tenant.id,
                    TenantAIProvider.provider_name == "openai",
                    TenantAIProvider.is_active == True
                )
            )
            openai_provider = result.scalar_one_or_none()
            
            if openai_provider:
                return openai.AsyncOpenAI(
                    api_key=openai_provider.api_key,
                    base_url=openai_provider.base_url
                )
            
            # Try anthropic if available (for future use)
            result = await db.execute(
                select(TenantAIProvider).filter(
                    TenantAIProvider.tenant_id == tenant.id,
                    TenantAIProvider.provider_name == "anthropic",
                    TenantAIProvider.is_active == True
                )
            )
            anthropic_provider = result.scalar_one_or_none()
            
            if anthropic_provider:
                # For now, Anthropic doesn't have embedding models
                # We'll use OpenAI as fallback
                logger.warning(
                    "Anthropic provider found but no embedding model available",
                    tenant_id=tenant.id
                )
            
            logger.warning(
                "No suitable embedding provider found for tenant",
                tenant_id=tenant.id
            )
            return None
            
        except Exception as e:
            logger.error(
                "Failed to get embedding client",
                tenant_id=tenant.id,
                error=str(e)
            )
            return None

    async def _generate_embedding(self, client: openai.AsyncOpenAI, text: str) -> List[float]:
        """Generate embedding for text using OpenAI."""
        try:
            response = await client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            
            return response.data[0].embedding
            
        except Exception as e:
            logger.error(
                "Failed to generate embedding",
                error=str(e),
                text_length=len(text)
            )
            raise

    def _estimate_tokens(self, text: str) -> int:
        """Estimate token count for text (rough approximation)."""
        # Rough approximation: 1 token ≈ 4 characters for English text
        return len(text) // 4

    async def reprocess_document(self, document_id: str) -> bool:
        """Reprocess a document by deleting existing chunks and generating new ones."""
        async with async_session() as db:
            try:
                # Delete existing chunks
                result = await db.execute(
                    select(Chunk).filter(Chunk.document_id == document_id)
                )
                existing_chunks = result.scalars().all()
                
                for chunk in existing_chunks:
                    await db.delete(chunk)
                
                await db.commit()
                
                logger.info(
                    "Deleted existing chunks for reprocessing",
                    document_id=document_id,
                    chunk_count=len(existing_chunks)
                )
                
                # Process document
                return await self.process_document(document_id)
                
            except Exception as e:
                logger.error(
                    "Failed to reprocess document",
                    document_id=document_id,
                    error=str(e)
                )
                return False

    async def get_processing_status(self, document_id: str) -> dict:
        """Get processing status for a document."""
        async with async_session() as db:
            try:
                document = await db.get(Document, document_id)
                if not document:
                    return {"error": "Document not found"}
                
                # Count chunks
                result = await db.execute(
                    select(Chunk).filter(Chunk.document_id == document_id)
                )
                chunks = result.scalars().all()
                
                chunks_with_embeddings = sum(
                    1 for chunk in chunks if chunk.embedding is not None
                )
                
                return {
                    "document_id": document_id,
                    "status": document.status,
                    "error_message": document.error_message,
                    "total_chunks": len(chunks),
                    "chunks_with_embeddings": chunks_with_embeddings,
                    "processing_complete": document.status == "completed",
                    "last_updated": document.updated_at.isoformat() if document.updated_at else None
                }
                
            except Exception as e:
                logger.error(
                    "Failed to get processing status",
                    document_id=document_id,
                    error=str(e)
                )
                return {"error": str(e)}


# Global instance
document_processing_service = DocumentProcessingService()


async def process_document_async(document_id: str):
    """Async function to process a document (can be called from background tasks)."""
    return await document_processing_service.process_document(document_id)


def process_document_sync(document_id: str):
    """Synchronous wrapper for RQ background jobs."""
    import asyncio
    import structlog
    
    logger = structlog.get_logger()
    logger.info("Starting synchronous document processing", document_id=document_id)
    
    try:
        # Create new event loop for the background task
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # Run the async function
        result = loop.run_until_complete(
            document_processing_service.process_document(document_id)
        )
        
        logger.info("Document processing completed", document_id=document_id, result=result)
        return result
        
    except Exception as e:
        logger.error("Document processing failed", document_id=document_id, error=str(e))
        raise
    finally:
        loop.close()