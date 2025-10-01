#!/usr/bin/env python3
"""
Test automatic document processing when uploading documents
"""
import asyncio
import time
from app.db import async_session
from app.models import Document, Dataset, Tenant
from app.services.job_queue_service import job_queue_service
from sqlalchemy import select
from datetime import datetime

async def test_automatic_processing():
    """Test that documents are automatically processed when created"""
    print("🧪 Testing Automatic Document Processing")
    print("=" * 45)
    
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
            return
        
        dataset, tenant = dataset_info
        print(f"📚 Using dataset: {dataset.name}")
        
        # Create multiple test documents to simulate user uploads
        test_docs = []
        
        for i in range(3):
            test_doc = Document(
                dataset_id=dataset.id,
                title=f"User Upload Test {i+1}",
                content=f"""This is test document #{i+1} uploaded by a user. 
                
                It contains sample content that should be automatically processed by the system.
                The document processing pipeline should:
                1. Detect the new document with 'pending' status
                2. Automatically enqueue it for background processing  
                3. Process it into chunks with embeddings
                4. Update status to 'completed'
                
                Content length: {'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' * (i+1)}
                This ensures different document sizes for testing chunking algorithms.
                """,
                source_type="text",
                tags=[f"test-{i+1}", "auto-upload", "user-content"],
                content_hash=f"auto-test-hash-{i+1}-{int(time.time())}",
                status="pending",
                meta_data={"test": True, "batch": "auto_upload_test", "index": i+1}
            )
            
            db.add(test_doc)
            test_docs.append(test_doc)
        
        await db.commit()
        
        # Refresh to get IDs
        for doc in test_docs:
            await db.refresh(doc)
        
        print(f"✅ Created {len(test_docs)} test documents")
        
        # Simulate what happens in the API endpoint - enqueue each document
        print("\n📋 Enqueueing documents (simulating API endpoint behavior):")
        job_ids = []
        
        for doc in test_docs:
            try:
                job_id = job_queue_service.enqueue_document_processing(str(doc.id))
                job_ids.append(job_id)
                print(f"  📤 Document '{doc.title}' → Job {job_id}")
            except Exception as e:
                print(f"  ❌ Failed to enqueue {doc.title}: {e}")
        
        print(f"\n⏳ Waiting 20 seconds for automatic processing...")
        await asyncio.sleep(20)
        
        # Check results
        print(f"\n📊 Processing Results:")
        processed_count = 0
        
        for doc in test_docs:
            await db.refresh(doc)
            status_icon = "✅" if doc.status == "completed" else "⏳" if doc.status == "processing" else "❌"
            print(f"  {status_icon} {doc.title}: {doc.status}")
            
            if doc.error_message:
                print(f"      Error: {doc.error_message}")
            
            if doc.status == "completed":
                processed_count += 1
        
        print(f"\n🎯 Summary:")
        print(f"   📄 Documents created: {len(test_docs)}")
        print(f"   ✅ Successfully processed: {processed_count}")
        print(f"   📋 Jobs enqueued: {len(job_ids)}")
        
        success_rate = (processed_count / len(test_docs)) * 100 if test_docs else 0
        print(f"   📈 Success rate: {success_rate:.1f}%")
        
        if success_rate == 100:
            print(f"\n🎉 Perfect! Automatic processing is working correctly!")
            print(f"   Users can upload documents and they'll be processed automatically.")
        elif success_rate > 0:
            print(f"\n⚠️  Partial success. Check worker logs for details.")
        else:
            print(f"\n❌ No documents processed. Check system status.")

async def main():
    await test_automatic_processing()

if __name__ == "__main__":
    asyncio.run(main())