import apiClient from '../utils/axios';
import type { 
  ApiResponse, 
  PaginationParams, 
  PaginatedResponse,
  ApiRequestConfig 
} from '../types/api';
import { AxiosResponse } from 'axios';

/**
 * Base API Service Class
 * Tüm API servislerinin temel sınıfı
 */
export class BaseApiService {
  protected endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  /**
   * GET request - Tek bir kayıt getir
   */
  protected async get<T>(
    id: string | number,
    config?: ApiRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.get(
      `${this.endpoint}/${id}`,
      config
    );
    
    // API response'unu kontrol et
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    } else {
      // Fallback - response'un kendisi data ise
      return response.data as T;
    }
  }

  /**
   * GET request - Tüm kayıtları getir
   */
  protected async getAll<T>(
    params?: PaginationParams & Record<string, any>,
    config?: ApiRequestConfig
  ): Promise<PaginatedResponse<T> | T[]> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<T> | T[]>> = await apiClient.get(
      this.endpoint,
      {
        ...config,
        params: { ...params, ...config?.params }
      }
    );
    
    // Backend'den gelen response yapısını kontrol et
    const responseData = response.data as any;
    if (responseData && responseData.items && Array.isArray(responseData.items)) {
      // Backend paginated response döndürüyor: {items: [...], index: 0, ...}
      return responseData.items as T[];
    } else if (responseData && responseData.data !== undefined) {
      // Standard API response: {data: [...]}
      return responseData.data;
    } else if (responseData && Array.isArray(responseData)) {
      // Direkt array dönen API'lar için
      return responseData as T[];
    } else {
      console.warn('Unexpected response format:', responseData);
      return [];
    }
  }

  /**
   * POST request - Yeni kayıt oluştur
   */
  protected async create<T, D = any>(
    data: D,
    config?: ApiRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.post(
      this.endpoint,
      data,
      config
    );
    
    // API response'unu kontrol et
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    } else {
      // Fallback - response'un kendisi data ise
      return response.data as T;
    }
  }

  /**
   * PUT request - Kayıt güncelle
   */
  protected async update<T, D = any>(
    id: string | number,
    data: D,
    config?: ApiRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.put(
      `${this.endpoint}/${id}`,
      data,
      config
    );
    
    // API response'unu kontrol et
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    } else {
      // Fallback - response'un kendisi data ise
      return response.data as T;
    }
  }

  /**
   * PATCH request - Kısmi güncelleme
   */
  protected async patch<T, D = any>(
    id: string | number,
    data: D,
    config?: ApiRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.patch(
      `${this.endpoint}/${id}`,
      data,
      config
    );
    
    // API response'unu kontrol et
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    } else {
      // Fallback - response'un kendisi data ise
      return response.data as T;
    }
  }

  /**
   * DELETE request - Kayıt sil
   */
  protected async delete(
    id: string | number,
    config?: ApiRequestConfig
  ): Promise<void> {
    await apiClient.delete(`${this.endpoint}/${id}`, config);
  }

  /**
   * Custom GET request
   */
  protected async customGet<T>(
    path: string,
    config?: ApiRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.get(
      `${this.endpoint}${path}`,
      config
    );
    
    // API response'unu kontrol et
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    } else {
      // Fallback - response'un kendisi data ise
      return response.data as T;
    }
  }

  /**
   * Custom POST request
   */
  protected async customPost<T, D = any>(
    path: string,
    data?: D,
    config?: ApiRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.post(
      `${this.endpoint}${path}`,
      data,
      config
    );
    
    // API response'unu kontrol et
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    } else {
      // Fallback - response'un kendisi data ise
      return response.data as T;
    }
  }
}
