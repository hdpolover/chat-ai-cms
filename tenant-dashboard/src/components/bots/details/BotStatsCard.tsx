import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  Chat as ChatIcon,
  Message as MessageIcon,
  Speed as SpeedIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import type { BotStatsCardProps } from './types';

export const BotStatsCard: React.FC<BotStatsCardProps> = ({
  conversationCount,
  messageCount,
  averageResponseTime,
  lastUsed
}) => {
  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatLastUsed = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const StatItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
  }> = ({ icon, label, value }) => (
    <Box sx={{ textAlign: 'center', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
        {icon}
      </Box>
      <Typography variant="h5" component="div" fontWeight="bold">
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Bot Statistics
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1 }}>
          <StatItem
            icon={<ChatIcon color="primary" />}
            label="Conversations"
            value={conversationCount.toLocaleString()}
          />
          
          <StatItem
            icon={<MessageIcon color="info" />}
            label="Messages"
            value={messageCount.toLocaleString()}
          />
          
          <StatItem
            icon={<SpeedIcon color="success" />}
            label="Avg Response"
            value={formatResponseTime(averageResponseTime)}
          />
          
          <StatItem
            icon={<ScheduleIcon color="warning" />}
            label="Last Used"
            value={formatLastUsed(lastUsed)}
          />
        </Box>
      </CardContent>
    </Card>
  );
};