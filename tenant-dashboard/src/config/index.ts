// Configuration constants for the tenant dashboard
export const CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Tenant Dashboard',
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // API Endpoints - Centralized endpoint management
  API: {
    // Authentication endpoints
    TENANT_AUTH: '/v1/tenant/auth',
    TENANT_AUTH_LOGIN: '/v1/tenant/auth/login',
    TENANT_AUTH_LOGOUT: '/v1/tenant/auth/logout',
    TENANT_AUTH_ME: '/v1/tenant/auth/me',
    TENANT_AUTH_REFRESH: '/v1/tenant/auth/refresh',
    
    // Bot management endpoints
    TENANT_BOTS: '/v1/tenant/bots',
    TENANT_BOTS_STATISTICS: '/v1/tenant/bots/statistics/overview',
    TENANT_BOTS_DATASETS_AVAILABLE: '/v1/tenant/bots/datasets/available',
    
    // Bot-specific endpoints (use with template string interpolation)
    TENANT_BOT_BY_ID: (botId: string) => `/v1/tenant/bots/${botId}`,
    TENANT_BOT_CONVERSATIONS: (botId: string) => `/v1/tenant/bots/${botId}/conversations`,
    TENANT_BOT_DATASETS: (botId: string) => `/v1/tenant/bots/${botId}/datasets`,
    TENANT_BOT_DATASET_ASSIGN: (botId: string, datasetId: string, priority?: number) => 
      `/v1/tenant/bots/${botId}/datasets/${datasetId}${priority ? `?priority=${priority}` : ''}`,
    TENANT_BOT_DATASET_REMOVE: (botId: string, datasetId: string) => 
      `/v1/tenant/bots/${botId}/datasets/${datasetId}`,
    
    // Scope management endpoints
    TENANT_BOT_SCOPES: (botId: string) => `/v1/tenant/bots/${botId}/scopes`,
    TENANT_BOT_SCOPE_BY_ID: (botId: string, scopeId: string) => `/v1/tenant/bots/${botId}/scopes/${scopeId}`,
    
    // Conversation endpoints
    TENANT_CHATS: '/v1/tenant/chats',
    TENANT_CHAT_BY_ID: (chatId: string) => `/v1/tenant/chats/${chatId}`,
    TENANT_CHAT_MESSAGES: (chatId: string) => `/v1/tenant/chats/${chatId}/messages`,
    TENANT_CONVERSATION_BY_ID: (conversationId: string) => `/v1/tenant/conversations/${conversationId}`,
    TENANT_CONVERSATION_MESSAGES: (conversationId: string) => `/v1/tenant/conversations/${conversationId}/messages`,
    TENANT_BOT_NEW_CONVERSATION: (botId: string) => `/v1/tenant/bots/${botId}/conversations`,
    
    // Analytics endpoints
    TENANT_ANALYTICS: '/v1/tenant/analytics',
    TENANT_ANALYTICS_DASHBOARD: '/v1/tenant/analytics/dashboard',
    TENANT_ANALYTICS_USAGE: '/v1/tenant/analytics/usage',
    TENANT_ANALYTICS_BOTS: (botId: string) => `/v1/tenant/analytics/bots/${botId}`,
    TENANT_ANALYTICS_TRENDS: '/v1/tenant/analytics/trends',
    TENANT_ANALYTICS_TOP_BOTS: '/v1/tenant/analytics/top-bots',
    TENANT_ANALYTICS_EXPORT: '/v1/tenant/analytics/export',
    
    // AI Provider endpoints
    TENANT_AI_PROVIDERS: '/v1/tenant/ai-providers',
    TENANT_AI_PROVIDER_BY_ID: (providerId: string) => `/v1/tenant/ai-providers/${providerId}`,
    TENANT_AI_PROVIDERS_GLOBAL_AVAILABLE: '/v1/tenant/ai-providers/global/available',
    
    // Dataset endpoints
    TENANT_DATASETS: '/v1/tenant/datasets',
    TENANT_DATASET_BY_ID: (datasetId: string) => `/v1/tenant/datasets/${datasetId}`,
    TENANT_DATASET_STATS: (datasetId: string) => `/v1/tenant/datasets/${datasetId}/stats`,
    
    // Document endpoints
    TENANT_DOCUMENTS: '/v1/tenant/documents',
    TENANT_DOCUMENT_BY_ID: (documentId: string) => `/v1/tenant/documents/${documentId}`,
    TENANT_DOCUMENT_UPLOAD: '/v1/tenant/documents/upload',
    TENANT_DOCUMENT_STATUS: (documentId: string) => `/v1/tenant/documents/${documentId}/status`,
    TENANT_DOCUMENT_DOWNLOAD: (documentId: string) => `/v1/tenant/documents/${documentId}/download`,
    TENANT_DOCUMENTS_DATASETS: '/v1/tenant/documents/datasets',
    TENANT_DOCUMENTS_DATASET_BY_ID: (datasetId: string) => `/v1/tenant/documents/datasets/${datasetId}`,
    
    // Dashboard endpoints
    TENANT_DASHBOARD_STATS: '/v1/tenant/dashboard/stats',
    
    // Settings endpoints
    TENANT_SETTINGS: '/v1/tenant/settings',
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

// Re-export endpoint utilities for convenience
export { Endpoints, URLBuilder, EndpointConfig } from './endpoints';