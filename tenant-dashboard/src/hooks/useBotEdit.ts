import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BotService } from '@/services/bot';
import { AIProviderService } from '@/services/aiProvider';
import { DatasetService } from '@/services/dataset';
import type { Bot, TenantAIProvider, Dataset, UpdateBotRequest } from '@/types';

export interface UseBotEditReturn {
  // Bot data
  bot: Bot | null;
  botData: UpdateBotRequest;
  setBotData: React.Dispatch<React.SetStateAction<UpdateBotRequest>>;
  
  // Related data
  aiProviders: TenantAIProvider[];
  datasets: Dataset[];
  
  // Loading states
  loading: boolean;
  saving: boolean;
  
  // Messages
  error: string | null;
  success: string | null;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  
  // Actions
  handleSave: () => Promise<void>;
  handleFieldChange: (field: keyof UpdateBotRequest, value: any) => void;
  loadBotData: () => Promise<void>;
}

export const useBotEdit = (botId: string): UseBotEditReturn => {
  const router = useRouter();
  
  // Data states
  const [bot, setBot] = useState<Bot | null>(null);
  const [botData, setBotData] = useState<UpdateBotRequest>({
    name: '',
    description: '',
    model: '',
    system_prompt: '',
    temperature: 0.7,
    max_tokens: 2000,
    is_active: true,
    is_public: false,
    allowed_domains: [],
    settings: {}
  });
  const [aiProviders, setAiProviders] = useState<TenantAIProvider[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Message states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadBotData = useCallback(async () => {
    if (!botId) return;

    try {
      setLoading(true);
      setError(null);
      
      // Load bot data and related resources in parallel
      const [botResult, providersResult, datasetsResult] = await Promise.all([
        BotService.getBot(botId),
        AIProviderService.getTenantAIProviders(),
        DatasetService.getDatasets()
      ]);
      
      setBot(botResult);
      setAiProviders(providersResult || []);
      setDatasets(datasetsResult || []);
      
      // Populate form data from bot
      setBotData({
        name: botResult.name,
        description: botResult.description || '',
        model: botResult.model,
        system_prompt: botResult.system_prompt || '',
        temperature: botResult.temperature || 0.7,
        max_tokens: botResult.max_tokens || 2000,
        is_active: botResult.is_active,
        is_public: botResult.is_public,
        allowed_domains: botResult.allowed_domains || [],
        settings: botResult.settings || {},
        tenant_ai_provider_id: botResult.tenant_ai_provider_id
      });
      
    } catch (err) {
      console.error('Error loading bot data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bot data');
    } finally {
      setLoading(false);
    }
  }, [botId]);

  const handleFieldChange = useCallback((field: keyof UpdateBotRequest, value: any) => {
    setBotData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!bot) return;

    try {
      setSaving(true);
      setError(null);
      
      const updatedBot = await BotService.updateBot(bot.id, botData);
      setBot(updatedBot);
      setSuccess('Bot updated successfully');
      
      // Redirect to bot details after short delay
      setTimeout(() => {
        router.push(`/bots/${bot.id}`);
      }, 1500);
      
    } catch (err) {
      console.error('Error updating bot:', err);
      setError(err instanceof Error ? err.message : 'Failed to update bot');
    } finally {
      setSaving(false);
    }
  }, [bot, botData, router]);

  useEffect(() => {
    loadBotData();
  }, [loadBotData]);

  return {
    bot,
    botData,
    setBotData,
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
    loadBotData,
  };
};