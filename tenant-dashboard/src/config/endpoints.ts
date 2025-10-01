// Endpoint builder utilities for better maintainability
import { CONFIG } from './index';

/**
 * URL parameter builder utility
 */
export class URLBuilder {
  private params = new URLSearchParams();

  add(key: string, value: string | number | boolean | undefined): URLBuilder {
    if (value !== undefined && value !== null) {
      this.params.set(key, value.toString());
    }
    return this;
  }

  build(baseUrl: string): string {
    const paramString = this.params.toString();
    return paramString ? `${baseUrl}?${paramString}` : baseUrl;
  }

  static create(): URLBuilder {
    return new URLBuilder();
  }
}

/**
 * Endpoint utilities with parameter handling
 */
export const Endpoints = {
  // Authentication
  Auth: {
    login: () => CONFIG.API.TENANT_AUTH_LOGIN,
    logout: () => CONFIG.API.TENANT_AUTH_LOGOUT,
    me: () => CONFIG.API.TENANT_AUTH_ME,
    refresh: () => CONFIG.API.TENANT_AUTH_REFRESH,
  },

  // Bots
  Bots: {
    list: (params?: { skip?: number; limit?: number; is_active?: boolean }) => {
      const builder = URLBuilder.create();
      if (params) {
        builder
          .add('skip', params.skip)
          .add('limit', params.limit)
          .add('is_active', params.is_active);
      }
      return builder.build(CONFIG.API.TENANT_BOTS);
    },
    create: () => CONFIG.API.TENANT_BOTS,
    getById: (botId: string) => CONFIG.API.TENANT_BOT_BY_ID(botId),
    update: (botId: string) => CONFIG.API.TENANT_BOT_BY_ID(botId),
    delete: (botId: string) => CONFIG.API.TENANT_BOT_BY_ID(botId),
    statistics: () => CONFIG.API.TENANT_BOTS_STATISTICS,
    conversations: (botId: string) => CONFIG.API.TENANT_BOT_CONVERSATIONS(botId),
  },

  // Scopes
  Scopes: {
    list: (botId: string) => CONFIG.API.TENANT_BOT_SCOPES(botId),
    create: (botId: string) => CONFIG.API.TENANT_BOT_SCOPES(botId),
    getById: (botId: string, scopeId: string) => CONFIG.API.TENANT_BOT_SCOPE_BY_ID(botId, scopeId),
    update: (botId: string, scopeId: string) => CONFIG.API.TENANT_BOT_SCOPE_BY_ID(botId, scopeId),
    delete: (botId: string, scopeId: string) => CONFIG.API.TENANT_BOT_SCOPE_BY_ID(botId, scopeId),
  },

  // Conversations
  Conversations: {
    list: (params?: { limit?: number; order_by?: string; order?: string }) => {
      const builder = URLBuilder.create();
      if (params) {
        builder
          .add('limit', params.limit)
          .add('order_by', params.order_by)
          .add('order', params.order);
      }
      return builder.build(CONFIG.API.TENANT_CHATS);
    },
    getById: (chatId: string) => CONFIG.API.TENANT_CHAT_BY_ID(chatId),
    messages: (chatId: string) => CONFIG.API.TENANT_CHAT_MESSAGES(chatId),
    delete: (chatId: string) => CONFIG.API.TENANT_CHAT_BY_ID(chatId),
    // New conversation endpoints
    getConversationById: (conversationId: string) => CONFIG.API.TENANT_CONVERSATION_BY_ID(conversationId),
    getConversationMessages: (conversationId: string) => CONFIG.API.TENANT_CONVERSATION_MESSAGES(conversationId),
    sendMessage: (conversationId: string) => CONFIG.API.TENANT_CONVERSATION_MESSAGES(conversationId),
    startNewConversation: (botId: string) => CONFIG.API.TENANT_BOT_NEW_CONVERSATION(botId),
  },

  // Analytics
  Analytics: {
    dashboard: () => CONFIG.API.TENANT_ANALYTICS_DASHBOARD,
    overview: (params?: { time_range?: string }) => {
      const builder = URLBuilder.create();
      if (params) {
        builder.add('time_range', params.time_range);
      }
      return builder.build(CONFIG.API.TENANT_ANALYTICS);
    },
    usage: (params?: { time_range?: string }) => {
      const builder = URLBuilder.create();
      if (params) {
        builder.add('time_range', params.time_range);
      }
      return builder.build(CONFIG.API.TENANT_ANALYTICS_USAGE);
    },
    botAnalytics: (botId: string, params?: { time_range?: string }) => {
      const builder = URLBuilder.create();
      if (params) {
        builder.add('time_range', params.time_range);
      }
      return builder.build(CONFIG.API.TENANT_ANALYTICS_BOTS(botId));
    },
    trends: (params?: { time_range?: string }) => {
      const builder = URLBuilder.create();
      if (params) {
        builder.add('time_range', params.time_range);
      }
      return builder.build(CONFIG.API.TENANT_ANALYTICS_TRENDS);
    },
    topBots: (params?: { limit?: number }) => {
      const builder = URLBuilder.create();
      if (params) {
        builder.add('limit', params.limit);
      }
      return builder.build(CONFIG.API.TENANT_ANALYTICS_TOP_BOTS);
    },
    export: (params?: { time_range?: string; format?: string }) => {
      const builder = URLBuilder.create();
      if (params) {
        builder
          .add('time_range', params.time_range)
          .add('format', params.format);
      }
      return builder.build(CONFIG.API.TENANT_ANALYTICS_EXPORT);
    },
  },

  // AI Providers
  AIProviders: {
    list: (params?: { is_active?: boolean }) => {
      const builder = URLBuilder.create();
      if (params) {
        builder.add('is_active', params.is_active);
      }
      return builder.build(CONFIG.API.TENANT_AI_PROVIDERS);
    },
    create: () => CONFIG.API.TENANT_AI_PROVIDERS,
    getById: (providerId: string) => CONFIG.API.TENANT_AI_PROVIDER_BY_ID(providerId),
    update: (providerId: string) => CONFIG.API.TENANT_AI_PROVIDER_BY_ID(providerId),
    delete: (providerId: string) => CONFIG.API.TENANT_AI_PROVIDER_BY_ID(providerId),
    globalAvailable: () => CONFIG.API.TENANT_AI_PROVIDERS_GLOBAL_AVAILABLE,
  },

  // Datasets
  Datasets: {
    list: () => CONFIG.API.TENANT_DATASETS,
    create: () => CONFIG.API.TENANT_DATASETS,
    getById: (datasetId: string) => CONFIG.API.TENANT_DATASET_BY_ID(datasetId),
    update: (datasetId: string) => CONFIG.API.TENANT_DATASET_BY_ID(datasetId),
    delete: (datasetId: string) => CONFIG.API.TENANT_DATASET_BY_ID(datasetId),
    stats: (datasetId: string) => CONFIG.API.TENANT_DATASET_STATS(datasetId),
    available: () => CONFIG.API.TENANT_BOTS_DATASETS_AVAILABLE,
    // Bot-dataset relationships
    assignToBot: (botId: string, datasetId: string, priority?: number) => 
      CONFIG.API.TENANT_BOT_DATASET_ASSIGN(botId, datasetId, priority),
    removeFromBot: (botId: string, datasetId: string) => 
      CONFIG.API.TENANT_BOT_DATASET_REMOVE(botId, datasetId),
    getForBot: (botId: string) => CONFIG.API.TENANT_BOT_DATASETS(botId),
  },

  // Documents
  Documents: {
    list: () => CONFIG.API.TENANT_DOCUMENTS,
    getById: (documentId: string) => CONFIG.API.TENANT_DOCUMENT_BY_ID(documentId),
    upload: () => CONFIG.API.TENANT_DOCUMENT_UPLOAD,
    delete: (documentId: string) => CONFIG.API.TENANT_DOCUMENT_BY_ID(documentId),
    status: (documentId: string) => CONFIG.API.TENANT_DOCUMENT_STATUS(documentId),
    download: (documentId: string) => CONFIG.API.TENANT_DOCUMENT_DOWNLOAD(documentId),
    datasets: () => CONFIG.API.TENANT_DOCUMENTS_DATASETS,
    getDatasetById: (datasetId: string) => CONFIG.API.TENANT_DOCUMENTS_DATASET_BY_ID(datasetId),
    deleteDataset: (datasetId: string) => CONFIG.API.TENANT_DOCUMENTS_DATASET_BY_ID(datasetId),
  },

  // Dashboard
  Dashboard: {
    stats: () => CONFIG.API.TENANT_DASHBOARD_STATS,
    recentBots: (params?: { limit?: number }) => {
      const builder = URLBuilder.create();
      if (params) {
        builder.add('limit', params.limit).add('order_by', 'updated_at').add('order', 'desc');
      }
      return builder.build(CONFIG.API.TENANT_BOTS);
    },
    recentConversations: (params?: { limit?: number }) => {
      const builder = URLBuilder.create();
      if (params) {
        builder.add('limit', params.limit).add('order_by', 'created_at').add('order', 'desc');
      }
      return builder.build(CONFIG.API.TENANT_CHATS);
    },
    recentDocuments: (params?: { limit?: number }) => {
      const builder = URLBuilder.create();
      if (params) {
        builder.add('limit', params.limit).add('order_by', 'created_at').add('order', 'desc');
      }
      return builder.build(CONFIG.API.TENANT_DOCUMENTS);
    },
  },

  // Settings
  Settings: {
    get: () => CONFIG.API.TENANT_SETTINGS,
    update: () => CONFIG.API.TENANT_SETTINGS,
  },
} as const;

/**
 * Type-safe endpoint access with parameters
 */
export type EndpointBuilder<T extends Record<string, any> = {}> = (params?: T) => string;

/**
 * Export endpoints for backward compatibility and convenience
 */
export { CONFIG as EndpointConfig };