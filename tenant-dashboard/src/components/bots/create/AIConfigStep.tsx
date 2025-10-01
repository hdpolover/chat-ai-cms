/**
 * AI Configuration step for Create Bot form
 */

import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormHelperText,
} from '@mui/material';
import { Settings, Info } from '@mui/icons-material';
import type { AIConfigStepProps } from './types';

export const AIConfigStep: React.FC<AIConfigStepProps> = ({
  botData,
  aiProviders,
  onChange,
}) => {
  const getAvailableModels = (providerId: string) => {
    const provider = aiProviders.find(p => p.id === providerId);
    if (!provider?.custom_settings?.supported_models) return [];
    return provider.custom_settings.supported_models;
  };

  const handleProviderChange = (providerId: string) => {
    onChange({ 
      tenant_ai_provider_id: providerId,
      model: '' // Reset model when provider changes
    });
  };

  const handleFieldChange = (field: string) => (event: any) => {
    let value = event.target.value;
    
    // Handle numeric fields
    if (field === 'max_tokens') {
      value = parseInt(value) || 1000;
    }
    
    onChange({ [field]: value });
  };

  const handleSliderChange = (field: string) => (_: Event, value: number | number[]) => {
    onChange({ [field]: value as number });
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Settings sx={{ mr: 1 }} />
        AI Configuration
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <FormControl fullWidth required>
          <InputLabel>AI Provider</InputLabel>
          <Select
            value={botData.tenant_ai_provider_id}
            label="AI Provider"
            onChange={(e) => handleProviderChange(e.target.value)}
          >
            {aiProviders.map((provider) => (
              <MenuItem key={provider.id} value={provider.id}>
                <Box>
                  <Typography variant="body1">{provider.provider_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {provider.custom_settings?.supported_models?.length || 0} models available
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>Select the AI provider to power this bot</FormHelperText>
        </FormControl>
        
        <FormControl fullWidth required disabled={!botData.tenant_ai_provider_id}>
          <InputLabel>Model</InputLabel>
          <Select
            value={botData.model}
            label="Model"
            onChange={handleFieldChange('model')}
          >
            {getAvailableModels(botData.tenant_ai_provider_id).map((model: string) => (
              <MenuItem key={model} value={model}>
                {model}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>Choose the specific AI model for this bot</FormHelperText>
        </FormControl>
        
        <TextField
          label="System Prompt"
          value={botData.system_prompt || ''}
          onChange={handleFieldChange('system_prompt')}
          fullWidth
          multiline
          rows={6}
          helperText="Instructions that define how the bot should behave and respond"
          placeholder="You are a helpful assistant that..."
        />

        <Box>
          <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Temperature: {botData.temperature}
            <Info sx={{ fontSize: 16, color: 'text.secondary' }} />
          </Typography>
          <Slider
            value={botData.temperature || 0.7}
            onChange={handleSliderChange('temperature')}
            min={0}
            max={2}
            step={0.1}
            marks={[
              { value: 0, label: '0 (Focused)' },
              { value: 1, label: '1 (Balanced)' },
              { value: 2, label: '2 (Creative)' }
            ]}
          />
          <FormHelperText>Controls randomness: lower = more focused, higher = more creative</FormHelperText>
        </Box>

        <TextField
          label="Max Tokens"
          type="number"
          value={botData.max_tokens || 1000}
          onChange={handleFieldChange('max_tokens')}
          fullWidth
          inputProps={{ min: 1, max: 4096 }}
          helperText="Maximum length of bot responses (1-4096 tokens)"
        />
      </Box>
    </Box>
  );
};