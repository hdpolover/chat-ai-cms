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
} from '@mui/material';
import {
  Upload,
  InsertDriveFile,
  MoreVert,
  Delete,
  Download,
  Visibility,
  CloudUpload,
} from '@mui/icons-material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TenantLayout from '@/components/layout/TenantLayout';

interface Document {
  id: string;
  title: string;
  fileName: string;
  fileSize: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploadedAt: string;
  chunks: number;
  dataset: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDataset, setUploadDataset] = useState('');

  // Mock data - replace with actual API calls
  useEffect(() => {
    setDocuments([
      {
        id: '1',
        title: 'Customer Support FAQ',
        fileName: 'support-faq.pdf',
        fileSize: '2.3 MB',
        status: 'completed',
        uploadedAt: '2 hours ago',
        chunks: 45,
        dataset: 'Support Documents',
      },
      {
        id: '2',
        title: 'Product Manual',
        fileName: 'product-manual.docx',
        fileSize: '5.1 MB',
        status: 'processing',
        uploadedAt: '1 hour ago',
        chunks: 23,
        dataset: 'Product Docs',
      },
      {
        id: '3',
        title: 'Company Policies',
        fileName: 'policies.txt',
        fileSize: '800 KB',
        status: 'completed',
        uploadedAt: '1 day ago',
        chunks: 12,
        dataset: 'Internal Docs',
      },
      {
        id: '4',
        title: 'API Documentation',
        fileName: 'api-docs.md',
        fileSize: '1.2 MB',
        status: 'failed',
        uploadedAt: '2 days ago',
        chunks: 0,
        dataset: 'Technical Docs',
      },
    ]);
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, documentId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedDocument(documentId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDocument(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleUploadDocument = () => {
    if (uploadFile && uploadDataset) {
      // TODO: Implement document upload API call
      console.log('Uploading document:', uploadFile.name, 'to dataset:', uploadDataset);
      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadDataset('');
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

  return (
    <ProtectedRoute>
      <TenantLayout>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              Documents
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your knowledge base documents and datasets
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={() => setUploadDialogOpen(true)}
            sx={{ height: 'fit-content' }}
          >
            Upload Document
          </Button>
        </Box>

        {/* Documents Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Document</TableCell>
                    <TableCell>Dataset</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Chunks</TableCell>
                    <TableCell>Uploaded</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map((document) => (
                    <TableRow key={document.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <InsertDriveFile sx={{ color: 'primary.main', mr: 2 }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {document.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {document.fileName}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={document.dataset} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{document.fileSize}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={document.status}
                            color={getStatusColor(document.status) as any}
                            size="small"
                          />
                          {getStatusIcon(document.status)}
                        </Box>
                      </TableCell>
                      <TableCell>{document.chunks}</TableCell>
                      <TableCell>{document.uploadedAt}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, document.id)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Document Actions Menu */}
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
              <Download fontSize="small" />
            </ListItemIcon>
            Download
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            Delete
          </MenuItem>
        </Menu>

        {/* Upload Document Dialog */}
        <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
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

              <TextField
                label="Dataset Name"
                value={uploadDataset}
                onChange={(e) => setUploadDataset(e.target.value)}
                fullWidth
                required
                helperText="Enter the name of the dataset to add this document to"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleUploadDocument} 
              disabled={!uploadFile || !uploadDataset}
            >
              Upload
            </Button>
          </DialogActions>
        </Dialog>
      </TenantLayout>
    </ProtectedRoute>
  );
}