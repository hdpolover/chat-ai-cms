'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { TenantUser } from '@/types';
import { authService } from '@/services/auth';
import { useRouter } from 'next/navigation';
import { CONFIG } from '@/config';

interface AuthContextType {
  user: TenantUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  mounted: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TenantUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Set mounted to true after component mounts (client-side only)
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run auth initialization after component has mounted
    if (!mounted) return;

    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
          } else {
            // Verify with backend
            try {
              const currentUser = await authService.getCurrentUser();
              setUser(currentUser);
            } catch (error) {
              // If verification fails, clear invalid tokens
              console.error('User verification failed:', error);
              await authService.logout();
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid tokens
        await authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [mounted]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      setUser(response.tenant);
      router.push(CONFIG.ROUTES.DASHBOARD);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      router.push(CONFIG.ROUTES.LOGIN);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    mounted,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}