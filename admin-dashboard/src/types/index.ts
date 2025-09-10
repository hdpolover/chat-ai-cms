// Core Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner_email: string;
  plan: 'free' | 'pro' | 'enterprise';
  usage_stats?: TenantUsageStats;
}

export interface TenantUsageStats {
  total_chats: number;
  total_messages: number;
  total_tokens_used: number;
  active_users: number;
  storage_used_mb: number;
  last_activity: string;
}

export interface DashboardStats {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  total_chats_today: number;
  total_messages_today: number;
  system_health: 'healthy' | 'warning' | 'error';
}

export interface SystemSettings {
  ai_provider_default: string;
  max_tenants_per_plan: {
    free: number;
    pro: number;
    enterprise: number;
  };
  rate_limits: {
    requests_per_minute: number;
    tokens_per_day: number;
  };
  maintenance_mode: boolean;
  registration_enabled: boolean;
}

export interface AIProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'azure' | 'custom';
  config: Record<string, any>;
  is_active: boolean;
  is_default: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// Form Types
export interface TenantFormData {
  name: string;
  slug: string;
  description?: string;
  owner_email: string;
  plan: 'free' | 'pro' | 'enterprise';
  is_active: boolean;
}

export interface SystemSettingsFormData {
  ai_provider_default: string;
  max_tenants_per_plan: {
    free: number;
    pro: number;
    enterprise: number;
  };
  rate_limits: {
    requests_per_minute: number;
    tokens_per_day: number;
  };
  maintenance_mode: boolean;
  registration_enabled: boolean;
}

// UI State Types
export interface TableState {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, any>;
}

export interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}