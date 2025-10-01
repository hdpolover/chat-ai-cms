#!/usr/bin/env python3
"""
Test document details functionality
"""
import asyncio
from app.db import async_session
from app.models import Document, Chunk, Dataset
from sqlalchemy import select

async def test_document_details():
    """Test enhanced document details with chunk statistics"""
    print("🔍 Testing Enhanced Document Details")
    print("=" * 40)
    
    async with async_session() as db:
        # Get a completed document
        result = await db.execute(
            select(Document, Dataset)
            .join(Dataset, Document.dataset_id == Dataset.id)
            .where(Document.status == "completed")
            .limit(1)
        )
        doc_info = result.first()
        
        if not doc_info:
            print("❌ No completed documents found")
            return
        
        document, dataset = doc_info
        print(f"📄 Document: {document.title}")
        print(f"📚 Dataset: {dataset.name}")
        
        # Get chunk statistics
        chunk_result = await db.execute(
            select(Chunk).where(Chunk.document_id == document.id)
        )
        chunks = chunk_result.scalars().all()
        
        chunk_count = len(chunks)
        chunks_with_embeddings = sum(1 for chunk in chunks if chunk.embedding is not None)
        
        print(f"\n📊 Processing Statistics:")
        print(f"   Status: {document.status}")
        print(f"   Total chunks: {chunk_count}")
        print(f"   Chunks with embeddings: {chunks_with_embeddings}")
        print(f"   Processing complete: {document.status == 'completed'}")
        
        if chunk_count > 0:
            progress = (chunks_with_embeddings / chunk_count) * 100
            print(f"   Embedding progress: {progress:.1f}%")
        
        # Test safe formatting
        print(f"\n🛡️ Safe Formatting Tests:")
        
        # File size handling
        test_file_sizes = [None, 0, 1024, 1048576, "invalid"]
        for size in test_file_sizes:
            try:
                if size is None or size == "invalid":
                    # Simulate null/invalid values
                    formatted = format_file_size(None if size is None else "invalid")
                else:
                    formatted = format_file_size(size)
                print(f"   File size {size} → {formatted}")
            except Exception as e:
                print(f"   File size {size} → Error: {e}")
        
        # Date handling
        test_dates = [None, "", "invalid-date", document.created_at]
        for date in test_dates:
            try:
                formatted = format_date(date)
                print(f"   Date {date} → {formatted}")
            except Exception as e:
                print(f"   Date {date} → Error: {e}")

def format_file_size(bytes_val):
    """Safe file size formatting"""
    if not bytes_val or bytes_val == 0 or (isinstance(bytes_val, str) and bytes_val == "invalid"):
        return '0 B'
    try:
        bytes_val = int(bytes_val) if isinstance(bytes_val, str) else bytes_val
        if bytes_val == 0:
            return '0 B'
        k = 1024
        sizes = ['B', 'KB', 'MB', 'GB']
        import math
        i = math.floor(math.log(bytes_val) / math.log(k))
        return f"{round(bytes_val / pow(k, i), 2)} {sizes[i]}"
    except (ValueError, TypeError, OverflowError):
        return '0 B'

def format_date(date_str):
    """Safe date formatting"""
    if not date_str:
        return 'Unknown'
    try:
        from datetime import datetime
        if isinstance(date_str, str):
            date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        else:
            date_obj = date_str
        return date_obj.strftime('%Y-%m-%d %H:%M')
    except (ValueError, TypeError, AttributeError):
        return 'Invalid Date'

async def main():
    await test_document_details()

if __name__ == "__main__":
    asyncio.run(main())