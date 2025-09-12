'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Tooltip,
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
  Slider,
  OutlinedInput,
} from '@mui/material';
import {
  ArrowBack,
  SmartToy,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  Settings,
  Storage,
  Timeline,
  Chat,
  Visibility,
  Language,
  Memory,
  Speed,
  Token,
} from '@mui/icons-material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TenantLayout from '@/components/layout/TenantLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { BotService } from '@/services/bot';
import { DatasetService, Dataset } from '@/services/dataset';
import { Bot, TenantAIProvider, ChatSession, UpdateBotRequest } from '@/types';

export default function BotDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;

  const [bot, setBot] = useState<Bot | null>(null);
  const [aiProviders, setAiProviders] = useState<TenantAIProvider[]>([]);
  const [availableDatasets, setAvailableDatasets] = useState<Dataset[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (botId) {
      loadBotDetails();
    }
  }, [botId]);

  const loadBotDetails = async () => {
    try {
      setLoading(true);
      const [botData, providersData, datasetsData] = await Promise.all([
        BotService.getBot(botId),
        BotService.getTenantAIProviders(),
        DatasetService.getAvailableDatasets()
      ]);
      
      setBot(botData);
      setAiProviders(providersData);
      setAvailableDatasets(datasetsData);
      
      // Load chat sessions for this bot
      try {
        // Note: Chat sessions API endpoint may need to be implemented
        // For now, we'll set empty array
        setChatSessions([]);
      } catch (error) {
        console.error('Failed to load chat sessions:', error);
      }
    } catch (error) {
      console.error('Failed to load bot details:', error);
      setError('Failed to load bot details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBot = async () => {
    if (!bot) return;
    
    try {
      setSaving(true);
      await BotService.deleteBot(bot.id);
      setDeleteDialogOpen(false);
      router.push('/bots');
      setSuccess('Bot deleted successfully');
    } catch (error) {
      console.error('Failed to delete bot:', error);
      setError('Failed to delete bot');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!bot) return;
    
    try {
      await BotService.toggleBotStatus(bot.id, !bot.is_active);
      await loadBotDetails();
      setSuccess(`Bot ${bot.is_active ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      console.error('Failed to toggle bot status:', error);
      setError('Failed to update bot status');
    }
  };

  const getProviderName = (providerId: string) => {
    const provider = aiProviders.find(p => p.id === providerId);
    return provider?.provider_name || 'Unknown';
  };

  const getAvailableModels = (providerId: string) => {
    const provider = aiProviders.find(p => p.id === providerId);
    if (!provider?.custom_settings?.supported_models) return [];
    return provider.custom_settings.supported_models;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <LoadingSpinner message="Loading bot details..." />
      </ProtectedRoute>
    );
  }

  if (!bot) {
    return (
      <ProtectedRoute>
        <TenantLayout>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Bot Not Found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              The bot you're looking for doesn't exist or you don't have permission to view it.
            </Typography>
            <Button variant="contained" onClick={() => router.push('/bots')}>
              Back to Bots
            </Button>
          </Box>
        </TenantLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <TenantLayout>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => router.push('/bots')} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <SmartToy />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                {bot.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={bot.is_active ? 'Active' : 'Inactive'} 
                  color={bot.is_active ? 'success' : 'default'}
                  size="small"
                />
                {bot.is_public && (
                  <Chip 
                    label="Public" 
                    color="info"
                    size="small"
                  />
                )}
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  ID: {bot.id}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={bot.is_active ? <Pause /> : <PlayArrow />}
                onClick={handleToggleStatus}
              >
                {bot.is_active ? 'Deactivate' : 'Activate'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => router.push(`/bots/${bot.id}/edit`)}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete
              </Button>
            </Box>
          </Box>
          
          {bot.description && (
            <Typography variant="body1" color="text.secondary">
              {bot.description}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Configuration Details */}
          <Box sx={{ flex: 2 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                  <Settings sx={{ mr: 1 }} />
                  Configuration
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      AI Provider
                    </Typography>
                    <Typography variant="body1">
                      {getProviderName(bot.tenant_ai_provider_id)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Model
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {bot.model}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Temperature
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Speed sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body1">{bot.temperature}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({(bot.temperature || 0) === 0 ? 'Focused' : (bot.temperature || 0) <= 1 ? 'Balanced' : 'Creative'})
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Max Tokens
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Token sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body1">{bot.max_tokens}</Typography>
                    </Box>
                  </Box>
                </Box>
                
                {bot.system_prompt && (
                  <Box sx={{ mb: 2, gridColumn: { sm: '1 / -1' } }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      System Prompt
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {bot.system_prompt}
                      </Typography>
                    </Paper>
                  </Box>
                )}
                
                {bot.allowed_domains && bot.allowed_domains.length > 0 && (
                  <Box sx={{ mb: 2, gridColumn: { sm: '1 / -1' } }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Allowed Domains
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {bot.allowed_domains.map((domain, index) => (
                        <Chip
                          key={index}
                          label={domain}
                          size="small"
                          variant="outlined"
                          icon={<Language />}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Quick Stats */}
          <Box sx={{ flex: 1, minWidth: { md: 300 } }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                  <Timeline sx={{ mr: 1 }} />
                  Statistics
                </Typography>
                
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Chat />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Chat Sessions"
                      secondary={chatSessions.length}
                    />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Storage />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Knowledge Datasets"
                      secondary={bot.datasets?.length || 0}
                    />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Visibility />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Visibility"
                      secondary={bot.is_public ? 'Public' : 'Private'}
                    />
                  </ListItem>
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Created
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {new Date(bot.created_at).toLocaleString()}
                </Typography>
                
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {new Date(bot.updated_at).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Knowledge Datasets */}
        {bot.datasets && bot.datasets.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                  <Memory sx={{ mr: 1 }} />
                  Knowledge Datasets ({bot.datasets.length})
                </Typography>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bot.datasets.map((dataset) => (
                        <TableRow key={dataset.id}>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {dataset.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {dataset.id.slice(0, 8)}...
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {dataset.description || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label="Active" 
                              color="success" 
                              size="small" 
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Recent Chat Sessions */}
        {chatSessions.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                  <Chat sx={{ mr: 1 }} />
                  Recent Chat Sessions ({chatSessions.length})
                </Typography>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Session ID</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Messages</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Last Updated</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {chatSessions.slice(0, 10).map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {session.session_id.slice(0, 8)}...
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {session.title || 'Untitled Session'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={session.message_count} 
                              size="small" 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {new Date(session.created_at).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {new Date(session.updated_at).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Bot</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{bot.name}"? This action cannot be undone and will also delete all associated chat sessions and messages.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleDeleteBot}
              disabled={saving}
            >
              {saving ? <CircularProgress size={20} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success/Error Snackbars */}
        <Snackbar 
          open={!!success} 
          autoHideDuration={6000} 
          onClose={() => setSuccess(null)}
        >
          <Alert onClose={() => setSuccess(null)} severity="success">
            {success}
          </Alert>
        </Snackbar>

        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={() => setError(null)}
        >
          <Alert onClose={() => setError(null)} severity="error">
            {error}
          </Alert>
        </Snackbar>
      </TenantLayout>
    </ProtectedRoute>
  );
}