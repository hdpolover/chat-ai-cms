# API Endpoints Documentation

## Overview

This document provides a comprehensive overview of the Chat AI CMS API endpoints, their relationships to the database schema, and usage patterns.

## Base URLs

- **API Server**: `http://localhost:8000`
- **Admin Dashboard**: `http://localhost:3000`
- **Tenant Dashboard**: `http://localhost:3002`

## Authentication

### Admin Authentication

**Endpoint**: `POST /v1/admin/auth/login`

```json
{
    "email": "admin@example.com",
    "password": "admin123"
}
```

**Response**:
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "admin": {
        "id": "uuid",
        "email": "admin@example.com",
        "role": "admin"
    }
}
```

### Tenant Authentication

**Endpoint**: `POST /v1/tenant/auth/login`

```json
{
    "email": "tenant@example.com",
    "password": "tenant123"
}
```

**Response**:
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "tenant": {
        "id": "uuid",
        "email": "tenant@example.com",
        "name": "Demo Tenant Company",
        "slug": "demo-tenant",
        "plan": "free"
    }
}
```

## Admin Endpoints

### Global AI Providers Management

#### List Global AI Providers
```
GET /v1/admin/global-ai-providers
Authorization: Bearer {admin_token}
```

**Response**:
```json
[
    {
        "id": "uuid",
        "name": "OpenAI",
        "provider_type": "openai",
        "config": {
            "base_url": "https://api.openai.com",
            "models": ["gpt-3.5-turbo", "gpt-4", "gpt-4o"]
        },
        "is_active": true,
        "is_default": true,
        "created_at": "2025-09-11T08:02:50.654352Z"
    }
]
```

#### Create Global AI Provider
```
POST /v1/admin/global-ai-providers
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request**:
```json
{
    "name": "Custom OpenAI",
    "provider_type": "openai",
    "config": {
        "base_url": "https://api.openai.com/v1",
        "models": ["gpt-3.5-turbo", "gpt-4"],
        "supported_features": ["chat", "embeddings"]
    },
    "is_active": true,
    "is_default": false
}
```

#### Update Global AI Provider
```
PUT /v1/admin/global-ai-providers/{provider_id}
Authorization: Bearer {admin_token}
```

#### Delete Global AI Provider
```
DELETE /v1/admin/global-ai-providers/{provider_id}
Authorization: Bearer {admin_token}
```

### Tenant Management

#### List Tenants
```
GET /v1/admin/tenants
Authorization: Bearer {admin_token}
```

**Response**:
```json
[
    {
        "id": "uuid",
        "name": "Demo Tenant Company",
        "slug": "demo-tenant",
        "email": "tenant@example.com",
        "plan": "free",
        "is_active": true,
        "ai_provider_count": 2,
        "bot_count": 0,
        "dataset_count": 0,
        "created_at": "2025-09-11T08:06:01.892447Z"
    }
]
```

#### Create Tenant
```
POST /v1/admin/tenants
Authorization: Bearer {admin_token}
```

**Request**:
```json
{
    "name": "New Company",
    "slug": "new-company",
    "email": "admin@newcompany.com",
    "password": "secure123",
    "plan": "pro",
    "description": "A new tenant company"
}
```

### System Settings

#### Get System Settings
```
GET /v1/admin/settings
Authorization: Bearer {admin_token}
```

#### Update System Settings
```
PUT /v1/admin/settings
Authorization: Bearer {admin_token}
```

**Request**:
```json
{
    "max_tenants": 100,
    "default_rate_limit": 1000,
    "maintenance_mode": false
}
```

## Tenant Endpoints

### AI Provider Management

#### List Tenant AI Providers
```
GET /v1/tenant/ai-providers
Authorization: Bearer {tenant_token}
```

**Response**:
```json
[
    {
        "id": "uuid",
        "provider_name": "OpenAI",
        "global_ai_provider_id": "uuid",
        "base_url": "https://api.openai.com",
        "custom_settings": {
            "model": "gpt-4",
            "temperature": 0.7
        },
        "is_active": true,
        "global_provider": {
            "name": "OpenAI",
            "provider_type": "openai",
            "config": {
                "models": ["gpt-3.5-turbo", "gpt-4", "gpt-4o"]
            }
        }
    }
]
```

#### Create Tenant AI Provider
```
POST /v1/tenant/ai-providers
Authorization: Bearer {tenant_token}
```

**Request**:
```json
{
    "global_ai_provider_id": "uuid",
    "provider_name": "My OpenAI",
    "api_key": "sk-...",
    "base_url": "https://api.openai.com/v1",
    "custom_settings": {
        "model": "gpt-4",
        "temperature": 0.7,
        "max_tokens": 4000
    }
}
```

#### Update Tenant AI Provider
```
PUT /v1/tenant/ai-providers/{provider_id}
Authorization: Bearer {tenant_token}
```

#### Delete Tenant AI Provider
```
DELETE /v1/tenant/ai-providers/{provider_id}
Authorization: Bearer {tenant_token}
```

### Bot Management

#### List Bots
```
GET /v1/tenant/bots
Authorization: Bearer {tenant_token}
```

**Response**:
```json
[
    {
        "id": "uuid",
        "name": "Customer Support Bot",
        "description": "Handles customer inquiries",
        "system_prompt": "You are a helpful customer support assistant...",
        "model": "gpt-4",
        "temperature": 0.7,
        "max_tokens": 2000,
        "is_public": true,
        "is_active": true,
        "tenant_ai_provider": {
            "id": "uuid",
            "provider_name": "OpenAI",
            "provider_type": "openai"
        },
        "settings": {
            "streaming": true,
            "safety_filters": ["toxicity"]
        },
        "created_at": "2025-09-11T10:00:00Z"
    }
]
```

#### Create Bot
```
POST /v1/tenant/bots
Authorization: Bearer {tenant_token}
```

**Request**:
```json
{
    "name": "Support Bot",
    "description": "Customer support chatbot",
    "tenant_ai_provider_id": "uuid",
    "system_prompt": "You are a helpful assistant for customer support.",
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 2000,
    "is_public": true,
    "settings": {
        "streaming": true,
        "conversation_memory": 10
    }
}
```

#### Update Bot
```
PUT /v1/tenant/bots/{bot_id}
Authorization: Bearer {tenant_token}
```

#### Delete Bot
```
DELETE /v1/tenant/bots/{bot_id}
Authorization: Bearer {tenant_token}
```

### Dataset Management

#### List Datasets
```
GET /v1/tenant/datasets
Authorization: Bearer {tenant_token}
```

**Response**:
```json
[
    {
        "id": "uuid",
        "name": "Product Documentation",
        "description": "All product documentation and FAQs",
        "tags": ["docs", "faq"],
        "document_count": 25,
        "total_chunks": 150,
        "is_active": true,
        "created_at": "2025-09-11T09:00:00Z"
    }
]
```

#### Create Dataset
```
POST /v1/tenant/datasets
Authorization: Bearer {tenant_token}
```

**Request**:
```json
{
    "name": "Knowledge Base",
    "description": "Company knowledge base documents",
    "tags": ["knowledge", "internal"]
}
```

#### Upload Document to Dataset
```
POST /v1/tenant/datasets/{dataset_id}/documents
Authorization: Bearer {tenant_token}
Content-Type: multipart/form-data
```

**Form Data**:
- `file`: Document file (PDF, TXT, DOCX)
- `title`: Document title
- `tags`: JSON array of tags

### Conversation Management

#### Start Conversation
```
POST /v1/tenant/bots/{bot_id}/conversations
Authorization: Bearer {tenant_token}
```

**Request**:
```json
{
    "message": "Hello, I need help with my account",
    "session_id": "optional-session-id",
    "metadata": {
        "source": "website",
        "user_id": "anonymous"
    }
}
```

**Response**:
```json
{
    "conversation_id": "uuid",
    "message": {
        "id": "uuid",
        "role": "assistant",
        "content": "Hello! I'd be happy to help you with your account. What specific issue are you experiencing?",
        "citations": [],
        "token_usage": {
            "prompt_tokens": 45,
            "completion_tokens": 23,
            "total_tokens": 68
        }
    }
}
```

#### Continue Conversation
```
POST /v1/tenant/conversations/{conversation_id}/messages
Authorization: Bearer {tenant_token}
```

**Request**:
```json
{
    "message": "I forgot my password"
}
```

#### Get Conversation History
```
GET /v1/tenant/conversations/{conversation_id}/messages
Authorization: Bearer {tenant_token}
```

## Public Endpoints

### Chat with Bot (Public API)

#### Send Message to Public Bot
```
POST /v1/chat/{tenant_slug}/{bot_name}
Content-Type: application/json
```

**Request**:
```json
{
    "message": "What are your business hours?",
    "session_id": "user-session-123",
    "context": {
        "user_ip": "192.168.1.1",
        "user_agent": "Mozilla/5.0..."
    }
}
```

**Response**:
```json
{
    "response": "Our business hours are Monday to Friday, 9 AM to 6 PM EST.",
    "conversation_id": "uuid",
    "citations": [
        {
            "source": "Business Hours FAQ",
            "url": "https://company.com/faq#hours",
            "chunk_id": "uuid"
        }
    ],
    "metadata": {
        "model_used": "gpt-4",
        "response_time_ms": 1250,
        "token_usage": {
            "total_tokens": 85
        }
    }
}
```

## Health and Status

### Health Check
```
GET /v1/health
```

**Response**:
```json
{
    "status": "healthy",
    "timestamp": "2025-09-11T09:43:43.368453Z",
    "version": "0.1.0",
    "database": "healthy",
    "redis": "healthy"
}
```

### System Status
```
GET /v1/status
```

**Response**:
```json
{
    "uptime": "2 days, 3 hours",
    "total_tenants": 5,
    "total_bots": 12,
    "total_conversations": 1456,
    "total_messages": 8932,
    "database_size": "245MB",
    "cache_status": "healthy"
}
```

## Database Query Patterns

### Common Query Examples

#### Get Tenant with AI Providers and Bots
```sql
SELECT 
    t.name as tenant_name,
    t.slug,
    COUNT(DISTINCT tap.id) as ai_provider_count,
    COUNT(DISTINCT b.id) as bot_count,
    json_agg(DISTINCT jsonb_build_object(
        'provider_name', tap.provider_name,
        'provider_type', gap.provider_type,
        'is_active', tap.is_active
    )) FILTER (WHERE tap.id IS NOT NULL) as ai_providers
FROM tenants t
LEFT JOIN tenant_ai_providers tap ON t.id = tap.tenant_id
LEFT JOIN global_ai_providers gap ON tap.global_ai_provider_id = gap.id
LEFT JOIN bots b ON t.id = b.tenant_id
WHERE t.id = $1
GROUP BY t.id, t.name, t.slug;
```

#### Get Bot Conversation Analytics
```sql
SELECT 
    b.name as bot_name,
    COUNT(DISTINCT c.id) as conversation_count,
    COUNT(m.id) as message_count,
    AVG(m.response_time_ms) as avg_response_time,
    SUM((m.token_usage->>'total_tokens')::int) as total_tokens
FROM bots b
LEFT JOIN conversations c ON b.id = c.bot_id
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE b.tenant_id = $1
AND c.created_at >= $2
GROUP BY b.id, b.name;
```

#### Semantic Search for RAG
```sql
SELECT 
    c.content,
    c.metadata,
    d.title as document_title,
    d.source_url,
    (c.embedding <-> $1) as distance
FROM chunks c
JOIN documents d ON c.document_id = d.id
JOIN datasets ds ON d.dataset_id = ds.id
WHERE ds.tenant_id = $2
AND ds.is_active = true
AND d.status = 'completed'
ORDER BY c.embedding <-> $1
LIMIT $3;
```

## Error Handling

### Standard Error Response
```json
{
    "error": "ValidationError",
    "message": "Invalid request data",
    "details": {
        "field": "email",
        "issue": "must be a valid email address"
    },
    "timestamp": "2025-09-11T10:00:00Z",
    "path": "/v1/tenant/bots"
}
```

### Common HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

## Rate Limiting

### Headers
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

### Limits
- **Admin API**: 1000 requests per hour
- **Tenant API**: 500 requests per hour (configurable per tenant)
- **Public Chat API**: 100 requests per hour per IP

## WebSocket Support

### Real-time Chat
```
WS /v1/ws/chat/{conversation_id}
Authorization: Bearer {token}
```

**Message Format**:
```json
{
    "type": "message",
    "content": "Hello world",
    "metadata": {}
}
```

**Response Format**:
```json
{
    "type": "response",
    "content": "Hello! How can I help you?",
    "citations": [],
    "streaming": true,
    "chunk": "Hello! "
}
```

## SDKs and Integration

### JavaScript SDK Example
```javascript
import { ChatAICMS } from '@chatai/cms-sdk';

const client = new ChatAICMS({
    baseUrl: 'http://localhost:8000',
    apiKey: 'your-api-key'
});

// Start a conversation
const conversation = await client.chat.start('bot-slug', {
    message: 'Hello world',
    sessionId: 'user-session-123'
});

// Continue conversation
const response = await client.chat.send(conversation.id, {
    message: 'Tell me more'
});
```

### Python SDK Example
```python
from chatai_cms import ChatAICMS

client = ChatAICMS(
    base_url="http://localhost:8000",
    api_key="your-api-key"
)

# Start conversation
conversation = client.chat.start(
    bot_slug="support-bot",
    message="I need help",
    session_id="user-123"
)

# Send message
response = client.chat.send(
    conversation_id=conversation.id,
    message="What are your hours?"
)
```

## Testing and Development

### Sample API Calls for Testing

#### Create Test Data
```bash
# Login as tenant
curl -X POST http://localhost:8000/v1/tenant/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "tenant@example.com", "password": "tenant123"}'

# Create a bot
curl -X POST http://localhost:8000/v1/tenant/bots \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Bot",
    "description": "A test chatbot",
    "tenant_ai_provider_id": "uuid",
    "system_prompt": "You are a helpful assistant.",
    "model": "gpt-3.5-turbo"
  }'

# Start a conversation
curl -X POST http://localhost:8000/v1/tenant/bots/{bot_id}/conversations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'
```

This documentation provides a comprehensive overview of how the database schema is exposed through the API endpoints, enabling developers to understand the full system architecture and integration patterns.