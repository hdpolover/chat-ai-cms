import { apiClient } from './api';
import { API_CONFIG } from '@/config';
import type { 
  LoginRequest, 
  AuthResponse, 
  User, 
  ApiResponse 
} from '@/types';

export class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    
    const { access_token, refresh_token, user } = response.data.data;
    
    // Store tokens
    apiClient.setTokens(access_token, refresh_token);
    
    return response.data.data;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    } finally {
      // Clear tokens regardless of API response
      apiClient.clearTokens();
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_CONFIG.ENDPOINTS.AUTH.REFRESH
    );
    
    const { access_token, refresh_token } = response.data.data;
    apiClient.setTokens(access_token, refresh_token);
    
    return response.data.data;
  }

  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      API_CONFIG.ENDPOINTS.AUTH.PROFILE
    );
    return response.data.data;
  }

  isAuthenticated(): boolean {
    // Check if we have a token in cookies
    if (typeof window === 'undefined') return false;
    
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('admin_access_token='))
      ?.split('=')[1];
    
    return !!token;
  }
}

export const authService = new AuthService();