#!/usr/bin/env python3
"""
Manually trigger document processing for testing and fixing pending documents
"""
import sys
import asyncio
import structlog
from app.db import async_session
from app.models import Document
from app.services.job_queue_service import job_queue_service
from app.services.document_processing_service import document_processing_service
from sqlalchemy import select

logger = structlog.get_logger()

async def get_pending_documents():
    """Get all pending documents"""
    async with async_session() as db:
        result = await db.execute(
            select(Document).where(Document.status == "pending")
            .order_by(Document.created_at.desc())
        )
        return result.scalars().all()

async def process_document_directly(document_id: str):
    """Process document directly without queue"""
    print(f"🔄 Processing document {document_id} directly...")
    try:
        success = await document_processing_service.process_document(document_id)
        if success:
            print(f"✅ Document {document_id} processed successfully!")
        else:
            print(f"❌ Failed to process document {document_id}")
        return success
    except Exception as e:
        print(f"❌ Error processing document {document_id}: {e}")
        return False

def trigger_processing(document_id: str):
    """Trigger document processing via queue"""
    print(f"🚀 Enqueuing document for processing: {document_id}")
    try:
        job_id = job_queue_service.enqueue_document_processing(document_id)
        print(f"📤 Job enqueued with ID: {job_id}")
        return job_id
    except Exception as e:
        print(f"❌ Failed to enqueue: {e}")
        return None

async def main():
    print("🔧 Document Processing Tool")
    print("=" * 30)
    
    if len(sys.argv) > 1:
        document_id = sys.argv[1]
        
        if document_id == "--all":
            # Process all pending documents
            print("Finding all pending documents...")
            pending_docs = await get_pending_documents()
            print(f"Found {len(pending_docs)} pending documents")
            
            if not pending_docs:
                print("✅ No pending documents!")
                return
            
            for doc in pending_docs:
                print(f"\n📄 Processing: {doc.title}")
                await process_document_directly(doc.id)
        
        elif document_id == "--queue-all":
            # Queue all pending documents
            print("Queueing all pending documents...")
            pending_docs = await get_pending_documents()
            
            for doc in pending_docs:
                print(f"\n📄 Queueing: {doc.title}")
                trigger_processing(doc.id)
        
        elif document_id.startswith("--"):
            print("Available options:")
            print("  --all        Process all pending documents directly")
            print("  --queue-all  Queue all pending documents for worker")
            print("  <doc_id>     Process specific document")
            
        else:
            # Process specific document
            choice = input(f"Process document {document_id}? (d)irect or (q)ueue: ").lower()
            
            if choice.startswith('d'):
                await process_document_directly(document_id)
            elif choice.startswith('q'):
                trigger_processing(document_id)
            else:
                print("Invalid choice")
    
    else:
        print("Usage:")
        print("  python trigger_processing.py <document_id>  # Process specific document")
        print("  python trigger_processing.py --all         # Process all pending docs directly") 
        print("  python trigger_processing.py --queue-all   # Queue all pending docs")

if __name__ == "__main__":
    asyncio.run(main())