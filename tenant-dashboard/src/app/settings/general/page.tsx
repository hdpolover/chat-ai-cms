'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
} from '@mui/material';
import {
  Save,
  Notifications,
  Security,
  Language,
} from '@mui/icons-material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TenantLayout from '@/components/layout/TenantLayout';

interface GeneralSettings {
  tenantName: string;
  description: string;
  contactEmail: string;
  timezone: string;
  language: string;
  emailNotifications: boolean;
  webhookNotifications: boolean;
  publicAccess: boolean;
  rateLimitEnabled: boolean;
  rateLimitPerHour: number;
}

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<GeneralSettings>({
    tenantName: '',
    description: '',
    contactEmail: '',
    timezone: 'UTC',
    language: 'en',
    emailNotifications: true,
    webhookNotifications: false,
    publicAccess: true,
    rateLimitEnabled: true,
    rateLimitPerHour: 1000,
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    setSettings({
      tenantName: 'My Company Bot',
      description: 'Customer support and sales assistance bots',
      contactEmail: 'admin@company.com',
      timezone: 'America/New_York',
      language: 'en',
      emailNotifications: true,
      webhookNotifications: false,
      publicAccess: true,
      rateLimitEnabled: true,
      rateLimitPerHour: 1000,
    });
  }, []);

  const handleSettingChange = (field: keyof GeneralSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Implement save API call
      console.log('Saving settings:', settings);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <TenantLayout>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              General Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your account and application settings
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>

        {hasChanges && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You have unsaved changes. Don't forget to save them.
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Basic Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                <Language sx={{ mr: 1 }} />
                Basic Information
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Tenant Name"
                  value={settings.tenantName}
                  onChange={(e) => handleSettingChange('tenantName', e.target.value)}
                  fullWidth
                  helperText="The name of your organization or project"
                />
                
                <TextField
                  label="Description"
                  value={settings.description}
                  onChange={(e) => handleSettingChange('description', e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  helperText="A brief description of your use case"
                />
                
                <TextField
                  label="Contact Email"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                  fullWidth
                  helperText="Primary contact email for this account"
                />
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Timezone"
                    value={settings.timezone}
                    onChange={(e) => handleSettingChange('timezone', e.target.value)}
                    fullWidth
                    select
                    SelectProps={{ native: true }}
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </TextField>
                  
                  <TextField
                    label="Language"
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    fullWidth
                    select
                    SelectProps={{ native: true }}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                  </TextField>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                <Notifications sx={{ mr: 1 }} />
                Notifications
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    />
                  }
                  label="Email Notifications"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
                  Receive email alerts for important events and updates
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.webhookNotifications}
                      onChange={(e) => handleSettingChange('webhookNotifications', e.target.checked)}
                    />
                  }
                  label="Webhook Notifications"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
                  Send real-time notifications to your webhook endpoints
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Access & Security */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                <Security sx={{ mr: 1 }} />
                Access & Security
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.publicAccess}
                        onChange={(e) => handleSettingChange('publicAccess', e.target.checked)}
                      />
                    }
                    label="Public Access"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
                    Allow public access to your bots without authentication
                  </Typography>
                </Box>
                
                <Divider />
                
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.rateLimitEnabled}
                        onChange={(e) => handleSettingChange('rateLimitEnabled', e.target.checked)}
                      />
                    }
                    label="Rate Limiting"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -1, mb: 2 }}>
                    Enable rate limiting to prevent abuse
                  </Typography>
                  
                  {settings.rateLimitEnabled && (
                    <TextField
                      label="Requests per Hour"
                      type="number"
                      value={settings.rateLimitPerHour}
                      onChange={(e) => handleSettingChange('rateLimitPerHour', parseInt(e.target.value))}
                      sx={{ ml: 4, maxWidth: 200 }}
                      helperText="Maximum requests per hour per IP"
                    />
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </TenantLayout>
    </ProtectedRoute>
  );
}