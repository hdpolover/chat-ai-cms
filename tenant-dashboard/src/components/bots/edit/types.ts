/**
 * Types for Bot Edit page components
 */

import { Bot, TenantAIProvider, Dataset, UpdateBotRequest } from '@/types';

export interface BotEditHeaderProps {
  bot: Bot | null;
  saving: boolean;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

export interface BasicInfoEditProps {
  botData: UpdateBotRequest;
  aiProviders: TenantAIProvider[];
  onFieldChange: (field: keyof UpdateBotRequest, value: any) => void;
}

export interface AIConfigEditProps {
  botData: UpdateBotRequest;
  onFieldChange: (field: keyof UpdateBotRequest, value: any) => void;
}

export interface KnowledgeEditProps {
  bot: Bot | null;
  datasets: Dataset[];
  onManageDatasets: () => void;
}

export interface SettingsEditProps {
  botData: UpdateBotRequest;
  onFieldChange: (field: keyof UpdateBotRequest, value: any) => void;
}