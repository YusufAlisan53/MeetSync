import { AxiosResponse } from 'axios';
import { BaseApiService } from './BaseApiService';
import { apiClient } from './index';

/**
 * OperationClaim API responses
 */
export interface OperationClaim {
  id: number;
  name: string;
  createdDate: string;
  updatedDate?: string;
  deletedDate?: string;
}

export interface OperationClaimListResponse {
  items: OperationClaim[];
  index: number;
  size: number;
  count: number;
  pages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/**
 * OperationClaim API Service
 */
class OperationClaimApiService extends BaseApiService {
  constructor() {
    super('/OperationClaims');
  }
  /**
   * Get all operation claims for selection (no authorization required)
   */
  async getOperationClaimsForSelection(page: number = 0, size: number = 100): Promise<OperationClaimListResponse> {
    const response: AxiosResponse<OperationClaimListResponse> = await apiClient.get(
      '/OperationClaims/for-selection',
      {
        params: {
          'PageRequest.Page': page,
          'PageRequest.PageSize': size
        }
      }
    );
    return response.data;
  }

  /**
   * Get all operation claims
   */
  async getOperationClaims(page: number = 0, size: number = 100): Promise<OperationClaimListResponse> {
    const response: AxiosResponse<OperationClaimListResponse> = await apiClient.get(
      '/OperationClaims',
      {
        params: {
          PageRequest: { Page: page, PageSize: size }
        }
      }
    );
    return response.data;
  }

  /**
   * Get operation claim by ID
   */
  async getOperationClaimById(id: number): Promise<OperationClaim> {
    const response: AxiosResponse<OperationClaim> = await apiClient.get(`/OperationClaims/${id}`);
    return response.data;
  }

  /**
   * Create new operation claim
   */
  async createOperationClaim(name: string): Promise<OperationClaim> {
    const response: AxiosResponse<OperationClaim> = await apiClient.post('/OperationClaims', { name });
    return response.data;
  }

  /**
   * Update operation claim
   */
  async updateOperationClaim(id: number, name: string): Promise<OperationClaim> {
    const response: AxiosResponse<OperationClaim> = await apiClient.put('/OperationClaims', { id, name });
    return response.data;
  }

  /**
   * Delete operation claim
   */
  async deleteOperationClaim(id: number): Promise<void> {
    await apiClient.delete('/OperationClaims', { data: { id } });
  }

  /**
   * Get user operation claims by user ID
   */
  async getUserOperationClaims(page: number = 0, size: number = 100): Promise<any> {
    const response = await apiClient.get('/UserOperationClaims', {
      params: {
        PageRequest: { Page: page, PageSize: size }
      }
    });
    return response.data;
  }

  /**
   * Add operation claim to user
   */
  async addUserOperationClaim(userId: string, operationClaimId: number): Promise<any> {
    const response = await apiClient.post('/UserOperationClaims', {
      userId,
      operationClaimId
    });
    return response.data;
  }

  /**
   * Remove operation claim from user
   */
  async removeUserOperationClaim(id: string): Promise<void> {
    await apiClient.delete('/UserOperationClaims', { data: { id } });
  }
}

export const operationClaimApiService = new OperationClaimApiService();
