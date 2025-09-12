'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  Chat,
  SmartToy,
  People,
} from '@mui/icons-material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TenantLayout from '@/components/layout/TenantLayout';

interface AnalyticsStats {
  totalConversations: number;
  totalMessages: number;
  activeUsers: number;
  averageResponseTime: string;
  conversationGrowth: string;
  messageGrowth: string;
}

interface BotMetric {
  name: string;
  conversations: number;
  successRate: number;
  avgRating: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats>({
    totalConversations: 0,
    totalMessages: 0,
    activeUsers: 0,
    averageResponseTime: '0s',
    conversationGrowth: '0%',
    messageGrowth: '0%',
  });

  const [botMetrics, setBotMetrics] = useState<BotMetric[]>([]);

  // Mock data - replace with actual API calls
  useEffect(() => {
    setStats({
      totalConversations: 156,
      totalMessages: 1248,
      activeUsers: 89,
      averageResponseTime: '1.2s',
      conversationGrowth: '+23%',
      messageGrowth: '+18%',
    });

    setBotMetrics([
      {
        name: 'Customer Support Bot',
        conversations: 65,
        successRate: 92,
        avgRating: 4.5,
      },
      {
        name: 'Product FAQ Bot',
        conversations: 45,
        successRate: 88,
        avgRating: 4.2,
      },
      {
        name: 'Sales Assistant',
        conversations: 28,
        successRate: 85,
        avgRating: 4.0,
      },
      {
        name: 'Technical Support',
        conversations: 18,
        successRate: 90,
        avgRating: 4.3,
      },
    ]);
  }, []);

  const statCards = [
    {
      title: 'Total Conversations',
      value: stats.totalConversations,
      growth: stats.conversationGrowth,
      icon: Chat,
      color: '#1976d2',
    },
    {
      title: 'Total Messages',
      value: stats.totalMessages,
      growth: stats.messageGrowth,
      icon: TrendingUp,
      color: '#2e7d32',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      growth: '+12%',
      icon: People,
      color: '#ed6c02',
    },
    {
      title: 'Avg Response Time',
      value: stats.averageResponseTime,
      growth: '-15%',
      icon: SmartToy,
      color: '#9c27b0',
    },
  ];

  return (
    <ProtectedRoute>
      <TenantLayout>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your bot performance and user engagement
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 3,
          mb: 4 
        }}>
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      backgroundColor: `${stat.color}15`,
                      mr: 2,
                    }}
                  >
                    <stat.icon sx={{ color: stat.color, fontSize: 24 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip
                    label={stat.growth}
                    color={stat.growth.startsWith('+') ? 'success' : stat.growth.startsWith('-') ? 'error' : 'default'}
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    from last month
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Bot Performance Metrics */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Bot Performance Metrics
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {botMetrics.map((bot, index) => (
              <Box key={index}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {bot.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {bot.conversations} conversations
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Success Rate
                    </Typography>
                    <Typography variant="body2">
                      {bot.successRate}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={bot.successRate} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 1,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: bot.successRate >= 90 ? '#2e7d32' : bot.successRate >= 80 ? '#ed6c02' : '#d32f2f'
                      }
                    }} 
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Average Rating
                  </Typography>
                  <Typography variant="body2">
                    {bot.avgRating}/5.0 ⭐
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      </TenantLayout>
    </ProtectedRoute>
  );
}