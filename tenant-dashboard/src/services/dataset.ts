import { apiClient } from './api';
import { CONFIG } from '@/config';

export interface Dataset {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  tags: string[];
  metadata: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

export class DatasetService {
  // Get all datasets for the tenant
  static async getDatasets(): Promise<Dataset[]> {
    try {
      const response = await apiClient.get<Dataset[]>(CONFIG.API.TENANT_DATASETS);
      return response || [];
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
      throw error;
    }
  }

  // Get available datasets for bot assignment
  static async getAvailableDatasets(): Promise<Dataset[]> {
    try {
      const response = await apiClient.get<Dataset[]>(CONFIG.API.TENANT_BOTS_DATASETS_AVAILABLE);
      return response || [];
    } catch (error) {
      console.error('Failed to fetch available datasets:', error);
      throw error;
    }
  }

  // Create a new dataset
  static async createDataset(datasetData: CreateDatasetRequest): Promise<Dataset> {
    try {
      const response = await apiClient.post<Dataset>(CONFIG.API.TENANT_DATASETS, datasetData);
      if (!response) {
        throw new Error('Failed to create dataset');
      }
      return response;
    } catch (error) {
      console.error('Failed to create dataset:', error);
      throw error;
    }
  }

  // Update a dataset
  static async updateDataset(datasetId: string, updates: UpdateDatasetRequest): Promise<Dataset> {
    try {
      const response = await apiClient.put<Dataset>(CONFIG.API.TENANT_DATASET_BY_ID(datasetId), updates);
      if (!response) {
        throw new Error('Failed to update dataset');
      }
      return response;
    } catch (error) {
      console.error(`Failed to update dataset ${datasetId}:`, error);
      throw error;
    }
  }

  // Delete a dataset
  static async deleteDataset(datasetId: string): Promise<void> {
    try {
      await apiClient.delete(CONFIG.API.TENANT_DATASET_BY_ID(datasetId));
    } catch (error) {
      console.error(`Failed to delete dataset ${datasetId}:`, error);
      throw error;
    }
  }

  // Get dataset statistics
  static async getDatasetStats(datasetId: string): Promise<any> {
    try {
      const response = await apiClient.get(CONFIG.API.TENANT_DATASET_STATS(datasetId));
      return response;
    } catch (error) {
      console.error(`Failed to get dataset stats ${datasetId}:`, error);
      throw error;
    }
  }

  // Assign dataset to bot
  static async assignDatasetToBot(botId: string, datasetId: string, priority: number = 1): Promise<void> {
    try {
      await apiClient.post(CONFIG.API.TENANT_BOT_DATASET_ASSIGN(botId, datasetId, priority));
    } catch (error) {
      console.error(`Failed to assign dataset ${datasetId} to bot ${botId}:`, error);
      throw error;
    }
  }

  // Remove dataset from bot
  static async removeDatasetFromBot(botId: string, datasetId: string): Promise<void> {
    try {
      await apiClient.delete(CONFIG.API.TENANT_BOT_DATASET_REMOVE(botId, datasetId));
    } catch (error) {
      console.error(`Failed to remove dataset ${datasetId} from bot ${botId}:`, error);
      throw error;
    }
  }

  // Get datasets assigned to a bot
  static async getBotDatasets(botId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(CONFIG.API.TENANT_BOT_DATASETS(botId));
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error(`Failed to get datasets for bot ${botId}:`, error);
      throw error;
    }
  }
}