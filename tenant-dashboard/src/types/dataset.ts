/**
 * Dataset and document management types
 */

import { BaseEntity } from './common';

export interface Dataset extends BaseEntity {
  tenant_id: string;
  name: string;
  description?: string;
  tags: string[];
  metadata: any;
  is_active: boolean;
  document_count: number;
  chunk_count: number;
  completed_documents: number;
  processing_complete: boolean;
}

export interface CreateDatasetRequest {
  name: string;
  description?: string;
  tags?: string[];
}

export interface UpdateDatasetRequest {
  name?: string;
  description?: string;
  tags?: string[];
}

export interface Document extends BaseEntity {
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

export interface UploadDocumentRequest {
  file: File;
  dataset: string;
  title?: string;
}