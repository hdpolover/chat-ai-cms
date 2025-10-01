'use client';

import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/hooks/useAuth';
import NoSSR from '@/components/NoSSR';
import HydrationFixProvider from './HydrationFixProvider';
import theme from '@/app/theme';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  // Create QueryClient instance per component to avoid sharing state between requests
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
        // Disable queries during SSR
        enabled: typeof window !== 'undefined',
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <HydrationFixProvider>
          <AuthProvider>
            {children}
            <NoSSR>
              <ReactQueryDevtools initialIsOpen={false} />
            </NoSSR>
          </AuthProvider>
        </HydrationFixProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}