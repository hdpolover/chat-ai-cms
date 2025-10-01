import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  List,
  ListItem,
  ListItemText,
  Button,
  Chip,
  IconButton,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  Chat as ChatIcon,
  Visibility as ViewIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import type { BotConversationsProps } from './types';

export const BotConversationsCard: React.FC<BotConversationsProps> = ({
  conversations,
  loading = false,
  onViewConversation
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getMessageCountText = (count?: number) => {
    if (!count) return 'No messages';
    return `${count} message${count === 1 ? '' : 's'}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChatIcon color="primary" />
            Recent Conversations
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChatIcon color="primary" />
            Recent Conversations
          </Typography>
          {conversations.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {conversations.length} conversation{conversations.length === 1 ? '' : 's'}
            </Typography>
          )}
        </Stack>

        {conversations.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No conversations yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This bot hasn't been used for any conversations
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {conversations.slice(0, 5).map((conversation) => (
              <ListItem
                key={conversation.id}
                sx={{ 
                  px: 0, 
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' }
                }}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    onClick={() => onViewConversation(conversation.id)}
                    size="small"
                  >
                    <ViewIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {conversation.id.substring(0, 8)}...
                      </Typography>
                      {conversation.title && (
                        <Typography variant="body2" color="text.primary">
                          {conversation.title}
                        </Typography>
                      )}
                    </Stack>
                  }
                  secondary={
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TimeIcon fontSize="inherit" />
                        {formatDate(conversation.created_at)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getMessageCountText(conversation.message_count)}
                      </Typography>
                    </Stack>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        {conversations.length > 5 && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button variant="outlined" size="small">
              View All Conversations ({conversations.length})
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};