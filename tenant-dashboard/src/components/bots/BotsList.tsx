/**
 * Bots list component with table layout
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { SmartToy } from '@mui/icons-material';
import { BotCard } from './BotCard';
import type { BotsListProps } from './types';

export const BotsList: React.FC<BotsListProps> = ({
  bots,
  aiProviders,
  loading = false,
  onEdit,
  onView,
  onToggleStatus,
  onDelete,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (bots.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
        <SmartToy sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          No bots found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create your first bot to get started with AI conversations.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Bot</TableCell>
            <TableCell>Provider</TableCell>
            <TableCell>Model</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bots.map((bot) => (
            <BotCard
              key={bot.id}
              bot={bot}
              aiProviders={aiProviders}
              onEdit={onEdit}
              onView={onView}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};