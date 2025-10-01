import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Box
} from '@mui/material';
import {
  SmartToy as BotIcon,
} from '@mui/icons-material';
import type { BasicInfoEditProps } from './types';

export const BasicInfoEditCard: React.FC<BasicInfoEditProps> = ({
  botData,
  aiProviders,
  onFieldChange
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <BotIcon color="primary" />
          Basic Information
        </Typography>
        
        <Stack spacing={3}>
          <TextField
            label="Bot Name"
            value={botData.name || ''}
            onChange={(e) => onFieldChange('name', e.target.value)}
            placeholder="Enter a descriptive name for your bot"
            fullWidth
            required
          />

          <TextField
            label="Description"
            value={botData.description || ''}
            onChange={(e) => onFieldChange('description', e.target.value)}
            placeholder="Briefly describe what this bot does"
            multiline
            rows={3}
            fullWidth
          />

          <FormControl fullWidth required>
            <InputLabel>AI Provider</InputLabel>
            <Select
              value={botData.tenant_ai_provider_id || ''}
              onChange={(e) => onFieldChange('tenant_ai_provider_id', e.target.value)}
              label="AI Provider"
            >
              <MenuItem value="">
                <em>Select an AI Provider</em>
              </MenuItem>
              {aiProviders.map((provider) => (
                <MenuItem key={provider.id} value={provider.id}>
                  {provider.provider_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Model"
            value={botData.model || ''}
            onChange={(e) => onFieldChange('model', e.target.value)}
            placeholder="e.g., gpt-4, claude-3-sonnet"
            fullWidth
            required
            helperText="The AI model to use for this bot"
          />
        </Stack>
      </CardContent>
    </Card>
  );
};