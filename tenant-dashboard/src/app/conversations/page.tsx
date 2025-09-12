'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Chat,
  Search,
  MoreVert,
  Delete,
  Visibility,
  Person,
  SmartToy,
} from '@mui/icons-material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TenantLayout from '@/components/layout/TenantLayout';
import NoSSR from '@/components/NoSSR';
import { conversationService, ConversationWithDetails } from '@/services/conversation';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load conversations from API
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await conversationService.getConversations({
        limit: 50,
        order_by: 'updated_at',
        order: 'desc'
      });
      setConversations(data);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, conversationId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedConversation(conversationId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedConversation(null);
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;
    
    try {
      const success = await conversationService.deleteConversation(selectedConversation);
      if (success) {
        // Remove the conversation from the list
        setConversations(prev => prev.filter(conv => conv.id !== selectedConversation));
        handleMenuClose();
      } else {
        setError('Failed to delete conversation');
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError('Failed to delete conversation');
    }
  };

  const filteredConversations = conversations.filter(conversation =>
    (conversation.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conversation.bot_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conversation.last_message || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <NoSSR>
        <TenantLayout>
          <div suppressHydrationWarning>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                Conversations
              </Typography>
              <Typography variant="body1" color="text.secondary">
                View and manage all bot conversations
              </Typography>
            </Box>

        {/* Search */}
        <Box sx={{ mb: 3 }}>
          <TextField
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ maxWidth: 400 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Conversations Table */}
        {!loading && !error && (
          <Card>
            <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Conversation</TableCell>
                    <TableCell>Bot</TableCell>
                    <TableCell>Messages</TableCell>
                    <TableCell>Last Message</TableCell>
                    <TableCell>Last Activity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredConversations.map((conversation) => (
                    <TableRow key={conversation.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}>
                            <Chat fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {conversation.title || 'Untitled Conversation'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Session: {conversation.session_id || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SmartToy sx={{ fontSize: 16, color: 'primary.main', mr: 1 }} />
                          {conversation.bot_name || 'Unknown Bot'}
                        </Box>
                      </TableCell>
                      <TableCell>{conversation.messages_count || 0}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conversation.last_message || 'No messages yet'}
                        </Typography>
                      </TableCell>
                      <TableCell>{conversation.last_activity || 'Unknown'}</TableCell>
                      <TableCell>
                        <Chip
                          label={conversation.is_active ? 'active' : 'completed'}
                          color={conversation.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, conversation.id)}
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
        )}

        {/* Conversation Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            View Conversation
          </MenuItem>
          <MenuItem onClick={handleDeleteConversation}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            Delete Conversation
          </MenuItem>
        </Menu>
          </div>
        </TenantLayout>
      </NoSSR>
    </ProtectedRoute>
  );
}