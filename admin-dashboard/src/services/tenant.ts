import { apiClient } from './api';
import { API_CONFIG } from '@/config';
import type {
  Tenant,
  TenantFormData,
  TenantUsageStats,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export class TenantService {
  async getTenants(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: boolean;
    plan?: string;
  }): Promise<PaginatedResponse<Tenant>> {
    const response = await apiClient.get<PaginatedResponse<Tenant>>(
      API_CONFIG.ENDPOINTS.TENANTS.LIST,
      { params }
    );
    return response.data;
  }

  async getTenant(id: string): Promise<Tenant> {
    const response = await apiClient.get<Tenant>(
      API_CONFIG.ENDPOINTS.TENANTS.DETAILS(id)
    );
    return response.data;
  }

  async createTenant(data: TenantFormData): Promise<Tenant> {
    const response = await apiClient.post<Tenant>(
      API_CONFIG.ENDPOINTS.TENANTS.CREATE,
      data
    );
    return response.data;
  }

  async updateTenant(id: string, data: Partial<TenantFormData>): Promise<Tenant> {
    const response = await apiClient.put<Tenant>(
      API_CONFIG.ENDPOINTS.TENANTS.UPDATE(id),
      data
    );
    return response.data;
  }

  async deleteTenant(id: string): Promise<void> {
    await apiClient.delete(API_CONFIG.ENDPOINTS.TENANTS.DELETE(id));
  }

  async getTenantStats(id: string): Promise<TenantUsageStats> {
    const response = await apiClient.get<TenantUsageStats>(
      API_CONFIG.ENDPOINTS.TENANTS.STATS(id)
    );
    return response.data;
  }

  async getTenantDetails(id: string): Promise<{
    tenant: Tenant;
    bots: Array<{
      id: string;
      name: string;
      model: string;
      is_active: boolean;
      ai_provider_name: string;
      created_at: string;
    }>;
    ai_providers: Array<{
      id: string;
      provider_name: string;
      is_active: boolean;
      created_at: string;
    }>;
    stats: TenantUsageStats;
  }> {
    const response = await apiClient.get(
      `${API_CONFIG.ENDPOINTS.TENANTS.DETAILS(id)}/full`
    );
    return response.data;
  }

  async toggleTenantStatus(id: string, is_active: boolean): Promise<Tenant> {
    const response = await apiClient.patch<Tenant>(
      API_CONFIG.ENDPOINTS.TENANTS.UPDATE(id),
      { is_active }
    );
    return response.data;
  }
}

export const tenantService = new TenantService();