/**
 * Review & Create step for Create Bot form
 */

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import type { ReviewStepProps } from './types';

export const ReviewStep: React.FC<ReviewStepProps> = ({
  botData,
  aiProviders,
}) => {
  const getProviderName = (providerId: string) => {
    return aiProviders.find(p => p.id === providerId)?.provider_name || 'Unknown';
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Save sx={{ mr: 1 }} />
        Review & Create
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>Basic Information</Typography>
            <Typography><strong>Name:</strong> {botData.name}</Typography>
            <Typography><strong>Description:</strong> {botData.description || 'None'}</Typography>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>AI Configuration</Typography>
            <Typography><strong>Provider:</strong> {getProviderName(botData.tenant_ai_provider_id)}</Typography>
            <Typography><strong>Model:</strong> {botData.model}</Typography>
            <Typography><strong>Temperature:</strong> {botData.temperature}</Typography>
            <Typography><strong>Max Tokens:</strong> {botData.max_tokens}</Typography>
            {botData.system_prompt && (
              <Box sx={{ mt: 1 }}>
                <Typography><strong>System Prompt:</strong></Typography>
                <Paper sx={{ p: 1, mt: 1, bgcolor: 'grey.50' }}>
                  <Typography variant="body2">{botData.system_prompt}</Typography>
                </Paper>
              </Box>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>Knowledge & Access</Typography>
            <Typography><strong>Datasets:</strong> {botData.dataset_ids?.length || 0} selected</Typography>
            <Typography><strong>Scopes:</strong> {botData.scope_ids?.length || 0} selected</Typography>
            <Typography><strong>Visibility:</strong> {botData.is_public ? 'Public' : 'Private'}</Typography>
            {botData.allowed_domains && botData.allowed_domains.length > 0 && (
              <Typography><strong>Allowed Domains:</strong> {botData.allowed_domains.join(', ')}</Typography>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>Guardrails & Filters</Typography>
            <Typography><strong>Allowed Topics:</strong> {botData.guardrails?.allowed_topics?.length || 0} configured</Typography>
            <Typography><strong>Forbidden Topics:</strong> {botData.guardrails?.forbidden_topics?.length || 0} configured</Typography>
            <Typography><strong>Strict Mode:</strong> {botData.guardrails?.knowledge_boundaries?.strict_mode ? 'Enabled' : 'Disabled'}</Typography>
            <Typography><strong>Dataset Filter Tags:</strong> {botData.dataset_filters?.tags?.length || 0} configured</Typography>
            <Typography><strong>Dataset Filter Categories:</strong> {botData.dataset_filters?.categories?.length || 0} configured</Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};