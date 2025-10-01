/**
 * Bot-related types for the tenant dashboard
 */

// Import shared types from common to avoid circular dependencies
import type { BaseEntity, GuardrailConfig } from './common';

export interface Bot extends BaseEntity {
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