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
  LinearProgress,
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

interface DatasetStatistics {
  total_documents: number;
  documents_by_status: Record<string, number>;
  total_chunks: number;
  chunks_with_embeddings: number;
  total_file_size: number;
  processing_progress: number;
  processing_complete: boolean;
}

interface DatasetDocument {
  id: string;
  title: string;
  source_type: string;
  status: string;
  file_size: number;
  chunk_count: number;
  chunks_with_embeddings: number;
  processing_complete: boolean;
  created_at: string;
  updated_at: string;
  tags: string[];
}

interface DatasetBot {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
}

interface DatasetDetails {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  tags: string[];
  metadata: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  statistics: DatasetStatistics;
  documents: DatasetDocument[];
  assigned_bots: DatasetBot[];
  latest_document?: {
    id: string;
    title: string;
    created_at: string;
  };
  last_activity: string;
}

interface Dataset extends DatasetServiceType {
  document_count: number;
  chunk_count: number;
  completed_documents: number;
  processing_complete: boolean;
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
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [datasetDetails, setDatasetDetails] = useState<DatasetDetails | null>(null);
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
      // API now returns enhanced data with all statistics
      setDatasets(data as Dataset[]);
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

  const handleViewDetails = async () => {
    if (!selectedDataset) return;

    try {
      const token = localStorage.getItem('tenant_access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/v1/tenant/datasets/${selectedDataset.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dataset details');
      }

      const details = await response.json();
      setDatasetDetails(details);
      setDetailsDialogOpen(true);
      handleMenuClose();
    } catch (err) {
      setError('Failed to load dataset details. Please try again.');
      console.error('Error loading dataset details:', err);
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InsertDriveFile sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Box>
                              <Typography variant="body2">{dataset.document_count}</Typography>
                              {dataset.completed_documents < dataset.document_count && (
                                <Typography variant="caption" color="warning.main">
                                  {dataset.completed_documents} completed
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Analytics sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            {dataset.chunk_count}
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
          <MenuItem onClick={handleViewDetails}>
            <ListItemIcon>
              <Analytics fontSize="small" />
            </ListItemIcon>
            View Details
          </MenuItem>
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

        {/* Dataset Details Dialog */}
        <Dialog 
          open={detailsDialogOpen} 
          onClose={() => setDetailsDialogOpen(false)} 
          maxWidth="lg" 
          fullWidth
        >
          <DialogTitle>
            Dataset Details: {datasetDetails?.name}
          </DialogTitle>
          <DialogContent>
            {datasetDetails && (
              <Box sx={{ pt: 2 }}>
                {/* Basic Information */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Basic Information
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Name</Typography>
                        <Typography variant="body1">{datasetDetails.name}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <Chip
                          label={datasetDetails.is_active ? 'Active' : 'Inactive'}
                          color={datasetDetails.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Created</Typography>
                        <Typography variant="body1">{formatDate(datasetDetails.created_at)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Last Activity</Typography>
                        <Typography variant="body1">{formatDate(datasetDetails.last_activity)}</Typography>
                      </Box>
                    </Box>
                    {datasetDetails.description && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Description</Typography>
                        <Typography variant="body1">{datasetDetails.description}</Typography>
                      </Box>
                    )}
                    {datasetDetails.tags.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Tags
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {datasetDetails.tags.map((tag, index) => (
                            <Chip key={index} label={tag} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* Statistics */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Statistics
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                      <Box>
                        <Typography variant="h4" color="primary">{datasetDetails.statistics.total_documents}</Typography>
                        <Typography variant="body2" color="text.secondary">Total Documents</Typography>
                      </Box>
                      <Box>
                        <Typography variant="h4" color="success.main">{datasetDetails.statistics.total_chunks}</Typography>
                        <Typography variant="body2" color="text.secondary">Total Chunks</Typography>
                      </Box>
                      <Box>
                        <Typography variant="h4" color="info.main">{datasetDetails.statistics.chunks_with_embeddings}</Typography>
                        <Typography variant="body2" color="text.secondary">Processed Chunks</Typography>
                      </Box>
                      <Box>
                        <Typography variant="h4" color="warning.main">{Math.round(datasetDetails.statistics.total_file_size / 1024)} KB</Typography>
                        <Typography variant="body2" color="text.secondary">Total Size</Typography>
                      </Box>
                    </Box>
                    
                    {/* Processing Progress */}
                    {datasetDetails.statistics.total_chunks > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Processing Progress: {datasetDetails.statistics.processing_progress}%
                        </Typography>
                        <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
                          <Box 
                            sx={{ 
                              width: `${datasetDetails.statistics.processing_progress}%`, 
                              bgcolor: datasetDetails.statistics.processing_complete ? 'success.main' : 'warning.main',
                              height: 8,
                              transition: 'width 0.3s ease'
                            }} 
                          />
                        </Box>
                      </Box>
                    )}
                    
                    {/* Status Breakdown */}
                    {Object.keys(datasetDetails.statistics.documents_by_status).length > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Documents by Status
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {Object.entries(datasetDetails.statistics.documents_by_status).map(([status, count]) => (
                            <Chip
                              key={status}
                              label={`${status}: ${count}`}
                              size="small"
                              color={status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'default'}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* Assigned Bots */}
                {datasetDetails.assigned_bots.length > 0 && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Assigned Bots ({datasetDetails.assigned_bots.length})
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 2 }}>
                        {datasetDetails.assigned_bots.map((bot) => (
                          <Paper key={bot.id} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                            <Typography variant="body1" fontWeight={500}>{bot.name}</Typography>
                            {bot.description && (
                              <Typography variant="body2" color="text.secondary">{bot.description}</Typography>
                            )}
                            <Chip
                              label={bot.is_active ? 'Active' : 'Inactive'}
                              size="small"
                              color={bot.is_active ? 'success' : 'default'}
                              sx={{ mt: 1 }}
                            />
                          </Paper>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* Documents */}
                {datasetDetails.documents.length > 0 && (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Recent Documents ({datasetDetails.documents.length} of {datasetDetails.statistics.total_documents})
                      </Typography>
                      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Title</TableCell>
                              <TableCell>Type</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Chunks</TableCell>
                              <TableCell>Size</TableCell>
                              <TableCell>Created</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {datasetDetails.documents.map((doc) => (
                              <TableRow key={doc.id} hover>
                                <TableCell>
                                  <Typography variant="body2">{doc.title}</Typography>
                                  {doc.tags.length > 0 && (
                                    <Box sx={{ mt: 0.5 }}>
                                      {doc.tags.slice(0, 2).map((tag, idx) => (
                                        <Chip key={idx} label={tag} size="small" variant="outlined" sx={{ mr: 0.5, height: 16, fontSize: '0.7rem' }} />
                                      ))}
                                    </Box>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Chip label={doc.source_type} size="small" variant="outlined" />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={doc.status}
                                    size="small"
                                    color={doc.status === 'completed' ? 'success' : doc.status === 'failed' ? 'error' : 'default'}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {doc.chunks_with_embeddings}/{doc.chunk_count}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : 'N/A'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">{formatDate(doc.created_at)}</Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
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