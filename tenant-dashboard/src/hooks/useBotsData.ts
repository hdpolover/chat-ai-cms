/**
 * Custom hook for managing bots data and state
 */

import { useState, useEffect } from 'react';
import { BotService } from '@/services/bot';
import { Bot, TenantAIProvider } from '@/types';
import type { UseBotsDataReturn } from '@/components/bots/types';

export const useBotsData = (): UseBotsDataReturn => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [aiProviders, setAiProviders] = useState<TenantAIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadBots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [botsData, providersData] = await Promise.all([
        BotService.getBots(),
        BotService.getTenantAIProviders()
      ]);
      
      setBots(botsData || []);
      setAiProviders(providersData || []);
      
    } catch (error) {
      console.error('Failed to load bots:', error);
      setError('Failed to load bots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBots();
  }, []);

  return {
    bots,
    aiProviders,
    loading,
    error,
    success,
    loadBots,
    setError,
    setSuccess,
  };
};