'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { CONFIG } from '@/config';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoSSR from '@/components/NoSSR';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedContent({ children }: ProtectedRouteProps) {
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
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  return (
    <NoSSR fallback={<LoadingSpinner message="Loading..." />}>
      <div suppressHydrationWarning>
        <ProtectedContent>{children}</ProtectedContent>
      </div>
    </NoSSR>
  );
}