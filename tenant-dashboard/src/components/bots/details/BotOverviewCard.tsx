import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  Stack
} from '@mui/material';
import { 
  SmartToy as BotIcon,
  Psychology as AIIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import type { BotOverviewCardProps } from './types';

export const BotOverviewCard: React.FC<BotOverviewCardProps> = ({
  bot,
  aiProvider
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BotIcon color="primary" />
          Bot Overview
        </Typography>
        
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Bot ID
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {bot.id}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              AI Provider
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <AIIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {aiProvider?.provider_name || bot.ai_provider_name || 'Not configured'}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Model
            </Typography>
            <Typography variant="body2">
              {bot.model || 'Default model'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <CategoryIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {bot.is_public ? 'Public' : 'Private'}
                {bot.allowed_domains?.length ? ` • ${bot.allowed_domains.length} domain(s)` : ''}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Created
            </Typography>
            <Typography variant="body2">
              {formatDate(bot.created_at)}
            </Typography>
          </Box>

          {bot.updated_at !== bot.created_at && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="body2">
                {formatDate(bot.updated_at)}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};