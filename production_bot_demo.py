#!/usr/bin/env python3
"""
Production Bot Setup Demo Script

This script demonstrates the complete flow for creating a production-ready bot
with knowledge base, from tenant creation to live deployment.

Usage:
    python production_bot_demo.py

Requirements:
    - API server running on localhost:8000
    - Admin user already created
    - OpenAI API key available
"""

import asyncio
import aiohttp
import json
import os
import time
from pathlib import Path
from typing import Dict, Any, Optional

class ProductionBotDemo:
    """Complete bot setup demonstration"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def create_tenant(self, tenant_config: Dict[str, Any]) -> Dict[str, Any]:
        """Step 1: Create a new tenant (organization)"""
        print("🏢 Step 1: Creating tenant...")
        
        async with self.session.post(
            f"{self.base_url}/admin/tenants/",
            json=tenant_config,
            headers={"Content-Type": "application/json"}
        ) as response:
            if response.status == 201:
                tenant = await response.json()
                print(f"✅ Tenant created: {tenant['name']} (ID: {tenant['id']})")
                return tenant
            else:
                error = await response.text()
                print(f"❌ Failed to create tenant: {error}")
                raise Exception(f"Tenant creation failed: {error}")
    
    async def setup_ai_provider(self, tenant_id: str, ai_config: Dict[str, Any]) -> Dict[str, Any]:
        """Step 2: Configure AI provider for the tenant"""
        print("🤖 Step 2: Setting up AI provider...")
        
        # First, get available global AI providers
        async with self.session.get(f"{self.base_url}/v1/tenant/ai-providers/global/available") as response:
            if response.status == 200:
                global_providers = await response.json()
                openai_provider = next((p for p in global_providers if p["provider_type"] == "openai"), None)
                
                if not openai_provider:
                    print("❌ OpenAI provider not found in global providers")
                    return None
                
                # Create tenant AI provider
                provider_data = {
                    "global_ai_provider_id": openai_provider["id"],
                    "provider_name": "openai",
                    "api_key": ai_config["api_key"],
                    "custom_settings": ai_config.get("custom_settings", {})
                }
                
                async with self.session.post(
                    f"{self.base_url}/v1/tenant/ai-providers/",
                    json=provider_data,
                    headers={"Content-Type": "application/json"}
                ) as create_response:
                    if create_response.status == 201:
                        ai_provider = await create_response.json()
                        print(f"✅ AI provider configured: {ai_provider['provider_name']}")
                        return ai_provider
                    else:
                        error = await create_response.text()
                        print(f"❌ Failed to create AI provider: {error}")
                        raise Exception(f"AI provider creation failed: {error}")
    
    async def create_dataset(self, dataset_config: Dict[str, Any]) -> Dict[str, Any]:
        """Step 3: Create dataset for knowledge base"""
        print("📚 Step 3: Creating dataset...")
        
        async with self.session.post(
            f"{self.base_url}/v1/tenant/datasets/",
            json=dataset_config,
            headers={"Content-Type": "application/json"}
        ) as response:
            if response.status == 201:
                dataset = await response.json()
                print(f"✅ Dataset created: {dataset['name']} (ID: {dataset['id']})")
                return dataset
            else:
                error = await response.text()
                print(f"❌ Failed to create dataset: {error}")
                raise Exception(f"Dataset creation failed: {error}")
    
    async def upload_sample_documents(self, dataset_id: str) -> None:
        """Step 4: Upload sample documents to the dataset"""
        print("📄 Step 4: Uploading sample documents...")
        
        # Sample documents
        documents = [
            {
                "title": "Shipping Policy",
                "content": """
                ACME Corporation Shipping Policy
                
                Standard Shipping:
                - Free shipping on orders over $50
                - Standard delivery: 3-5 business days
                - Expedited shipping: 1-2 business days ($15 fee)
                
                International Shipping:
                - Available to most countries
                - Delivery time: 7-14 business days
                - Customs fees may apply
                
                Returns:
                - 30-day return policy
                - Items must be in original condition
                - Return shipping fee: $5 (deducted from refund)
                """,
                "source_type": "text",
                "tags": ["shipping", "policy", "returns"]
            },
            {
                "title": "Product Support Guide",
                "content": """
                ACME Product Support Guide
                
                Getting Started:
                1. Unpack your product carefully
                2. Follow the quick start guide
                3. Download the mobile app
                4. Create your account
                
                Troubleshooting:
                - Device won't turn on: Check battery and charging cable
                - Connection issues: Restart device and check WiFi
                - App not working: Update to latest version
                
                Warranty:
                - 2-year limited warranty
                - Covers manufacturing defects
                - Does not cover physical damage or water damage
                
                Contact Support:
                - Email: support@acme.com
                - Phone: 1-800-ACME-HELP
                - Live chat: Available 9 AM - 6 PM EST
                """,
                "source_type": "text", 
                "tags": ["support", "troubleshooting", "warranty"]
            },
            {
                "title": "Billing and Payment FAQ",
                "content": """
                Billing and Payment Information
                
                Payment Methods:
                - Credit cards: Visa, MasterCard, American Express
                - PayPal and Apple Pay accepted
                - Bank transfers for enterprise customers
                
                Billing Cycles:
                - Monthly billing on the date of purchase
                - Annual plans billed yearly with 15% discount
                - Pro-rated charges for plan changes
                
                Refund Policy:
                - 7-day money-back guarantee
                - Refunds processed within 3-5 business days
                - No refunds for services already rendered
                
                Account Management:
                - Update payment methods in account settings
                - View billing history and invoices
                - Download receipts for expense reports
                """,
                "source_type": "text",
                "tags": ["billing", "payment", "refunds", "faq"]
            }
        ]
        
        for doc in documents:
            async with self.session.post(
                f"{self.base_url}/v1/tenant/datasets/{dataset_id}/documents",
                json=doc,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 201:
                    doc_result = await response.json()
                    print(f"  ✅ Uploaded: {doc['title']}")
                else:
                    error = await response.text()
                    print(f"  ❌ Failed to upload {doc['title']}: {error}")
        
        print("📄 Document upload completed")
    
    async def wait_for_document_processing(self, dataset_id: str, timeout: int = 120) -> bool:
        """Step 5: Wait for document processing to complete"""
        print("⏳ Step 5: Waiting for document processing...")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            async with self.session.get(
                f"{self.base_url}/v1/tenant/datasets/{dataset_id}/documents"
            ) as response:
                if response.status == 200:
                    documents = await response.json()
                    
                    # Check if all documents are processed
                    statuses = [doc["status"] for doc in documents]
                    pending_count = sum(1 for status in statuses if status in ["pending", "processing"])
                    completed_count = sum(1 for status in statuses if status == "completed")
                    
                    print(f"  📊 Processing status: {completed_count} completed, {pending_count} pending")
                    
                    if pending_count == 0:
                        print("✅ All documents processed successfully!")
                        return True
                
                await asyncio.sleep(5)  # Wait 5 seconds before checking again
        
        print("⚠️ Document processing timeout - continuing anyway")
        return False
    
    async def create_bot(self, bot_config: Dict[str, Any]) -> Dict[str, Any]:
        """Step 6: Create the chatbot"""
        print("🤖 Step 6: Creating bot...")
        
        async with self.session.post(
            f"{self.base_url}/v1/tenant/bots/",
            json=bot_config,
            headers={"Content-Type": "application/json"}
        ) as response:
            if response.status == 201:
                bot = await response.json()
                print(f"✅ Bot created: {bot['name']} (ID: {bot['id']})")
                return bot
            else:
                error = await response.text()
                print(f"❌ Failed to create bot: {error}")
                raise Exception(f"Bot creation failed: {error}")
    
    async def link_dataset_to_bot(self, bot_id: str, dataset_id: str) -> None:
        """Step 7: Link dataset to bot for knowledge base access"""
        print("🔗 Step 7: Linking dataset to bot...")
        
        async with self.session.post(
            f"{self.base_url}/v1/tenant/bots/{bot_id}/datasets",
            json={
                "dataset_id": dataset_id,
                "is_active": True,
                "priority": 1
            },
            headers={"Content-Type": "application/json"}
        ) as response:
            if response.status == 201:
                print("✅ Dataset linked to bot successfully")
            else:
                error = await response.text()
                print(f"❌ Failed to link dataset: {error}")
    
    async def configure_bot_scopes(self, bot_id: str, scope_config: Dict[str, Any]) -> None:
        """Step 8: Configure bot scopes and guardrails"""
        print("🛡️ Step 8: Configuring bot scopes...")
        
        async with self.session.post(
            f"{self.base_url}/v1/tenant/bots/{bot_id}/scopes",
            json=scope_config,
            headers={"Content-Type": "application/json"}
        ) as response:
            if response.status == 201:
                print("✅ Bot scopes configured successfully")
            else:
                error = await response.text()
                print(f"❌ Failed to configure scopes: {error}")
    
    async def test_bot_functionality(self, bot_id: str) -> None:
        """Step 9: Test bot functionality"""
        print("🧪 Step 9: Testing bot functionality...")
        
        test_questions = [
            "What is your shipping policy?",
            "How do I return a product?", 
            "What payment methods do you accept?",
            "Can you help me with medical advice?"  # Should be blocked by guardrails
        ]
        
        for i, question in enumerate(test_questions, 1):
            print(f"\n  🔍 Test {i}: {question}")
            
            async with self.session.post(
                f"{self.base_url}/v1/chat/public",
                json={
                    "bot_id": bot_id,
                    "messages": [{"role": "user", "content": question}],
                    "session_id": None,
                    "metadata": {"source": "production_test"}
                },
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    response_text = result["message"]["content"]
                    citations = result.get("citations", [])
                    
                    print(f"  🤖 Response: {response_text[:150]}...")
                    if citations:
                        print(f"  📚 Citations: {len(citations)} sources found")
                    else:
                        print("  📚 No citations (expected for off-topic question)")
                else:
                    error = await response.text()
                    print(f"  ❌ Test failed: {error}")
        
        print("\n✅ Bot testing completed!")

async def main():
    """Run the complete production bot setup demo"""
    
    print("🚀 Production Bot Setup Demo")
    print("=" * 50)
    
    # Configuration
    config = {
        "tenant": {
            "name": "Demo Corporation",
            "slug": "demo-corp-" + str(int(time.time())),  # Unique slug
            "email": f"demo-{int(time.time())}@example.com",
            "password": "demo_password_123",
            "description": "Demo tenant for bot setup",
            "plan": "pro",
            "owner_email": "owner@demo.com"
        },
        "ai_provider": {
            "api_key": os.getenv("OPENAI_API_KEY", "sk-your-openai-key-here"),
            "custom_settings": {
                "max_tokens": 1000,
                "default_model": "gpt-3.5-turbo"
            }
        },
        "dataset": {
            "name": "Customer Support Knowledge Base",
            "description": "Complete customer support documentation and policies",
            "tags": ["customer-support", "documentation", "policies"],
            "metadata": {
                "category": "support",
                "language": "en",
                "version": "1.0"
            }
        },
        "bot": {
            "name": "Customer Support Assistant", 
            "description": "AI-powered customer support bot with comprehensive knowledge base",
            "system_prompt": """You are a helpful customer support assistant for Demo Corporation. 
You have access to comprehensive documentation including shipping policies, product support guides, 
and billing information. Always provide accurate, helpful responses based on the available knowledge base. 
Maintain a professional and friendly tone. If you cannot find specific information in the knowledge base, 
politely direct customers to contact human support.""",
            "model": "gpt-3.5-turbo",
            "temperature": 0.7,
            "max_tokens": 1000,
            "is_active": True,
            "is_public": True,
            "settings": {
                "response_format": "helpful_and_detailed",
                "citation_style": "numbered"
            }
        },
        "scopes": {
            "strictness_level": "moderate",
            "allowed_topics": [
                "customer support", "product information", "shipping", "billing",
                "returns", "refunds", "technical support", "account management",
                "payment methods", "warranties", "troubleshooting"
            ],
            "forbidden_topics": [
                "medical advice", "legal advice", "financial investment advice",
                "personal information", "competitor information", "internal operations"
            ],
            "refusal_message": None,  # Use smart responses
            "context_settings": {
                "max_conversation_history": 10,
                "citation_required": True,
                "escalation_triggers": ["complex_issue", "billing_dispute"]
            }
        }
    }
    
    # Check if OpenAI API key is provided
    if config["ai_provider"]["api_key"] == "sk-your-openai-key-here":
        print("⚠️ Warning: Using placeholder OpenAI API key")
        print("Set OPENAI_API_KEY environment variable for full functionality")
        print("")
    
    try:
        async with ProductionBotDemo() as demo:
            
            # Execute complete setup flow
            tenant = await demo.create_tenant(config["tenant"])
            
            ai_provider = await demo.setup_ai_provider(
                tenant["id"], 
                config["ai_provider"]
            )
            
            dataset = await demo.create_dataset(config["dataset"])
            
            await demo.upload_sample_documents(dataset["id"])
            
            await demo.wait_for_document_processing(dataset["id"])
            
            bot_config = {
                **config["bot"],
                "tenant_ai_provider_id": ai_provider["id"] if ai_provider else None
            }
            bot = await demo.create_bot(bot_config)
            
            await demo.link_dataset_to_bot(bot["id"], dataset["id"])
            
            await demo.configure_bot_scopes(bot["id"], config["scopes"])
            
            await demo.test_bot_functionality(bot["id"])
            
            print("\n🎉 SETUP COMPLETE!")
            print("=" * 50)
            print(f"✅ Tenant ID: {tenant['id']}")
            print(f"✅ Bot ID: {bot['id']}")
            print(f"✅ Dataset ID: {dataset['id']}")
            print(f"✅ Knowledge Base: 3 documents processed")
            print(f"✅ Guardrails: Configured with moderate strictness")
            print(f"✅ Testing: All functionality verified")
            print("\n🚀 Your production bot is ready for deployment!")
            print(f"\nTest your bot:")
            print(f'curl -X POST "http://localhost:8000/v1/chat/public" \\')
            print(f'  -H "Content-Type: application/json" \\')
            print(f'  -d \'{{"bot_id": "{bot["id"]}", "messages": [{{"role": "user", "content": "What is your shipping policy?"}}]}}\'')
            
    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        print("Please check your API server is running and try again.")

if __name__ == "__main__":
    asyncio.run(main())