#!/usr/bin/env python3
"""Test script to check scopes API endpoints."""

import asyncio
import httpx
import os

async def test_scopes_api():
    """Test the scopes API endpoints."""
    base_url = "http://localhost:8000"
    
    # You'll need to replace this with a valid API key from your database
    headers = {
        "Authorization": "Bearer your-api-key-here",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        # Test health endpoint first
        try:
            response = await client.get(f"{base_url}/v1/health")
            print(f"Health check: {response.status_code} - {response.json()}")
        except Exception as e:
            print(f"Health check failed: {e}")
        
        # Test get bots (to get a valid bot ID)
        try:
            response = await client.get(f"{base_url}/v1/tenant/bots", headers=headers)
            print(f"Get bots: {response.status_code}")
            if response.status_code == 200:
                bots = response.json()
                if bots:
                    bot_id = bots[0]["id"]
                    print(f"Found bot ID: {bot_id}")
                    
                    # Test get scopes for this bot
                    response = await client.get(f"{base_url}/v1/tenant/bots/{bot_id}/scopes", headers=headers)
                    print(f"Get scopes: {response.status_code} - {response.text}")
                else:
                    print("No bots found")
            else:
                print(f"Get bots failed: {response.text}")
        except Exception as e:
            print(f"API test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_scopes_api())