import { apiClient } from './api';
import { CONFIG } from '@/config';

export interface ConversationWithDetails {
  id: string;
  bot_id: string;
  title?: string;
  session_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  messages_count: number;
  bot_name?: string;
  last_message?: string;
  last_activity?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationFilter {
  limit?: number;
  order_by?: 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
  search?: string;
  bot_id?: string;
  is_active?: boolean;
}

export class ConversationService {
  async getConversations(filter: ConversationFilter = {}): Promise<ConversationWithDetails[]> {
    const params = new URLSearchParams();
    
    if (filter.limit) params.append('limit', filter.limit.toString());
    if (filter.order_by) params.append('order_by', filter.order_by);
    if (filter.order) params.append('order', filter.order);
    
    const conversations = await apiClient.get<any[]>(`${CONFIG.API.TENANT_CHATS}?${params.toString()}`);
    
    // Get bot information for each conversation
    const botsMap = await this.getBotsMap();
    
    // Get last message for each conversation
    const conversationsWithDetails: ConversationWithDetails[] = await Promise.all(
      conversations.map(async (conv) => {
        const botName = botsMap[conv.bot_id]?.name || 'Unknown Bot';
        
        // Get last message (we'll implement this if the API supports it)
        const lastMessage = await this.getLastMessage(conv.id);
        
        return {
          ...conv,
          bot_name: botName,
          last_message: lastMessage?.content || 'No messages yet',
          last_activity: this.formatRelativeTime(conv.updated_at),
        };
      })
    );
    
    return conversationsWithDetails;
  }

  async getConversationById(id: string): Promise<ConversationWithDetails | null> {
    try {
      const conversation = await apiClient.get<any>(CONFIG.API.TENANT_CHAT_BY_ID(id));
      return conversation;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    try {
      // This endpoint might need to be created in the backend
      return await apiClient.get<Message[]>(CONFIG.API.TENANT_CHAT_MESSAGES(conversationId));
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      return [];
    }
  }

  async deleteConversation(id: string): Promise<boolean> {
    try {
      await apiClient.delete(CONFIG.API.TENANT_CHAT_BY_ID(id));
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }

  private async getBotsMap(): Promise<Record<string, { name: string; model: string }>> {
    try {
      const bots = await apiClient.get<any[]>(`${CONFIG.API.TENANT_BOTS}?limit=1000`);
      const botsMap: Record<string, { name: string; model: string }> = {};
      
      bots.forEach(bot => {
        botsMap[bot.id] = {
          name: bot.name,
          model: bot.model,
        };
      });
      
      return botsMap;
    } catch (error) {
      console.error('Error fetching bots:', error);
      return {};
    }
  }

  private async getLastMessage(conversationId: string): Promise<Message | null> {
    try {
      // For now, we'll return null since we don't have this endpoint yet
      // In a real implementation, you'd call: /v1/tenant/chats/${conversationId}/messages?limit=1&order=desc
      return null;
    } catch (error) {
      console.error('Error fetching last message:', error);
      return null;
    }
  }

  private formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

export const conversationService = new ConversationService();