'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { CONFIG } from '@/config';
import SSRSafeLoading from '@/components/common/SSRSafeLoading';
import NoSSR from '@/components/NoSSR';

function HomeContent() {
  const { isAuthenticated, loading, mounted } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (mounted && !loading) {
      if (isAuthenticated) {
        router.push(CONFIG.ROUTES.DASHBOARD);
      } else {
        router.push(CONFIG.ROUTES.LOGIN);
      }
    }
  }, [isAuthenticated, loading, router, mounted]);

  if (!mounted || loading) {
    return <SSRSafeLoading />;
  }

  return <SSRSafeLoading />;
}

export default function Home() {
  return (
    <NoSSR fallback={<SSRSafeLoading />}>
      <HomeContent />
    </NoSSR>
  );
}
