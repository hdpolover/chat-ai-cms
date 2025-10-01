/**
 * Header component for Create Bot page
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { ArrowBack, SmartToy } from '@mui/icons-material';

export const CreateBotHeader: React.FC = () => {
  const router = useRouter();

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => router.push('/bots')} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <SmartToy sx={{ color: 'primary.main', mr: 2, fontSize: 32 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Create New Bot
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure your chatbot with AI providers, knowledge datasets, and access controls
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};