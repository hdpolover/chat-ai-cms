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
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Tenant>>>(
      API_CONFIG.ENDPOINTS.TENANTS.LIST,
      { params }
    );
    return response.data.data;
  }

  async getTenant(id: string): Promise<Tenant> {
    const response = await apiClient.get<ApiResponse<Tenant>>(
      API_CONFIG.ENDPOINTS.TENANTS.DETAILS(id)
    );
    return response.data.data;
  }

  async createTenant(data: TenantFormData): Promise<Tenant> {
    const response = await apiClient.post<ApiResponse<Tenant>>(
      API_CONFIG.ENDPOINTS.TENANTS.CREATE,
      data
    );
    return response.data.data;
  }

  async updateTenant(id: string, data: Partial<TenantFormData>): Promise<Tenant> {
    const response = await apiClient.put<ApiResponse<Tenant>>(
      API_CONFIG.ENDPOINTS.TENANTS.UPDATE(id),
      data
    );
    return response.data.data;
  }

  async deleteTenant(id: string): Promise<void> {
    await apiClient.delete(API_CONFIG.ENDPOINTS.TENANTS.DELETE(id));
  }

  async getTenantStats(id: string): Promise<TenantUsageStats> {
    const response = await apiClient.get<ApiResponse<TenantUsageStats>>(
      API_CONFIG.ENDPOINTS.TENANTS.STATS(id)
    );
    return response.data.data;
  }

  async toggleTenantStatus(id: string, is_active: boolean): Promise<Tenant> {
    const response = await apiClient.patch<ApiResponse<Tenant>>(
      API_CONFIG.ENDPOINTS.TENANTS.UPDATE(id),
      { is_active }
    );
    return response.data.data;
  }
}

export const tenantService = new TenantService();