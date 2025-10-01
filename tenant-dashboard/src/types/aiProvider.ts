/**
 * AI Provider types for tenant dashboard
 */

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