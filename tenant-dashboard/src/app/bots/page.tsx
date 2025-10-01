'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Add,
  SmartToy,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  PlayArrow,
  Pause,
} from '@mui/icons-material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TenantLayout from '@/components/layout/TenantLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { BotService } from '@/services/bot';
import { Bot, TenantAIProvider } from '@/types';
import { formatDate } from '@/utils/dateUtils';

export default function BotsPage() {
  const router = useRouter();
  const [bots, setBots] = useState<Bot[]>([]);
  const [aiProviders, setAiProviders] = useState<TenantAIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [botsData, providersData] = await Promise.all([
        BotService.getBots(),
        BotService.getTenantAIProviders()
      ]);
      
      setBots(botsData || []);
      setAiProviders(providersData || []);
      
    } catch (error) {
      console.error('Failed to load bots:', error);
      setError('Failed to load bots');
    } finally {
      setLoading(false);
    }
  };

  const getProviderName = (providerId: string) => {
    const provider = aiProviders.find(p => p.id === providerId);
    return provider?.provider_name || 'Unknown';
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <LoadingSpinner message="Loading bots..." />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <TenantLayout>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              Bots
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your AI chatbots and their configurations
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push('/bots/create')}
            sx={{ fontWeight: 500 }}
          >
            Create Bot
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {bots.length === 0 ? (
          <Alert severity="warning" sx={{ mb: 3 }}>
            No bots found. Create your first bot to get started.
          </Alert>
        ) : (
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
                      <Tooltip title="View Bot">
                        <IconButton 
                          size="small" 
                          onClick={() => router.push(`/bots/${bot.id}`)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Bot">
                        <IconButton 
                          size="small" 
                          onClick={() => router.push(`/bots/${bot.id}/edit`)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Snackbar 
          open={!!success} 
          autoHideDuration={6000} 
          onClose={() => setSuccess(null)}
        >
          <Alert onClose={() => setSuccess(null)} severity="success">
            {success}
          </Alert>
        </Snackbar>

        <Snackbar 
          open={!!error && !loading} 
          autoHideDuration={6000} 
          onClose={() => setError(null)}
        >
          <Alert onClose={() => setError(null)} severity="error">
            {error}
          </Alert>
        </Snackbar>
      </TenantLayout>
    </ProtectedRoute>
  );
}