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
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Settings as SettingsIcon,
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

  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      name: '',
      type: 'openai',
      is_active: true,
      is_default: false,
      config: {},
    },
  });

  const handleAddProvider = () => {
    setEditingProvider(null);
    reset();
    setDialogOpen(true);
  };

  const handleEditProvider = (provider: AIProvider) => {
    setEditingProvider(provider);
    setValue('name', provider.name);
    setValue('type', provider.type);
    setValue('is_active', provider.is_active);
    setValue('is_default', provider.is_default);
    setDialogOpen(true);
  };

  const handleDeleteProvider = (provider: AIProvider) => {
    setProviderToDelete(provider);
    setDeleteDialogOpen(true);
  };

  const onSubmit = async (data: any) => {
    try {
      if (editingProvider) {
        await updateMutation.mutateAsync({
          id: editingProvider.id,
          data,
        });
      } else {
        await createMutation.mutateAsync(data);
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
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">AI Providers</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddProvider}
        >
          Add Provider
        </Button>
      </Box>

      {/* Providers Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Default</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : providers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
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
              
              <Grid item xs={12}>
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
              
              <Grid item xs={12}>
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