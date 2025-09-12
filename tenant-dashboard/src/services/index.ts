// Export all services
export { apiClient } from './api';
export { AuthService } from './auth';
export { BotService } from './bot';
export { DocumentService } from './document';
export { AnalyticsService } from './analytics';
export { DatasetService } from './dataset';
export { conversationService } from './conversation';

// Re-export types from services
export type {
  Document,
  Dataset,
  UploadDocumentRequest,
} from './document';

export type {
  Dataset as DatasetType,
  CreateDatasetRequest,
  UpdateDatasetRequest,
} from './dataset';

export type {
  DashboardStats,
  BotPerformance,
  ConversationMetrics,
  UsageAnalytics,
} from './analytics';

export type {
  ConversationWithDetails,
  Message,
  ConversationFilter,
} from './conversation';