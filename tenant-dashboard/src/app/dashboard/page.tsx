'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  LinearProgress,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';
import {
  SmartToy,
  InsertDriveFile,
  Chat,
  Api,
  TrendingUp,
  MoreVert,
  Visibility,
  Edit,
  Delete,
} from '@mui/icons-material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TenantLayout from '@/components/layout/TenantLayout';
import { tenantDashboardService } from '@/services/dashboard';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);

  // Fetch dashboard stats
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['tenant-dashboard-stats'],
    queryFn: tenantDashboardService.getStats,
  });

  // Fetch recent bots
  const {
    data: recentBots,
    isLoading: botsLoading,
  } = useQuery({
    queryKey: ['recent-bots'],
    queryFn: () => tenantDashboardService.getRecentBots(3),
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, botId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedBot(botId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBot(null);
  };

  const statCards = [
    {
      title: 'Total Bots',
      value: stats?.totalBots || 0,
      icon: SmartToy,
      color: '#1976d2',
      growth: '+12%',
    },
    {
      title: 'Documents',
      value: stats?.totalDocuments || 0,
      icon: InsertDriveFile,
      color: '#2e7d32',
      growth: '+5%',
    },
    {
      title: 'Conversations',
      value: stats?.totalConversations || 0,
      icon: Chat,
      color: '#ed6c02',
      growth: '+23%',
    },
    {
      title: 'API Keys',
      value: stats?.totalApiKeys || 0,
      icon: Api,
      color: '#9c27b0',
      growth: '0%',
    },
  ];

  if (statsLoading) {
    return (
      <ProtectedRoute>
        <TenantLayout>
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress />
          </Box>
        </TenantLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <TenantLayout>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Here's an overview of your chatbots and activity.
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statCards.map((stat, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card sx={{ height: '100%' }}>
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
                    <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                    <Typography variant="body2" color="success.main">
                      {stat.growth}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                      from last month
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Bots */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Recent Bots
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {botsLoading ? (
                  <Box sx={{ p: 2 }}>
                    <LinearProgress />
                  </Box>
                ) : (
                  (recentBots || []).map((bot) => (
                    <Box
                      key={bot.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        '&:hover': {
                          backgroundColor: 'grey.50',
                        },
                      }}
                    >
                      <Box sx={{ mr: 2 }}>
                        <SmartToy sx={{ color: 'primary.main', fontSize: 24 }} />
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {bot.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {bot.conversations_count || 0} conversations • Created {formatDistanceToNow(new Date(bot.created_at), { addSuffix: true })}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={bot.is_active ? 'active' : 'inactive'} 
                          color={bot.is_active ? 'success' : 'default'}
                          size="small"
                        />
                        <IconButton 
                          size="small"
                          onClick={(e) => handleMenuOpen(e, bot.id)}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Quick Actions */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Card sx={{ 
                  p: 2, 
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 3 }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SmartToy sx={{ color: 'primary.main', mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Create New Bot
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Set up a new chatbot
                      </Typography>
                    </Box>
                  </Box>
                </Card>
                
                <Card sx={{ 
                  p: 2, 
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 3 }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <InsertDriveFile sx={{ color: 'success.main', mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Upload Documents
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Add knowledge base files
                      </Typography>
                    </Box>
                  </Box>
                </Card>
                
                <Card sx={{ 
                  p: 2, 
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 3 }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Api sx={{ color: 'warning.main', mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Generate API Key
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Create new API access
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Bot Actions Menu */}
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
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            Edit Bot
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            Delete Bot
          </MenuItem>
        </Menu>
      </TenantLayout>
    </ProtectedRoute>
  );
}