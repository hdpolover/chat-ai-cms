# Database Schema Documentation

## Overview

This document provides a comprehensive overview of the PostgreSQL database schema for the Chat AI CMS API, including table structures, relationships, and data flow patterns.

## Database Architecture

The system follows a multi-tenant architecture with support for various AI providers, chatbots, document processing, and conversation management.

## Entity Relationship Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────┐    ┌─────────────┐
│ global_ai_      │    │ tenant_ai_       │    │   bots      │    │ conversations│
│ providers       │◄───┤ providers        │◄───┤             │◄───┤             │
│                 │    │                  │    │             │    │             │
└─────────────────┘    └──────────────────┘    └─────────────┘    └─────────────┘
         │                       │                     │                   │
         │                       │                     │                   │
         │              ┌─────────▼──────┐             │          ┌────────▼────────┐
         │              │   tenants      │◄────────────┤          │   messages      │
         │              │                │             │          │                 │
         │              └────────────────┘             │          └─────────────────┘
         │                       │                     │
         │                       │                     │
         │              ┌─────────▼──────┐    ┌────────▼────────┐
         │              │   datasets     │◄───┤    scopes       │
         │              │                │    │                 │
         │              └────────▲───────┘    └─────────────────┘
         │                       │                     │
         │                       │            ┌────────▼────────┐
         │              ┌─────────▼──────┐    │  bot_datasets   │
         │              │  documents     │    │ (many-to-many)  │
         │              │                │    └─────────────────┘
         │              └────────────────┘             │
         │                       │                     │
         │              ┌─────────▼──────┐             │
         │              │    chunks      │◄────────────┘
         │              │  (embeddings)  │   (via datasets)
         │              └────────────────┘
```

## Core Tables

### 1. Tenants (`tenants`)

**Purpose**: Multi-tenant isolation and authentication

```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255),
    password_hash VARCHAR(255),
    is_email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    settings JSON NOT NULL DEFAULT '{}',
    global_rate_limit INTEGER NOT NULL DEFAULT 1000,
    feature_flags JSON NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    owner_email VARCHAR(255),
    plan VARCHAR(50) NOT NULL DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Indexes**:
- `idx_tenant_email` on `email`
- Unique constraint on `slug`

**Relationships**:
- One-to-many with `tenant_ai_providers`
- One-to-many with `bots`
- One-to-many with `datasets`
- One-to-many with `api_keys`
- One-to-many with `audit_logs`

### 2. Global AI Providers (`global_ai_providers`)

**Purpose**: Master catalog of available AI providers

```sql
CREATE TABLE global_ai_providers (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    provider_type VARCHAR(50) NOT NULL,
    config JSON NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Configuration Examples**:
```json
{
    "base_url": "https://api.openai.com",
    "models": ["gpt-3.5-turbo", "gpt-4", "gpt-4o"],
    "supported_features": ["chat", "embeddings"]
}
```

**Indexes**:
- `idx_global_ai_provider_type` on `provider_type`

**Relationships**:
- One-to-many with `tenant_ai_providers`

### 3. Tenant AI Providers (`tenant_ai_providers`)

**Purpose**: Tenant-specific configurations of global AI providers

```sql
CREATE TABLE tenant_ai_providers (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    global_ai_provider_id UUID REFERENCES global_ai_providers(id),
    provider_name VARCHAR(100) NOT NULL,
    api_key TEXT NOT NULL,
    base_url VARCHAR(255),
    custom_settings JSON,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, provider_name)
);
```

**Custom Settings Examples**:
```json
{
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 4000,
    "timeout": 30
}
```

**Indexes**:
- `idx_tenant_ai_providers_tenant` on `tenant_id`
- `uq_tenant_provider` unique constraint on `(tenant_id, provider_name)`

**Relationships**:
- Many-to-one with `tenants`
- Many-to-one with `global_ai_providers`
- One-to-many with `bots`

### 4. Bots (`bots`)

**Purpose**: Chatbot instances belonging to tenants

```sql
CREATE TABLE bots (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    tenant_ai_provider_id UUID NOT NULL REFERENCES tenant_ai_providers(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    system_prompt TEXT,
    model VARCHAR(100) NOT NULL DEFAULT 'gpt-3.5-turbo',
    temperature DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    max_tokens INTEGER,
    is_public BOOLEAN NOT NULL DEFAULT true,
    allowed_domains JSON NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    settings JSON NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);
```

**Settings Examples**:
```json
{
    "streaming": true,
    "response_format": "text",
    "safety_filters": ["toxicity", "bias"],
    "conversation_memory": 10
}
```

**Indexes**:
- `idx_bot_tenant_ai_provider` on `tenant_ai_provider_id`
- `uq_bot_tenant_name` unique constraint on `(tenant_id, name)`

**Relationships**:
- Many-to-one with `tenants`
- Many-to-one with `tenant_ai_providers`
- One-to-many with `conversations`
- One-to-many with `scopes`
- Many-to-many with `datasets` (via `bot_datasets`)

## Bot-Dataset Relationship Table

### Bot Datasets (`bot_datasets`)

**Purpose**: Many-to-many relationship between bots and datasets for knowledge base assignment

```sql
CREATE TABLE bot_datasets (
    id UUID PRIMARY KEY,
    bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(bot_id, dataset_id)
);
```

**Features**:
- **Priority**: Allows ordering datasets by importance for retrieval
- **Active/Inactive**: Can temporarily disable datasets without removing the relationship
- **Cascade Delete**: Automatically removes relationships when bot or dataset is deleted

**Indexes**:
- `idx_bot_datasets_bot_id` on `bot_id`
- `idx_bot_datasets_dataset_id` on `dataset_id`
- Unique constraint on `(bot_id, dataset_id)`

**Relationships**:
- Many-to-one with `bots`
- Many-to-one with `datasets`

## Document Processing Tables

### 5. Datasets (`datasets`)

**Purpose**: Collections of documents for knowledge base

```sql
CREATE TABLE datasets (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tags JSON NOT NULL DEFAULT '[]',
    metadata JSON NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, name)
);
```

**Relationships**:
- Many-to-one with `tenants`
- One-to-many with `documents`
- Many-to-many with `bots` (via `bot_datasets`)

### 6. Documents (`documents`)

**Purpose**: Individual documents within datasets

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    dataset_id UUID NOT NULL REFERENCES datasets(id),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_url VARCHAR(1000),
    file_path VARCHAR(1000),
    file_size INTEGER,
    content_hash VARCHAR(64) NOT NULL,
    tags JSON NOT NULL DEFAULT '[]',
    metadata JSON NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Status Values**: `pending`, `processing`, `completed`, `failed`

**Indexes**:
- `idx_document_content_hash` on `content_hash`
- `idx_document_status` on `status`

**Relationships**:
- Many-to-one with `datasets`
- One-to-many with `chunks`

### 7. Chunks (`chunks`)

**Purpose**: Text chunks with vector embeddings for semantic search

```sql
CREATE TABLE chunks (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id),
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    token_count INTEGER NOT NULL,
    chunk_index INTEGER NOT NULL,
    start_char INTEGER NOT NULL,
    end_char INTEGER NOT NULL,
    metadata JSON NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Indexes**:
- `idx_chunk_document_id` on `document_id`
- `idx_chunk_embedding` IVFFlat index on `embedding` for vector similarity search

**Relationships**:
- Many-to-one with `documents`

## Conversation Tables

### 8. Conversations (`conversations`)

**Purpose**: Chat sessions between users and bots

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    bot_id UUID NOT NULL REFERENCES bots(id),
    session_id VARCHAR(255),
    title VARCHAR(500),
    user_ip VARCHAR(45),
    user_agent TEXT,
    metadata JSON NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Indexes**:
- `idx_conversation_bot_id` on `bot_id`
- `idx_conversation_session_id` on `session_id`

**Relationships**:
- Many-to-one with `bots`
- One-to-many with `messages`

### 9. Messages (`messages`)

**Purpose**: Individual messages within conversations

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    citations JSON NOT NULL DEFAULT '[]',
    token_usage JSON NOT NULL DEFAULT '{}',
    response_time_ms INTEGER,
    metadata JSON NOT NULL DEFAULT '{}',
    sequence_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Role Values**: `user`, `assistant`, `system`

**Token Usage Example**:
```json
{
    "prompt_tokens": 150,
    "completion_tokens": 75,
    "total_tokens": 225
}
```

**Indexes**:
- `idx_message_conversation_id` on `conversation_id`
- `idx_message_sequence` on `(conversation_id, sequence_number)`

**Relationships**:
- Many-to-one with `conversations`

## Access Control Tables

### 10. Scopes (`scopes`)

**Purpose**: Define data access and filtering rules for bots

```sql
CREATE TABLE scopes (
    id UUID PRIMARY KEY,
    bot_id UUID NOT NULL REFERENCES bots(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    dataset_filters JSON NOT NULL DEFAULT '{}',
    guardrails JSON NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(bot_id, name)
);
```

**Dataset Filters Example**:
```json
{
    "include_datasets": ["uuid1", "uuid2"],
    "exclude_tags": ["internal", "confidential"],
    "date_range": {
        "start": "2024-01-01",
        "end": "2024-12-31"
    }
}
```

**Relationships**:
- Many-to-one with `bots`

### 11. API Keys (`api_keys`)

**Purpose**: API access management for tenants

```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    scopes JSON NOT NULL DEFAULT '[]',
    rate_limit INTEGER NOT NULL DEFAULT 1000,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**Relationships**:
- Many-to-one with `tenants`

## Administrative Tables

### 12. Admin Users (`admin_users`)

**Purpose**: System administrators

```sql
CREATE TABLE admin_users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### 13. System Settings (`system_settings`)

**Purpose**: Global system configuration

```sql
CREATE TABLE system_settings (
    id UUID PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value JSON NOT NULL,
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### 14. Audit Logs (`audit_logs`)

**Purpose**: System activity tracking

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSON NOT NULL DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

## Data Flow Patterns

### 1. AI Provider Configuration Flow

```
1. Admin creates global_ai_providers
2. Tenant configures tenant_ai_providers with API keys
3. Bot is created using tenant_ai_provider
4. Conversations use bot's AI provider settings
```

### 2. Document Processing & Bot Knowledge Flow

```
1. Tenant creates dataset
2. Documents are uploaded to dataset
3. Documents are chunked and embedded
4. Chunks are stored with vector embeddings
5. Bot is assigned to specific datasets via bot_datasets
6. Bot queries use semantic search only on assigned datasets
```

### 3. Bot-Specific Knowledge Retrieval

```
1. User asks question to bot
2. System identifies bot's assigned datasets
3. Semantic search performed only on chunks from those datasets
4. Relevant chunks retrieved with priority ordering
5. AI provider generates response using filtered knowledge
6. Response includes citations from assigned datasets only
```

### 4. Conversation Flow

```
1. User starts conversation with bot
2. Messages are stored in sequence
3. Bot retrieves relevant chunks using embeddings from assigned datasets
4. AI provider generates response using filtered knowledge
5. Response is stored with metadata and dataset citations
```

## Migration Notes

### Legacy Tables

- **`ai_providers_master`**: Old provider table, replaced by `global_ai_providers`
- Migration path: Data moved to new structure, old table preserved for rollback

### Recent Changes

- Added authentication fields to `tenants` table
- Migrated from direct AI provider references to global→tenant pattern
- Added vector support with pgvector extension

## Performance Considerations

### Indexes for Common Queries

1. **Tenant isolation**: All tenant-related queries use `tenant_id` indexes
2. **Vector search**: IVFFlat index on `chunks.embedding` for fast similarity search
3. **Conversation history**: Composite index on `(conversation_id, sequence_number)`
4. **Document status**: Index on `documents.status` for processing queries

### Query Patterns

1. **Get tenant bots with AI providers**:
```sql
SELECT b.*, tap.provider_name, gap.provider_type
FROM bots b
JOIN tenant_ai_providers tap ON b.tenant_ai_provider_id = tap.id
JOIN global_ai_providers gap ON tap.global_ai_provider_id = gap.id
WHERE b.tenant_id = ?;
```

2. **Semantic search in chunks**:
```sql
SELECT c.content, c.metadata, d.title
FROM chunks c
JOIN documents d ON c.document_id = d.id
JOIN datasets ds ON d.dataset_id = ds.id
WHERE ds.tenant_id = ?
ORDER BY c.embedding <-> ?
LIMIT 10;
```

## Current State (as of Sept 11, 2025)

- **Global AI Providers**: 6 configured (OpenAI x2, Anthropic x2, Azure OpenAI, Google Gemini)
- **Tenants**: 1 (Demo Tenant Company with authentication)
- **Tenant AI Providers**: 2 configured (OpenAI, Anthropic)
- **Bots**: 0 (ready for creation)
- **Datasets**: 0 (ready for creation)
- **Conversations**: 0 (ready for creation)

## Future Enhancements

1. **Multi-model support**: Enhanced provider configurations for different model types
2. **Advanced chunking**: Configurable chunking strategies per dataset
3. **Conversation analytics**: Enhanced message metadata and analytics
4. **Role-based access**: Fine-grained permissions within tenants
5. **Webhook support**: Real-time notifications for events