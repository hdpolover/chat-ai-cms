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
  InputAdornment,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Security,
  Api,
  Key,
  Visibility,
  VisibilityOff,
  Save,
  Refresh,
  VpnKey,
  Shield,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const apiSecuritySchema = z.object({
  jwt_secret_key: z.string().min(32, 'JWT secret key must be at least 32 characters'),
  jwt_access_token_expire_minutes: z.number().min(1).max(10080), // Max 1 week
  jwt_refresh_token_expire_days: z.number().min(1).max(90), // Max 90 days
  cors_origins: z.string(),
  api_key_enabled: z.boolean(),
  api_key_header_name: z.string().min(1, 'API key header name is required'),
  rate_limit_enabled: z.boolean(),
  rate_limit_requests_per_minute: z.number().min(1).max(1000),
  rate_limit_requests_per_hour: z.number().min(1).max(10000),
  ip_whitelist_enabled: z.boolean(),
  ip_whitelist: z.string(),
  request_logging_enabled: z.boolean(),
  audit_logging_enabled: z.boolean(),
});

type ApiSecurityFormData = z.infer<typeof apiSecuritySchema>;

export default function ApiSecuritySettings() {
  const [showJwtSecret, setShowJwtSecret] = useState(false);
  const [jwtSecretGenerated, setJwtSecretGenerated] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ApiSecurityFormData>({
    resolver: zodResolver(apiSecuritySchema),
    defaultValues: {
      jwt_secret_key: 'your-super-secret-jwt-key-here-make-it-long-and-random-32-chars-minimum',
      jwt_access_token_expire_minutes: 30,
      jwt_refresh_token_expire_days: 7,
      cors_origins: 'http://localhost:3000,https://yourdomain.com',
      api_key_enabled: false,
      api_key_header_name: 'X-API-Key',
      rate_limit_enabled: true,
      rate_limit_requests_per_minute: 60,
      rate_limit_requests_per_hour: 1000,
      ip_whitelist_enabled: false,
      ip_whitelist: '',
      request_logging_enabled: true,
      audit_logging_enabled: true,
    },
  });

  const generateJwtSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue('jwt_secret_key', result, { shouldDirty: true });
    setJwtSecretGenerated(true);
    setTimeout(() => setJwtSecretGenerated(false), 3000);
  };

  const onSubmit = (data: ApiSecurityFormData) => {
    console.log('API Security settings:', data);
    // TODO: Implement API calls
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Shield />
          API & Security Settings
        </Typography>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSubmit(onSubmit)}
          disabled={!isDirty}
        >
          Save Changes
        </Button>
      </Box>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <strong>Important:</strong> Changes to security settings will affect all API access. 
        Make sure to update your applications accordingly.
      </Alert>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* JWT Configuration */}
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VpnKey fontSize="small" />
                  JWT Token Configuration
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="jwt_secret_key"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="JWT Secret Key"
                          fullWidth
                          type={showJwtSecret ? 'text' : 'password'}
                          error={!!errors.jwt_secret_key}
                          helperText={errors.jwt_secret_key?.message || 'Minimum 32 characters required'}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowJwtSecret(!showJwtSecret)}
                                  edge="end"
                                >
                                  {showJwtSecret ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                                <IconButton
                                  onClick={generateJwtSecret}
                                  edge="end"
                                  color="primary"
                                >
                                  <Refresh />
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                    {jwtSecretGenerated && (
                      <Chip
                        label="New secret generated!"
                        color="success"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="jwt_access_token_expire_minutes"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Access Token Expiry (minutes)"
                          type="number"
                          fullWidth
                          error={!!errors.jwt_access_token_expire_minutes}
                          helperText={errors.jwt_access_token_expire_minutes?.message}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="jwt_refresh_token_expire_days"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Refresh Token Expiry (days)"
                          type="number"
                          fullWidth
                          error={!!errors.jwt_refresh_token_expire_days}
                          helperText={errors.jwt_refresh_token_expire_days?.message}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* CORS Configuration */}
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Api fontSize="small" />
                  CORS Configuration
                </Typography>

                <Controller
                  name="cors_origins"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Allowed Origins"
                      fullWidth
                      multiline
                      rows={2}
                      helperText="Comma-separated list of allowed origins (e.g., http://localhost:3000,https://yourdomain.com)"
                      error={!!errors.cors_origins}
                    />
                  )}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* API Key Configuration */}
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Key fontSize="small" />
                  API Key Authentication
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="api_key_enabled"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch {...field} checked={field.value} />}
                          label="Enable API Key Authentication"
                        />
                      )}
                    />
                  </Grid>

                  {watch('api_key_enabled') && (
                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="api_key_header_name"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="API Key Header Name"
                            fullWidth
                            error={!!errors.api_key_header_name}
                            helperText={errors.api_key_header_name?.message}
                          />
                        )}
                      />
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Rate Limiting */}
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Security fontSize="small" />
                  Rate Limiting
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="rate_limit_enabled"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch {...field} checked={field.value} />}
                          label="Enable Rate Limiting"
                        />
                      )}
                    />
                  </Grid>

                  {watch('rate_limit_enabled') && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="rate_limit_requests_per_minute"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Requests per Minute"
                              type="number"
                              fullWidth
                              error={!!errors.rate_limit_requests_per_minute}
                              helperText={errors.rate_limit_requests_per_minute?.message}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="rate_limit_requests_per_hour"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Requests per Hour"
                              type="number"
                              fullWidth
                              error={!!errors.rate_limit_requests_per_hour}
                              helperText={errors.rate_limit_requests_per_hour?.message}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          )}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* IP Whitelist */}
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Shield fontSize="small" />
                  IP Whitelist
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="ip_whitelist_enabled"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch {...field} checked={field.value} />}
                          label="Enable IP Whitelist"
                        />
                      )}
                    />
                  </Grid>

                  {watch('ip_whitelist_enabled') && (
                    <Grid item xs={12}>
                      <Controller
                        name="ip_whitelist"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Whitelisted IP Addresses"
                            fullWidth
                            multiline
                            rows={3}
                            helperText="One IP address or CIDR block per line (e.g., 192.168.1.1, 10.0.0.0/24)"
                            error={!!errors.ip_whitelist}
                          />
                        )}
                      />
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Logging Settings */}
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Logging & Auditing
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="request_logging_enabled"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch {...field} checked={field.value} />}
                          label="Enable Request Logging"
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="audit_logging_enabled"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch {...field} checked={field.value} />}
                          label="Enable Audit Logging"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}