'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { CONFIG } from '@/config';
import { CircularProgress, Box } from '@mui/material';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push(CONFIG.ROUTES.DASHBOARD);
      } else {
        router.push(CONFIG.ROUTES.LOGIN);
      }
    }
  }, [isAuthenticated, loading, router]);

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
