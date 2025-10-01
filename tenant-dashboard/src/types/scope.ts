/**
 * Scope-related types for bot configuration and guardrails
 */

// Import shared types from common to avoid circular dependencies
import type { 
  BaseEntity, 
  GuardrailConfig, 
  DatasetFilters, 
  KnowledgeBoundaries, 
  ResponseGuidelines 
} from './common';

// Re-export for convenience (maintains backward compatibility)
export type { GuardrailConfig, DatasetFilters, KnowledgeBoundaries, ResponseGuidelines };

export interface Scope extends BaseEntity {
  bot_id: string;
  name: string;
  description?: string;
  dataset_filters?: DatasetFilters;
  guardrails?: GuardrailConfig;
  is_active: boolean;
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

export interface ScopeResponse extends Scope {}