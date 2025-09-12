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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Slider,
  Alert,
  Snackbar,
  CircularProgress,
  Autocomplete,
  OutlinedInput,
  SelectChangeEvent,
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
import { DatasetService, Dataset } from '@/services/dataset';
import { Bot, CreateBotRequest, TenantAIProvider } from '@/types';

export default function BotsPage() {
  const router = useRouter();
  const [bots, setBots] = useState<Bot[]>([]);
  const [aiProviders, setAiProviders] = useState<TenantAIProvider[]>([]);
  const [availableDatasets, setAvailableDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [botsData, providersData, datasetsData] = await Promise.all([
        BotService.getBots(),
        BotService.getTenantAIProviders(),
        DatasetService.getAvailableDatasets()
      ]);
      setBots(botsData);
      setAiProviders(providersData);
      setAvailableDatasets(datasetsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load bots, AI providers, and datasets');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, bot: Bot) => {
    setAnchorEl(event.currentTarget);
    setSelectedBot(bot);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBot(null);
  };

  const handleDeleteBot = async () => {
    if (!selectedBot) return;
    
    try {
      setSaving(true);
      await BotService.deleteBot(selectedBot.id);
      setDeleteDialogOpen(false);
      await loadData();
      setSuccess('Bot deleted successfully');
    } catch (error) {
      console.error('Failed to delete bot:', error);
      setError('Failed to delete bot');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (bot: Bot) => {
    try {
      await BotService.toggleBotStatus(bot.id, !bot.is_active);
      await loadData();
      setSuccess(`Bot ${bot.is_active ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      console.error('Failed to toggle bot status:', error);
      setError('Failed to update bot status');
    }
    handleMenuClose();
  };

  const openDeleteDialog = (bot: Bot) => {
    setSelectedBot(bot);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const getProviderName = (providerId: string) => {
    const provider = aiProviders.find(p => p.id === providerId);
    return provider?.provider_name || 'Unknown';
  };

  const getAvailableModels = (providerId: string) => {
    const provider = aiProviders.find(p => p.id === providerId);
    if (!provider?.custom_settings?.supported_models) return [];
    return provider.custom_settings.supported_models;
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
              Manage your chatbots and their configurations
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push('/bots/create')}
            sx={{ height: 'fit-content' }}
            disabled={aiProviders.length === 0}
          >
            Create Bot
          </Button>
        </Box>

        {aiProviders.length === 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            You need to configure at least one AI provider before creating bots.
          </Alert>
        )}

        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Bot</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Provider</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Visibility</TableCell>
                <TableCell>Datasets</TableCell>
                <TableCell>Config</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <SmartToy sx={{ fontSize: 48, color: 'text.secondary' }} />
                      <Typography variant="h6" color="text.secondary">
                        No bots found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Create your first bot to get started
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                bots.map((bot) => (
                  <TableRow 
                    key={bot.id} 
                    hover 
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/bots/${bot.id}`)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <SmartToy sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {bot.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {bot.id.slice(0, 8)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {bot.description || '-'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {getProviderName(bot.tenant_ai_provider_id)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {bot.model}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={bot.is_active ? 'Active' : 'Inactive'} 
                        color={bot.is_active ? 'success' : 'default'}
                        size="small"
                        variant={bot.is_active ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    
                    <TableCell>
                      {bot.is_public ? (
                        <Chip 
                          label="Public" 
                          color="info"
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Chip 
                          label="Private" 
                          color="default"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {bot.datasets && bot.datasets.length > 0 ? (
                        <Tooltip 
                          title={bot.datasets.map(d => d.name).join(', ')}
                          arrow
                        >
                          <Chip
                            label={`${bot.datasets.length} dataset${bot.datasets.length > 1 ? 's' : ''}`}
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          None
                        </Typography>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Temp: {bot.temperature}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tokens: {bot.max_tokens}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(bot.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: '2-digit'
                        })}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, bot);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Bot Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => router.push(`/bots/${selectedBot?.id}`)}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            View Details
          </MenuItem>
          <MenuItem onClick={() => {
            handleMenuClose();
            router.push(`/bots/${selectedBot?.id}/edit`);
          }}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            Edit Bot
          </MenuItem>
          <MenuItem onClick={() => handleToggleStatus(selectedBot!)}>
            <ListItemIcon>
              {selectedBot?.is_active ? 
                <Pause fontSize="small" /> : <PlayArrow fontSize="small" />
              }
            </ListItemIcon>
            {selectedBot?.is_active ? 'Deactivate' : 'Activate'}
          </MenuItem>
          <MenuItem onClick={() => openDeleteDialog(selectedBot!)}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            Delete Bot
          </MenuItem>
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Bot</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{selectedBot?.name}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleDeleteBot}
              disabled={saving}
            >
              {saving ? <CircularProgress size={20} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success/Error Snackbars */}
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
          open={!!error} 
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