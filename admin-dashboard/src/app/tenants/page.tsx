'use client';

import dynamic from 'next/dynamic';
import Layout from '@/components/layout/Layout';
import { CircularProgress, Box } from '@mui/material';

// Dynamically import TenantList to prevent hydration issues
const TenantList = dynamic(() => import('@/components/tenants/TenantList'), {
  loading: () => (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
      <CircularProgress />
    </Box>
  ),
  ssr: false,
});

export default function TenantsPage() {
  return (
    <Layout>
      <TenantList />
    </Layout>
  );
}