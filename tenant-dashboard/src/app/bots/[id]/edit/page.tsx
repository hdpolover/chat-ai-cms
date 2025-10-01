'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Alert,
  Snackbar,
  CircularProgress,
  Stack,
} from '@mui/material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TenantLayout from '@/components/layout/TenantLayout';
import { useBotEdit } from '@/hooks/useBotEdit';
import { 
  BotEditHeader,
  CombinedBasicEditCard,
  CombinedAdvancedEditCard
} from '@/components/bots/edit';

export default function BotEditPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;

  const {
    bot,
    botData,
    aiProviders,
    datasets,
    loading,
    saving,
    error,
    success,
    setError,
    setSuccess,
    handleSave,
    handleFieldChange,
  } = useBotEdit(botId);

  const handleCancel = () => {
    router.push(`/bots/${botId}`);
  };

  const handleManageDatasets = () => {
    router.push(`/bots/${botId}/datasets`);
  };

  const handleGuardrailsFieldChange = (field: string, value: any) => {
    // Type-safe wrapper for guardrails and advanced config
    handleFieldChange(field as any, value);
  };

  const handleBasicFieldChange = (field: string, value: any) => {
    // Type-safe wrapper for basic configuration
    handleFieldChange(field as any, value);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </ProtectedRoute>
    );
  }

  if (!bot) {
    return (
      <ProtectedRoute>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            Bot not found or you don't have permission to edit it.
          </Alert>
        </Box>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <TenantLayout>
        <Box sx={{ p: 3 }}>
          <BotEditHeader
            bot={bot}
            saving={saving}
            onSave={handleSave}
            onCancel={handleCancel}
          />

          <Stack spacing={3} sx={{ maxWidth: '1200px', mx: 'auto' }}>
            {/* Basic Configuration */}
            <CombinedBasicEditCard
              botData={botData}
              aiProviders={aiProviders}
              onFieldChange={handleBasicFieldChange}
            />
            
            {/* Advanced Configuration */}
            <CombinedAdvancedEditCard
              botData={botData}
              availableDatasets={datasets}
              availableScopes={[]}
              onFieldChange={handleGuardrailsFieldChange}
            />
          </Stack>

        {/* Success Snackbar */}
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
        >
          <Alert onClose={() => setSuccess(null)} severity="success">
            {success}
          </Alert>
        </Snackbar>

        {/* Error Snackbar */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert onClose={() => setError(null)} severity="error">
            {error}
          </Alert>
        </Snackbar>
        </Box>
      </TenantLayout>
    </ProtectedRoute>
  );
}