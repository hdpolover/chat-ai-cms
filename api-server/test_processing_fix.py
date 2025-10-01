#!/usr/bin/env python3
"""
Test document processing after fix
"""
import asyncio
import sys
from app.db import async_session
from app.models import Document, Dataset, Tenant
from app.services.job_queue_service import job_queue_service
from sqlalchemy import select
from datetime import datetime

async def create_test_document():
    """Create a test document to verify processing works"""
    async with async_session() as db:
        # Get first available dataset
        result = await db.execute(
            select(Dataset, Tenant)
            .join(Tenant, Dataset.tenant_id == Tenant.id)
            .limit(1)
        )
        dataset_info = result.first()
        
        if not dataset_info:
            print("❌ No datasets found")
            return None
        
        dataset, tenant = dataset_info
        print(f"📚 Using dataset: {dataset.name} (Tenant: {tenant.name})")
        
        # Create test document
        test_doc = Document(
            dataset_id=dataset.id,
            title="Auto Processing Test",
            content="""This is a test document created to verify that the document processing pipeline 
            is working correctly after fixing the Redis connection issues. The worker should automatically 
            pick up this document and process it into chunks with embeddings. This content is long enough 
            to potentially create multiple chunks depending on the chunking algorithm settings.""",
            source_type="text",
            tags=["test", "auto-processing", "verification"],
            content_hash="test-hash-" + str(datetime.now().timestamp()),
            status="pending",
            meta_data={"test": True, "auto_created": True}
        )
        
        db.add(test_doc)
        await db.commit()
        await db.refresh(test_doc)
        
        print(f"✅ Created test document: {test_doc.id}")
        return test_doc.id

async def enqueue_test_document(doc_id: str):
    """Enqueue the document for processing"""
    print(f"📋 Enqueuing document {doc_id}...")
    try:
        job_id = job_queue_service.enqueue_document_processing(doc_id)
        print(f"✅ Enqueued with job ID: {job_id}")
        return job_id
    except Exception as e:
        print(f"❌ Failed to enqueue: {e}")
        return None

async def check_processing_after_delay(doc_id: str, delay: int = 30):
    """Check document processing status after a delay"""
    print(f"⏳ Waiting {delay} seconds for processing...")
    await asyncio.sleep(delay)
    
    async with async_session() as db:
        document = await db.get(Document, doc_id)
        if document:
            print(f"📄 Document status: {document.status}")
            if document.error_message:
                print(f"❌ Error: {document.error_message}")
        else:
            print("❌ Document not found")

async def main():
    print("🧪 Testing Automatic Document Processing")
    print("=" * 40)
    
    # Create test document
    doc_id = await create_test_document()
    if not doc_id:
        return
    
    # Enqueue for processing
    job_id = await enqueue_test_document(doc_id)
    if not job_id:
        return
    
    # Check processing result
    await check_processing_after_delay(doc_id, 15)
    
    print("\n✅ Test completed!")
    print("Check worker logs to see processing details:")
    print("docker logs chataicmsapi-worker-1 --tail 20")

if __name__ == "__main__":
    asyncio.run(main())