'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Key,
  MoreVert,
  Delete,
  ContentCopy,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TenantLayout from '@/components/layout/TenantLayout';

interface APIKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsed: string;
  createdAt: string;
  scopes: string[];
  isActive: boolean;
  rateLimit: number;
}

export default function APIKeysPage() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyGenerated, setNewKeyGenerated] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    setApiKeys([
      {
        id: '1',
        name: 'Production API Key',
        keyPrefix: 'sk_prod_',
        lastUsed: '2 hours ago',
        createdAt: '1 week ago',
        scopes: ['chat:read', 'chat:write', 'bots:read'],
        isActive: true,
        rateLimit: 1000,
      },
      {
        id: '2',
        name: 'Development Key',
        keyPrefix: 'sk_dev_',
        lastUsed: '1 day ago',
        createdAt: '2 weeks ago',
        scopes: ['chat:read', 'chat:write'],
        isActive: true,
        rateLimit: 100,
      },
      {
        id: '3',
        name: 'Webhook Integration',
        keyPrefix: 'sk_webhook_',
        lastUsed: 'Never',
        createdAt: '3 weeks ago',
        scopes: ['webhooks:read'],
        isActive: false,
        rateLimit: 50,
      },
    ]);
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, keyId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedKey(keyId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedKey(null);
  };

  const handleCreateAPIKey = () => {
    if (newKeyName.trim()) {
      // TODO: Implement API key creation
      const generatedKey = `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      setNewKeyGenerated(generatedKey);
      setNewKeyName('');
      // Don't close dialog yet - show the generated key first
    }
  };

  const handleCopyKey = () => {
    if (newKeyGenerated) {
      navigator.clipboard.writeText(newKeyGenerated);
    }
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setNewKeyGenerated(null);
    setShowNewKey(false);
    setNewKeyName('');
  };

  const handleDeleteKey = (keyId: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== keyId));
    handleMenuClose();
  };

  return (
    <ProtectedRoute>
      <TenantLayout>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              API Keys
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your API keys for accessing the chat API
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ height: 'fit-content' }}
          >
            Create API Key
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          API keys provide access to your bots and conversations. Keep them secure and never share them publicly.
        </Alert>

        {/* API Keys Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Key</TableCell>
                    <TableCell>Scopes</TableCell>
                    <TableCell>Rate Limit</TableCell>
                    <TableCell>Last Used</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Key sx={{ color: 'primary.main', mr: 2 }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {apiKey.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Created {apiKey.createdAt}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {apiKey.keyPrefix}••••••••••••••••
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {apiKey.scopes.map((scope, index) => (
                            <Chip key={index} label={scope} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>{apiKey.rateLimit}/hour</TableCell>
                      <TableCell>{apiKey.lastUsed}</TableCell>
                      <TableCell>
                        <Chip
                          label={apiKey.isActive ? 'Active' : 'Inactive'}
                          color={apiKey.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, apiKey.id)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* API Key Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            View Details
          </MenuItem>
          <MenuItem onClick={() => handleDeleteKey(selectedKey!)}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            Delete Key
          </MenuItem>
        </Menu>

        {/* Create API Key Dialog */}
        <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {newKeyGenerated ? 'API Key Created' : 'Create New API Key'}
          </DialogTitle>
          <DialogContent>
            {!newKeyGenerated ? (
              <Box sx={{ pt: 2 }}>
                <TextField
                  label="API Key Name"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  fullWidth
                  required
                  helperText="Choose a descriptive name for this API key"
                />
              </Box>
            ) : (
              <Box sx={{ pt: 2 }}>
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <strong>Important:</strong> This is the only time you'll see this key. Make sure to copy it now.
                </Alert>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Your new API key:
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 2,
                  backgroundColor: 'grey.100',
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  wordBreak: 'break-all'
                }}>
                  <Box sx={{ flexGrow: 1 }}>
                    {showNewKey ? newKeyGenerated : '••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                  </Box>
                  <Tooltip title={showNewKey ? 'Hide key' : 'Show key'}>
                    <IconButton size="small" onClick={() => setShowNewKey(!showNewKey)}>
                      {showNewKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Copy to clipboard">
                    <IconButton size="small" onClick={handleCopyKey}>
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {!newKeyGenerated ? (
              <>
                <Button onClick={handleCloseCreateDialog}>Cancel</Button>
                <Button 
                  variant="contained" 
                  onClick={handleCreateAPIKey} 
                  disabled={!newKeyName.trim()}
                >
                  Create Key
                </Button>
              </>
            ) : (
              <Button variant="contained" onClick={handleCloseCreateDialog}>
                Done
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </TenantLayout>
    </ProtectedRoute>
  );
}