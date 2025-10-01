'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
} from '@mui/material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TenantLayout from '@/components/layout/TenantLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ErrorNotification, SuccessNotification } from '@/components/common/Notification';
import {
  CreateBotHeader,
  CreateBotStepper,
  BasicInfoStep,
  AIConfigStep,
  KnowledgeStep,
  AccessSecurityStep,
  ReviewStep,
  CreateBotNavigation,
} from '@/components/bots/create';
import { useCreateBot } from '@/hooks/useCreateBot';

const STEPS = [
  'Basic Information',
  'AI Configuration',
  'Knowledge & Datasets',
  'Access & Security',
  'Review & Create'
];

export default function CreateBotPage() {
  const [activeStep, setActiveStep] = useState(0);
  
  const {
    botData,
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
  } = useCreateBot();

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);
  const handleStepClick = (step: number) => setActiveStep(step);

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 0:
        return botData.name.trim() !== '';
      case 1:
        return botData.tenant_ai_provider_id !== '' && botData.model !== '';
      case 2:
        return true; // Optional step
      case 3:
        return true; // Optional step
      case 4:
        return Boolean(botData.name && botData.tenant_ai_provider_id && botData.model);
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return <BasicInfoStep botData={botData} onChange={updateBotData} />;
      case 1:
        return (
          <AIConfigStep 
            botData={botData} 
            aiProviders={aiProviders} 
            onChange={updateBotData} 
          />
        );
      case 2:
        return (
          <KnowledgeStep 
            botData={botData}
            availableDatasets={availableDatasets}
            availableScopes={availableScopes}
            onChange={updateBotData}
          />
        );
      case 3:
        return <AccessSecurityStep botData={botData} onChange={updateBotData} />;
      case 4:
        return <ReviewStep botData={botData} aiProviders={aiProviders} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <LoadingSpinner message="Loading configuration..." />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <TenantLayout>
        <CreateBotHeader />

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
          {/* Stepper Sidebar */}
          <Box sx={{ width: { lg: 300 }, flexShrink: 0 }}>
            <CreateBotStepper
              activeStep={activeStep}
              steps={STEPS}
              isStepComplete={isStepComplete}
              onStepClick={handleStepClick}
            />
          </Box>

          {/* Main Content */}
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                {renderStep()}

                <CreateBotNavigation
                  activeStep={activeStep}
                  totalSteps={STEPS.length}
                  isStepComplete={isStepComplete(activeStep)}
                  saving={saving}
                  onBack={handleBack}
                  onNext={handleNext}
                  onCreate={handleCreateBot}
                />
              </CardContent>
            </Card>
          </Box>
        </Box>

        <SuccessNotification 
          success={success}
          onClose={() => setSuccess(null)}
        />

        <ErrorNotification 
          error={error}
          onClose={() => setError(null)}
        />
      </TenantLayout>
    </ProtectedRoute>
  );
}