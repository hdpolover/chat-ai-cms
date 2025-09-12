# Tenant Dashboard - AI Provider and Bot Management Guide

This guide explains how to use the tenant dashboard to configure AI providers and create chatbots.

## 🚀 Getting Started

### 1. Access the Tenant Dashboard
- **URL**: http://localhost:3002
- **Login Credentials**:
  - Email: `tenant@example.com`
  - Password: `tenant123`

### 2. Navigation Structure
The tenant dashboard provides the following key sections:
- **Dashboard**: Overview and analytics
- **Bots**: Manage your chatbots  
- **Settings** → **AI Providers**: Configure AI provider connections

## 🤖 AI Provider Management

### Available Provider Types
The system supports multiple AI providers:
- **OpenAI**: GPT models (gpt-3.5-turbo, gpt-4, etc.)
- **Anthropic**: Claude models (claude-3-haiku, claude-3-sonnet, etc.)
- **Google**: Gemini models
- **Custom**: Other compatible APIs

### Adding a New AI Provider
1. Navigate to **Settings** → **AI Providers**
2. Click **"Add Provider"**
3. Configure the provider:
   - **Provider Type**: Select from available global providers
   - **Provider Name**: Custom name for this configuration
   - **API Key**: Your API key from the provider
4. Click **"Add Provider"**

### Managing Existing Providers
- **Edit**: Update provider name or API key
- **Delete**: Remove provider (warning: deletes associated bots)
- **View**: See provider details and available models

### Security Features
- API keys are never displayed in full for security
- Keys are encrypted in the database
- Provider connections can be tested before saving

## 🤖 Bot Management

### Creating a New Bot
1. Navigate to **Bots**
2. Click **"Create Bot"**
3. Configure the bot:
   - **Bot Name**: Descriptive name for your bot
   - **Description**: Optional description
   - **AI Provider**: Select from configured providers
   - **Model**: Choose from available models for the provider
   - **System Prompt**: Instructions for bot behavior
   - **Temperature**: Creativity level (0-2, where 0 is focused, 2 is creative)
   - **Max Tokens**: Maximum response length
   - **Public Bot**: Whether the bot is accessible to external users
   - **Allowed Domains**: Domain restrictions for public bots

### Bot Configuration Options

#### Core Settings
- **Name**: Unique identifier for the bot
- **Model**: AI model to use (depends on selected provider)
- **System Prompt**: Defines bot personality and behavior

#### Advanced Settings  
- **Temperature**: Controls randomness (0.0-2.0)
  - 0.0: Very focused and deterministic
  - 1.0: Balanced creativity and focus  
  - 2.0: Very creative and random
- **Max Tokens**: Response length limit (1-4096)

#### Access Control
- **Private Bots**: Only accessible within your tenant
- **Public Bots**: Can be accessed by external users
- **Domain Restrictions**: Limit public bot access to specific domains

### Managing Existing Bots
- **View Details**: See complete bot configuration
- **Edit**: Modify bot settings and behavior
- **Activate/Deactivate**: Enable or disable bot
- **Delete**: Permanently remove bot

## 💡 Current Test Data

### Pre-configured AI Providers
The system comes with these test providers:
- **OpenAI**: Ready for GPT models
- **Anthropic**: Ready for Claude models

### Sample Bots
- **OpenAI Assistant**: Uses gpt-3.5-turbo model
- **Claude Assistant**: Uses claude-3-haiku-20240307 model

## 🔧 Development Information

### Backend API Integration
The tenant dashboard connects to these API endpoints:
- `GET /v1/tenant/ai-providers` - List AI providers
- `POST /v1/tenant/ai-providers` - Create AI provider
- `PUT /v1/tenant/ai-providers/{id}` - Update AI provider
- `DELETE /v1/tenant/ai-providers/{id}` - Delete AI provider
- `GET /v1/tenant/bots` - List bots
- `POST /v1/tenant/bots` - Create bot
- `PUT /v1/tenant/bots/{id}` - Update bot
- `DELETE /v1/tenant/bots/{id}` - Delete bot

### Database Schema
The system uses a multi-tenant architecture:
- **tenants**: Tenant organizations
- **global_ai_providers**: Available AI provider types
- **tenant_ai_providers**: Tenant-specific AI provider configurations
- **bots**: Chatbots belonging to tenants
- **conversations**: Chat sessions with bots

### Authentication
- JWT-based authentication for tenant access
- API keys are encrypted and never exposed in responses
- Session management with automatic token refresh

## 🚀 Next Steps

### For Development
1. Add support for additional AI providers
2. Implement bot analytics and usage tracking
3. Add conversation management interface
4. Implement bot embedding and sharing features

### For Production
1. Configure production AI provider API keys
2. Set up proper SSL certificates
3. Configure monitoring and logging
4. Implement rate limiting and usage quotas

## 📚 API Documentation

### Tenant AI Provider Model
```typescript
interface TenantAIProvider {
  id: string;
  tenant_id: string;
  global_ai_provider_id: string;
  provider_name: string;
  base_url?: string;
  custom_settings?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Bot Model
```typescript
interface Bot {
  id: string;
  name: string;
  description?: string;
  tenant_id: string;
  tenant_ai_provider_id: string;
  model: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  is_active: boolean;
  settings?: Record<string, any>;
  is_public: boolean;
  allowed_domains?: string[];
  created_at: string;
  updated_at: string;
}
```

This completes the tenant dashboard implementation with full AI provider configuration and bot creation capabilities.