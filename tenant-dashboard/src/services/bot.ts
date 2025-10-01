import { apiClient } from './api';
import { CONFIG } from '@/config';
import {
  Bot,
  CreateBotRequest,
  UpdateBotRequest,
  TenantAIProvider,
  ChatSession,
} from '@/types';

export class BotService {
  // Get all bots for the tenant
  static async getBots(params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
  }): Promise<Bot[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.skip !== undefined) searchParams.set('skip', params.skip.toString());
      if (params?.limit !== undefined) searchParams.set('limit', params.limit.toString());
      if (params?.is_active !== undefined) searchParams.set('is_active', params.is_active.toString());
      
      const url = `${CONFIG.API.TENANT_BOTS}${searchParams.toString() ? `?${searchParams}` : ''}`;
      const response = await apiClient.get<Bot[]>(url);
      return response || [];
    } catch (error) {
      console.error('Failed to fetch bots:', error);
      throw error;
    }
  }

  // Get a specific bot by ID
  static async getBot(botId: string): Promise<Bot> {
    try {
      const response = await apiClient.get<Bot>(`${CONFIG.API.TENANT_BOTS}/${botId}`);
      if (!response) {
        throw new Error('Bot not found');
      }
      return response;
    } catch (error) {
      console.error(`Failed to fetch bot ${botId}:`, error);
      throw error;
    }
  }

  // Create a new bot
  static async createBot(botData: CreateBotRequest): Promise<Bot> {
    try {
      const response = await apiClient.post<Bot>(CONFIG.API.TENANT_BOTS, botData);
      if (!response) {
        throw new Error('Failed to create bot');
      }
      return response;
    } catch (error) {
      console.error('Failed to create bot:', error);
      throw error;
    }
  }

  // Update an existing bot
  static async updateBot(botId: string, updates: UpdateBotRequest): Promise<Bot> {
    try {
      const response = await apiClient.put<Bot>(`${CONFIG.API.TENANT_BOTS}/${botId}`, updates);
      if (!response) {
        throw new Error('Failed to update bot');
      }
      return response;
    } catch (error) {
      console.error(`Failed to update bot ${botId}:`, error);
      throw error;
    }
  }

  // Delete a bot
  static async deleteBot(botId: string): Promise<void> {
    try {
      await apiClient.delete(`${CONFIG.API.TENANT_BOTS}/${botId}`);
    } catch (error) {
      console.error(`Failed to delete bot ${botId}:`, error);
      throw error;
    }
  }

  // Toggle bot active status
  static async toggleBotStatus(botId: string, isActive: boolean): Promise<Bot> {
    return this.updateBot(botId, { is_active: isActive });
  }

  // Get bot statistics
  static async getBotStatistics(): Promise<{
    total_bots: number;
    active_bots: number;
    total_conversations: number;
    top_bots: Array<{
      id: string;
      name: string;
      conversation_count: number;
    }>;
  }> {
    try {
      const response = await apiClient.get<{
        total_bots: number;
        active_bots: number;
        total_conversations: number;
        top_bots: Array<{
          id: string;
          name: string;
          conversation_count: number;
        }>;
      }>('/v1/tenant/bots/statistics/overview');
      
      return response || {
        total_bots: 0,
        active_bots: 0,
        total_conversations: 0,
        top_bots: []
      };
    } catch (error) {
      console.error('Failed to fetch bot statistics:', error);
      throw error;
    }
  }

  // Get tenant AI providers
  static async getTenantAIProviders(): Promise<TenantAIProvider[]> {
    try {
      const response = await apiClient.get<TenantAIProvider[]>('/v1/tenant/ai-providers');
      return response || [];
    } catch (error) {
      console.error('Failed to fetch tenant AI providers:', error);
      throw error;
    }
  }

    // Get bot scopes
  static async getBotScopes(botId: string): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    config?: Record<string, any>;
    is_active: boolean;
  }>> {
    try {
      const response = await apiClient.get<Array<{
        id: string;
        name: string;
        description?: string;
        guardrails?: Record<string, any>;
        is_active: boolean;
      }>>(`/v1/tenant/bots/${botId}/scopes`);
      
      // Transform guardrails to config for compatibility
      return response.map(scope => ({
        ...scope,
        config: scope.guardrails || {}
      }));
    } catch (error) {
      console.error('Failed to get bot scopes:', error);
      return [];
    }
  }

  /**
   * Get conversations for a specific bot
   */
  static async getBotConversations(botId: string): Promise<ChatSession[]> {
    try {
      const response = await apiClient.get<any[]>(`/v1/tenant/bots/${botId}/conversations`);
      return response.map(conv => ({
        id: conv.id,
        bot_id: conv.bot_id,
        bot_name: conv.bot_name,
        user_id: conv.user_id,
        session_id: conv.session_id || conv.id,
        title: conv.title,
        message_count: conv.message_count || 0,
        created_at: conv.created_at,
        updated_at: conv.updated_at
      }));
    } catch (error) {
      console.error('Failed to fetch bot conversations:', error);
      return [];
    }
  }

  // Get available global AI providers (public ones that can be configured)
  static async getAvailableGlobalProviders(): Promise<Array<{
    id: string;
    name: string;
    provider_type: string;
    config?: Record<string, any>;
    is_configured: boolean;
  }>> {
    try {
      const response = await apiClient.get<Array<{
        id: string;
        name: string;
        provider_type: string;
        config?: Record<string, any>;
        is_configured: boolean;
      }>>('/v1/tenant/ai-providers/global/available');
      return response || [];
    } catch (error) {
      console.error('Failed to fetch available global providers:', error);
      throw error;
    }
  }
}