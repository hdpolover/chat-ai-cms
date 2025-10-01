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
import { useBotDetails } from '@/hooks/useBotDetails';
import { 
  BotDetailsHeader,
  BotOverviewCard,
  BotStatsCard,
  BotConfigurationCard,
  BotGuardrailsCard,
  BotDatasetFiltersCard,
  BotConversationsCard
} from '@/components/bots/details';

export default function BotDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;

  const {
    bot,
    aiProvider,
    conversations,
    loading,
    error,
    success,
    setError,
    setSuccess,
    handleToggleStatus,
    handleDeleteBot,
  } = useBotDetails(botId);

  const handleEdit = () => {
    router.push(`/bots/${botId}/edit`);
  };

  const handleViewConversation = (conversationId: string) => {
    router.push(`/conversations/${conversationId}`);
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
            Bot not found or you don't have permission to view it.
          </Alert>
        </Box>
      </ProtectedRoute>
    );
  }

  // Calculate stats from conversations
  const totalMessages = conversations.reduce((sum, conv) => sum + (conv.message_count || 0), 0);
  const averageResponseTime = 1200; // Placeholder - would need actual data
  const lastUsed = conversations.length > 0 ? conversations[0].updated_at : undefined;

  return (
    <ProtectedRoute>
      <TenantLayout>
        <Box sx={{ p: 3 }}>
          <BotDetailsHeader
            bot={bot}
            onEdit={handleEdit}
            onDelete={handleDeleteBot}
            onToggleStatus={handleToggleStatus}
          />

        <Stack spacing={3}>
          {/* Basic Information */}
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' } }}>
            {/* Left Column */}
            <Stack spacing={3}>
              <BotOverviewCard bot={bot} aiProvider={aiProvider || undefined} />
              <BotConfigurationCard bot={bot} aiProvider={aiProvider || undefined} />
            </Stack>

            {/* Right Column */}
            <Stack spacing={3}>
              <BotStatsCard
                conversationCount={conversations.length}
                messageCount={totalMessages}
                averageResponseTime={averageResponseTime}
                lastUsed={lastUsed}
              />
              <BotConversationsCard
                conversations={conversations}
                loading={loading}
                onViewConversation={handleViewConversation}
              />
            </Stack>
          </Box>

          {/* Advanced Configuration */}
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
            <BotGuardrailsCard bot={bot} />
            <BotDatasetFiltersCard bot={bot} />
          </Box>
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