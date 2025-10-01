import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Chip, 
  IconButton, 
  Tooltip,
  Stack 
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import type { BotDetailsHeaderProps } from './types';

export const BotDetailsHeader: React.FC<BotDetailsHeaderProps> = ({
  bot,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  const router = useRouter();

  const handleBack = () => {
    router.push('/bots');
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {bot.name}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            {bot.description || 'No description provided'}
          </Typography>
        </Box>
        <Chip
          label={bot.is_active ? 'Active' : 'Inactive'}
          color={bot.is_active ? 'success' : 'default'}
          variant="outlined"
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={onEdit}
        >
          Edit Bot
        </Button>
        <Button
          variant="outlined"
          startIcon={bot.is_active ? <PauseIcon /> : <PlayIcon />}
          onClick={onToggleStatus}
          color={bot.is_active ? 'warning' : 'success'}
        >
          {bot.is_active ? 'Deactivate' : 'Activate'}
        </Button>
        <Tooltip title="Delete Bot">
          <IconButton 
            onClick={onDelete}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
};