import { apiClient } from './api';
import { 
  TenantAIProvider, 
  GlobalAIProvider, 
  CreateTenantAIProviderRequest, 
  UpdateTenantAIProviderRequest 
} from '@/types';

export class AIProviderService {
  // Get all tenant AI providers
  static async getTenantAIProviders(params?: {
    is_active?: boolean;
  }): Promise<TenantAIProvider[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.is_active !== undefined) searchParams.set('is_active', params.is_active.toString());
      
      const url = `/v1/tenant/ai-providers${searchParams.toString() ? `?${searchParams}` : ''}`;
      const response = await apiClient.get<TenantAIProvider[]>(url);
      return response || [];
    } catch (error) {
      console.error('Failed to fetch tenant AI providers:', error);
      throw error;
    }
  }

  // Get a specific tenant AI provider by ID
  static async getTenantAIProvider(providerId: string): Promise<TenantAIProvider> {
    try {
      const response = await apiClient.get<TenantAIProvider>(`/v1/tenant/ai-providers/${providerId}`);
      if (!response) {
        throw new Error('AI provider not found');
      }
      return response;
    } catch (error) {
      console.error(`Failed to fetch AI provider ${providerId}:`, error);
      throw error;
    }
  }

  // Create a new tenant AI provider
  static async createTenantAIProvider(data: CreateTenantAIProviderRequest): Promise<TenantAIProvider> {
    try {
      const response = await apiClient.post<TenantAIProvider>('/v1/tenant/ai-providers', data);
      if (!response) {
        throw new Error('Failed to create AI provider');
      }
      return response;
    } catch (error) {
      console.error('Failed to create AI provider:', error);
      throw error;
    }
  }

  // Update an existing tenant AI provider
  static async updateTenantAIProvider(providerId: string, updates: UpdateTenantAIProviderRequest): Promise<TenantAIProvider> {
    try {
      const response = await apiClient.put<TenantAIProvider>(`/v1/tenant/ai-providers/${providerId}`, updates);
      if (!response) {
        throw new Error('Failed to update AI provider');
      }
      return response;
    } catch (error) {
      console.error(`Failed to update AI provider ${providerId}:`, error);
      throw error;
    }
  }

  // Delete a tenant AI provider
  static async deleteTenantAIProvider(providerId: string): Promise<void> {
    try {
      await apiClient.delete(`/v1/tenant/ai-providers/${providerId}`);
    } catch (error) {
      console.error(`Failed to delete AI provider ${providerId}:`, error);
      throw error;
    }
  }

  // Toggle AI provider active status
  static async toggleAIProviderStatus(providerId: string, isActive: boolean): Promise<TenantAIProvider> {
    return this.updateTenantAIProvider(providerId, { is_active: isActive });
  }

  // Get available global providers
  static async getAvailableGlobalProviders(): Promise<GlobalAIProvider[]> {
    try {
      const response = await apiClient.get<GlobalAIProvider[]>('/v1/tenant/ai-providers/global/available');
      return response || [];
    } catch (error) {
      console.error('Failed to fetch available global providers:', error);
      throw error;
    }
  }
}