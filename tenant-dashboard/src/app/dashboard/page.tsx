'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Typography, Box } from '@mui/material';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to Tenant Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This is where you'll manage your bots, view analytics, and configure settings.
        </Typography>
      </Box>
    </ProtectedRoute>
  );
}