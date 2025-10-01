import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  Stack,
  Divider
} from '@mui/material';
import { 
  Settings as SettingsIcon,
  Thermostat as TempIcon,
  Memory as TokensIcon,
  Code as PromptIcon
} from '@mui/icons-material';
import type { BotConfigurationProps } from './types';

export const BotConfigurationCard: React.FC<BotConfigurationProps> = ({
  bot,
  aiProvider
}) => {
  const ConfigItem: React.FC<{
    label: string;
    value: any;
    icon?: React.ReactNode;
  }> = ({ label, value, icon }) => (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        {icon}
        {label}
      </Typography>
      <Typography variant="body2">
        {value || 'Not set'}
      </Typography>
    </Box>
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <SettingsIcon color="primary" />
          Bot Configuration
        </Typography>
        
        <Stack spacing={2}>
          <ConfigItem
            label="Model"
            value={bot.model}
            icon={<SettingsIcon fontSize="small" />}
          />
          
          <ConfigItem
            label="Temperature"
            value={bot.temperature !== undefined ? bot.temperature.toString() : undefined}
            icon={<TempIcon fontSize="small" />}
          />
          
          <ConfigItem
            label="Max Tokens"
            value={bot.max_tokens !== undefined ? bot.max_tokens.toLocaleString() : undefined}
            icon={<TokensIcon fontSize="small" />}
          />

          {bot.system_prompt && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PromptIcon fontSize="small" />
                  System Prompt
                </Typography>
                <Box sx={{ 
                  backgroundColor: 'grey.50', 
                  p: 2, 
                  borderRadius: 1, 
                  border: '1px solid',
                  borderColor: 'grey.200',
                  maxHeight: 200,
                  overflow: 'auto'
                }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                    {bot.system_prompt}
                  </Typography>
                </Box>
              </Box>
            </>
          )}

          {bot.settings && Object.keys(bot.settings).length > 0 && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Additional Settings
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(bot.settings).map(([key, value]) => (
                    <Chip
                      key={key}
                      label={`${key}: ${JSON.stringify(value)}`}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Stack>
              </Box>
            </>
          )}

          {bot.allowed_domains && bot.allowed_domains.length > 0 && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Allowed Domains
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {bot.allowed_domains.map((domain) => (
                    <Chip
                      key={domain}
                      label={domain}
                      variant="outlined"
                      size="small"
                      color="info"
                    />
                  ))}
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};