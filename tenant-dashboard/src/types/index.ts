// TypeScript types for the tenant dashboard
export interface TenantUser {
  id: string;
  email: string;
  name: string;
  slug: string;
  description?: string;
  plan: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
}

export interface TenantAIProvider {
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

export interface GlobalAIProvider {
  id: string;
  name: string;
  provider_type: string;
  config?: Record<string, any>;
  is_configured: boolean;
}

export interface CreateTenantAIProviderRequest {
  global_ai_provider_id: string;
  provider_name: string;
  api_key: string;
  base_url?: string;
  custom_settings?: Record<string, any>;
  is_active?: boolean;
}

export interface UpdateTenantAIProviderRequest {
  provider_name?: string;
  api_key?: string;
  base_url?: string;
  custom_settings?: Record<string, any>;
  is_active?: boolean;
}

export interface Scope {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  config?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBoundaries {
  strict_mode?: boolean;
  allowed_sources?: string[];
  context_preference?: 'exclusive' | 'supplement' | 'prefer';
}

export interface ResponseGuidelines {
  max_response_length?: number;
  require_citations?: boolean;
  step_by_step?: boolean;
  mathematical_notation?: boolean;
}

export interface GuardrailConfig {
  allowed_topics?: string[];
  forbidden_topics?: string[];
  knowledge_boundaries?: KnowledgeBoundaries;
  response_guidelines?: ResponseGuidelines;
  refusal_message?: string;
}

export interface DatasetFilters {
  tags?: string[];
  categories?: string[];
  metadata_filters?: Record<string, string>;
  include_patterns?: string[];
  exclude_patterns?: string[];
  source_priorities?: Record<string, number>;
}

export interface Scope {
  id: string;
  bot_id: string;
  name: string;
  description?: string;
  dataset_filters?: DatasetFilters;
  guardrails?: GuardrailConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateScopeRequest {
  name: string;
  description?: string;
  dataset_filters?: DatasetFilters;
  guardrails?: GuardrailConfig;
  is_active?: boolean;
}

export interface UpdateScopeRequest {
  name?: string;
  description?: string;
  dataset_filters?: DatasetFilters;
  guardrails?: GuardrailConfig;
  is_active?: boolean;
}

export interface Bot {
  id: string;
  name: string;
  description?: string;
  tenant_id: string;
  tenant_ai_provider_id: string;
  ai_provider_name?: string;
  model: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  is_active: boolean;
  settings?: Record<string, any>;
  is_public: boolean;
  allowed_domains?: string[];
  datasets?: Array<{
    id: string;
    name: string;
    description?: string;
    tags?: string[];
    created_at: string;
    updated_at: string;
  }>;
  scopes?: Array<{
    id: string;
    name: string;
    description?: string;
    guardrails?: GuardrailConfig;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  bot_id: string;
  bot_name?: string;
  user_id?: string;
  session_id: string;
  title?: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  chat_session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface TenantAnalytics {
  total_bots: number;
  active_bots: number;
  total_chats: number;
  total_messages: number;
  monthly_messages: number;
  avg_response_time: number;
  usage_by_bot: Array<{
    bot_id: string;
    bot_name: string;
    message_count: number;
  }>;
  daily_usage: Array<{
    date: string;
    message_count: number;
  }>;
}

export interface TenantSettings {
  id: string;
  tenant_id: string;
  max_bots: number;
  monthly_message_limit: number;
  api_rate_limit: number;
  custom_domain?: string;
  webhook_url?: string;
  webhook_secret?: string;
  branding?: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  status?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  tenant: TenantUser;
}

export interface CreateBotRequest {
  name: string;
  description?: string;
  tenant_ai_provider_id: string;
  model: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  settings?: Record<string, any>;
  is_public?: boolean;
  allowed_domains?: string[];
  dataset_ids?: string[];
}

export interface UpdateBotRequest extends Partial<CreateBotRequest> {
  is_active?: boolean;
  scope_ids?: string[];
}

export interface CreateChatRequest {
  bot_id: string;
  session_id?: string;
  user_id?: string;
}

export interface SendMessageRequest {
  chat_session_id: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface ScopeResponse extends Scope {}