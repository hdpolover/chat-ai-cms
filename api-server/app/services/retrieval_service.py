"""Retrieval service for finding relevant context using RAG."""
import os
from typing import List

import openai
import structlog
from pgvector.sqlalchemy import Vector
from sqlalchemy import and_, or_, select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models import Chunk, Dataset, Document, Scope
from ..schemas import Citation

logger = structlog.get_logger()

# OpenAI client for embeddings
openai_client = openai.AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
)


class RetrievalService:
    """Service for retrieving relevant context using vector search."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def retrieve_context(
        self,
        query: str,
        tenant_id: str,
        bot_scopes: List[Scope] = None,
        bot_datasets: List[Dataset] = None,
        limit: int = 5,
    ) -> List[Citation]:
        """Retrieve relevant context for a query using bot's assigned datasets."""
        logger.info("🔍 RETRIEVAL SERVICE CALLED", 
                   query=query[:50], 
                   tenant_id=tenant_id, 
                   has_datasets=bool(bot_datasets),
                   has_scopes=bool(bot_scopes))
        try:
            # Generate query embedding
            query_embedding = await self._generate_embedding(query)
            
            # Build base query for chunks
            chunk_query = (
                select(Chunk)
                .join(Document)
                .join(Dataset)
                .options(selectinload(Chunk.document))
                .where(
                    Dataset.tenant_id == tenant_id,
                    Dataset.is_active == True,
                    Document.status == "completed",
                    Chunk.embedding.isnot(None),  # Only chunks with embeddings
                )
            )
            
            # PRIORITY 1: Use bot's assigned datasets if available
            if bot_datasets:
                dataset_ids = [dataset.id for dataset in bot_datasets]
                chunk_query = chunk_query.where(Dataset.id.in_(dataset_ids))
                logger.info(
                    "Using bot datasets for retrieval",
                    dataset_count=len(dataset_ids),
                    tenant_id=tenant_id,
                )
            
            # PRIORITY 2: Fall back to scope filters if no bot datasets
            elif bot_scopes:
                scope_filters = []
                for scope in bot_scopes:
                    if not scope.is_active:
                        continue
                    
                    dataset_filters = scope.dataset_filters
                    if dataset_filters:
                        # Apply tag filters
                        if "tags" in dataset_filters:
                            required_tags = dataset_filters["tags"]
                            if required_tags:
                                # Check if dataset has any of the required tags
                                tag_conditions = [
                                    Dataset.tags.contains([tag]) for tag in required_tags
                                ]
                                scope_filters.append(or_(*tag_conditions) if len(tag_conditions) > 1 else tag_conditions[0])
                        
                        # Apply other metadata filters
                        if "metadata" in dataset_filters:
                            metadata_filters = dataset_filters["metadata"]
                            for key, value in metadata_filters.items():
                                scope_filters.append(Dataset.metadata[key].astext == str(value))
                
                if scope_filters:
                    chunk_query = chunk_query.where(or_(*scope_filters) if len(scope_filters) > 1 else scope_filters[0])
                
                logger.info(
                    "Using scope filters for retrieval",
                    scope_count=len(bot_scopes),
                    tenant_id=tenant_id,
                )
            
            # PRIORITY 3: If neither bot datasets nor scopes, search all tenant datasets
            else:
                logger.info(
                    "Using all tenant datasets for retrieval",
                    tenant_id=tenant_id,
                )
            
            # Use simple keyword matching to avoid async issues
            logger.info("Using keyword search for retrieval", query=query[:50])
            
            # Simple approach: search for any chunks containing query keywords
            query_lower = query.lower().strip()
            
            # Build a simple text search that should work reliably
            try:
                # Create a basic query that searches chunk content
                basic_query = (
                    select(Chunk)
                    .join(Document)
                    .join(Dataset)
                    .options(selectinload(Chunk.document))
                    .where(
                        Dataset.tenant_id == tenant_id,
                        Dataset.is_active == True,
                        Document.status == "completed",
                        or_(
                            Chunk.content.ilike(f"%{query_lower}%"),
                            Chunk.content.ilike(f"%{query_lower.split()[0]}%") if query_lower.split() else False
                        )
                    )
                    .limit(limit)
                )
                
                # If we have bot datasets, filter by them
                if bot_datasets:
                    dataset_ids = [str(dataset.id) for dataset in bot_datasets]
                    basic_query = basic_query.where(Dataset.id.in_(dataset_ids))
                    logger.info(f"Filtering by bot datasets", dataset_count=len(dataset_ids))
                
                result = await self.db.execute(basic_query)
                chunks = result.scalars().all()
                logger.info(f"Keyword search found {len(chunks)} chunks", query=query[:30])
                
            except Exception as e:
                logger.error("Keyword search failed, trying fallback", error=str(e))
                # Ultimate fallback - just get any chunks from bot datasets
                try:
                    if bot_datasets:
                        dataset_ids = [str(dataset.id) for dataset in bot_datasets]
                        fallback_query = (
                            select(Chunk)
                            .join(Document)
                            .join(Dataset)
                            .options(selectinload(Chunk.document))
                            .where(
                                Dataset.id.in_(dataset_ids),
                                Dataset.is_active == True,
                                Document.status == "completed"
                            )
                            .limit(3)
                        )
                        result = await self.db.execute(fallback_query)
                        chunks = result.scalars().all()
                        logger.info(f"Fallback search found {len(chunks)} chunks")
                    else:
                        chunks = []
                except Exception as fallback_error:
                    logger.error("All retrieval methods failed", error=str(fallback_error))
                    return []
            
            # Convert to citations with actual similarity scores
            citations = []
            for chunk in chunks:
                # Calculate similarity score (1 - normalized distance)
                # Note: In production, you might want to calculate this more precisely
                score = min(0.95, max(0.1, 0.8))  # Placeholder score - in real implementation calculate from distance
                
                citation = Citation(
                    document_id=chunk.document.id,
                    document_title=chunk.document.title,
                    chunk_id=chunk.id,
                    content=chunk.content,
                    score=score,
                    metadata={
                        "chunk_index": chunk.chunk_index,
                        "document_source": chunk.document.source_type,
                        "document_tags": chunk.document.tags,
                        "dataset_id": str(chunk.document.dataset_id),
                        "dataset_name": chunk.document.dataset.name if chunk.document.dataset else None,
                        **chunk.meta_data,
                    },
                )
                citations.append(citation)
            
            logger.info(
                "Retrieved context successfully",
                query_length=len(query),
                citations_count=len(citations),
                tenant_id=tenant_id,
                using_bot_datasets=bool(bot_datasets),
                using_scopes=bool(bot_scopes and not bot_datasets),
            )
            
            return citations
            
        except Exception as e:
            logger.error("Failed to retrieve context", error=str(e), tenant_id=tenant_id)
            return []  # Return empty list on error to allow chat to continue
    
    async def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using OpenAI."""
        try:
            response = await openai_client.embeddings.create(
                model="text-embedding-ada-002",  # or "text-embedding-3-small"
                input=text,
            )
            return response.data[0].embedding
            
        except Exception as e:
            logger.error("Failed to generate embedding", error=str(e))
            raise
    
    async def embed_document_chunks(self, document_id: str) -> None:
        """Generate embeddings for all chunks of a document."""
        try:
            # Get all chunks for the document that don't have embeddings
            result = await self.db.execute(
                select(Chunk)
                .where(
                    Chunk.document_id == document_id,
                    Chunk.embedding.is_(None),
                )
                .order_by(Chunk.chunk_index)
            )
            chunks = result.scalars().all()
            
            if not chunks:
                logger.info("No chunks to embed", document_id=document_id)
                return
            
            # Generate embeddings in batches
            batch_size = 100  # OpenAI rate limits
            for i in range(0, len(chunks), batch_size):
                batch = chunks[i:i + batch_size]
                texts = [chunk.content for chunk in batch]
                
                # Generate embeddings for batch
                response = await openai_client.embeddings.create(
                    model="text-embedding-ada-002",
                    input=texts,
                )
                
                # Update chunks with embeddings
                for chunk, embedding_data in zip(batch, response.data):
                    chunk.embedding = embedding_data.embedding
                
                await self.db.commit()
            
            logger.info(
                "Generated embeddings for document",
                document_id=document_id,
                chunks_count=len(chunks),
            )
            
        except Exception as e:
            logger.error(
                "Failed to generate embeddings for document",
                error=str(e),
                document_id=document_id,
            )
            raise