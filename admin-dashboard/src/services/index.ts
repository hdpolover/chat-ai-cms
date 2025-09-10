import { apiClient } from './api';
import { API_CONFIG } from '@/config';
import type {
  DashboardStats,
  SystemSettings,
  SystemSettingsFormData,
  AIProvider,
  ApiResponse,
} from '@/types';

export class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get<ApiResponse<DashboardStats>>(
      API_CONFIG.ENDPOINTS.DASHBOARD.STATS
    );
    return response.data.data;
  }

  async getMetrics(period: 'day' | 'week' | 'month' = 'day'): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(
      API_CONFIG.ENDPOINTS.DASHBOARD.METRICS,
      { params: { period } }
    );
    return response.data.data;
  }
}

export class SettingsService {
  async getSystemSettings(): Promise<SystemSettings> {
    const response = await apiClient.get<ApiResponse<SystemSettings>>(
      API_CONFIG.ENDPOINTS.SETTINGS.SYSTEM
    );
    return response.data.data;
  }

  async updateSystemSettings(data: SystemSettingsFormData): Promise<SystemSettings> {
    const response = await apiClient.put<ApiResponse<SystemSettings>>(
      API_CONFIG.ENDPOINTS.SETTINGS.SYSTEM,
      data
    );
    return response.data.data;
  }

  async getAIProviders(): Promise<AIProvider[]> {
    const response = await apiClient.get<ApiResponse<AIProvider[]>>(
      API_CONFIG.ENDPOINTS.SETTINGS.AI_PROVIDERS
    );
    return response.data.data;
  }

  async createAIProvider(data: Partial<AIProvider>): Promise<AIProvider> {
    const response = await apiClient.post<ApiResponse<AIProvider>>(
      API_CONFIG.ENDPOINTS.SETTINGS.AI_PROVIDERS,
      data
    );
    return response.data.data;
  }

  async updateAIProvider(id: string, data: Partial<AIProvider>): Promise<AIProvider> {
    const response = await apiClient.put<ApiResponse<AIProvider>>(
      `${API_CONFIG.ENDPOINTS.SETTINGS.AI_PROVIDERS}/${id}`,
      data
    );
    return response.data.data;
  }

  async deleteAIProvider(id: string): Promise<void> {
    await apiClient.delete(`${API_CONFIG.ENDPOINTS.SETTINGS.AI_PROVIDERS}/${id}`);
  }
}

export const dashboardService = new DashboardService();
export const settingsService = new SettingsService();