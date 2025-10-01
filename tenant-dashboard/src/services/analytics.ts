import { apiClient } from './api';
import { CONFIG } from '@/config';
import { TenantAnalytics, ApiResponse } from '@/types';

export interface DashboardStats {
  totalBots: number;
  activeBots: number;
  totalConversations: number;
  totalMessages: number;
  totalDocuments: number;
  totalApiKeys: number;
  averageResponseTime: number;
  monthlyGrowth: {
    conversations: number;
    messages: number;
    documents: number;
  };
}

export interface BotPerformance {
  botId: string;
  botName: string;
  conversations: number;
  messages: number;
  successRate: number;
  averageRating: number;
  averageResponseTime: number;
  lastUsed: string;
}

export interface ConversationMetrics {
  date: string;
  conversations: number;
  messages: number;
  uniqueUsers: number;
}

export interface UsageAnalytics {
  timeRange: 'day' | 'week' | 'month' | 'year';
  metrics: ConversationMetrics[];
  botPerformance: BotPerformance[];
  topQueries: Array<{
    query: string;
    count: number;
  }>;
  responseTimeDistribution: Array<{
    range: string;
    count: number;
  }>;
}

export class AnalyticsService {
  // Get dashboard overview stats
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<ApiResponse<DashboardStats>>(CONFIG.API.TENANT_ANALYTICS_DASHBOARD);
      return response.data || {
        totalBots: 0,
        activeBots: 0,
        totalConversations: 0,
        totalMessages: 0,
        totalDocuments: 0,
        totalApiKeys: 0,
        averageResponseTime: 0,
        monthlyGrowth: {
          conversations: 0,
          messages: 0,
          documents: 0,
        },
      };
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  }

  // Get detailed analytics
  static async getAnalytics(timeRange: 'day' | 'week' | 'month' | 'year' = 'week'): Promise<TenantAnalytics> {
    try {
      const response = await apiClient.get<ApiResponse<TenantAnalytics>>(CONFIG.API.TENANT_ANALYTICS, {
        time_range: timeRange,
      });
      return response.data || {
        total_bots: 0,
        active_bots: 0,
        total_chats: 0,
        total_messages: 0,
        monthly_messages: 0,
        avg_response_time: 0,
        usage_by_bot: [],
        daily_usage: [],
      };
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      throw error;
    }
  }

  // Get usage analytics with detailed metrics
  static async getUsageAnalytics(timeRange: 'day' | 'week' | 'month' | 'year' = 'week'): Promise<UsageAnalytics> {
    try {
      const response = await apiClient.get<ApiResponse<UsageAnalytics>>(CONFIG.API.TENANT_ANALYTICS_USAGE, {
        time_range: timeRange,
      });
      return response.data || {
        timeRange,
        metrics: [],
        botPerformance: [],
        topQueries: [],
        responseTimeDistribution: [],
      };
    } catch (error) {
      console.error('Failed to fetch usage analytics:', error);
      throw error;
    }
  }

  // Get bot-specific analytics
  static async getBotAnalytics(botId: string, timeRange: 'day' | 'week' | 'month' | 'year' = 'week'): Promise<BotPerformance & { dailyMetrics: ConversationMetrics[] }> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(CONFIG.API.TENANT_ANALYTICS_BOTS(botId), {
        time_range: timeRange,
      });
      return response.data || {
        botId,
        botName: '',
        conversations: 0,
        messages: 0,
        successRate: 0,
        averageRating: 0,
        averageResponseTime: 0,
        lastUsed: '',
        dailyMetrics: [],
      };
    } catch (error) {
      console.error(`Failed to fetch bot analytics for ${botId}:`, error);
      throw error;
    }
  }

  // Get conversation trends
  static async getConversationTrends(timeRange: 'day' | 'week' | 'month' | 'year' = 'week'): Promise<ConversationMetrics[]> {
    try {
      const response = await apiClient.get<ApiResponse<ConversationMetrics[]>>(CONFIG.API.TENANT_ANALYTICS_TRENDS, {
        time_range: timeRange,
      });
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch conversation trends:', error);
      throw error;
    }
  }

  // Get top performing bots
  static async getTopBots(limit: number = 10): Promise<BotPerformance[]> {
    try {
      const response = await apiClient.get<ApiResponse<BotPerformance[]>>(CONFIG.API.TENANT_ANALYTICS_TOP_BOTS, {
        limit,
      });
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch top bots:', error);
      throw error;
    }
  }

  // Export analytics data
  static async exportAnalytics(
    timeRange: 'day' | 'week' | 'month' | 'year' = 'week',
    format: 'csv' | 'json' = 'csv'
  ): Promise<Blob> {
    try {
      const response = await apiClient.get(CONFIG.API.TENANT_ANALYTICS_EXPORT, {
        time_range: timeRange,
        format,
        responseType: 'blob',
      });
      return response as Blob;
    } catch (error) {
      console.error('Failed to export analytics:', error);
      throw error;
    }
  }
}