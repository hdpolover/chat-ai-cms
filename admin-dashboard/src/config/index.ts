// API Configuration
export const API_CONFIG = {
  BASE_URL: typeof window !== 'undefined' && window.location ? 
    (window.location.protocol === 'https:' ? 'https://api.yourdomain.com' : 'http://localhost:8000') :
    'http://localhost:8000',
  TIMEOUT: 30000,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/admin/auth/login',
      LOGOUT: '/admin/auth/logout',
      REFRESH: '/admin/auth/refresh',
      PROFILE: '/admin/auth/me',
    },
    TENANTS: {
      LIST: '/admin/tenants',
      CREATE: '/admin/tenants',
      UPDATE: (id: string) => `/admin/tenants/${id}`,
      DELETE: (id: string) => `/admin/tenants/${id}`,
      DETAILS: (id: string) => `/admin/tenants/${id}`,
      STATS: (id: string) => `/admin/tenants/${id}/stats`,
    },
    SETTINGS: {
      SYSTEM: '/admin/settings/system',
      AI_PROVIDERS: '/admin/settings/ai-providers',
      USERS: '/admin/settings/users',
    },
    DASHBOARD: {
      STATS: '/admin/dashboard/stats',
      METRICS: '/admin/dashboard/metrics',
    },
  },
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'Chat AI CMS Admin',
  VERSION: '1.0.0',
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
  },
  TOKEN_STORAGE_KEY: 'admin_access_token',
  REFRESH_TOKEN_STORAGE_KEY: 'admin_refresh_token',
};