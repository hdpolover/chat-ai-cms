'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TenantLayout from '@/components/layout/TenantLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ErrorNotification, SuccessNotification } from '@/components/common/Notification';
import { BotsPageHeader, BotsList } from '@/components/bots';
import { useBotsData } from '@/hooks/useBotsData';
import { BotService } from '@/services/bot';
import type { Bot } from '@/types';

interface BotWithConversationCount extends Bot {
  _conversationCount?: number;
}

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

  const [localBots, setLocalBots] = useState<Bot[]>(bots);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [botToDelete, setBotToDelete] = useState<BotWithConversationCount | null>(null);

  // Update local state when bots data changes
  useEffect(() => {
    setLocalBots(bots);
  }, [bots]);

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
    try {
      await BotService.toggleBotStatus(botId, isActive);
      setSuccess(`Bot ${isActive ? 'activated' : 'deactivated'} successfully`);
      // Find and update the bot in the current list
      const updatedBot = await BotService.getBot(botId);
      setLocalBots(prevBots => 
        prevBots.map(bot => bot.id === botId ? updatedBot : bot)
      );
    } catch (error) {
      console.error('Failed to toggle bot status:', error);
      setError('Failed to update bot status');
    }
  };

  const handleDeleteBot = async (botId: string) => {
    const bot = localBots.find(b => b.id === botId);
    if (!bot) return;
    
    // Check if bot can be deleted first
    try {
      const deleteCheck = await BotService.canDeleteBot(botId);
      setBotToDelete({ ...bot, _conversationCount: deleteCheck.conversationCount });
    } catch (error) {
      // If check fails, still allow delete attempt but show warning
      setBotToDelete(bot);
    }
    
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!botToDelete) return;
    
    try {
      await BotService.deleteBot(botToDelete.id);
      setSuccess('Bot deleted successfully');
      // Remove the bot from the current list
      setLocalBots(prevBots => prevBots.filter(bot => bot.id !== botToDelete.id));
    } catch (error: any) {
      console.error('Failed to delete bot:', error);
      
      // Extract the error message from the response
      let errorMessage = 'Failed to delete bot';
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setDeleteDialogOpen(false);
      setBotToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setBotToDelete(null);
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
          botCount={localBots.length}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <BotsList
          bots={localBots}
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

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <DialogTitle id="delete-dialog-title">
            Delete Bot
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
              Are you sure you want to delete the bot <strong>"{botToDelete?.name}"</strong>?
              <br />
              <br />
              {botToDelete?._conversationCount && botToDelete._conversationCount > 0 ? (
                <>
                  <strong style={{ color: '#f44336' }}>⚠️ Warning:</strong> This bot has {botToDelete._conversationCount} conversation(s). 
                  Deletion will fail because bots with conversations cannot be deleted. 
                  Consider deactivating the bot instead to preserve conversation history.
                  <br /><br />
                </>
              ) : (
                <>
                  <strong>Warning:</strong> This action cannot be undone. All associated data will be permanently removed.
                  <br /><br />
                </>
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="primary">
              Cancel
            </Button>
            {botToDelete && !botToDelete.is_active ? null : (
              <Button 
                onClick={() => {
                  if (botToDelete) {
                    handleToggleStatus(botToDelete.id, false);
                    handleDeleteCancel();
                  }
                }} 
                color="warning" 
                variant="outlined"
              >
                Deactivate Instead
              </Button>
            )}
            <Button 
              onClick={handleDeleteConfirm} 
              color="error" 
              variant="contained"
              disabled={Boolean(botToDelete?._conversationCount && botToDelete._conversationCount > 0)}
            >
              {botToDelete?._conversationCount && botToDelete._conversationCount > 0 ? 'Cannot Delete' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </TenantLayout>
    </ProtectedRoute>
  );
}