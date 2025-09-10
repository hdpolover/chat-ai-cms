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
    const response = await apiClient.get<SystemSettings>(
      API_CONFIG.ENDPOINTS.SETTINGS.SYSTEM
    );
    
    // The API already returns the data in the correct format
    return response.data;
  }

  async updateSystemSettings(data: SystemSettingsFormData): Promise<SystemSettings> {
    const response = await apiClient.put<SystemSettings>(
      API_CONFIG.ENDPOINTS.SETTINGS.SYSTEM,
      data
    );
    return response.data;
  }

  async getAIProviders(): Promise<AIProvider[]> {
    const response = await apiClient.get<AIProvider[]>(
      API_CONFIG.ENDPOINTS.SETTINGS.AI_PROVIDERS
    );
    
    // The API returns the data directly, not wrapped in a response object
    return response.data;
  }

  async createAIProvider(data: Partial<AIProvider>): Promise<AIProvider> {
    const response = await apiClient.post<AIProvider>(
      API_CONFIG.ENDPOINTS.SETTINGS.AI_PROVIDERS,
      data
    );
    return response.data;
  }

  async updateAIProvider(id: string, data: Partial<AIProvider>): Promise<AIProvider> {
    const response = await apiClient.put<AIProvider>(
      `${API_CONFIG.ENDPOINTS.SETTINGS.AI_PROVIDERS}/${id}`,
      data
    );
    return response.data;
  }

  async deleteAIProvider(id: string): Promise<void> {
    await apiClient.delete(`${API_CONFIG.ENDPOINTS.SETTINGS.AI_PROVIDERS}/${id}`);
  }
}

export const dashboardService = new DashboardService();
export const settingsService = new SettingsService();