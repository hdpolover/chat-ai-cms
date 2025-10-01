'use client';

import { useRouter } from 'next/navigation';
import {
  Box,
  Alert,
} from '@mui/material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TenantLayout from '@/components/layout/TenantLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ErrorNotification, SuccessNotification } from '@/components/common/Notification';
import { BotsPageHeader, BotsList } from '@/components/bots';
import { useBotsData } from '@/hooks/useBotsData';

export default function BotsPage() {
  const router = useRouter();
  const {
    bots,
    aiProviders,
    loading,
    error,
    success,
    setError,
    setSuccess,
  } = useBotsData();

  const handleCreateBot = () => {
    router.push('/bots/create');
  };

  const handleEditBot = (botId: string) => {
    router.push(`/bots/${botId}/edit`);
  };

  const handleViewBot = (botId: string) => {
    router.push(`/bots/${botId}`);
  };

  const handleToggleStatus = async (botId: string, isActive: boolean) => {
    // TODO: Implement bot status toggle
    console.log('Toggle bot status:', botId, isActive);
  };

  const handleDeleteBot = async (botId: string) => {
    // TODO: Implement bot deletion
    console.log('Delete bot:', botId);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <LoadingSpinner message="Loading bots..." />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <TenantLayout>
        <BotsPageHeader 
          onCreateBot={handleCreateBot}
          botCount={bots.length}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <BotsList
          bots={bots}
          aiProviders={aiProviders}
          onEdit={handleEditBot}
          onView={handleViewBot}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteBot}
        />

        <SuccessNotification 
          success={success}
          onClose={() => setSuccess(null)}
        />

        <ErrorNotification 
          error={error}
          onClose={() => setError(null)}
          show={!loading}
        />
      </TenantLayout>
    </ProtectedRoute>
  );
}