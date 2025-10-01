/**
 * Types for Bot Details page components
 */

import { Bot, TenantAIProvider, ChatSession } from '@/types';

export interface BotDetailsHeaderProps {
  bot: Bot;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

export interface BotOverviewCardProps {
  bot: Bot;
  aiProvider?: TenantAIProvider;
}

export interface BotStatsCardProps {
  conversationCount: number;
  messageCount: number;
  averageResponseTime: number;
  lastUsed?: string;
}

export interface BotConfigurationProps {
  bot: Bot;
  aiProvider?: TenantAIProvider;
}

export interface BotDatasetsProps {
  bot: Bot;
  onManageDatasets: () => void;
}

export interface BotConversationsProps {
  conversations: ChatSession[];
  loading?: boolean;
  onViewConversation: (conversationId: string) => void;
}

export interface BotSettingsProps {
  bot: Bot;
  onManageSettings: () => void;
}

export interface UseBotDetailsReturn {
  bot: Bot | null;
  aiProvider: TenantAIProvider | null;
  conversations: ChatSession[];
  loading: boolean;
  error: string | null;
  success: string | null;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  loadBot: () => Promise<void>;
  handleToggleStatus: () => Promise<void>;
  handleDeleteBot: () => Promise<void>;
}