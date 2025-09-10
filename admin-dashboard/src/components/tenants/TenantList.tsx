'use client';
import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Search,
  MoreVert,
  Add,
  Edit,
  Delete,
  Visibility,
  PlayArrow,
  Pause,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantService } from '@/services/tenant';
import { formatDistanceToNow } from 'date-fns';
import type { Tenant } from '@/types';
import TenantDialog from './TenantDialog';

export default function TenantList() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const queryClient = useQueryClient();

  const {
    data: tenantsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tenants', page, rowsPerPage, search],
    queryFn: () =>
      tenantService.getTenants({
        page: page + 1,
        per_page: rowsPerPage,
        search: search || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: tenantService.deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setDeleteDialogOpen(false);
      setSelectedTenant(null);
      setNotification({
        open: true,
        message: 'Tenant deleted successfully',
        severity: 'success',
      });
    },
    onError: (error: any) => {
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Failed to delete tenant',
        severity: 'error',
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      tenantService.toggleTenantStatus(id, is_active),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setNotification({
        open: true,
        message: `Tenant ${variables.is_active ? 'activated' : 'deactivated'} successfully`,
        severity: 'success',
      });
    },
    onError: (error: any) => {
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Failed to update tenant status',
        severity: 'error',
      });
    },
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, tenant: Tenant) => {
    setAnchorEl(event.currentTarget);
    setSelectedTenant(tenant);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCreateTenant = () => {
    setDialogMode('create');
    setSelectedTenant(null);
    setDialogOpen(true);
  };

  const handleEditTenant = () => {
    setDialogMode('edit');
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleViewTenant = () => {
    setDialogMode('view');
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteTenant = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleToggleStatus = () => {
    if (selectedTenant) {
      toggleStatusMutation.mutate({
        id: selectedTenant.id,
        is_active: !selectedTenant.is_active,
      });
    }
    handleMenuClose();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedTenant(null);
  };

  const handleDialogSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['tenants'] });
    handleDialogClose();
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free':
        return 'default';
      case 'pro':
        return 'primary';
      case 'enterprise':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const tenants = tenantsData?.items || [];
  const totalCount = tenantsData?.total || 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Tenants</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateTenant}
        >
          Add Tenant
        </Button>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search tenants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      {/* Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Usage</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <>
                    {Array.from({ length: rowsPerPage }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box>
                            <Box sx={{ height: 20, bgcolor: 'grey.200', borderRadius: 1, mb: 0.5 }} />
                            <Box sx={{ height: 16, bgcolor: 'grey.100', borderRadius: 1, width: '60%' }} />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ height: 20, bgcolor: 'grey.200', borderRadius: 1, width: '80%' }} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ height: 24, bgcolor: 'grey.200', borderRadius: 12, width: 60 }} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ height: 24, bgcolor: 'grey.200', borderRadius: 12, width: 60 }} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ height: 20, bgcolor: 'grey.200', borderRadius: 1, width: '70%' }} />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Box sx={{ height: 20, bgcolor: 'grey.200', borderRadius: 1, mb: 0.5 }} />
                            <Box sx={{ height: 16, bgcolor: 'grey.100', borderRadius: 1, width: '60%' }} />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ height: 32, bgcolor: 'grey.200', borderRadius: 1, width: 32 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Alert severity="error" sx={{ m: 2 }}>
                        Failed to load tenants. Please try again.
                      </Alert>
                    </TableCell>
                  </TableRow>
                ) : tenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No tenants found
                    </TableCell>
                  </TableRow>
                ) : (
                  tenants.map((tenant) => (
                    <TableRow key={tenant.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {tenant.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tenant.slug}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{tenant.owner_email}</TableCell>
                      <TableCell>
                        <Chip
                          label={tenant.plan}
                          color={getPlanColor(tenant.plan) as any}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tenant.is_active ? 'Active' : 'Inactive'}
                          color={tenant.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDistanceToNow(new Date(tenant.created_at), { addSuffix: true })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {tenant.usage_stats?.total_chats || 0} chats
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tenant.usage_stats?.active_users || 0} users
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, tenant)}
                          size="small"
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewTenant}>
          <Visibility fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleEditTenant}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem 
          onClick={handleToggleStatus}
          disabled={toggleStatusMutation.isPending}
        >
          {toggleStatusMutation.isPending ? (
            <>Loading...</>
          ) : selectedTenant?.is_active ? (
            <><Pause fontSize="small" sx={{ mr: 1 }} />Deactivate</>
          ) : (
            <><PlayArrow fontSize="small" sx={{ mr: 1 }} />Activate</>
          )}
        </MenuItem>
        <MenuItem onClick={handleDeleteTenant} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Tenant Dialog */}
      <TenantDialog
        open={dialogOpen}
        mode={dialogMode}
        tenant={selectedTenant}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Delete color="error" />
            Confirm Deletion
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete the tenant "{selectedTenant?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Slug: {selectedTenant?.slug}
          </Typography>
          <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>
            This action cannot be undone. All associated data, including bots, conversations, 
            and documents will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedTenant) {
                deleteMutation.mutate(selectedTenant.id);
              }
            }}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            startIcon={deleteMutation.isPending ? null : <Delete />}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Tenant'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}