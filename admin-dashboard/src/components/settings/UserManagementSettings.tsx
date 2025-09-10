'use client';
import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PersonAdd,
  Security,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const adminUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'super_admin']),
  is_active: z.boolean(),
});

type AdminUserFormData = z.infer<typeof adminUserSchema>;

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

export default function UserManagementSettings() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

  const queryClient = useQueryClient();

  // Mock data for now - replace with actual API calls
  const mockUsers: AdminUser[] = [
    {
      id: '1',
      name: 'Test Admin',
      email: 'admin@test.com',
      role: 'super_admin',
      is_active: true,
      created_at: '2025-09-10T08:41:45.721025Z',
      last_login_at: '2025-09-10T08:47:37.013670Z',
    },
  ];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<AdminUserFormData>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'admin',
      is_active: true,
    },
  });

  const handleAddUser = () => {
    setEditingUser(null);
    reset();
    setDialogOpen(true);
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setValue('name', user.name);
    setValue('email', user.email);
    setValue('role', user.role as 'admin' | 'super_admin');
    setValue('is_active', user.is_active);
    setDialogOpen(true);
  };

  const handleDeleteUser = (user: AdminUser) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const onSubmit = (data: AdminUserFormData) => {
    console.log('User data:', data);
    // TODO: Implement API calls
    setDialogOpen(false);
    reset();
  };

  const confirmDelete = () => {
    console.log('Deleting user:', userToDelete);
    // TODO: Implement API calls
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'error';
      case 'admin':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AdminPanelSettings />
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={handleAddUser}
        >
          Add Admin User
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Manage administrator accounts and permissions. Only super administrators can create and modify user accounts.
      </Alert>

      <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Security fontSize="small" />
            Administrator Accounts
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role.replace('_', ' ').toUpperCase()}
                        color={getRoleColor(user.role) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? 'Active' : 'Inactive'}
                        color={user.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>
                      {user.last_login_at ? formatDate(user.last_login_at) : 'Never'}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditUser(user)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUser(user)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingUser ? 'Edit Admin User' : 'Add Admin User'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('name')}
                  label="Full Name"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('email')}
                  label="Email Address"
                  type="email"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    {...register('role')}
                    label="Role"
                    defaultValue="admin"
                  >
                    <MenuItem value="admin">Administrator</MenuItem>
                    <MenuItem value="super_admin">Super Administrator</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      {...register('is_active')}
                      defaultChecked
                    />
                  }
                  label="Active Account"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the user "{userToDelete?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}