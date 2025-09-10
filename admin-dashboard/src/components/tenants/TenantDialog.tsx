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
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  SmartToy as BotIcon,
  CloudQueue as ProviderIcon,
  ExpandMore,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
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
  
  // Fetch detailed tenant information for view mode
  const { data: tenantDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['tenant-details', tenant?.id],
    queryFn: () => tenantService.getTenantDetails(tenant!.id),
    enabled: mode === 'view' && !!tenant?.id && open,
  });

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

  // Show detailed view for view mode
  if (mode === 'view') {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" component="h2">
              {tenant?.name || 'Tenant Details'}
            </Typography>
            <Chip
              label={tenant?.is_active ? 'Active' : 'Inactive'}
              color={tenant?.is_active ? 'success' : 'error'}
              size="small"
            />
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {detailsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        Basic Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Tenant Name
                            </Typography>
                            <Typography variant="body1" fontWeight={500}>
                              {tenant?.name || 'N/A'}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Slug
                            </Typography>
                            <Typography variant="body1" fontWeight={500}>
                              {tenant?.slug || 'N/A'}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Description
                            </Typography>
                            <Typography variant="body1">
                              {tenant?.description || 'No description provided'}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Owner Email
                            </Typography>
                            <Typography variant="body1">
                              {tenant?.owner_email || 'N/A'}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Subscription Plan
                            </Typography>
                            <Chip
                              label={tenant?.plan?.toUpperCase() || 'FREE'}
                              color={tenant?.plan === 'enterprise' ? 'primary' : tenant?.plan === 'pro' ? 'secondary' : 'default'}
                              variant="outlined"
                            />
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Rate Limit (per hour)
                            </Typography>
                            <Typography variant="body1">
                              {tenant?.global_rate_limit?.toLocaleString() || '1,000'} requests
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Created At
                            </Typography>
                            <Typography variant="body1">
                              {tenant?.created_at ? new Date(tenant.created_at).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Usage Statistics */}
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
                        Usage Statistics
                      </Typography>
                      <Grid container spacing={1.5}>
                        <Grid item xs={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'primary.main', borderRadius: 1, color: 'white' }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>
                              {tenantDetails?.stats?.total_chats || 0}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.9 }}>
                              Total Chats
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'secondary.main', borderRadius: 1, color: 'white' }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>
                              {tenantDetails?.stats?.total_messages || 0}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.9 }}>
                              Messages
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'success.main', borderRadius: 1, color: 'white' }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>
                              {tenantDetails?.stats?.active_users || 0}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.9 }}>
                              Active Users
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'warning.main', borderRadius: 1, color: 'white' }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>
                              {tenantDetails?.stats?.storage_used_mb || 0}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.9 }}>
                              MB Used
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Bots */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, fontSize: '1rem' }}>
                        <BotIcon fontSize="small" />
                        Bots ({tenantDetails?.bots?.length || 0})
                      </Typography>
                      {tenantDetails?.bots?.length ? (
                        <Box sx={{ '& > *:not(:last-child)': { mb: 1 } }}>
                          {tenantDetails.bots.map((bot) => (
                            <Box key={bot.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                              {bot.is_active ? <CheckCircle color="success" sx={{ fontSize: 16 }} /> : <Cancel color="error" sx={{ fontSize: 16 }} />}
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                                  {bot.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                  {bot.model} • {bot.ai_provider_name}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2, fontStyle: 'italic' }}>
                          No bots configured
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* AI Providers */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, fontSize: '1rem' }}>
                        <ProviderIcon fontSize="small" />
                        AI Providers ({tenantDetails?.ai_providers?.length || 0})
                      </Typography>
                      {tenantDetails?.ai_providers?.length ? (
                        <Box sx={{ '& > *:not(:last-child)': { mb: 1 } }}>
                          {tenantDetails.ai_providers.map((provider) => (
                            <Box key={provider.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                              {provider.is_active ? <CheckCircle color="success" sx={{ fontSize: 16 }} /> : <Cancel color="error" sx={{ fontSize: 16 }} />}
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                                  {provider.provider_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                  Added: {new Date(provider.created_at).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2, fontStyle: 'italic' }}>
                          No AI providers configured
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Configuration */}
                <Grid item xs={12}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Advanced Configuration
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Settings
                          </Typography>
                          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, fontFamily: 'monospace' }}>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                              {JSON.stringify(tenant?.settings || {}, null, 2)}
                            </pre>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Feature Flags
                          </Typography>
                          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, fontFamily: 'monospace' }}>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                              {JSON.stringify(tenant?.feature_flags || {}, null, 2)}
                            </pre>
                          </Box>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

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


          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}