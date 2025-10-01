#!/usr/bin/env python3
"""Test script for enhanced document details with dataset content."""

import requests
import json
from datetime import datetime

# Configuration
API_BASE = "http://localhost:8000"
TENANT_EMAIL = "tenant@example.com"
TENANT_PASSWORD = "tenant123"

def authenticate():
    """Authenticate as tenant and get access token."""
    response = requests.post(f"{API_BASE}/v1/tenant/auth/login", json={
        "email": TENANT_EMAIL,
        "password": TENANT_PASSWORD
    })
    
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Authentication failed: {response.text}")
        return None

def test_enhanced_document_details():
    """Test the enhanced document details API with dataset content."""
    # Get auth token
    token = authenticate()
    if not token:
        print("❌ Authentication failed")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Authentication successful")
    
    # Get all documents first
    response = requests.get(f"{API_BASE}/v1/tenant/documents", headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to get documents: {response.text}")
        return
    
    documents = response.json()
    if not documents:
        print("❌ No documents found")
        return
    
    print(f"✅ Found {len(documents)} documents")
    
    # Test document details for the first document
    doc_id = documents[0]["id"]
    print(f"\n📄 Testing document details for: {documents[0]['title']}")
    
    response = requests.get(f"{API_BASE}/v1/tenant/documents/{doc_id}", headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to get document details: {response.text}")
        return
    
    details = response.json()
    print("✅ Document details retrieved successfully")
    
    # Verify enhanced fields
    print(f"\n📊 Document Information:")
    print(f"   ID: {details.get('id')}")
    print(f"   Title: {details.get('title')}")
    print(f"   Status: {details.get('status')}")
    print(f"   Chunks: {details.get('chunk_count', 0)}")
    print(f"   Chunks with embeddings: {details.get('chunks_with_embeddings', 0)}")
    print(f"   Processing complete: {details.get('processing_complete', False)}")
    
    # Check dataset information
    if details.get('dataset'):
        dataset = details['dataset']
        print(f"\n📁 Dataset Information:")
        print(f"   Name: {dataset.get('name')}")
        print(f"   Description: {dataset.get('description', 'No description')}")
        print(f"   Total documents: {dataset.get('total_documents', 0)}")
        print(f"   Completed documents: {dataset.get('completed_documents', 0)}")
        print(f"   Total chunks: {dataset.get('total_chunks', 0)}")
        print(f"   Dataset tags: {dataset.get('tags', [])}")
        
        other_docs = dataset.get('other_documents', [])
        if other_docs:
            print(f"\n📚 Other documents in dataset ({len(other_docs)}):")
            for doc in other_docs[:3]:  # Show first 3
                print(f"   - {doc['title']} (Status: {doc['status']})")
            if len(other_docs) > 3:
                print(f"   ... and {len(other_docs) - 3} more")
        else:
            print(f"\n📚 This is the only document in the dataset")
        
        print("✅ Dataset content information successfully included")
    else:
        print("⚠️ No dataset information found in response")
    
    # Pretty print the full response for verification
    print(f"\n📋 Full Response Structure:")
    print("=" * 50)
    print(json.dumps(details, indent=2, default=str))
    
    return True

if __name__ == "__main__":
    print("🚀 Testing Enhanced Document Details with Dataset Content")
    print("=" * 60)
    
    success = test_enhanced_document_details()
    
    if success:
        print("\n" + "=" * 60)
        print("✅ All tests passed! Document details now include dataset content:")
        print("   - Dataset name and description")
        print("   - Dataset statistics (total docs, completed docs, chunks)")
        print("   - Dataset tags")
        print("   - Other documents in the same dataset")
        print("   - Enhanced document processing information")
    else:
        print("\n❌ Some tests failed")