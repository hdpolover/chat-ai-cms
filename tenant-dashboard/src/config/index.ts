// Configuration constants for the tenant dashboard
export const CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Tenant Dashboard',
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // API Endpoints
  API: {
    TENANT_AUTH: '/v1/tenant/auth',
    TENANT_BOTS: '/v1/tenant/bots',
    TENANT_CHATS: '/v1/tenant/chats',
    TENANT_ANALYTICS: '/v1/tenant/analytics',
    TENANT_SETTINGS: '/v1/tenant/settings',
    TENANT_DOCUMENTS: '/v1/tenant/documents',
    TENANT_DATASETS: '/v1/tenant/datasets',
  },
  
  // Storage Keys
  STORAGE: {
    ACCESS_TOKEN: 'tenant_access_token',
    REFRESH_TOKEN: 'tenant_refresh_token',
    USER_DATA: 'tenant_user_data',
  },
  
  // Routes
  ROUTES: {
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    DATASETS: '/datasets',
    DOCUMENTS: '/documents',
    BOTS: '/bots',
    CHAT: '/chat',
    ANALYTICS: '/analytics',
    SETTINGS: '/settings',
  },
} as const;