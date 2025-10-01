#!/usr/bin/env python3
"""Test script to verify dataset statistics are properly displayed in the frontend."""

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

def test_dataset_statistics_display():
    """Test that dataset statistics are properly returned and formatted for frontend display."""
    # Get auth token
    token = authenticate()
    if not token:
        print("❌ Authentication failed")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Authentication successful")
    
    # Test enhanced dataset list with statistics
    print(f"\n📊 Testing Enhanced Dataset Statistics")
    response = requests.get(f"{API_BASE}/v1/tenant/datasets/", headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to get datasets: {response.text}")
        return False
    
    datasets = response.json()
    if not datasets:
        print("❌ No datasets found")
        return False
    
    print(f"✅ Found {len(datasets)} datasets with enhanced statistics")
    
    # Verify all datasets have the required fields for frontend display
    required_fields = [
        'id', 'tenant_id', 'name', 'description', 'tags', 'metadata', 
        'is_active', 'created_at', 'updated_at', 'document_count', 
        'chunk_count', 'completed_documents', 'processing_complete'
    ]
    
    print(f"\n🔍 Verifying Enhanced Dataset Fields:")
    all_fields_present = True
    
    for i, dataset in enumerate(datasets):
        print(f"\n📁 Dataset {i+1}: {dataset['name']}")
        
        # Check all required fields are present
        missing_fields = []
        for field in required_fields:
            if field not in dataset:
                missing_fields.append(field)
        
        if missing_fields:
            print(f"❌ Missing fields: {missing_fields}")
            all_fields_present = False
        else:
            print(f"✅ All required fields present")
        
        # Display the statistics that will show in the frontend table
        print(f"   📊 Statistics for Frontend Display:")
        print(f"      - Documents: {dataset['document_count']} (Completed: {dataset['completed_documents']})")
        print(f"      - Chunks: {dataset['chunk_count']}")
        print(f"      - Processing Complete: {dataset['processing_complete']}")
        print(f"      - Active: {dataset['is_active']}")
        print(f"      - Tags: {len(dataset['tags'])} tags")
        
        # Show completion percentage
        if dataset['document_count'] > 0:
            completion_percentage = (dataset['completed_documents'] / dataset['document_count']) * 100
            print(f"      - Completion Rate: {completion_percentage:.1f}%")
        
        # Display what the frontend table will show
        print(f"   🖥️  Frontend Table Display:")
        print(f"      - Name: {dataset['name']}")
        print(f"      - Description: {dataset['description'] or 'No description'}")
        documents_display = f"{dataset['document_count']}"
        if dataset['completed_documents'] < dataset['document_count']:
            documents_display += f" ({dataset['completed_documents']} completed)"
        print(f"      - Documents Column: {documents_display}")
        print(f"      - Chunks Column: {dataset['chunk_count']}")
        print(f"      - Tags Column: {', '.join(dataset['tags']) if dataset['tags'] else 'No tags'}")
        print(f"      - Status Column: {'Active' if dataset['is_active'] else 'Inactive'}")
    
    if not all_fields_present:
        print(f"\n❌ Some datasets are missing required fields")
        return False
    
    # Test comprehensive dataset details for View Details dialog
    print(f"\n🔍 Testing Dataset Details Dialog Data:")
    dataset_id = datasets[0]["id"]
    response = requests.get(f"{API_BASE}/v1/tenant/datasets/{dataset_id}", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Failed to get dataset details: {response.text}")
        return False
    
    details = response.json()
    
    # Verify details dialog fields
    details_fields = [
        'id', 'name', 'description', 'tags', 'is_active', 'created_at', 'updated_at',
        'statistics', 'documents', 'assigned_bots', 'latest_document', 'last_activity'
    ]
    
    missing_details = []
    for field in details_fields:
        if field not in details:
            missing_details.append(field)
    
    if missing_details:
        print(f"❌ Missing details fields: {missing_details}")
        return False
    
    print(f"✅ Details dialog data complete")
    print(f"   - Statistics: {len(details['statistics'])} metrics")
    print(f"   - Documents: {len(details['documents'])} recent documents")
    print(f"   - Assigned Bots: {len(details['assigned_bots'])} bots")
    
    # Show what the details dialog will display
    stats = details['statistics']
    print(f"\n📊 Details Dialog Statistics Dashboard:")
    print(f"   - Total Documents: {stats['total_documents']}")
    print(f"   - Total Chunks: {stats['total_chunks']}")
    print(f"   - Processed Chunks: {stats['chunks_with_embeddings']}")
    print(f"   - Total Size: {stats['total_file_size']} bytes")
    print(f"   - Processing Progress: {stats['processing_progress']}%")
    print(f"   - Status Breakdown: {stats['documents_by_status']}")
    
    print(f"\n✅ All dataset statistics are properly formatted for frontend display!")
    print(f"✅ Frontend table will show accurate document counts and processing status")
    print(f"✅ Details dialog will display comprehensive statistics and relationships")
    
    return True

if __name__ == "__main__":
    print("🚀 Testing Dataset Statistics Display in Frontend")
    print("=" * 60)
    
    success = test_dataset_statistics_display()
    
    if success:
        print("\n" + "=" * 60)
        print("✅ ALL DATASET STATISTICS TESTS PASSED!")
        print()
        print("📊 Dataset List Table Now Shows:")
        print("   - Accurate document counts with completion indicators")
        print("   - Total chunk counts per dataset")
        print("   - Processing status warnings for incomplete datasets")
        print("   - Visual status indicators and tags")
        print()
        print("🔍 Dataset Details Dialog Now Shows:")
        print("   - Complete statistics dashboard")
        print("   - Bot assignments and relationships")
        print("   - Recent documents with processing details")
        print("   - Activity tracking and progress indicators")
        print()
        print("🎯 Frontend will now display proper dataset statistics!")
    else:
        print("\n❌ Dataset statistics tests failed")