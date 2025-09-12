'use client';
import { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Business,
  ChatBubble,
  MoreVert,
  CheckCircle,
  Warning,
  Error,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { dashboardService } from '@/services';
import { tenantService } from '@/services/tenant';
import { formatDistanceToNow } from 'date-fns';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

function StatCard({ title, value, change, changeType, icon, color = 'primary' }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h3" component="div">
              {value}
            </Typography>
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp 
                  sx={{ 
                    mr: 0.5, 
                    fontSize: 16, 
                    color: changeType === 'increase' ? 'success.main' : 'error.main' 
                  }} 
                />
                <Typography 
                  variant="body2" 
                  color={changeType === 'increase' ? 'success.main' : 'error.main'}
                >
                  {change}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 2,
              bgcolor: `${color}.main`,
              color: 'white',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

interface SystemHealthProps {
  status: 'healthy' | 'warning' | 'error';
}

function SystemHealth({ status }: SystemHealthProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'healthy':
        return { icon: <CheckCircle />, color: 'success', text: 'All Systems Operational' };
      case 'warning':
        return { icon: <Warning />, color: 'warning', text: 'Some Issues Detected' };
      case 'error':
        return { icon: <Error />, color: 'error', text: 'Critical Issues' };
    }
  };

  const config = getStatusConfig();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          System Health
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ color: `${config.color}.main` }}>
            {config.icon}
          </Box>
          <Typography variant="body1">{config.text}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardOverview() {
  const [chartPeriod, setChartPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  });

  const {
    data: metrics,
    isLoading: metricsLoading,
  } = useQuery({
    queryKey: ['dashboard-metrics', chartPeriod],
    queryFn: () => dashboardService.getMetrics(chartPeriod),
  });

  const {
    data: recentTenantsData,
    isLoading: tenantsLoading,
  } = useQuery({
    queryKey: ['recent-tenants'],
    queryFn: () => tenantService.getTenants({ per_page: 5 }),
  });

  const handlePeriodMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePeriodMenuClose = () => {
    setAnchorEl(null);
  };

  const handlePeriodChange = (period: 'day' | 'week' | 'month') => {
    setChartPeriod(period);
    handlePeriodMenuClose();
  };

  // Use real data from API or fallback to empty array
  const chartData = metrics || [];
  const recentTenants = recentTenantsData?.items || [];

  if (statsLoading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Dashboard Overview
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tenants"
            value={stats?.total_tenants || 0}
            change={12}
            changeType="increase"
            icon={<Business />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Tenants"
            value={stats?.active_tenants || 0}
            change={8}
            changeType="increase"
            icon={<CheckCircle />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats?.total_users || 0}
            change={15}
            changeType="increase"
            icon={<People />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Chats Today"
            value={stats?.total_chats_today || 0}
            change={23}
            changeType="increase"
            icon={<ChatBubble />}
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Activity Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Activity Overview</Typography>
                <Box>
                  <IconButton onClick={handlePeriodMenuOpen}>
                    <MoreVert />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handlePeriodMenuClose}
                  >
                    <MenuItem onClick={() => handlePeriodChange('day')}>Last 24 Hours</MenuItem>
                    <MenuItem onClick={() => handlePeriodChange('week')}>Last Week</MenuItem>
                    <MenuItem onClick={() => handlePeriodChange('month')}>Last Month</MenuItem>
                  </Menu>
                </Box>
              </Box>
              
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="chats" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="messages" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Health & Recent Activity */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <SystemHealth status={stats?.system_health || 'healthy'} />
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Tenants
                  </Typography>
                  
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Plan</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tenantsLoading ? (
                          <TableRow>
                            <TableCell colSpan={3}>
                              <LinearProgress />
                            </TableCell>
                          </TableRow>
                        ) : (
                          recentTenants.map((tenant) => (
                            <TableRow key={tenant.id}>
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                  {tenant.name}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={tenant.plan}
                                  size="small"
                                  color={tenant.plan === 'enterprise' ? 'primary' : 'default'}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={tenant.is_active ? 'Active' : 'Inactive'}
                                  size="small"
                                  color={tenant.is_active ? 'success' : 'default'}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Usage Metrics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Usage Metrics
              </Typography>
              
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="users" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}