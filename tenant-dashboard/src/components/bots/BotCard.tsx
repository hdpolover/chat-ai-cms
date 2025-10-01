/**
 * Individual bot card component for table rows
 */

import React from 'react';
import {
  TableRow,
  TableCell,
  Box,
  Typography,
  Avatar,
  Chip,
} from '@mui/material';
import { SmartToy } from '@mui/icons-material';
import { BotActions } from './BotActions';
import { formatDate } from '@/utils/dateUtils';
import type { BotCardProps } from './types';

export const BotCard: React.FC<BotCardProps> = ({
  bot,
  aiProviders,
  onEdit,
  onView,
  onToggleStatus,
  onDelete,
}) => {
  const getProviderName = (providerId: string) => {
    const provider = aiProviders.find(p => p.id === providerId);
    return provider?.provider_name || 'Unknown';
  };

  return (
    <TableRow key={bot.id} hover>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <SmartToy />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
              {bot.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {bot.description || 'No description'}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      
      <TableCell>
        <Typography variant="body2">
          {getProviderName(bot.tenant_ai_provider_id)}
        </Typography>
      </TableCell>
      
      <TableCell>
        <Chip 
          label={bot.model} 
          size="small" 
          variant="outlined" 
          color="primary"
        />
      </TableCell>
      
      <TableCell>
        <Chip
          label={bot.is_active ? 'Active' : 'Inactive'}
          size="small"
          color={bot.is_active ? 'success' : 'default'}
          variant={bot.is_active ? 'filled' : 'outlined'}
        />
      </TableCell>
      
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {formatDate(bot.created_at)}
        </Typography>
      </TableCell>
      
      <TableCell align="right">
        <BotActions
          bot={bot}
          onEdit={onEdit}
          onView={onView}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
};