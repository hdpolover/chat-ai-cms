#!/usr/bin/env python3
"""
Manually trigger document processing for testing
"""
import sys
from app.services.job_queue_service import job_queue_service

def trigger_processing(document_id: str):
    """Trigger document processing manually"""
    print(f"🚀 Manually triggering processing for document: {document_id}")
    
    # Enqueue the job
    job_id = job_queue_service.enqueue_document_processing(document_id)
    print(f"📤 Job enqueued with ID: {job_id}")
    print(f"🔄 Check worker logs to see processing...")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python trigger_processing.py <document_id>")
        sys.exit(1)
    
    document_id = sys.argv[1]
    trigger_processing(document_id)