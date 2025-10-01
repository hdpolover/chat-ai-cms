/**
 * Basic Information step for Create Bot form
 */

import React from 'react';
import {
  Box,
  Typography,
  TextField,
} from '@mui/material';
import { SmartToy } from '@mui/icons-material';
import type { BasicInfoStepProps } from './types';

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  botData,
  onChange,
}) => {
  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ [field]: event.target.value });
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <SmartToy sx={{ mr: 1 }} />
        Basic Information
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TextField
          label="Bot Name"
          value={botData.name}
          onChange={handleChange('name')}
          fullWidth
          required
          helperText="A unique name for your chatbot"
        />
        
        <TextField
          label="Description"
          value={botData.description || ''}
          onChange={handleChange('description')}
          fullWidth
          multiline
          rows={4}
          helperText="Describe what this bot does and its purpose"
        />
      </Box>
    </Box>
  );
};