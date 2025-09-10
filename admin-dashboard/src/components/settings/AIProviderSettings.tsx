'use client';
import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Collapse,
  AccordionSummary,
  AccordionDetails,
  Accordion,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Settings as SettingsIcon,
  ExpandMore,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { settingsService } from '@/services';
import type { AIProvider } from '@/types';

export default function AIProviderSettings() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<AIProvider | null>(null);

  const queryClient = useQueryClient();

  const {
    data: providers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: settingsService.getAIProviders,
    retry: 3,
    retryDelay: 1000,
  });

  // Debug logging
  console.log('AIProviders Debug:', {
    providers,
    isLoading,
    error,
  });

  const createMutation = useMutation({
    mutationFn: settingsService.createAIProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
      setDialogOpen(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AIProvider> }) =>
      settingsService.updateAIProvider(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
      setDialogOpen(false);
      setEditingProvider(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: settingsService.deleteAIProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
      setDeleteDialogOpen(false);
      setProviderToDelete(null);
    },
  });

  const { register, handleSubmit, reset, formState: { errors }, setValue, watch, getValues } = useForm({
    defaultValues: {
      name: '',
      type: 'openai',
      is_active: true,
      is_default: false,
      config: {
        base_url: '',
        api_key: '',
        models: '',
        max_tokens: '',
      },
    },
  });

  // Debug form values
  const formValues = watch();
  console.log('Form values:', formValues);

  const handleAddProvider = () => {
    setEditingProvider(null);
    reset();
    setDialogOpen(true);
  };

  const handleEditProvider = (provider: AIProvider) => {
    setEditingProvider(provider);
    
    // Reset form with provider data
    const formData = {
      name: provider.name,
      type: provider.type,
      is_active: provider.is_active,
      is_default: provider.is_default,
      config: {
        base_url: provider.config?.base_url || '',
        api_key: '', // Don't pre-fill API key for security
        models: Array.isArray(provider.config?.models) ? provider.config.models.join(', ') : '',
        max_tokens: provider.config?.max_tokens?.toString() || '',
      },
    };
    
    reset(formData);
    setDialogOpen(true);
  };

  const handleDeleteProvider = (provider: AIProvider) => {
    setProviderToDelete(provider);
    setDeleteDialogOpen(true);
  };

  const onSubmit = async (data: any) => {
    try {
      // Process config data
      const processedData = {
        ...data,
        config: {
          base_url: data.config?.base_url || '',
          ...(data.config?.api_key && { api_key: data.config.api_key }), // Only include if provided
          models: data.config?.models ? data.config.models.split(',').map((m: string) => m.trim()).filter(Boolean) : [],
          ...(data.config?.max_tokens && { max_tokens: parseInt(data.config.max_tokens) }),
        },
      };

      if (editingProvider) {
        await updateMutation.mutateAsync({
          id: editingProvider.id,
          data: processedData,
        });
      } else {
        await createMutation.mutateAsync(processedData);
      }
    } catch (error) {
      console.error('Failed to save provider:', error);
    }
  };

  const handleConfirmDelete = async () => {
    if (providerToDelete) {
      try {
        await deleteMutation.mutateAsync(providerToDelete.id);
      } catch (error) {
        console.error('Failed to delete provider:', error);
      }
    }
  };

  const getProviderTypeColor = (type: string) => {
    switch (type) {
      case 'openai':
        return 'primary';
      case 'anthropic':
        return 'secondary';
      case 'azure':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h5" component="h1" sx={{ mb: 0.5, fontWeight: 600 }}>
              AI Providers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure and manage AI provider connections and settings
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddProvider}
            size="medium"
            sx={{ borderRadius: 2 }}
          >
            Add Provider
          </Button>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load AI providers: {(error as any)?.message || 'Unknown error'}
        </Alert>
      )}

      {/* Providers Table */}
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Default</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 2 }}>Configuration</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, py: 2 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : providers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No AI providers configured
                    </TableCell>
                  </TableRow>
                ) : (
                  providers.map((provider) => (
                    <TableRow key={provider.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {provider.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={provider.type.toUpperCase()}
                          color={getProviderTypeColor(provider.type) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={provider.is_active ? 'Active' : 'Inactive'}
                          color={provider.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {provider.is_default && (
                          <Chip
                            label="Default"
                            color="primary"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ maxWidth: 200 }}>
                          {provider.config.base_url && (
                            <Typography variant="caption" display="block">
                              <strong>URL:</strong> {provider.config.base_url}
                            </Typography>
                          )}
                          {provider.config.models && provider.config.models.length > 0 && (
                            <Typography variant="caption" display="block">
                              <strong>Models:</strong> {provider.config.models.slice(0, 2).join(', ')}
                              {provider.config.models.length > 2 && ` (+${provider.config.models.length - 2} more)`}
                            </Typography>
                          )}
                          {provider.config.api_key && (
                            <Typography variant="caption" display="block" color="success.main">
                              <strong>API Key:</strong> ••••••••
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleEditProvider(provider)}
                          size="small"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteProvider(provider)}
                          size="small"
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Detailed Configuration View */}
      {providers.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Provider Configurations
          </Typography>
          
          {providers.map((provider) => (
            <Accordion key={provider.id} sx={{ mb: 1 }}>
              <AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls={`provider-${provider.id}-content`}
                id={`provider-${provider.id}-header`}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Typography variant="subtitle1" fontWeight={500}>
                    {provider.name}
                  </Typography>
                  <Chip
                    label={provider.type.toUpperCase()}
                    color={getProviderTypeColor(provider.type) as any}
                    size="small"
                  />
                  {provider.is_default && (
                    <Chip label="Default" color="primary" size="small" />
                  )}
                  <Chip
                    label={provider.is_active ? 'Active' : 'Inactive'}
                    color={provider.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  {provider.config?.base_url && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Base URL
                      </Typography>
                      <Typography variant="body1" fontFamily="monospace">
                        {provider.config.base_url}
                      </Typography>
                    </Grid>
                  )}
                  
                  {provider.config?.api_key && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        API Key
                      </Typography>
                      <Typography variant="body1" color="success.main">
                        ••••••••••••••••••••••••••••••••
                      </Typography>
                    </Grid>
                  )}
                  
                  {provider.config?.models && provider.config.models.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Supported Models
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {provider.config.models.map((model: string, index: number) => (
                          <Chip
                            key={index}
                            label={model}
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Box>
                    </Grid>
                  )}
                  
                  {provider.config?.max_tokens && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Max Tokens
                      </Typography>
                      <Typography variant="body1">
                        {provider.config.max_tokens.toLocaleString()}
                      </Typography>
                    </Grid>
                  )}

                  {provider.config?.temperature !== undefined && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Temperature
                      </Typography>
                      <Typography variant="body1">
                        {provider.config.temperature}
                      </Typography>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleEditProvider(provider)}
                      >
                        Edit Configuration
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => handleDeleteProvider(provider)}
                      >
                        Delete Provider
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProvider ? 'Edit AI Provider' : 'Add New AI Provider'}
        </DialogTitle>
        
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  {...register('name', { required: 'Name is required' })}
                  fullWidth
                  label="Provider Name"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Provider Type</InputLabel>
                  <Select
                    {...register('type')}
                    value={watch('type')}
                    label="Provider Type"
                  >
                    <MenuItem value="openai">OpenAI</MenuItem>
                    <MenuItem value="anthropic">Anthropic</MenuItem>
                    <MenuItem value="azure">Azure OpenAI</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Configuration Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Configuration
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  {...register('config.base_url')}
                  fullWidth
                  label="Base URL"
                  placeholder="https://api.openai.com"
                  helperText="API endpoint URL for this provider"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  {...register('config.api_key')}
                  fullWidth
                  label="API Key"
                  type="password"
                  placeholder="sk-..."
                  helperText="API key for authentication (leave blank to keep existing)"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  {...register('config.models')}
                  fullWidth
                  label="Supported Models"
                  placeholder="gpt-3.5-turbo,gpt-4,gpt-4o"
                  helperText="Comma-separated list of model names"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  {...register('config.max_tokens')}
                  fullWidth
                  label="Max Tokens"
                  type="number"
                  placeholder="4000"
                  helperText="Maximum tokens per request (optional)"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      {...register('is_active')}
                      checked={watch('is_active')}
                    />
                  }
                  label="Active"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      {...register('is_default')}
                      checked={watch('is_default')}
                    />
                  }
                  label="Set as Default"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
          >
            {editingProvider ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the AI provider "{providerToDelete?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}