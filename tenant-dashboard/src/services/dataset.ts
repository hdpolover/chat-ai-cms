import { apiClient } from './api';

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  created_at: string;
  updated_at?: string;
  is_active?: boolean;
  document_count?: number;
  total_chunks?: number;
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
      const response = await apiClient.get<Dataset[]>('/v1/tenant/datasets/');
      return response || [];
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
      throw error;
    }
  }

  // Get available datasets for bot assignment
  static async getAvailableDatasets(): Promise<Dataset[]> {
    try {
      const response = await apiClient.get<Dataset[]>('/v1/tenant/bots/datasets/available');
      return response || [];
    } catch (error) {
      console.error('Failed to fetch available datasets:', error);
      throw error;
    }
  }

  // Create a new dataset
  static async createDataset(datasetData: CreateDatasetRequest): Promise<Dataset> {
    try {
      const response = await apiClient.post<Dataset>('/v1/tenant/datasets/', datasetData);
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
      const response = await apiClient.put<Dataset>(`/v1/tenant/datasets/${datasetId}`, updates);
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
      await apiClient.delete(`/v1/tenant/datasets/${datasetId}`);
    } catch (error) {
      console.error(`Failed to delete dataset ${datasetId}:`, error);
      throw error;
    }
  }

  // Get dataset statistics
  static async getDatasetStats(datasetId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/v1/tenant/datasets/${datasetId}/stats`);
      return response;
    } catch (error) {
      console.error(`Failed to get dataset stats ${datasetId}:`, error);
      throw error;
    }
  }

  // Assign dataset to bot
  static async assignDatasetToBot(botId: string, datasetId: string, priority: number = 1): Promise<void> {
    try {
      await apiClient.post(`/v1/tenant/bots/${botId}/datasets/${datasetId}?priority=${priority}`);
    } catch (error) {
      console.error(`Failed to assign dataset ${datasetId} to bot ${botId}:`, error);
      throw error;
    }
  }

  // Remove dataset from bot
  static async removeDatasetFromBot(botId: string, datasetId: string): Promise<void> {
    try {
      await apiClient.delete(`/v1/tenant/bots/${botId}/datasets/${datasetId}`);
    } catch (error) {
      console.error(`Failed to remove dataset ${datasetId} from bot ${botId}:`, error);
      throw error;
    }
  }

  // Get datasets assigned to a bot
  static async getBotDatasets(botId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/v1/tenant/bots/${botId}/datasets`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error(`Failed to get datasets for bot ${botId}:`, error);
      throw error;
    }
  }
}