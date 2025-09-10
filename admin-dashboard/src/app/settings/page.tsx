'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Settings() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to system settings by default
    router.replace('/settings/system');
  }, [router]);

  return null;
}