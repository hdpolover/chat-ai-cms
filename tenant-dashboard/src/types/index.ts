/**
 * Modular TypeScript types for the tenant dashboard
 * 
 * This file serves as the central export point for all type definitions.
 * Types are organized into domain-specific modules for better maintainability.
 */

// === Authentication Types ===
export type {
  TenantUser,
  LoginRequest,
  LoginResponse,
} from './auth';

// === Bot Management Types ===
export type {
  Bot,
  CreateBotRequest,
  UpdateBotRequest,
  ChatSession,
  ChatMessage,
  CreateChatRequest,
  SendMessageRequest,
} from './bot';

// === AI Provider Types ===
export type {
  TenantAIProvider,
  GlobalAIProvider,
  CreateTenantAIProviderRequest,
  UpdateTenantAIProviderRequest,
} from './aiProvider';

// === Scope & Guardrail Types ===
export type {
  Scope,
  ScopeResponse,
  CreateScopeRequest,
  UpdateScopeRequest,
} from './scope';

// === Analytics Types ===
export type {
  TenantAnalytics,
} from './analytics';

// === Dataset & Document Types ===
export type {
  Dataset,
  CreateDatasetRequest,
  UpdateDatasetRequest,
  Document,
  UploadDocumentRequest,
} from './dataset';

// === Common/Shared Types ===
export type {
  ApiResponse,
  TenantSettings,
  SortOrder,
  PaginationParams,
  BaseEntity,
  TimestampedEntity,
  // Shared guardrail types (also available via scope module)
  GuardrailConfig,
  DatasetFilters,
  KnowledgeBoundaries,
  ResponseGuidelines,
} from './common';

// === Re-export modules for direct access ===
// This allows importing specific modules when needed:
// import { AuthTypes } from '@/types';
export * as AuthTypes from './auth';
export * as BotTypes from './bot';
export * as AIProviderTypes from './aiProvider';
export * as ScopeTypes from './scope';
export * as AnalyticsTypes from './analytics';
export * as DatasetTypes from './dataset';
export * as CommonTypes from './common';