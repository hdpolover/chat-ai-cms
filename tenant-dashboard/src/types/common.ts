/**
 * Common shared types used across the tenant dashboard
 */

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  status?: number;
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

// Common utility types
export type SortOrder = 'asc' | 'desc';

export interface PaginationParams {
  skip?: number;
  limit?: number;
  order_by?: string;
  order?: SortOrder;
}

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface TimestampedEntity extends BaseEntity {
  created_at: string;
  updated_at: string;
}

// Shared scope and guardrail types to avoid circular dependencies
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