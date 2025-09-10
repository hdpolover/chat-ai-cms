'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
} from '@mui/material';
import { usePathname } from 'next/navigation';
import SystemSettings from './SystemSettings';
import AIProviderSettings from './AIProviderSettings';

const SettingsPage: React.FC = () => {
  const pathname = usePathname();

  const getPageTitle = () => {
    switch (pathname) {
      case '/settings/system':
        return 'System Settings';
      case '/settings/ai-providers':
        return 'AI Providers';
      case '/settings/users':
        return 'User Management';
      case '/settings/security':
        return 'API & Security';
      default:
        return 'Settings';
    }
  };

  const renderSettingContent = () => {
    switch (pathname) {
      case '/settings/system':
        return <SystemSettings />;
      case '/settings/ai-providers':
        return <AIProviderSettings />;
      case '/settings/users':
        return (
          <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" component="h1" sx={{ mb: 0.5, fontWeight: 600 }}>
                User Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage user accounts, roles, permissions, and access control
              </Typography>
            </Box>
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Coming Soon
              </Typography>
              <Typography color="text.secondary">
                User management features will be implemented here. This will include user roles, permissions, and access control settings.
              </Typography>
            </Paper>
          </Box>
        );
      case '/settings/security':
        return (
          <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" component="h1" sx={{ mb: 0.5, fontWeight: 600 }}>
                API & Security Settings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure API access, rate limiting, and security policies
              </Typography>
            </Box>
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Coming Soon
              </Typography>
              <Typography color="text.secondary">
                API configuration and security settings will be implemented here. This will include API keys, rate limiting, and security policies.
              </Typography>
            </Paper>
          </Box>
        );
      default:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Welcome to Settings
            </Typography>
            <Typography color="text.secondary">
              Please select a settings category from the navigation menu.
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {renderSettingContent()}
    </Box>
  );
};

export default SettingsPage;