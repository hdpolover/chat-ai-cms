'use client';
import { useState } from 'react';
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
  });

  const updateMutation = useMutation({
    mutationFn: settingsService.updateSystemSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      setSuccessMessage('Settings updated successfully');
      setErrorMessage(null);
    },
    onError: (error: any) => {
      setErrorMessage(error.message || 'Failed to update settings');
      setSuccessMessage(null);
    },
  });

  // Initialize form with fetched data
  useState(() => {
    if (settings) {
      reset(settings);
    }
  });

  const onSubmit = async (data: SystemSettingsFormData) => {
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      console.error('Failed to update settings:', error);
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
      <Alert severity="error">
        Failed to load system settings. Please try again.
      </Alert>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
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

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                General Settings
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    {...register('ai_provider_default')}
                    fullWidth
                    label="Default AI Provider"
                    error={!!errors.ai_provider_default}
                    helperText={errors.ai_provider_default?.message}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ pt: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          {...register('maintenance_mode')}
                          checked={watch('maintenance_mode')}
                        />
                      }
                      label="Maintenance Mode"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ pt: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          {...register('registration_enabled')}
                          checked={watch('registration_enabled')}
                        />
                      }
                      label="Allow New Registrations"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Plan Limits */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Plan Limits
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    {...register('max_tenants_per_plan.free', { valueAsNumber: true })}
                    fullWidth
                    label="Free Plan Tenant Limit"
                    type="number"
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
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rate Limits
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    {...register('rate_limits.requests_per_minute', { valueAsNumber: true })}
                    fullWidth
                    label="Requests per Minute"
                    type="number"
                    error={!!errors.rate_limits?.requests_per_minute}
                    helperText={errors.rate_limits?.requests_per_minute?.message}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    {...register('rate_limits.tokens_per_day', { valueAsNumber: true })}
                    fullWidth
                    label="Tokens per Day"
                    type="number"
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
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              sx={{ minWidth: 120 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}