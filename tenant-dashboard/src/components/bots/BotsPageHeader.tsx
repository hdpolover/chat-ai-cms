/**
 * Header component for the Bots page
 */

import React from 'react';
import {
  Box,
  Typography,
  Button,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import type { BotsPageHeaderProps } from './types';

export const BotsPageHeader: React.FC<BotsPageHeaderProps> = ({
  onCreateBot,
  botCount = 0,
}) => {
  return (
    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Bots
          {botCount > 0 && (
            <Typography component="span" color="text.secondary" sx={{ ml: 1, fontSize: '0.8em' }}>
              ({botCount})
            </Typography>
          )}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your AI chatbots and their configurations
        </Typography>
      </Box>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={onCreateBot}
        sx={{ fontWeight: 500 }}
      >
        Create Bot
      </Button>
    </Box>
  );
};