/**
 * Authentication-related types for the tenant dashboard
 */

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

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  tenant: TenantUser;
}