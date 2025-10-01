/**
 * Navigation component for Create Bot form
 */

import React from 'react';
import {
  Box,
  Button,
  CircularProgress,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import type { CreateBotNavigationProps } from './types';

export const CreateBotNavigation: React.FC<CreateBotNavigationProps> = ({
  activeStep,
  totalSteps,
  isStepComplete,
  saving,
  onBack,
  onNext,
  onCreate,
}) => {
  const isLastStep = activeStep === totalSteps - 1;

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      mt: 4, 
      pt: 2, 
      borderTop: 1, 
      borderColor: 'divider' 
    }}>
      <Button
        onClick={onBack}
        disabled={activeStep === 0}
        variant="outlined"
      >
        Back
      </Button>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        {isLastStep ? (
          <Button
            variant="contained"
            onClick={onCreate}
            disabled={saving || !isStepComplete}
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          >
            {saving ? 'Creating...' : 'Create Bot'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={onNext}
            disabled={!isStepComplete}
          >
            Next
          </Button>
        )}
      </Box>
    </Box>
  );
};