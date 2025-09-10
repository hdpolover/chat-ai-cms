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
    const response = await apiClient.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    
    const { access_token, user } = response.data;
    
    // Store tokens (no refresh_token from backend yet)
    apiClient.setTokens(access_token, null);
    
    return response.data;
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
    const response = await apiClient.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.AUTH.REFRESH
    );
    
    const { access_token } = response.data;
    apiClient.setTokens(access_token);
    
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>(
      API_CONFIG.ENDPOINTS.AUTH.PROFILE
    );
    return response.data;
  }

  isAuthenticated(): boolean {
    // This should be used carefully to avoid hydration issues
    // Return false during SSR, true check happens on client side
    return false;
  }

  // Client-side only authentication check
  isAuthenticatedClient(): boolean {
    if (typeof window === 'undefined') return false;
    
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('admin_access_token='))
      ?.split('=')[1];
    
    return !!token;
  }
}

export const authService = new AuthService();