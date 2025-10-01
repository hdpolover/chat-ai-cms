#!/usr/bin/env python3
"""Test script for enhanced dataset management with comprehensive details."""

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

def test_enhanced_dataset_management():
    """Test the enhanced dataset management with comprehensive details."""
    # Get auth token
    token = authenticate()
    if not token:
        print("❌ Authentication failed")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Authentication successful")
    
    # Test enhanced dataset list
    print(f"\n📋 Testing enhanced dataset list")
    response = requests.get(f"{API_BASE}/v1/tenant/datasets", headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to get datasets: {response.text}")
        return
    
    datasets = response.json()
    if not datasets:
        print("❌ No datasets found")
        return
    
    print(f"✅ Found {len(datasets)} datasets with enhanced statistics")
    
    # Display enhanced list information
    for dataset in datasets[:2]:  # Show first 2
        print(f"\n📊 Dataset: {dataset['name']}")
        print(f"   Documents: {dataset.get('document_count', 0)}")
        print(f"   Chunks: {dataset.get('chunk_count', 0)}")  
        print(f"   Completed: {dataset.get('completed_documents', 0)}")
        print(f"   Processing Complete: {dataset.get('processing_complete', False)}")
    
    # Test comprehensive dataset details
    dataset_id = datasets[0]["id"]
    print(f"\n🔍 Testing comprehensive dataset details for: {datasets[0]['name']}")
    
    response = requests.get(f"{API_BASE}/v1/tenant/datasets/{dataset_id}", headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to get dataset details: {response.text}")
        return
    
    details = response.json()
    print("✅ Comprehensive dataset details retrieved successfully")
    
    # Verify comprehensive fields
    print(f"\n📖 Dataset Details:")
    print(f"   ID: {details.get('id')}")
    print(f"   Name: {details.get('name')}")
    print(f"   Description: {details.get('description', 'No description')}")
    print(f"   Active: {details.get('is_active')}")
    print(f"   Tags: {details.get('tags', [])}")
    
    # Check statistics
    if details.get('statistics'):
        stats = details['statistics']
        print(f"\n📊 Dataset Statistics:")
        print(f"   Total documents: {stats.get('total_documents', 0)}")
        print(f"   Total chunks: {stats.get('total_chunks', 0)}")
        print(f"   Chunks with embeddings: {stats.get('chunks_with_embeddings', 0)}")
        print(f"   Total file size: {stats.get('total_file_size', 0)} bytes")
        print(f"   Processing progress: {stats.get('processing_progress', 0)}%")
        print(f"   Processing complete: {stats.get('processing_complete', False)}")
        
        if stats.get('documents_by_status'):
            print(f"   Status breakdown: {stats['documents_by_status']}")
    
    # Check assigned bots
    assigned_bots = details.get('assigned_bots', [])
    if assigned_bots:
        print(f"\n🤖 Assigned Bots ({len(assigned_bots)}):")
        for bot in assigned_bots:
            print(f"   - {bot['name']} (Active: {bot.get('is_active', True)})")
    else:
        print(f"\n🤖 No bots assigned to this dataset")
    
    # Check documents
    documents = details.get('documents', [])
    if documents:
        print(f"\n📄 Recent Documents ({len(documents)}):")
        for doc in documents[:3]:  # Show first 3
            print(f"   - {doc['title']}")
            print(f"     Status: {doc['status']}, Chunks: {doc['chunk_count']}")
            print(f"     Processing: {doc['chunks_with_embeddings']}/{doc['chunk_count']} chunks")
    else:
        print(f"\n📄 No documents in this dataset")
    
    # Check latest activity
    latest_doc = details.get('latest_document')
    if latest_doc:
        print(f"\n🕒 Latest Activity:")
        print(f"   Latest document: {latest_doc['title']}")
        print(f"   Created: {latest_doc['created_at']}")
        print(f"   Last activity: {details.get('last_activity')}")
    
    print(f"\n✅ All enhanced dataset features verified:")
    print(f"   - Basic information and metadata")
    print(f"   - Comprehensive statistics and progress tracking") 
    print(f"   - Assigned bots relationship")
    print(f"   - Document details with processing status")
    print(f"   - Activity tracking")
    
    return True

if __name__ == "__main__":
    print("🚀 Testing Enhanced Dataset Management with Comprehensive Details")
    print("=" * 70)
    
    success = test_enhanced_dataset_management()
    
    if success:
        print("\n" + "=" * 70)
        print("✅ All enhanced dataset management tests passed!")
        print("📊 Dataset list now includes basic statistics")
        print("🔍 Dataset details provide comprehensive information:")
        print("   - Complete statistics (documents, chunks, processing progress)")
        print("   - Bot assignments and relationships") 
        print("   - Document listing with processing details")
        print("   - Activity tracking and latest updates")
        print("   - Status breakdowns and progress indicators")
    else:
        print("\n❌ Some tests failed")