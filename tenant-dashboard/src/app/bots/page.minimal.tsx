'use client';

import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TenantLayout from '@/components/layout/TenantLayout';

export default function BotsPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <TenantLayout>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              Bots
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your AI chatbots and their configurations
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => router.push('/bots/create')}
            sx={{ fontWeight: 500 }}
          >
            Create Bot
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Loading bots functionality...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The full bots management interface is being loaded.
          </Typography>
        </Box>
      </TenantLayout>
    </ProtectedRoute>
  );
}