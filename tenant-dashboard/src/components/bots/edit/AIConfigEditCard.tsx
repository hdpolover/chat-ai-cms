import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  TextField,
  Slider,
  Stack,
  Box,
  FormHelperText
} from '@mui/material';
import {
  Psychology as AIIcon,
  Thermostat as TempIcon,
  Memory as TokensIcon,
} from '@mui/icons-material';
import type { AIConfigEditProps } from './types';

export const AIConfigEditCard: React.FC<AIConfigEditProps> = ({
  botData,
  onFieldChange
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <AIIcon color="primary" />
          AI Configuration
        </Typography>
        
        <Stack spacing={4}>
          <TextField
            label="System Prompt"
            value={botData.system_prompt || ''}
            onChange={(e) => onFieldChange('system_prompt', e.target.value)}
            placeholder="Define the bot's personality, role, and behavior instructions..."
            multiline
            rows={6}
            fullWidth
            helperText="This prompt defines how the AI will behave and respond to users"
          />

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TempIcon fontSize="small" color="action" />
              <Typography variant="subtitle1">Temperature</Typography>
            </Box>
            <Slider
              value={botData.temperature || 0.7}
              onChange={(_, value) => onFieldChange('temperature', value)}
              min={0}
              max={2}
              step={0.1}
              valueLabelDisplay="on"
              marks={[
                { value: 0, label: 'Focused' },
                { value: 1, label: 'Balanced' },
                { value: 2, label: 'Creative' }
              ]}
            />
            <FormHelperText>
              Lower values make responses more focused and deterministic. Higher values increase creativity and randomness.
            </FormHelperText>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TokensIcon fontSize="small" color="action" />
              <Typography variant="subtitle1">Max Tokens</Typography>
            </Box>
            <Slider
              value={botData.max_tokens || 2000}
              onChange={(_, value) => onFieldChange('max_tokens', value)}
              min={100}
              max={4000}
              step={100}
              valueLabelDisplay="on"
              marks={[
                { value: 100, label: '100' },
                { value: 1000, label: '1K' },
                { value: 2000, label: '2K' },
                { value: 4000, label: '4K' }
              ]}
            />
            <FormHelperText>
              Maximum number of tokens the bot can generate in a single response. Higher values allow longer responses but cost more.
            </FormHelperText>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};