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
import { useBotEdit } from '@/hooks/useBotEdit';
import { 
  BotEditHeader,
  BasicInfoEditCard,
  AIConfigEditCard,
  SettingsEditCard
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
      <Box sx={{ p: 3 }}>
        <BotEditHeader
          bot={bot}
          saving={saving}
          onSave={handleSave}
          onCancel={handleCancel}
        />

        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' } }}>
          {/* Left Column */}
          <Stack spacing={3}>
            <BasicInfoEditCard
              botData={botData}
              aiProviders={aiProviders}
              onFieldChange={handleFieldChange}
            />
            <AIConfigEditCard
              botData={botData}
              onFieldChange={handleFieldChange}
            />
          </Stack>

          {/* Right Column */}
          <Stack spacing={3}>
            <SettingsEditCard
              botData={botData}
              onFieldChange={handleFieldChange}
            />
          </Stack>
        </Box>

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
    </ProtectedRoute>
  );
}