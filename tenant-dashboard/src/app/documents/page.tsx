'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
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
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Upload,
  InsertDriveFile,
  MoreVert,
  Delete,
  Download,
  Visibility,
  CloudUpload,
  Refresh,
  Search,
} from '@mui/icons-material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TenantLayout from '@/components/layout/TenantLayout';

// API services
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface DocumentDataset {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  metadata: any;
  created_at: string;
  updated_at: string;
  total_documents: number;
  completed_documents: number;
  total_chunks: number;
  other_documents: {
    id: string;
    title: string;
    status: string;
    file_size: number;
    created_at: string;
  }[];
}

interface Document {
  id: string;
  title: string;
  source_type: string;
  source_url?: string;
  tags: string[];
  metadata: any;
  dataset_id: string;
  content_hash: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  dataset_name?: string;
  chunk_count?: number;
  chunks_with_embeddings?: number;
  processing_complete?: boolean;
  dataset?: DocumentDataset;
}

interface Dataset {
  id: string;
  name: string;
  description?: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDataset, setUploadDataset] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState<'file' | 'text'>('file');
  const [textContent, setTextContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [documentDetails, setDocumentDetails] = useState<Document | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('tenant_access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const loadData = async () => {
    await Promise.all([loadDocuments(), loadDatasets()]);
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/v1/tenant/documents`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      setError('Failed to load documents. Please try again.');
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDatasets = async () => {
    try {
      const response = await fetch(`${API_BASE}/v1/tenant/datasets`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch datasets');
      }
      
      const data = await response.json();
      setDatasets(data);
    } catch (err) {
      console.error('Error loading datasets:', err);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, document: Document) => {
    setAnchorEl(event.currentTarget);
    setSelectedDocument(document);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDocument(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
      }
    }
  };

  const handleUploadDocument = async () => {
    if ((!uploadFile && uploadType === 'file') || (!textContent && uploadType === 'text') || !uploadDataset || !uploadTitle) {
      return;
    }

    try {
      const token = localStorage.getItem('tenant_access_token');
      let response;

      if (uploadType === 'file' && uploadFile) {
        // File upload endpoint
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('title', uploadTitle);

        response = await fetch(`${API_BASE}/v1/tenant/datasets/${uploadDataset}/documents/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
      } else if (uploadType === 'text') {
        // Text content endpoint
        const requestBody = {
          title: uploadTitle,
          content: textContent,
          source_type: 'text',
          tags: [],
          metadata: {}
        };

        response = await fetch(`${API_BASE}/v1/tenant/datasets/${uploadDataset}/documents`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
      }

      if (!response || !response.ok) {
        throw new Error('Failed to upload document');
      }

      // Reset form and reload documents
      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadDataset('');
      setUploadTitle('');
      setTextContent('');
      setUploadType('file');
      loadDocuments();
    } catch (err) {
      setError('Failed to upload document. Please try again.');
      console.error('Error uploading document:', err);
    }
  };

  const handleViewDetails = async () => {
    if (!selectedDocument) return;

    try {
      const response = await fetch(`${API_BASE}/v1/tenant/documents/${selectedDocument.id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch document details');
      }

      const documentData = await response.json();
      setDocumentDetails(documentData);
      setDetailsDialogOpen(true);
      handleMenuClose();
    } catch (err) {
      setError('Failed to load document details. Please try again.');
      console.error('Error loading document details:', err);
    }
  };

  const handleDeleteDocument = async () => {
    if (!selectedDocument) return;

    try {
      const response = await fetch(`${API_BASE}/v1/tenant/documents/${selectedDocument.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      handleMenuClose();
      loadDocuments();
    } catch (err) {
      setError('Failed to delete document. Please try again.');
      console.error('Error deleting document:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'processing') {
      return <LinearProgress sx={{ width: 60, height: 4 }} />;
    }
    return null;
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.dataset_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <TenantLayout>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              Documents
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your knowledge base documents and content
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadDocuments}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Add Document
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Box>

        {/* Documents Table */}
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
                      <TableCell>Document</TableCell>
                      <TableCell>Dataset</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Uploaded</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDocuments.map((document) => (
                      <TableRow key={document.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <InsertDriveFile sx={{ color: 'primary.main', mr: 2 }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {document.title}
                              </Typography>
                              <Chip 
                                label={document.source_type} 
                                size="small" 
                                variant="outlined" 
                                sx={{ ml: 1, height: 20 }}
                              />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={document.dataset_name || 'Unknown'} 
                            size="small" 
                            variant="outlined" 
                          />
                        </TableCell>
                        <TableCell>{formatFileSize(document.file_size)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={document.status || 'unknown'}
                              color={getStatusColor(document.status || 'unknown') as any}
                              size="small"
                            />
                            {getStatusIcon(document.status || 'unknown')}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={document.source_type || 'unknown'} 
                            size="small" 
                            color={(document.source_type || 'unknown') === 'file' ? 'primary' : 'secondary'}
                          />
                        </TableCell>
                        <TableCell>{formatDate(document.created_at)}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, document)}
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredDocuments.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            {searchTerm ? 'No documents match your search.' : 'No documents found. Upload your first document to get started.'}
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

        {/* Document Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleViewDetails}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            View Details
          </MenuItem>
          <MenuItem onClick={handleDeleteDocument}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            Delete
          </MenuItem>
        </Menu>

        {/* Upload Document Dialog */}
        <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Document</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              {/* Upload Type Selection */}
              <FormControl fullWidth>
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as 'file' | 'text')}
                  label="Document Type"
                >
                  <MenuItem value="file">File Upload</MenuItem>
                  <MenuItem value="text">Text Content</MenuItem>
                </Select>
              </FormControl>

              {/* File Upload */}
              {uploadType === 'file' && (
                <Box
                  sx={{
                    border: '2px dashed',
                    borderColor: 'grey.300',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'grey.50',
                    },
                  }}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={handleFileUpload}
                  />
                  <CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {uploadFile ? uploadFile.name : 'Choose a file or drag it here'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Supported formats: PDF, DOC, DOCX, TXT, MD
                  </Typography>
                </Box>
              )}

              {/* Text Content */}
              {uploadType === 'text' && (
                <TextField
                  label="Text Content"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  fullWidth
                  multiline
                  rows={8}
                  required
                  helperText="Enter the text content for this document"
                />
              )}

              {/* Document Title */}
              <TextField
                label="Document Title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                fullWidth
                required
                helperText="Enter a title for this document"
              />

              {/* Dataset Selection */}
              <FormControl fullWidth required>
                <InputLabel>Dataset</InputLabel>
                <Select
                  value={uploadDataset}
                  onChange={(e) => setUploadDataset(e.target.value)}
                  label="Dataset"
                >
                  {datasets.map((dataset) => (
                    <MenuItem key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleUploadDocument} 
              disabled={
                !uploadTitle || 
                !uploadDataset || 
                (uploadType === 'file' && !uploadFile) ||
                (uploadType === 'text' && !textContent.trim())
              }
            >
              Add Document
            </Button>
          </DialogActions>
        </Dialog>

        {/* Document Details Dialog */}
        <Dialog 
          open={detailsDialogOpen} 
          onClose={() => setDetailsDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            Document Details
          </DialogTitle>
          <DialogContent>
            {documentDetails && (
              <Box sx={{ pt: 2 }}>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Basic Information
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Title</Typography>
                        <Typography variant="body1">{documentDetails.title || 'Untitled'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Source Type</Typography>
                        <Chip 
                          label={documentDetails.source_type || 'unknown'} 
                          size="small" 
                          color={(documentDetails.source_type || 'unknown') === 'file' ? 'primary' : 'secondary'}
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">File Size</Typography>
                        <Typography variant="body1">{formatFileSize(documentDetails.file_size)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <Chip
                          label={documentDetails.status || 'unknown'}
                          color={getStatusColor(documentDetails.status || 'unknown') as any}
                          size="small"
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Created</Typography>
                        <Typography variant="body1">{formatDate(documentDetails.created_at)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Updated</Typography>
                        <Typography variant="body1">{formatDate(documentDetails.updated_at)}</Typography>
                      </Box>
                    </Box>
                    
                    {/* Processing Information */}
                    {(documentDetails.chunk_count !== undefined || documentDetails.chunks_with_embeddings !== undefined) && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          Processing Information
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Total Chunks</Typography>
                            <Typography variant="body1">{documentDetails.chunk_count || 0}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Chunks with Embeddings</Typography>
                            <Typography variant="body1">{documentDetails.chunks_with_embeddings || 0}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Processing Complete</Typography>
                            <Chip
                              label={documentDetails.processing_complete ? 'Yes' : 'No'}
                              color={documentDetails.processing_complete ? 'success' : 'warning'}
                              size="small"
                            />
                          </Box>
                        </Box>
                        
                        {documentDetails.chunk_count && documentDetails.chunks_with_embeddings && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">Embedding Progress</Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={(documentDetails.chunks_with_embeddings / documentDetails.chunk_count) * 100}
                              sx={{ mt: 1, height: 8, borderRadius: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {documentDetails.chunks_with_embeddings} / {documentDetails.chunk_count} chunks processed
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                    
                    {documentDetails.source_url && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">Source URL</Typography>
                        <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                          <a href={documentDetails.source_url} target="_blank" rel="noopener noreferrer">
                            {documentDetails.source_url}
                          </a>
                        </Typography>
                      </Box>
                    )}
                    
                    {documentDetails.error_message && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Processing Error:</strong><br/>
                          {documentDetails.error_message}
                        </Typography>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
                
                {documentDetails.tags && documentDetails.tags.length > 0 && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Tags
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {documentDetails.tags.map((tag, index) => (
                          <Chip key={index} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                )}
                
                {/* Dataset Information */}
                {documentDetails.dataset && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Dataset: {documentDetails.dataset.name}
                      </Typography>
                      
                      {documentDetails.dataset.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {documentDetails.dataset.description}
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Total Documents</Typography>
                          <Typography variant="h6">{documentDetails.dataset.total_documents}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Completed Documents</Typography>
                          <Typography variant="h6" color={documentDetails.dataset.completed_documents === documentDetails.dataset.total_documents ? 'success.main' : 'warning.main'}>
                            {documentDetails.dataset.completed_documents}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Total Chunks</Typography>
                          <Typography variant="h6">{documentDetails.dataset.total_chunks}</Typography>
                        </Box>
                      </Box>
                      
                      {documentDetails.dataset.tags && documentDetails.dataset.tags.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Dataset Tags
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {documentDetails.dataset.tags.map((tag, index) => (
                              <Chip key={index} label={tag} size="small" color="primary" variant="outlined" />
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      {documentDetails.dataset.other_documents && documentDetails.dataset.other_documents.length > 0 && (
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Other Documents in Dataset
                          </Typography>
                          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Title</TableCell>
                                  <TableCell>Status</TableCell>
                                  <TableCell>Size</TableCell>
                                  <TableCell>Created</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {documentDetails.dataset.other_documents.map((doc) => (
                                  <TableRow key={doc.id} hover>
                                    <TableCell>
                                      <Typography variant="body2">{doc.title}</Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={doc.status}
                                        color={getStatusColor(doc.status) as any}
                                        size="small"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2">{formatFileSize(doc.file_size)}</Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2">{formatDate(doc.created_at)}</Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          {documentDetails.dataset.total_documents > documentDetails.dataset.other_documents.length + 1 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              Showing {documentDetails.dataset.other_documents.length} of {documentDetails.dataset.total_documents - 1} other documents
                            </Typography>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {documentDetails.metadata && Object.keys(documentDetails.metadata).length > 0 && (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Document Metadata
                      </Typography>
                      <Box component="pre" sx={{ 
                        backgroundColor: 'grey.100', 
                        p: 2, 
                        borderRadius: 1, 
                        overflow: 'auto',
                        fontSize: '0.875rem'
                      }}>
                        {JSON.stringify(documentDetails.metadata, null, 2)}
                      </Box>
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
      </TenantLayout>
    </ProtectedRoute>
  );
}