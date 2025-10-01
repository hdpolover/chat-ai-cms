/**
 * Stepper component for Create Bot page
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import type { CreateBotStepperProps } from './types';

export const CreateBotStepper: React.FC<CreateBotStepperProps> = ({
  activeStep,
  steps,
  isStepComplete,
  onStepClick,
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Setup Progress
        </Typography>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((label, index) => (
            <Step key={label} completed={index < activeStep || isStepComplete(index)}>
              <StepLabel
                onClick={() => onStepClick(index)}
                sx={{ cursor: 'pointer' }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </CardContent>
    </Card>
  );
};