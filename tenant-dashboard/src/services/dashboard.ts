import { apiClient } from './api';
import { CONFIG } from '@/config';

export interface TenantStats {
  totalBots: number;
  totalDocuments: number;
  totalConversations: number;
  totalApiKeys: number;
  activeConversations: number;
  documentsProcessed: number;
}

export interface Bot {
  id: string;
  name: string;
  description?: string;
  model: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  conversations_count?: number;
  last_used_at?: string;
}

export interface Conversation {
  id: string;
  bot_id: string;
  title?: string;
  session_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  messages_count?: number;
}

export interface Document {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  file_size?: number;
  content_type?: string;
}

export class TenantDashboardService {
  async getStats(): Promise<TenantStats> {
    return apiClient.get<TenantStats>('/v1/tenant/dashboard/stats');
  }

  async getRecentBots(limit = 5): Promise<Bot[]> {
    return apiClient.get<Bot[]>(`${CONFIG.API.TENANT_BOTS}?limit=${limit}&order_by=updated_at&order=desc`);
  }

  async getRecentConversations(limit = 10): Promise<Conversation[]> {
    return apiClient.get<Conversation[]>(`${CONFIG.API.TENANT_CHATS}?limit=${limit}&order_by=created_at&order=desc`);
  }

  async getRecentDocuments(limit = 5): Promise<Document[]> {
    return apiClient.get<Document[]>(`${CONFIG.API.TENANT_DOCUMENTS}?limit=${limit}&order_by=created_at&order=desc`);
  }
}

export const tenantDashboardService = new TenantDashboardService();