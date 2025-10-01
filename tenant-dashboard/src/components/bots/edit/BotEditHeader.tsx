import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  Stack,
  LinearProgress 
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import type { BotEditHeaderProps } from './types';

export const BotEditHeader: React.FC<BotEditHeaderProps> = ({
  bot,
  saving,
  onSave,
  onCancel
}) => {
  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <IconButton onClick={onCancel} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Edit Bot{bot ? `: ${bot.name}` : ''}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Modify bot configuration and settings
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={onSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
        </Stack>
      </Box>
      
      {saving && (
        <LinearProgress sx={{ mb: 2 }} />
      )}
    </>
  );
};