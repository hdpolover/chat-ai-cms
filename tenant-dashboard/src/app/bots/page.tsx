'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
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
  const [bots, setBots] = useState<Bot[]>([]);
  const [aiProviders, setAiProviders] = useState<TenantAIProvider[]>([]);
  const [availableDatasets, setAvailableDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [newBot, setNewBot] = useState<CreateBotRequest & { dataset_ids?: string[] }>({
    name: '',
    description: '',
    tenant_ai_provider_id: '',
    model: '',
    system_prompt: '',
    temperature: 0.7,
    max_tokens: 1000,
    settings: {},
    is_public: false,
    allowed_domains: [],
    dataset_ids: [],
  });

  const [editBot, setEditBot] = useState<Partial<Bot> & { dataset_ids?: string[] }>({});

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

  const handleCreateBot = async () => {
    try {
      setSaving(true);
      await BotService.createBot(newBot);
      setCreateDialogOpen(false);
      setNewBot({
        name: '',
        description: '',
        tenant_ai_provider_id: '',
        model: '',
        system_prompt: '',
        temperature: 0.7,
        max_tokens: 1000,
        settings: {},
        is_public: false,
        allowed_domains: [],
        dataset_ids: [],
      });
      await loadData();
      setSuccess('Bot created successfully');
    } catch (error) {
      console.error('Failed to create bot:', error);
      setError('Failed to create bot');
    } finally {
      setSaving(false);
    }
  };

  const handleEditBot = async () => {
    if (!selectedBot) return;
    
    try {
      setSaving(true);
      await BotService.updateBot(selectedBot.id, editBot);
      setEditDialogOpen(false);
      setEditBot({});
      await loadData();
      setSuccess('Bot updated successfully');
    } catch (error) {
      console.error('Failed to update bot:', error);
      setError('Failed to update bot');
    } finally {
      setSaving(false);
    }
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

  const openEditDialog = (bot: Bot) => {
    setSelectedBot(bot);
    setEditBot({
      name: bot.name,
      description: bot.description,
      tenant_ai_provider_id: bot.tenant_ai_provider_id,
      model: bot.model,
      system_prompt: bot.system_prompt,
      temperature: bot.temperature,
      max_tokens: bot.max_tokens,
      settings: bot.settings,
      is_public: bot.is_public,
      allowed_domains: bot.allowed_domains,
      dataset_ids: bot.datasets?.map(d => d.id) || [],
    });
    setEditDialogOpen(true);
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
            onClick={() => setCreateDialogOpen(true)}
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

        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: 3
        }}>
          {bots.map((bot) => (
            <Card key={bot.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SmartToy sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {bot.name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={bot.is_active ? 'Active' : 'Inactive'} 
                        color={bot.is_active ? 'success' : 'default'}
                        size="small"
                      />
                      {bot.is_public && (
                        <Chip 
                          label="Public" 
                          color="info"
                          size="small"
                        />
                      )}
                      <IconButton 
                        size="small"
                        onClick={(e) => handleMenuOpen(e, bot)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  {bot.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {bot.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Model: {bot.model}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Provider: {getProviderName(bot.tenant_ai_provider_id)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Temperature: {bot.temperature} • Max Tokens: {bot.max_tokens}
                    </Typography>
                    {bot.datasets && bot.datasets.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Knowledge Datasets:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {bot.datasets.map((dataset) => (
                            <Chip
                              key={dataset.id}
                              label={dataset.name}
                              size="small"
                              variant="outlined"
                              color="info"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                    <Typography variant="caption" color="text.secondary">
                      Created {new Date(bot.created_at).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Updated {new Date(bot.updated_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
        </Box>

        {/* Bot Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            View Details
          </MenuItem>
          <MenuItem onClick={() => openEditDialog(selectedBot!)}>
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

        {/* Create Bot Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Bot</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <TextField
                label="Bot Name"
                value={newBot.name}
                onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
                fullWidth
                required
              />
              
              <TextField
                label="Description"
                value={newBot.description || ''}
                onChange={(e) => setNewBot({ ...newBot, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
              
              <FormControl fullWidth required>
                <InputLabel>AI Provider</InputLabel>
                <Select
                  value={newBot.tenant_ai_provider_id}
                  label="AI Provider"
                  onChange={(e) => {
                    const providerId = e.target.value;
                    setNewBot({ 
                      ...newBot, 
                      tenant_ai_provider_id: providerId,
                      model: '' // Reset model when provider changes
                    });
                  }}
                >
                  {aiProviders.map((provider) => (
                    <MenuItem key={provider.id} value={provider.id}>
                      {provider.provider_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth required disabled={!newBot.tenant_ai_provider_id}>
                <InputLabel>Model</InputLabel>
                <Select
                  value={newBot.model}
                  label="Model"
                  onChange={(e) => setNewBot({ ...newBot, model: e.target.value })}
                >
                  {getAvailableModels(newBot.tenant_ai_provider_id).map((model: string) => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="System Prompt"
                value={newBot.system_prompt || ''}
                onChange={(e) => setNewBot({ ...newBot, system_prompt: e.target.value })}
                fullWidth
                multiline
                rows={4}
                placeholder="Enter instructions for how the bot should behave..."
              />

              <Box>
                <Typography gutterBottom>Temperature: {newBot.temperature}</Typography>
                <Slider
                  value={newBot.temperature || 0.7}
                  onChange={(_, value) => setNewBot({ ...newBot, temperature: value as number })}
                  min={0}
                  max={2}
                  step={0.1}
                  marks={[
                    { value: 0, label: '0 (Focused)' },
                    { value: 1, label: '1 (Balanced)' },
                    { value: 2, label: '2 (Creative)' }
                  ]}
                />
              </Box>

              <TextField
                label="Max Tokens"
                type="number"
                value={newBot.max_tokens || 1000}
                onChange={(e) => setNewBot({ ...newBot, max_tokens: parseInt(e.target.value) || 1000 })}
                fullWidth
                inputProps={{ min: 1, max: 4096 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={newBot.is_public || false}
                    onChange={(e) => setNewBot({ ...newBot, is_public: e.target.checked })}
                  />
                }
                label="Public Bot (accessible to all users)"
              />

              {newBot.is_public && (
                <TextField
                  label="Allowed Domains (comma-separated)"
                  value={newBot.allowed_domains?.join(', ') || ''}
                  onChange={(e) => setNewBot({ 
                    ...newBot, 
                    allowed_domains: e.target.value.split(',').map(d => d.trim()).filter(d => d)
                  })}
                  fullWidth
                  placeholder="example.com, another.com"
                  helperText="Leave empty to allow all domains"
                />
              )}

              <FormControl fullWidth>
                <InputLabel>Knowledge Datasets</InputLabel>
                <Select
                  multiple
                  value={newBot.dataset_ids || []}
                  onChange={(e) => {
                    const value = typeof e.target.value === 'string' ? [e.target.value] : e.target.value;
                    setNewBot({ ...newBot, dataset_ids: value });
                  }}
                  input={<OutlinedInput label="Knowledge Datasets" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((datasetId) => {
                        const dataset = availableDatasets.find(d => d.id === datasetId);
                        return (
                          <Chip
                            key={datasetId}
                            label={dataset?.name || datasetId}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {availableDatasets.map((dataset) => (
                    <MenuItem key={dataset.id} value={dataset.id}>
                      <Box>
                        <Typography variant="body2">{dataset.name}</Typography>
                        {dataset.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {dataset.description}
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {availableDatasets.length === 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    No datasets available. Create datasets first to assign them to bots.
                  </Typography>
                )}
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCreateBot} 
              disabled={!newBot.name || !newBot.tenant_ai_provider_id || !newBot.model || saving}
            >
              {saving ? <CircularProgress size={20} /> : 'Create Bot'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Bot Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Bot</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <TextField
                label="Bot Name"
                value={editBot.name || ''}
                onChange={(e) => setEditBot({ ...editBot, name: e.target.value })}
                fullWidth
                required
              />
              
              <TextField
                label="Description"
                value={editBot.description || ''}
                onChange={(e) => setEditBot({ ...editBot, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
              
              <FormControl fullWidth required>
                <InputLabel>AI Provider</InputLabel>
                <Select
                  value={editBot.tenant_ai_provider_id || ''}
                  label="AI Provider"
                  onChange={(e) => {
                    const providerId = e.target.value;
                    setEditBot({ 
                      ...editBot, 
                      tenant_ai_provider_id: providerId,
                      model: '' // Reset model when provider changes
                    });
                  }}
                >
                  {aiProviders.map((provider) => (
                    <MenuItem key={provider.id} value={provider.id}>
                      {provider.provider_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth required disabled={!editBot.tenant_ai_provider_id}>
                <InputLabel>Model</InputLabel>
                <Select
                  value={editBot.model || ''}
                  label="Model"
                  onChange={(e) => setEditBot({ ...editBot, model: e.target.value })}
                >
                  {getAvailableModels(editBot.tenant_ai_provider_id || '').map((model: string) => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="System Prompt"
                value={editBot.system_prompt || ''}
                onChange={(e) => setEditBot({ ...editBot, system_prompt: e.target.value })}
                fullWidth
                multiline
                rows={4}
                placeholder="Enter instructions for how the bot should behave..."
              />

              <Box>
                <Typography gutterBottom>Temperature: {editBot.temperature || 0.7}</Typography>
                <Slider
                  value={editBot.temperature || 0.7}
                  onChange={(_, value) => setEditBot({ ...editBot, temperature: value as number })}
                  min={0}
                  max={2}
                  step={0.1}
                  marks={[
                    { value: 0, label: '0 (Focused)' },
                    { value: 1, label: '1 (Balanced)' },
                    { value: 2, label: '2 (Creative)' }
                  ]}
                />
              </Box>

              <TextField
                label="Max Tokens"
                type="number"
                value={editBot.max_tokens || 1000}
                onChange={(e) => setEditBot({ ...editBot, max_tokens: parseInt(e.target.value) || 1000 })}
                fullWidth
                inputProps={{ min: 1, max: 4096 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={editBot.is_public || false}
                    onChange={(e) => setEditBot({ ...editBot, is_public: e.target.checked })}
                  />
                }
                label="Public Bot (accessible to all users)"
              />

              {editBot.is_public && (
                <TextField
                  label="Allowed Domains (comma-separated)"
                  value={editBot.allowed_domains?.join(', ') || ''}
                  onChange={(e) => setEditBot({ 
                    ...editBot, 
                    allowed_domains: e.target.value.split(',').map(d => d.trim()).filter(d => d)
                  })}
                  fullWidth
                  placeholder="example.com, another.com"
                  helperText="Leave empty to allow all domains"
                />
              )}

              <FormControl fullWidth>
                <InputLabel>Knowledge Datasets</InputLabel>
                <Select
                  multiple
                  value={editBot.dataset_ids || []}
                  onChange={(e) => {
                    const value = typeof e.target.value === 'string' ? [e.target.value] : e.target.value;
                    setEditBot({ ...editBot, dataset_ids: value });
                  }}
                  input={<OutlinedInput label="Knowledge Datasets" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((datasetId) => {
                        const dataset = availableDatasets.find(d => d.id === datasetId);
                        return (
                          <Chip
                            key={datasetId}
                            label={dataset?.name || datasetId}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {availableDatasets.map((dataset) => (
                    <MenuItem key={dataset.id} value={dataset.id}>
                      <Box>
                        <Typography variant="body2">{dataset.name}</Typography>
                        {dataset.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {dataset.description}
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {availableDatasets.length === 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    No datasets available. Create datasets first to assign them to bots.
                  </Typography>
                )}
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleEditBot} 
              disabled={!editBot.name || !editBot.tenant_ai_provider_id || !editBot.model || saving}
            >
              {saving ? <CircularProgress size={20} /> : 'Update Bot'}
            </Button>
          </DialogActions>
        </Dialog>

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