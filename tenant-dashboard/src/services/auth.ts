import { apiClient } from './api';
import { CONFIG } from '@/config';
import { LoginRequest, LoginResponse, TenantUser } from '@/types';

export class AuthService {
  // Login
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      `${CONFIG.API.TENANT_AUTH}/login`,
      credentials
    );
    
    if (response.access_token) {
      // Store tokens and user data
      localStorage.setItem(CONFIG.STORAGE.ACCESS_TOKEN, response.access_token);
      localStorage.setItem(CONFIG.STORAGE.USER_DATA, JSON.stringify(response.user));
    }
    
    return response;
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await apiClient.post(`${CONFIG.API.TENANT_AUTH}/logout`);
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem(CONFIG.STORAGE.ACCESS_TOKEN);
      localStorage.removeItem(CONFIG.STORAGE.REFRESH_TOKEN);
      localStorage.removeItem(CONFIG.STORAGE.USER_DATA);
    }
  }

  // Get current user
  async getCurrentUser(): Promise<TenantUser> {
    return apiClient.get<TenantUser>(`${CONFIG.API.TENANT_AUTH}/me`);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem(CONFIG.STORAGE.ACCESS_TOKEN);
    return !!token;
  }

  // Get stored user data
  getStoredUser(): TenantUser | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem(CONFIG.STORAGE.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  }

  // Refresh token
  async refreshToken(): Promise<string> {
    const response = await apiClient.post<{ access_token: string }>(
      `${CONFIG.API.TENANT_AUTH}/refresh`
    );
    
    if (response.access_token) {
      localStorage.setItem(CONFIG.STORAGE.ACCESS_TOKEN, response.access_token);
    }
    
    return response.access_token;
  }
}

export const authService = new AuthService();