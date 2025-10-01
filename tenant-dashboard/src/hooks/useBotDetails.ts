import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BotService } from '@/services/bot';
import { AIProviderService } from '@/services/aiProvider';
import { ConversationService } from '@/services/conversation';
import type { Bot, TenantAIProvider, ChatSession } from '@/types';
import type { UseBotDetailsReturn } from '../components/bots/details/types';

export const useBotDetails = (botId: string): UseBotDetailsReturn => {
  const router = useRouter();
  const [bot, setBot] = useState<Bot | null>(null);
  const [aiProvider, setAiProvider] = useState<TenantAIProvider | null>(null);
  const [conversations, setConversations] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadBot = useCallback(async () => {
    if (!botId) return;

    try {
      setLoading(true);
      setError(null);
      
      // Load bot details
      const botData = await BotService.getBot(botId);
      setBot(botData);

      // Load AI provider if bot has one
      if (botData.tenant_ai_provider_id) {
        try {
          const providerData = await AIProviderService.getTenantAIProvider(botData.tenant_ai_provider_id);
          setAiProvider(providerData);
        } catch (err) {
          console.warn('Could not load AI provider:', err);
        }
      }

      // Load recent conversations for this bot
      try {
        const conversationsData = await BotService.getBotConversations(botId);
        setConversations(conversationsData || []);
      } catch (err) {
        console.warn('Could not load conversations:', err);
      }
    } catch (err) {
      console.error('Error loading bot:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bot');
    } finally {
      setLoading(false);
    }
  }, [botId]);

  const handleToggleStatus = useCallback(async () => {
    if (!bot) return;

    try {
      setError(null);
      const newStatus = !bot.is_active;
      
      await BotService.updateBot(bot.id, { is_active: newStatus });
      
      setBot(prev => prev ? { ...prev, is_active: newStatus } : null);
      setSuccess(`Bot ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Error toggling bot status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update bot status');
    }
  }, [bot]);

  const handleDeleteBot = useCallback(async () => {
    if (!bot) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${bot.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError(null);
      await BotService.deleteBot(bot.id);
      setSuccess('Bot deleted successfully');
      
      // Redirect to bots list after short delay
      setTimeout(() => {
        router.push('/bots');
      }, 1500);
    } catch (err) {
      console.error('Error deleting bot:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete bot');
    }
  }, [bot, router]);

  useEffect(() => {
    loadBot();
  }, [loadBot]);

  return {
    bot,
    aiProvider,
    conversations,
    loading,
    error,
    success,
    setError,
    setSuccess,
    loadBot,
    handleToggleStatus,
    handleDeleteBot,
  };
};