'use client';

import Layout from '@/components/layout/Layout';
import TenantList from '@/components/tenants/TenantList';

export default function TenantsPage() {
  return (
    <Layout>
      <TenantList />
    </Layout>
  );
}