/**
 * Component prop types for the Bots page
 */

import { Bot, TenantAIProvider } from '@/types';

export interface BotCardProps {
  bot: Bot;
  aiProviders: TenantAIProvider[];
  onEdit: (botId: string) => void;
  onView: (botId: string) => void;
  onToggleStatus?: (botId: string, isActive: boolean) => void;
  onDelete?: (botId: string) => void;
}

export interface BotsListProps {
  bots: Bot[];
  aiProviders: TenantAIProvider[];
  loading?: boolean;
  onEdit: (botId: string) => void;
  onView: (botId: string) => void;
  onToggleStatus?: (botId: string, isActive: boolean) => void;
  onDelete?: (botId: string) => void;
}

export interface BotsPageHeaderProps {
  onCreateBot: () => void;
  botCount?: number;
}

export interface BotActionsProps {
  bot: Bot;
  onEdit: (botId: string) => void;
  onView: (botId: string) => void;
  onToggleStatus?: (botId: string, isActive: boolean) => void;
  onDelete?: (botId: string) => void;
}

export interface UseBotsDataReturn {
  bots: Bot[];
  aiProviders: TenantAIProvider[];
  loading: boolean;
  error: string | null;
  success: string | null;
  loadBots: () => Promise<void>;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
}