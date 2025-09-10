'use client';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Divider,
  Alert,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { tenantService } from '@/services/tenant';
import type { Tenant, TenantFormData } from '@/types';

const tenantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  owner_email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  plan: z.enum(['free', 'pro', 'enterprise']),
  is_active: z.boolean(),
  global_rate_limit: z.number().min(1).max(10000).optional(),
  settings: z.record(z.any()).optional(),
  feature_flags: z.record(z.any()).optional(),
});

interface TenantDialogProps {
  open: boolean;
  mode: 'create' | 'edit' | 'view';
  tenant?: Tenant | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TenantDialog({
  open,
  mode,
  tenant,
  onClose,
  onSuccess,
}: TenantDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      owner_email: '',
      plan: 'free',
      is_active: true,
      global_rate_limit: 1000,
      settings: {},
      feature_flags: {},
    },
  });

  const createMutation = useMutation({
    mutationFn: tenantService.createTenant,
    onSuccess: () => {
      setSubmitError(null);
      onSuccess();
      reset();
    },
    onError: (error: any) => {
      setSubmitError(error.response?.data?.message || error.message || 'Failed to create tenant');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TenantFormData> }) =>
      tenantService.updateTenant(id, data),
    onSuccess: () => {
      setSubmitError(null);
      onSuccess();
    },
    onError: (error: any) => {
      setSubmitError(error.response?.data?.message || error.message || 'Failed to update tenant');
    },
  });

  useEffect(() => {
    if (tenant && (mode === 'edit' || mode === 'view')) {
      setValue('name', tenant.name);
      setValue('slug', tenant.slug);
      setValue('description', tenant.description || '');
      setValue('owner_email', tenant.owner_email || '');
      setValue('plan', tenant.plan);
      setValue('is_active', tenant.is_active);
      setValue('global_rate_limit', tenant.global_rate_limit || 1000);
      setValue('settings', tenant.settings || {});
      setValue('feature_flags', tenant.feature_flags || {});
    } else {
      reset();
    }
    // Clear any previous errors when dialog opens/closes
    setSubmitError(null);
  }, [tenant, mode, setValue, reset, open]);

  const onSubmit = async (data: TenantFormData) => {
    setIsLoading(true);
    setSubmitError(null);
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(data);
      } else if (mode === 'edit' && tenant) {
        await updateMutation.mutateAsync({ id: tenant.id, data });
      }
    } catch (error) {
      // Error is handled by mutation onError callbacks
      console.error('Form submission failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    setValue('name', name);
    
    // Auto-generate slug from name
    if (mode === 'create') {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setValue('slug', slug);
    }
  };

  const getDialogTitle = () => {
    switch (mode) {
      case 'create':
        return 'Create New Tenant';
      case 'edit':
        return 'Edit Tenant';
      case 'view':
        return 'Tenant Details';
      default:
        return 'Tenant';
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{getDialogTitle()}</DialogTitle>
      
      <DialogContent>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        <Box component="form" sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                {...register('name')}
                fullWidth
                label="Tenant Name"
                error={!!errors.name}
                helperText={errors.name?.message}
                disabled={isReadOnly}
                onChange={handleNameChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                {...register('slug')}
                fullWidth
                label="Slug"
                error={!!errors.slug}
                helperText={errors.slug?.message || 'Used in URLs (e.g., tenant-name)'}
                disabled={isReadOnly}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                {...register('description')}
                fullWidth
                label="Description"
                multiline
                rows={3}
                error={!!errors.description}
                helperText={errors.description?.message}
                disabled={isReadOnly}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                {...register('owner_email')}
                fullWidth
                label="Owner Email"
                type="email"
                error={!!errors.owner_email}
                helperText={errors.owner_email?.message}
                disabled={isReadOnly}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={isReadOnly}>
                <InputLabel>Plan</InputLabel>
                <Select
                  {...register('plan')}
                  value={watch('plan')}
                  label="Plan"
                >
                  <MenuItem value="free">Free</MenuItem>
                  <MenuItem value="pro">Pro</MenuItem>
                  <MenuItem value="enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                {...register('global_rate_limit', { valueAsNumber: true })}
                fullWidth
                label="Global Rate Limit"
                type="number"
                InputProps={{ inputProps: { min: 1, max: 10000 } }}
                error={!!errors.global_rate_limit}
                helperText={errors.global_rate_limit?.message || 'API requests per hour'}
                disabled={isReadOnly}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    {...register('is_active')}
                    checked={watch('is_active')}
                    disabled={isReadOnly}
                  />
                }
                label="Active"
              />
            </Grid>
            
            {!isReadOnly && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h6" gutterBottom>
                    Advanced Configuration
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Settings (JSON)"
                    multiline
                    rows={4}
                    value={JSON.stringify(watch('settings') || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setValue('settings', parsed);
                      } catch (error) {
                        // Invalid JSON - user is still typing
                      }
                    }}
                    helperText="JSON object for tenant-specific settings"
                    disabled={isReadOnly}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Feature Flags (JSON)"
                    multiline
                    rows={4}
                    value={JSON.stringify(watch('feature_flags') || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setValue('feature_flags', parsed);
                      } catch (error) {
                        // Invalid JSON - user is still typing
                      }
                    }}
                    helperText="JSON object for feature toggles"
                    disabled={isReadOnly}
                  />
                </Grid>
              </>
            )}

            {mode === 'view' && tenant && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Usage Statistics
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {tenant.usage_stats?.total_chats || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Chats
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {tenant.usage_stats?.total_messages || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Messages
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {tenant.usage_stats?.active_users || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Users
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {tenant.usage_stats?.storage_used_mb || 0} MB
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Storage Used
                    </Typography>
                  </Box>
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          {mode === 'view' ? 'Close' : 'Cancel'}
        </Button>
        
        {!isReadOnly && (
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}