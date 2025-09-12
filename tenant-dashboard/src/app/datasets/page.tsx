'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Delete,
  Edit,
  Folder,
  InsertDriveFile,
  Analytics,
  Search,
} from '@mui/icons-material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TenantLayout from '@/components/layout/TenantLayout';
import { DatasetService, Dataset as DatasetServiceType } from '@/services/dataset';

interface Dataset extends DatasetServiceType {
  document_count: number;
  total_chunks: number;
  updated_at: string;
  is_active: boolean;
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [datasetName, setDatasetName] = useState('');
  const [datasetDescription, setDatasetDescription] = useState('');
  const [datasetTags, setDatasetTags] = useState('');

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DatasetService.getDatasets();
      // Transform the data to match our interface
      const transformedData = data.map(dataset => ({
        ...dataset,
        document_count: 0, // Will be populated by API
        total_chunks: 0,   // Will be populated by API
        updated_at: dataset.created_at, // Use created_at as fallback
        is_active: true,   // Default to active
      }));
      setDatasets(transformedData);
    } catch (err) {
      setError('Failed to load datasets. Please try again.');
      console.error('Error loading datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, dataset: Dataset) => {
    setAnchorEl(event.currentTarget);
    setSelectedDataset(dataset);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDataset(null);
  };

  const openCreateDialog = () => {
    setDatasetName('');
    setDatasetDescription('');
    setDatasetTags('');
    setCreateDialogOpen(true);
  };

  const openEditDialog = () => {
    if (selectedDataset) {
      setDatasetName(selectedDataset.name);
      setDatasetDescription(selectedDataset.description || '');
      setDatasetTags(selectedDataset.tags.join(', '));
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleCreateDataset = async () => {
    try {
      const tags = datasetTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      await DatasetService.createDataset({
        name: datasetName,
        description: datasetDescription || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      setCreateDialogOpen(false);
      loadDatasets();
    } catch (err) {
      setError('Failed to create dataset. Please try again.');
      console.error('Error creating dataset:', err);
    }
  };

  const handleUpdateDataset = async () => {
    if (!selectedDataset) return;
    
    try {
      const tags = datasetTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      await DatasetService.updateDataset(selectedDataset.id, {
        name: datasetName,
        description: datasetDescription || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      setEditDialogOpen(false);
      setSelectedDataset(null);
      loadDatasets();
    } catch (err) {
      setError('Failed to update dataset. Please try again.');
      console.error('Error updating dataset:', err);
    }
  };

  const handleDeleteDataset = async () => {
    if (!selectedDataset) return;
    
    try {
      await DatasetService.deleteDataset(selectedDataset.id);
      setDeleteDialogOpen(false);
      setSelectedDataset(null);
      loadDatasets();
    } catch (err) {
      setError('Failed to delete dataset. Please try again.');
      console.error('Error deleting dataset:', err);
    }
  };

  const filteredDatasets = datasets.filter(dataset =>
    dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dataset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dataset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ProtectedRoute>
      <TenantLayout>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              Datasets
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Organize your documents into datasets for better knowledge management
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
            sx={{ height: 'fit-content' }}
          >
            Create Dataset
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search and Stats */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          <Box sx={{ flex: 2 }}>
            <TextField
              fullWidth
              placeholder="Search datasets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                  {datasets.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Datasets
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Datasets Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Dataset</TableCell>
                      <TableCell>Documents</TableCell>
                      <TableCell>Chunks</TableCell>
                      <TableCell>Tags</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDatasets.map((dataset) => (
                      <TableRow key={dataset.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Folder sx={{ color: 'primary.main', mr: 2 }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {dataset.name}
                              </Typography>
                              {dataset.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {dataset.description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <InsertDriveFile sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            {dataset.document_count}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Analytics sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            {dataset.total_chunks}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {dataset.tags.map((tag, index) => (
                              <Chip key={index} label={tag} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>{formatDate(dataset.created_at)}</TableCell>
                        <TableCell>
                          <Chip
                            label={dataset.is_active ? 'Active' : 'Inactive'}
                            color={dataset.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, dataset)}
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredDatasets.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            {searchTerm ? 'No datasets match your search.' : 'No datasets found. Create your first dataset to get started.'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Dataset Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={openEditDialog}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            Edit Dataset
          </MenuItem>
          <MenuItem onClick={openDeleteDialog}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            Delete Dataset
          </MenuItem>
        </Menu>

        {/* Create Dataset Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Dataset</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <TextField
                label="Dataset Name"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Description"
                value={datasetDescription}
                onChange={(e) => setDatasetDescription(e.target.value)}
                fullWidth
                multiline
                rows={3}
                helperText="Optional description of what this dataset contains"
              />
              <TextField
                label="Tags"
                value={datasetTags}
                onChange={(e) => setDatasetTags(e.target.value)}
                fullWidth
                helperText="Comma-separated tags (e.g., support, product, internal)"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleCreateDataset}
              disabled={!datasetName.trim()}
            >
              Create Dataset
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dataset Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Dataset</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <TextField
                label="Dataset Name"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Description"
                value={datasetDescription}
                onChange={(e) => setDatasetDescription(e.target.value)}
                fullWidth
                multiline
                rows={3}
              />
              <TextField
                label="Tags"
                value={datasetTags}
                onChange={(e) => setDatasetTags(e.target.value)}
                fullWidth
                helperText="Comma-separated tags"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleUpdateDataset}
              disabled={!datasetName.trim()}
            >
              Update Dataset
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Dataset Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Dataset</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the dataset "{selectedDataset?.name}"? 
              This action cannot be undone and will also delete all associated documents.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleDeleteDataset}>
              Delete Dataset
            </Button>
          </DialogActions>
        </Dialog>
      </TenantLayout>
    </ProtectedRoute>
  );
}