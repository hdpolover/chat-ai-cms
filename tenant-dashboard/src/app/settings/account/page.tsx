'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save,
  Lock,
  Delete,
} from '@mui/icons-material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TenantLayout from '@/components/layout/TenantLayout';
import { useAuth } from '@/hooks/useAuth';

interface AccountInfo {
  name: string;
  email: string;
  slug: string;
  plan: string;
  createdAt: string;
  lastLogin: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const [accountInfo, setAccountInfo] = useState<AccountInfo>({
    name: '',
    email: '',
    slug: '',
    plan: '',
    createdAt: '',
    lastLogin: '',
  });
  
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  // Mock data - replace with actual API calls
  useEffect(() => {
    if (user) {
      setAccountInfo({
        name: user.name || '',
        email: user.email || '',
        slug: user.slug || '',
        plan: 'Free',
        createdAt: '2 weeks ago',
        lastLogin: '2 hours ago',
      });
    }
  }, [user]);

  const handleAccountInfoChange = (field: keyof AccountInfo, value: string) => {
    setAccountInfo(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handlePasswordChange = (field: keyof PasswordChangeData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // TODO: Implement save API call
      console.log('Saving account info:', accountInfo);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save account info:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    try {
      // TODO: Implement password change API call
      console.log('Changing password');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      alert('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmDeleteText !== accountInfo.name) {
      alert('Please type your account name to confirm deletion');
      return;
    }

    try {
      // TODO: Implement account deletion API call
      console.log('Deleting account');
      setDeleteDialogOpen(false);
      // Would redirect to logout/goodbye page
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  return (
    <ProtectedRoute>
      <TenantLayout>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Account Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your account information and security settings
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Account Information */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Account Information
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveChanges}
                  disabled={!hasChanges || saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
              
              {hasChanges && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  You have unsaved changes.
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Account Name"
                  value={accountInfo.name}
                  onChange={(e) => handleAccountInfoChange('name', e.target.value)}
                  fullWidth
                />
                
                <TextField
                  label="Email Address"
                  type="email"
                  value={accountInfo.email}
                  onChange={(e) => handleAccountInfoChange('email', e.target.value)}
                  fullWidth
                />
                
                <TextField
                  label="Account Slug"
                  value={accountInfo.slug}
                  onChange={(e) => handleAccountInfoChange('slug', e.target.value)}
                  fullWidth
                  helperText="Used in API endpoints and URLs"
                />
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Plan"
                    value={accountInfo.plan}
                    fullWidth
                    disabled
                    helperText="Contact support to upgrade your plan"
                  />
                  <TextField
                    label="Member Since"
                    value={accountInfo.createdAt}
                    fullWidth
                    disabled
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                <Lock sx={{ mr: 1 }} />
                Change Password
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Current Password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  fullWidth
                />
                
                <TextField
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  fullWidth
                />
                
                <TextField
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  fullWidth
                />
                
                <Button
                  variant="outlined"
                  onClick={handleChangePassword}
                  disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Change Password
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card sx={{ border: '1px solid', borderColor: 'error.main' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'error.main', display: 'flex', alignItems: 'center' }}>
                <Delete sx={{ mr: 1 }} />
                Danger Zone
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  Delete Account
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Permanently delete your account and all associated data. This action cannot be undone.
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete Account
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Delete Account Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ color: 'error.main' }}>
            Delete Account
          </DialogTitle>
          <DialogContent>
            <Alert severity="error" sx={{ mb: 3 }}>
              <strong>Warning:</strong> This action is irreversible. All your bots, conversations, documents, and settings will be permanently deleted.
            </Alert>
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              To confirm deletion, please type your account name <strong>{accountInfo.name}</strong> below:
            </Typography>
            
            <TextField
              label="Account Name"
              value={confirmDeleteText}
              onChange={(e) => setConfirmDeleteText(e.target.value)}
              fullWidth
              error={confirmDeleteText.length > 0 && confirmDeleteText !== accountInfo.name}
              helperText={confirmDeleteText.length > 0 && confirmDeleteText !== accountInfo.name ? 'Account name does not match' : ''}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="error"
              onClick={handleDeleteAccount}
              disabled={confirmDeleteText !== accountInfo.name}
            >
              Delete Account
            </Button>
          </DialogActions>
        </Dialog>
      </TenantLayout>
    </ProtectedRoute>
  );
}