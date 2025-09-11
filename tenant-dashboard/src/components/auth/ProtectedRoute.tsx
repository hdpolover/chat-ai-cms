'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { CONFIG } from '@/config';
import { CircularProgress, Box } from '@mui/material';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, mounted } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after component has mounted and auth check is complete
    if (mounted && !loading && !isAuthenticated) {
      router.push(CONFIG.ROUTES.LOGIN);
    }
  }, [isAuthenticated, loading, mounted, router]);

  // Show loading until component is mounted and auth is determined
  if (!mounted || loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}