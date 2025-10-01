/**
 * Custom hook for Create Bot page data management
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BotService } from '@/services/bot';
import { DatasetService, Dataset } from '@/services/dataset';
import { TenantAIProvider } from '@/types';
import type { CreateBotFormData, UseCreateBotReturn } from '@/components/bots/create/types';

export const useCreateBot = (): UseCreateBotReturn => {
  const router = useRouter();
  
  // Form data state
  const [botData, setBotData] = useState<CreateBotFormData>({
    name: '',
    description: '',
    tenant_ai_provider_id: '',
    model: '',
    system_prompt: '',
    temperature: 0.7,
    max_tokens: 1000,
    settings: {},
    is_public: false,
    allowed_domains: [],
    dataset_ids: [],
    scope_ids: [],
  });

  // Data state
  const [aiProviders, setAiProviders] = useState<TenantAIProvider[]>([]);
  const [availableDatasets, setAvailableDatasets] = useState<Dataset[]>([]);
  const [availableScopes, setAvailableScopes] = useState<any[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateBotData = (updates: Partial<CreateBotFormData>) => {
    setBotData(prev => ({ ...prev, ...updates }));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [providersData, datasetsData] = await Promise.all([
        BotService.getTenantAIProviders(),
        DatasetService.getAvailableDatasets()
      ]);
      
      setAiProviders(providersData);
      setAvailableDatasets(datasetsData);
      
      // Load scopes if available
      try {
        setAvailableScopes([]);
      } catch (error) {
        console.error('Failed to load scopes:', error);
        setAvailableScopes([]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load configuration data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBot = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!botData.name || !botData.tenant_ai_provider_id || !botData.model) {
        setError('Please fill in all required fields');
        return;
      }

      await BotService.createBot(botData);
      setSuccess('Bot created successfully');
      
      // Navigate back to bots list after a short delay
      setTimeout(() => {
        router.push('/bots');
      }, 1500);
    } catch (error) {
      console.error('Failed to create bot:', error);
      setError('Failed to create bot');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    botData,
    setBotData,
    updateBotData,
    aiProviders,
    availableDatasets,
    availableScopes,
    loading,
    saving,
    error,
    success,
    setError,
    setSuccess,
    handleCreateBot,
    loadData,
  };
};