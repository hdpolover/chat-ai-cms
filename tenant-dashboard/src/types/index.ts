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

export interface Bot {
  id: string;
  name: string;
  description?: string;
  tenant_id: string;
  ai_provider_id: string;
  ai_provider_name?: string;
  model: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  is_active: boolean;
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
  ai_provider_id: string;
  model: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface UpdateBotRequest extends Partial<CreateBotRequest> {
  is_active?: boolean;
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