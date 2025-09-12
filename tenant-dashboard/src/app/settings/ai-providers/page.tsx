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
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  CloudQueue,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Science,
} from '@mui/icons-material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TenantLayout from '@/components/layout/TenantLayout';
import { AIProviderService } from '@/services/aiProvider';
import { TenantAIProvider, CreateTenantAIProviderRequest } from '@/types';

export default function AIProvidersPage() {
  const [providers, setProviders] = useState<TenantAIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProvider, setSelectedProvider] = useState<TenantAIProvider | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [newProvider, setNewProvider] = useState<CreateTenantAIProviderRequest>({
    global_ai_provider_id: '1', // Default to OpenAI
    provider_name: '',
    api_key: '',
    custom_settings: {},
  });

  const [editProvider, setEditProvider] = useState({
    provider_name: '',
    api_key: '',
    custom_settings: {},
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const tenantProviders = await AIProviderService.getTenantAIProviders();
      setProviders(tenantProviders);
    } catch (error) {
      console.error('Failed to load AI providers:', error);
      setError('Failed to load AI providers');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, provider: TenantAIProvider) => {
    setAnchorEl(event.currentTarget);
    setSelectedProvider(provider);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProvider(null);
  };

  const handleCreateProvider = async () => {
    try {
      setSaving(true);
      await AIProviderService.createTenantAIProvider(newProvider);
      setCreateDialogOpen(false);
      setNewProvider({
        global_ai_provider_id: '1',
        provider_name: '',
        api_key: '',
        custom_settings: {},
      });
      await loadData();
      setSuccess('AI Provider created successfully');
    } catch (error) {
      console.error('Failed to create AI provider:', error);
      setError('Failed to create AI provider');
    } finally {
      setSaving(false);
    }
  };

  const handleEditProvider = async () => {
    if (!selectedProvider) return;
    
    try {
      setSaving(true);
      await AIProviderService.updateTenantAIProvider(selectedProvider.id, editProvider);
      setEditDialogOpen(false);
      setEditProvider({
        provider_name: '',
        api_key: '',
        custom_settings: {},
      });
      await loadData();
      setSuccess('AI Provider updated successfully');
    } catch (error) {
      console.error('Failed to update AI provider:', error);
      setError('Failed to update AI provider');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProvider = async () => {
    if (!selectedProvider) return;
    
    try {
      setSaving(true);
      await AIProviderService.deleteTenantAIProvider(selectedProvider.id);
      setDeleteDialogOpen(false);
      await loadData();
      setSuccess('AI Provider deleted successfully');
    } catch (error) {
      console.error('Failed to delete AI provider:', error);
      setError('Failed to delete AI provider');
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (provider: TenantAIProvider) => {
    setSelectedProvider(provider);
    setEditProvider({
      provider_name: provider.provider_name,
      api_key: '', // Don't pre-fill API key for security
      custom_settings: provider.custom_settings || {},
    });
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const openDeleteDialog = (provider: TenantAIProvider) => {
    setSelectedProvider(provider);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  const maskApiKey = (apiKey: string, visible: boolean) => {
    if (visible) return apiKey;
    return apiKey.substring(0, 8) + '•'.repeat(32);
  };

  const getAvailableModels = (customSettings: any) => {
    return customSettings?.supported_models || [];
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <TenantLayout>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        </TenantLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <TenantLayout>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              AI Providers
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configure and manage your AI provider connections
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ height: 'fit-content' }}
          >
            Add Provider
          </Button>
        </Box>

        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: 3
        }}>
          {providers.map((provider) => (
            <Card key={provider.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CloudQueue sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {provider.provider_name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={provider.is_active ? 'Active' : 'Inactive'} 
                      color={provider.is_active ? 'success' : 'default'}
                      size="small"
                    />
                    <IconButton 
                      size="small"
                      onClick={(e) => handleMenuOpen(e, provider)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    API Key:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', flexGrow: 1 }}>
                      •••••••••••••••••••••••••••••••••••••••••••••••••
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (Hidden for security)
                    </Typography>
                  </Box>
                </Box>

                {getAvailableModels(provider.custom_settings).length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Available Models:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {getAvailableModels(provider.custom_settings).slice(0, 3).map((model: string) => (
                        <Chip 
                          key={model}
                          label={model} 
                          size="small" 
                          variant="outlined"
                        />
                      ))}
                      {getAvailableModels(provider.custom_settings).length > 3 && (
                        <Chip 
                          label={`+${getAvailableModels(provider.custom_settings).length - 3} more`}
                          size="small" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                  <Typography variant="caption" color="text.secondary">
                    Created {new Date(provider.created_at).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Updated {new Date(provider.updated_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {providers.length === 0 && !loading && (
          <Card sx={{ p: 6, textAlign: 'center' }}>
            <CloudQueue sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No AI providers configured
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add your first AI provider to start creating chatbots
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Add Provider
            </Button>
          </Card>
        )}

        {/* Provider Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => openEditDialog(selectedProvider!)}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            Edit Provider
          </MenuItem>
          <MenuItem onClick={() => openDeleteDialog(selectedProvider!)}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            Delete Provider
          </MenuItem>
        </Menu>

        {/* Create Provider Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add AI Provider</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Provider Type</InputLabel>
                <Select
                  value={newProvider.global_ai_provider_id}
                  label="Provider Type"
                  onChange={(e) => setNewProvider({ 
                    ...newProvider, 
                    global_ai_provider_id: e.target.value
                  })}
                >
                  <MenuItem value="1">OpenAI</MenuItem>
                  <MenuItem value="2">Anthropic</MenuItem>
                  <MenuItem value="3">Google</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Provider Name"
                value={newProvider.provider_name}
                onChange={(e) => setNewProvider({ ...newProvider, provider_name: e.target.value })}
                fullWidth
                required
                helperText="A custom name for this provider instance"
              />
              
              <TextField
                label="API Key"
                type="password"
                value={newProvider.api_key}
                onChange={(e) => setNewProvider({ ...newProvider, api_key: e.target.value })}
                fullWidth
                required
                helperText="Your API key for this provider"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCreateProvider} 
              disabled={!newProvider.global_ai_provider_id || !newProvider.provider_name || !newProvider.api_key || saving}
            >
              {saving ? <CircularProgress size={20} /> : 'Add Provider'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Provider Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit AI Provider</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <TextField
                label="Provider Name"
                value={editProvider.provider_name}
                onChange={(e) => setEditProvider({ ...editProvider, provider_name: e.target.value })}
                fullWidth
                required
              />
              
              <TextField
                label="API Key"
                type="password"
                value={editProvider.api_key}
                onChange={(e) => setEditProvider({ ...editProvider, api_key: e.target.value })}
                fullWidth
                required
                helperText="Enter a new API key to update"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleEditProvider} 
              disabled={!editProvider.provider_name || !editProvider.api_key || saving}
            >
              {saving ? <CircularProgress size={20} /> : 'Update Provider'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete AI Provider</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{selectedProvider?.provider_name}"? 
              This will also delete all bots using this provider. This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleDeleteProvider}
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