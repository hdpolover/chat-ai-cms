import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import { APP_CONFIG } from '@/config';

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = Cookies.get(APP_CONFIG.TOKEN_STORAGE_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config;
        
        if (error.response?.status === 401 && !original._retry) {
          original._retry = true;
          
          try {
            const refreshToken = Cookies.get(APP_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
            if (refreshToken) {
              const response = await axios.post('/admin/auth/refresh', {
                refresh_token: refreshToken,
              });
              
              const { access_token } = response.data;
              Cookies.set(APP_CONFIG.TOKEN_STORAGE_KEY, access_token);
              
              // Retry original request with new token
              original.headers.Authorization = `Bearer ${access_token}`;
              return this.client(original);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.clearTokens();
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  public clearTokens() {
    Cookies.remove(APP_CONFIG.TOKEN_STORAGE_KEY);
    Cookies.remove(APP_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
  }

  public setTokens(accessToken: string, refreshToken?: string | null) {
    Cookies.set(APP_CONFIG.TOKEN_STORAGE_KEY, accessToken);
    if (refreshToken) {
      Cookies.set(APP_CONFIG.REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    }
  }

  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config);
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config);
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config);
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }
}

// Create singleton instance
const baseURL = typeof window !== 'undefined' 
  ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  : 'http://localhost:8000';

export const apiClient = new ApiClient(baseURL);
export default apiClient;