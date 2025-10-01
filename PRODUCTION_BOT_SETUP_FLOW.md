# 🏗️ Production Bot Setup: Complete Flow Guide

## Overview
This document provides the complete step-by-step flow for creating a production-ready chatbot with knowledge base, from tenant creation to live deployment.

---

## 🎯 Prerequisites & Database Dependencies

### Entity Relationship Flow:
```
Admin User → Tenant → AI Provider → Dataset → Documents → Bot → Scopes → API Keys
     ↓          ↓         ↓           ↓          ↓        ↓       ↓        ↓
  System     Multi-   AI Engine   Knowledge  Content   Chat   Guard-  Access
   Mgmt      Tenant    Config      Base      Sources   Logic  rails   Control
```

---

## 📋 Complete Production Bot Setup Flow

### Phase 1: System Foundation (Admin Level)

#### 1.1 **Create Admin User** (System Bootstrap)
```sql
-- First time system setup only
INSERT INTO admin_users (id, email, name, password_hash, role) 
VALUES (
    gen_random_uuid()::text, 
    'admin@yourcompany.com', 
    'System Administrator',
    '$hashed_password',
    'super_admin'
);
```

#### 1.2 **Setup Global AI Providers** (System Level)
```sql
-- Create global AI provider configurations
INSERT INTO global_ai_providers (id, name, provider_type, config, is_active, is_default)
VALUES 
    (gen_random_uuid()::text, 'OpenAI GPT', 'openai', '{"models": ["gpt-3.5-turbo", "gpt-4"], "max_tokens": 4000}', true, true),
    (gen_random_uuid()::text, 'Anthropic Claude', 'anthropic', '{"models": ["claude-3-sonnet", "claude-3-haiku"]}', true, false);
```

### Phase 2: Tenant Setup

#### 2.1 **Create Tenant** (Organization)
```bash
# Via API or Admin Dashboard
curl -X POST "http://localhost:8000/admin/tenants/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "email": "admin@acme.com",
    "password": "secure_password_123",
    "description": "Enterprise customer support and documentation",
    "plan": "enterprise",
    "owner_email": "owner@acme.com"
  }'
```

**Response:**
```json
{
  "id": "tenant-uuid-123",
  "name": "Acme Corporation", 
  "slug": "acme-corp",
  "is_active": true
}
```

#### 2.2 **Configure Tenant AI Provider** (AI Engine Setup)
```bash
# Add OpenAI API key for this tenant
curl -X POST "http://localhost:8000/v1/tenant/ai-providers/" \
  -H "Authorization: Bearer <tenant-auth-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "global_ai_provider_id": "global-openai-provider-id",
    "provider_name": "openai",
    "api_key": "sk-your-openai-api-key-here",
    "base_url": null,
    "custom_settings": {
      "organization": "org-your-org-id",
      "max_tokens": 4000,
      "default_model": "gpt-3.5-turbo"
    }
  }'
```

### Phase 3: Knowledge Base Creation

#### 3.1 **Create Dataset** (Knowledge Container)
```bash
# Create dataset for company documentation
curl -X POST "http://localhost:8000/v1/tenant/datasets/" \
  -H "Authorization: Bearer <tenant-auth-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Support Knowledge Base",
    "description": "Complete customer support documentation, FAQs, and policies",
    "tags": ["customer-support", "documentation", "faq"],
    "metadata": {
      "category": "support",
      "language": "en",
      "domain": "customer-service"
    }
  }'
```

**Response:**
```json
{
  "id": "dataset-uuid-456",
  "name": "Customer Support Knowledge Base",
  "tenant_id": "tenant-uuid-123"
}
```

#### 3.2 **Upload Documents** (Knowledge Content)

##### Option A: File Upload
```bash
# Upload PDF, DOCX, TXT files
curl -X POST "http://localhost:8000/v1/tenant/datasets/dataset-uuid-456/documents/upload" \
  -H "Authorization: Bearer <tenant-auth-token>" \
  -F "files=@customer_support_guide.pdf" \
  -F "files=@product_documentation.docx" \
  -F "files=@faq_database.txt" \
  -F "metadata={\"category\": \"documentation\", \"priority\": \"high\"}"
```

##### Option B: Direct Text Input
```bash
# Add direct text content
curl -X POST "http://localhost:8000/v1/tenant/datasets/dataset-uuid-456/documents" \
  -H "Authorization: Bearer <tenant-auth-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Shipping Policy",
    "content": "Our shipping policy includes free shipping on orders over $50. Standard delivery takes 3-5 business days...",
    "source_type": "text",
    "tags": ["shipping", "policy"],
    "metadata": {"category": "policy", "last_updated": "2024-01-15"}
  }'
```

#### 3.3 **Monitor Document Processing**
```bash
# Check processing status
curl -X GET "http://localhost:8000/v1/tenant/datasets/dataset-uuid-456/documents" \
  -H "Authorization: Bearer <tenant-auth-token>"
```

**Processing Pipeline:**
1. **Document Upload** → `status: "pending"`
2. **Text Extraction** → `status: "processing"`
3. **Chunking & Embeddings** → `status: "processing"`
4. **Vector Storage** → `status: "completed"`

### Phase 4: Bot Creation & Configuration

#### 4.1 **Create Bot** (Chat Interface)
```bash
curl -X POST "http://localhost:8000/v1/tenant/bots/" \
  -H "Authorization: Bearer <tenant-auth-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Support Assistant",
    "description": "AI-powered customer support bot with access to complete knowledge base",
    "tenant_ai_provider_id": "tenant-ai-provider-uuid",
    "system_prompt": "You are a helpful customer support assistant for Acme Corporation. You have access to comprehensive documentation and should provide accurate, helpful responses to customer inquiries. Always maintain a professional and friendly tone. If you cannot find specific information, direct customers to contact human support.",
    "model": "gpt-3.5-turbo",
    "temperature": 0.7,
    "max_tokens": 1000,
    "is_active": true,
    "is_public": true,
    "settings": {
      "response_format": "helpful_and_detailed",
      "citation_style": "numbered",
      "fallback_behavior": "escalate_to_human"
    }
  }'
```

**Response:**
```json
{
  "id": "bot-uuid-789",
  "name": "Customer Support Assistant",
  "tenant_id": "tenant-uuid-123",
  "is_active": true
}
```

#### 4.2 **Assign Dataset to Bot** (Knowledge Base Connection)
```bash
curl -X POST "http://localhost:8000/v1/tenant/bots/bot-uuid-789/datasets" \
  -H "Authorization: Bearer <tenant-auth-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "dataset-uuid-456",
    "is_active": true,
    "priority": 1
  }'
```

#### 4.3 **Configure Bot Scopes** (Guardrails & Restrictions)
```bash
curl -X POST "http://localhost:8000/v1/tenant/bots/bot-uuid-789/scopes" \
  -H "Authorization: Bearer <tenant-auth-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "strictness_level": "moderate",
    "allowed_topics": [
      "customer support", "product information", "shipping", "billing", 
      "returns", "technical support", "account management", "policies"
    ],
    "forbidden_topics": [
      "medical advice", "legal advice", "financial investment advice", 
      "personal information", "competitor information"
    ],
    "refusal_message": null,
    "context_settings": {
      "max_conversation_history": 10,
      "citation_required": true,
      "escalation_triggers": ["complex_technical_issue", "billing_dispute"]
    }
  }'
```

### Phase 5: Authentication & Access Control

#### 5.1 **Create API Keys** (External Access)
```bash
# Create API key for production use
curl -X POST "http://localhost:8000/v1/tenant/api-keys/" \
  -H "Authorization: Bearer <tenant-auth-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Website Integration",
    "scopes": ["chat:read", "chat:write", "bots:read"],
    "rate_limit": 10000,
    "expires_at": "2025-12-31T23:59:59Z"
  }'
```

**Response:**
```json
{
  "id": "api-key-uuid",
  "name": "Production Website Integration", 
  "key": "ak_live_1234567890abcdef...",
  "key_prefix": "ak_live_1234"
}
```

### Phase 6: Testing & Validation

#### 6.1 **Test Bot Functionality**
```bash
# Test basic chat functionality
curl -X POST "http://localhost:8000/v1/chat/public" \
  -H "Content-Type: application/json" \
  -d '{
    "bot_id": "bot-uuid-789",
    "messages": [
      {"role": "user", "content": "What is your shipping policy?"}
    ],
    "session_id": null,
    "metadata": {"source": "production_test"}
  }'
```

#### 6.2 **Test Guardrails**
```bash
# Test topic restrictions
curl -X POST "http://localhost:8000/v1/chat/public" \
  -H "Content-Type: application/json" \
  -d '{
    "bot_id": "bot-uuid-789",
    "messages": [
      {"role": "user", "content": "Can you give me medical advice?"}
    ],
    "session_id": null
  }'
```

#### 6.3 **Test Knowledge Base Integration**
```bash
# Test knowledge retrieval with citation
curl -X POST "http://localhost:8000/v1/chat/public" \
  -H "Content-Type: application/json" \
  -d '{
    "bot_id": "bot-uuid-789",
    "messages": [
      {"role": "user", "content": "How do I return a defective product?"}
    ],
    "session_id": null
  }'
```

### Phase 7: Production Deployment

#### 7.1 **Frontend Integration** (Website/App)
```javascript
// Production chat widget implementation
class ProductionChatBot {
    constructor(botId, apiKey) {
        this.botId = botId;
        this.apiKey = apiKey;
        this.sessionId = null;
        this.baseUrl = 'https://your-api-domain.com';
    }
    
    async sendMessage(message) {
        const response = await fetch(`${this.baseUrl}/v1/chat/efficient`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                message: message,
                session_id: this.sessionId,
                bot_id: this.botId,
                context_limit: 10,
                metadata: {
                    source: 'website',
                    user_agent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                }
            })
        });
        
        const data = await response.json();
        this.sessionId = data.session_id;
        return data;
    }
}

// Initialize production bot
const supportBot = new ProductionChatBot(
    'bot-uuid-789',
    'ak_live_1234567890abcdef...'
);
```

#### 7.2 **Domain Configuration** (CORS & Security)
```bash
# Configure allowed domains for bot
curl -X PUT "http://localhost:8000/v1/tenant/bots/bot-uuid-789" \
  -H "Authorization: Bearer <tenant-auth-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "allowed_domains": [
      "https://www.acme.com",
      "https://support.acme.com", 
      "https://app.acme.com"
    ],
    "is_public": true
  }'
```

#### 7.3 **Monitoring Setup** (Analytics & Performance)
```bash
# Configure audit logging
curl -X POST "http://localhost:8000/admin/settings/system" \
  -H "Authorization: Bearer <admin-auth-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "audit_logging",
    "value": {
      "enabled": true,
      "log_conversations": true,
      "log_knowledge_retrieval": true,
      "retention_days": 90
    }
  }'
```

---

## 🔄 Complete Entity Creation Order

### Required Creation Sequence:
```
1. AdminUser (system bootstrap)
2. GlobalAIProvider (system config)
3. Tenant (organization)
4. TenantAIProvider (AI configuration)
5. Dataset (knowledge container)
6. Documents (knowledge content)
7. Bot (chat interface)
8. BotDataset (knowledge assignment) 
9. Scope (guardrails)
10. APIKey (access control)
```

### Dependencies Matrix:
| Entity | Depends On | Required For |
|--------|------------|--------------|
| **Tenant** | AdminUser | Everything else |
| **TenantAIProvider** | Tenant, GlobalAIProvider | Bot |
| **Dataset** | Tenant | Documents, BotDataset |
| **Documents** | Dataset | Chunks (auto-created) |
| **Bot** | Tenant, TenantAIProvider | Conversations, BotDataset, Scope |
| **BotDataset** | Bot, Dataset | Knowledge retrieval |
| **Scope** | Bot | Guardrail enforcement |
| **APIKey** | Tenant | External access |

---

## 📊 Production Readiness Checklist

### ✅ **Infrastructure Requirements:**
- [ ] PostgreSQL with pgvector extension
- [ ] Redis for caching and sessions
- [ ] Docker containers running and healthy
- [ ] SSL certificates for HTTPS
- [ ] Domain name configured

### ✅ **Data Requirements:**
- [ ] Tenant created and configured
- [ ] AI Provider with valid API keys
- [ ] Dataset created with documents uploaded
- [ ] All documents processed (status: "completed")
- [ ] Bot created and linked to datasets
- [ ] Scopes configured with appropriate restrictions

### ✅ **Security Requirements:**
- [ ] API keys generated with appropriate scopes
- [ ] Rate limits configured
- [ ] CORS domains configured
- [ ] Authentication working
- [ ] Guardrails tested and validated

### ✅ **Testing Requirements:**
- [ ] Basic chat functionality working
- [ ] Knowledge base retrieval working
- [ ] Citations being returned
- [ ] Guardrails preventing off-topic questions
- [ ] Context preservation across messages
- [ ] Error handling working properly

### ✅ **Monitoring Requirements:**
- [ ] Audit logging enabled
- [ ] Performance metrics collection
- [ ] Error tracking configured
- [ ] Usage analytics setup
- [ ] Health checks implemented

---

## 🚀 Quick Start Script

### Automated Bot Setup:
```python
#!/usr/bin/env python3
"""
Production Bot Setup Script
Automates the complete bot creation flow
"""

import asyncio
import aiohttp
import json
from pathlib import Path

class ProductionBotSetup:
    def __init__(self, admin_token, base_url="http://localhost:8000"):
        self.admin_token = admin_token
        self.base_url = base_url
        self.session = None
        
    async def create_complete_bot(self, config):
        """Create a complete production-ready bot"""
        
        # 1. Create tenant
        tenant = await self.create_tenant(config["tenant"])
        tenant_token = await self.login_tenant(tenant["email"], config["tenant"]["password"])
        
        # 2. Setup AI provider
        ai_provider = await self.setup_ai_provider(tenant_token, config["ai_provider"])
        
        # 3. Create dataset and upload documents
        dataset = await self.create_dataset(tenant_token, config["dataset"])
        await self.upload_documents(tenant_token, dataset["id"], config["documents"])
        
        # 4. Wait for document processing
        await self.wait_for_processing(tenant_token, dataset["id"])
        
        # 5. Create bot
        bot = await self.create_bot(tenant_token, {
            **config["bot"],
            "tenant_ai_provider_id": ai_provider["id"]
        })
        
        # 6. Link dataset to bot
        await self.link_dataset_to_bot(tenant_token, bot["id"], dataset["id"])
        
        # 7. Configure scopes
        await self.configure_scopes(tenant_token, bot["id"], config["scopes"])
        
        # 8. Create API keys
        api_key = await self.create_api_key(tenant_token, config["api_key"])
        
        return {
            "tenant": tenant,
            "bot": bot,
            "dataset": dataset,
            "api_key": api_key,
            "setup_complete": True
        }

# Configuration example
config = {
    "tenant": {
        "name": "Acme Corporation",
        "slug": "acme-corp", 
        "email": "admin@acme.com",
        "password": "secure_password_123",
        "plan": "enterprise"
    },
    "ai_provider": {
        "provider_name": "openai",
        "api_key": "sk-your-openai-key",
        "custom_settings": {"max_tokens": 4000}
    },
    "dataset": {
        "name": "Customer Support KB",
        "description": "Complete customer support documentation"
    },
    "documents": [
        {"type": "file", "path": "./docs/support_guide.pdf"},
        {"type": "text", "title": "FAQ", "content": "Frequently asked questions..."}
    ],
    "bot": {
        "name": "Customer Support Assistant",
        "system_prompt": "You are a helpful customer support assistant...",
        "model": "gpt-3.5-turbo"
    },
    "scopes": {
        "strictness_level": "moderate",
        "allowed_topics": ["customer support", "billing", "shipping"]
    },
    "api_key": {
        "name": "Production API Key",
        "scopes": ["chat:read", "chat:write"]
    }
}

# Run setup
setup = ProductionBotSetup(admin_token="your-admin-token")
result = asyncio.run(setup.create_complete_bot(config))
print(f"Bot setup complete! Bot ID: {result['bot']['id']}")
```

---

## 🎯 Summary

**Complete production bot setup requires:**

1. **System Foundation**: Admin user + Global AI providers
2. **Tenant Setup**: Organization + AI provider configuration  
3. **Knowledge Base**: Dataset + document upload + processing
4. **Bot Creation**: Chat interface + dataset linking + scope configuration
5. **Access Control**: API keys + domain restrictions
6. **Testing & Validation**: Functionality + guardrails + performance
7. **Production Deployment**: Frontend integration + monitoring

**Total entities created**: 8-10 database records minimum  
**Setup time**: 15-30 minutes for complete production bot  
**Dependencies**: All entities must be created in the specified order  

The system is designed for enterprise-grade deployment with proper multi-tenancy, security, and scalability built-in.