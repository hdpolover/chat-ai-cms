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

interface Conversation {
  id: string;
  title: string;
  botName: string;
  messageCount: number;
  lastMessage: string;
  lastActivity: string;
  status: 'active' | 'completed';
  sessionId: string;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual API calls
  useEffect(() => {
    setConversations([
      {
        id: '1',
        title: 'Product inquiry from customer',
        botName: 'Customer Support Bot',
        messageCount: 12,
        lastMessage: 'Thank you for your help!',
        lastActivity: '2 hours ago',
        status: 'completed',
        sessionId: 'sess_123abc',
      },
      {
        id: '2',
        title: 'Technical support question',
        botName: 'Customer Support Bot',
        messageCount: 8,
        lastMessage: 'Can you help me with installation?',
        lastActivity: '1 hour ago',
        status: 'active',
        sessionId: 'sess_456def',
      },
      {
        id: '3',
        title: 'FAQ about pricing',
        botName: 'Product FAQ Bot',
        messageCount: 5,
        lastMessage: 'What are your pricing plans?',
        lastActivity: '3 hours ago',
        status: 'completed',
        sessionId: 'sess_789ghi',
      },
      {
        id: '4',
        title: 'Sales consultation',
        botName: 'Sales Assistant',
        messageCount: 15,
        lastMessage: 'I need a custom solution',
        lastActivity: '5 hours ago',
        status: 'active',
        sessionId: 'sess_012jkl',
      },
    ]);
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, conversationId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedConversation(conversationId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedConversation(null);
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.botName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
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

        {/* Conversations Table */}
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
                              {conversation.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Session: {conversation.sessionId}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SmartToy sx={{ fontSize: 16, color: 'primary.main', mr: 1 }} />
                          {conversation.botName}
                        </Box>
                      </TableCell>
                      <TableCell>{conversation.messageCount}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conversation.lastMessage}
                        </Typography>
                      </TableCell>
                      <TableCell>{conversation.lastActivity}</TableCell>
                      <TableCell>
                        <Chip
                          label={conversation.status}
                          color={conversation.status === 'active' ? 'success' : 'default'}
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
          <MenuItem onClick={handleMenuClose}>
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