import { apiClient } from './api';
import { CONFIG } from '@/config';
import { ApiResponse } from '@/types';

export interface Document {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  chunks: number;
  dataset: string;
  uploadedAt: string;
  processedAt?: string;
  errorMessage?: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  totalChunks: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UploadDocumentRequest {
  file: File;
  dataset: string;
  title?: string;
}

export class DocumentService {
  // Get all documents for the tenant
  static async getDocuments(): Promise<Document[]> {
    try {
      const response = await apiClient.get<ApiResponse<Document[]>>(CONFIG.API.TENANT_DOCUMENTS);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      throw error;
    }
  }

  // Get all datasets for the tenant
  static async getDatasets(): Promise<Dataset[]> {
    try {
      const response = await apiClient.get<ApiResponse<Dataset[]>>(CONFIG.API.TENANT_DOCUMENTS_DATASETS);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
      throw error;
    }
  }

  // Get a specific document by ID
  static async getDocument(documentId: string): Promise<Document> {
    try {
      const response = await apiClient.get<ApiResponse<Document>>(CONFIG.API.TENANT_DOCUMENT_BY_ID(documentId));
      if (!response.data) {
        throw new Error('Document not found');
      }
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch document ${documentId}:`, error);
      throw error;
    }
  }

  // Upload a new document
  static async uploadDocument(uploadData: UploadDocumentRequest): Promise<Document> {
    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('dataset', uploadData.dataset);
      if (uploadData.title) {
        formData.append('title', uploadData.title);
      }

      const response = await apiClient.upload<ApiResponse<Document>>(
        CONFIG.API.TENANT_DOCUMENT_UPLOAD,
        formData
      );
      
      if (!response.data) {
        throw new Error('Failed to upload document');
      }
      return response.data;
    } catch (error) {
      console.error('Failed to upload document:', error);
      throw error;
    }
  }

  // Delete a document
  static async deleteDocument(documentId: string): Promise<void> {
    try {
      await apiClient.delete(CONFIG.API.TENANT_DOCUMENT_BY_ID(documentId));
    } catch (error) {
      console.error(`Failed to delete document ${documentId}:`, error);
      throw error;
    }
  }

  // Create a new dataset
  static async createDataset(name: string, description: string, tags: string[] = []): Promise<Dataset> {
    try {
      const response = await apiClient.post<ApiResponse<Dataset>>(CONFIG.API.TENANT_DOCUMENTS_DATASETS, {
        name,
        description,
        tags,
      });
      if (!response.data) {
        throw new Error('Failed to create dataset');
      }
      return response.data;
    } catch (error) {
      console.error('Failed to create dataset:', error);
      throw error;
    }
  }

  // Delete a dataset
  static async deleteDataset(datasetId: string): Promise<void> {
    try {
      await apiClient.delete(CONFIG.API.TENANT_DOCUMENTS_DATASET_BY_ID(datasetId));
    } catch (error) {
      console.error(`Failed to delete dataset ${datasetId}:`, error);
      throw error;
    }
  }

  // Get document processing status
  static async getProcessingStatus(documentId: string): Promise<{ status: string; progress: number; message?: string }> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(CONFIG.API.TENANT_DOCUMENT_STATUS(documentId));
      return response.data || { status: 'unknown', progress: 0 };
    } catch (error) {
      console.error(`Failed to fetch processing status for ${documentId}:`, error);
      throw error;
    }
  }

  // Download a document
  static async downloadDocument(documentId: string): Promise<Blob> {
    try {
      const response = await apiClient.get(CONFIG.API.TENANT_DOCUMENT_DOWNLOAD(documentId), {
        responseType: 'blob',
      });
      return response as Blob;
    } catch (error) {
      console.error(`Failed to download document ${documentId}:`, error);
      throw error;
    }
  }
}