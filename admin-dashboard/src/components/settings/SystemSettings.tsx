'use client';
import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services';
import type { SystemSettingsFormData } from '@/types';

const systemSettingsSchema = z.object({
  ai_provider_default: z.string().min(1, 'Default AI provider is required'),
  max_tenants_per_plan: z.object({
    free: z.number().min(0, 'Must be 0 or greater'),
    pro: z.number().min(0, 'Must be 0 or greater'),
    enterprise: z.number().min(0, 'Must be 0 or greater'),
  }),
  rate_limits: z.object({
    requests_per_minute: z.number().min(1, 'Must be at least 1'),
    tokens_per_day: z.number().min(1, 'Must be at least 1'),
  }),
  maintenance_mode: z.boolean(),
  registration_enabled: z.boolean(),
});

export default function SystemSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const {
    data: settings,
    isLoading: settingsLoading,
    error: settingsError,
  } = useQuery({
    queryKey: ['system-settings'],
    queryFn: settingsService.getSystemSettings,
    retry: 3,
    retryDelay: 1000,
  });
  
  // Debug logging
  console.log('SystemSettings Debug:', {
    settings,
    settingsLoading,
    settingsError,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<SystemSettingsFormData>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      ai_provider_default: '',
      max_tenants_per_plan: {
        free: 1,
        pro: 10,
        enterprise: 100,
      },
      rate_limits: {
        requests_per_minute: 60,
        tokens_per_day: 10000,
      },
      maintenance_mode: false,
      registration_enabled: true,
    },
  });

  const updateMutation = useMutation({
    mutationFn: settingsService.updateSystemSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      setSuccessMessage('Settings updated successfully');
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    },
    onError: (error: any) => {
      let errorMessage = error.message || 'Failed to update settings';
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        errorMessage = 'Only super administrators can update system settings. Please login with a super admin account.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
      }
      
      setErrorMessage(errorMessage);
      setSuccessMessage(null);
    },
  });

  // Initialize form with fetched data
  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const onSubmit = async (data: SystemSettingsFormData) => {
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      console.error('Failed to update settings:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  if (settingsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (settingsError) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Failed to load system settings. Error: {(settingsError as any)?.message || 'Unknown error'}
        <Button 
          size="small" 
          onClick={() => window.location.reload()} 
          sx={{ ml: 2 }}
        >
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ mb: 0.5, fontWeight: 600 }}>
          System Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure global system preferences and operational settings
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Note:</strong> Only super administrators can modify system settings. 
          If you need to make changes, please login with a super admin account 
          (admin@example.com with password: admin123).
        </Alert>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
        )}

        <Grid container spacing={2}>
        {/* General Settings */}
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                General Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure core system settings and operational preferences
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    {...register('ai_provider_default')}
                    fullWidth
                    label="Default AI Provider"
                    size="small"
                    error={!!errors.ai_provider_default}
                    helperText={errors.ai_provider_default?.message}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'grey.50', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}>
                    <FormControlLabel
                      control={
                        <Switch
                          {...register('maintenance_mode')}
                          checked={watch('maintenance_mode')}
                          size="small"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            Maintenance Mode
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Disable system access for maintenance
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'grey.50', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}>
                    <FormControlLabel
                      control={
                        <Switch
                          {...register('registration_enabled')}
                          checked={watch('registration_enabled')}
                          size="small"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            Allow New Registrations
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Enable new user account creation
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Plan Limits */}
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Plan Limits
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure maximum tenant limits for each subscription plan
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    {...register('max_tenants_per_plan.free', { valueAsNumber: true })}
                    fullWidth
                    label="Free Plan Tenant Limit"
                    type="number"
                    size="small"
                    error={!!errors.max_tenants_per_plan?.free}
                    helperText={errors.max_tenants_per_plan?.free?.message}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    {...register('max_tenants_per_plan.pro', { valueAsNumber: true })}
                    fullWidth
                    label="Pro Plan Tenant Limit"
                    type="number"
                    size="small"
                    error={!!errors.max_tenants_per_plan?.pro}
                    helperText={errors.max_tenants_per_plan?.pro?.message}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    {...register('max_tenants_per_plan.enterprise', { valueAsNumber: true })}
                    fullWidth
                    label="Enterprise Plan Tenant Limit"
                    type="number"
                    size="small"
                    error={!!errors.max_tenants_per_plan?.enterprise}
                    helperText={errors.max_tenants_per_plan?.enterprise?.message}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Rate Limits */}
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Rate Limits
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure API rate limiting to prevent abuse and ensure system stability
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    {...register('rate_limits.requests_per_minute', { valueAsNumber: true })}
                    fullWidth
                    label="Requests Per Minute"
                    type="number"
                    size="small"
                    error={!!errors.rate_limits?.requests_per_minute}
                    helperText={errors.rate_limits?.requests_per_minute?.message}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    {...register('rate_limits.tokens_per_day', { valueAsNumber: true })}
                    fullWidth
                    label="Tokens Per Day"
                    type="number"
                    size="small"
                    error={!!errors.rate_limits?.tokens_per_day}
                    helperText={errors.rate_limits?.tokens_per_day?.message}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Actions */}
        <Grid item xs={12}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            pt: 1,
            mt: 2,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              size="medium"
              sx={{ minWidth: 120, borderRadius: 2 }}
            >
              {isLoading ? <CircularProgress size={16} /> : 'Save Changes'}
            </Button>
          </Box>
        </Grid>
      </Grid>
      </Box>
    </Box>
  );
}