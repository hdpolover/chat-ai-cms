/**
 * Types for Create Bot page components
 */

import { CreateBotRequest, TenantAIProvider } from '@/types';
import { Dataset } from '@/services/dataset';

export interface CreateBotFormData extends CreateBotRequest {
  dataset_ids?: string[];
  scope_ids?: string[];
}

export interface CreateBotStepperProps {
  activeStep: number;
  steps: string[];
  isStepComplete: (step: number) => boolean;
  onStepClick: (step: number) => void;
}

export interface CreateBotFormStep {
  title: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

export interface BasicInfoStepProps {
  botData: CreateBotFormData;
  onChange: (data: Partial<CreateBotFormData>) => void;
}

export interface AIConfigStepProps {
  botData: CreateBotFormData;
  aiProviders: TenantAIProvider[];
  onChange: (data: Partial<CreateBotFormData>) => void;
}

export interface KnowledgeStepProps {
  botData: CreateBotFormData;
  availableDatasets: Dataset[];
  availableScopes: any[];
  onChange: (data: Partial<CreateBotFormData>) => void;
}

export interface AccessSecurityStepProps {
  botData: CreateBotFormData;
  onChange: (data: Partial<CreateBotFormData>) => void;
}

export interface ReviewStepProps {
  botData: CreateBotFormData;
  aiProviders: TenantAIProvider[];
}

export interface CreateBotNavigationProps {
  activeStep: number;
  totalSteps: number;
  isStepComplete: boolean;
  saving: boolean;
  onBack: () => void;
  onNext: () => void;
  onCreate: () => void;
}

export interface UseCreateBotReturn {
  botData: CreateBotFormData;
  setBotData: (data: CreateBotFormData) => void;
  updateBotData: (updates: Partial<CreateBotFormData>) => void;
  aiProviders: TenantAIProvider[];
  availableDatasets: Dataset[];
  availableScopes: any[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: string | null;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  handleCreateBot: () => Promise<void>;
  loadData: () => Promise<void>;
}