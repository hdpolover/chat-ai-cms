/**
 * Bot actions component with view and edit buttons
 */

import React from 'react';
import {
  IconButton,
  Tooltip,
  Box,
} from '@mui/material';
import {
  Edit,
  Visibility,
  PlayArrow,
  Pause,
  Delete,
} from '@mui/icons-material';
import type { BotActionsProps } from './types';

export const BotActions: React.FC<BotActionsProps> = ({
  bot,
  onEdit,
  onView,
  onToggleStatus,
  onDelete,
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Tooltip title="View Bot">
        <IconButton 
          size="small" 
          onClick={() => onView(bot.id)}
        >
          <Visibility fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Edit Bot">
        <IconButton 
          size="small" 
          onClick={() => onEdit(bot.id)}
        >
          <Edit fontSize="small" />
        </IconButton>
      </Tooltip>

      {onToggleStatus && (
        <Tooltip title={bot.is_active ? 'Deactivate Bot' : 'Activate Bot'}>
          <IconButton 
            size="small" 
            onClick={() => onToggleStatus(bot.id, !bot.is_active)}
            color={bot.is_active ? 'warning' : 'success'}
          >
            {bot.is_active ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
          </IconButton>
        </Tooltip>
      )}

      {onDelete && (
        <Tooltip title="Delete Bot">
          <IconButton 
            size="small" 
            onClick={() => onDelete(bot.id)}
            color="error"
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};