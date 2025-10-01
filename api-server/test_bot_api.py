#!/usr/bin/env python3
"""Test bot API endpoints to verify they work correctly."""

import asyncio
import httpx
import os
import sys
from datetime import datetime

async def test_bot_api():
    """Test the bot API endpoints with proper authentication."""
    base_url = "http://localhost:8000"
    
    # First, let's check health
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            print("🔍 Testing Bot API Endpoints")
            print("=" * 50)
            
            # Test health endpoint
            response = await client.get(f"{base_url}/v1/health")
            print(f"✅ Health check: {response.status_code}")
            
            # Test without auth (should fail)
            response = await client.get(f"{base_url}/v1/tenant/bots")
            print(f"🚫 Get bots without auth: {response.status_code} (expected 401/403)")
            
            # Test with basic auth header structure (will likely fail but shows structure)
            headers = {
                "Authorization": "Bearer fake-token",  
                "Content-Type": "application/json"
            }
            
            response = await client.get(f"{base_url}/v1/tenant/bots", headers=headers)
            print(f"🔑 Get bots with fake token: {response.status_code}")
            
            if response.status_code == 200:
                bots = response.json()
                print(f"📋 Found {len(bots)} bots")
                
                if bots:
                    bot = bots[0]
                    print(f"🤖 First bot: {bot.get('name', 'Unknown')}")
                    print(f"   - ID: {bot.get('id', 'No ID')}")
                    print(f"   - Scopes: {len(bot.get('scopes', []))}")
                    print(f"   - Datasets: {len(bot.get('datasets', []))}")
                    
                    # Test get individual bot
                    bot_id = bot['id']
                    response = await client.get(f"{base_url}/v1/tenant/bots/{bot_id}", headers=headers)
                    print(f"🔍 Get specific bot: {response.status_code}")
                    
                    if response.status_code == 200:
                        bot_detail = response.json()
                        print(f"   - Enhanced details loaded successfully")
                        print(f"   - Scopes: {bot_detail.get('scopes', [])}")
                        print(f"   - Datasets: {bot_detail.get('datasets', [])}")
                    else:
                        print(f"   - Error: {response.text}")
            else:
                print(f"   - Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("Testing Bot API endpoints...")
    asyncio.run(test_bot_api())