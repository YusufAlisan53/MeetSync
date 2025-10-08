import { BaseApiService } from './BaseApiService';
import apiClient from '../utils/axios';
import type { PaginationParams, PaginatedResponse } from '../types/api';

export interface Room {
  id: string;
  name: string;
  capacity: number;
  locationInfo: string;
  details?: string;
  isCurrentlyAvailable?: boolean;
  activeMeetingsCount?: number;
  nextMeetingInfo?: string;
}

export interface CreateRoomRequest {
  name: string;
  capacity: number;
  locationInfo: string;
  details?: string;
}

export interface UpdateRoomRequest extends CreateRoomRequest {
  id: string;
}

export interface RoomFilterParams extends PaginationParams {
  name?: string;
  location?: string;
  isActive?: boolean;
  minCapacity?: number;
  maxCapacity?: number;
}

/**
 * Room API Service
 * Oda yönetimi ile ilgili API çağrılarını yönetir
 */
export class RoomApiService extends BaseApiService {
  constructor() {
    super('/Rooms');
  }

  /**
   * Tüm odaları getir
   */
  async getRooms(params?: RoomFilterParams): Promise<PaginatedResponse<Room> | Room[]> {
    return this.getAll<Room>(params);
  }

  /**
   * Belirli bir odayı getir
   */
  async getRoom(id: string): Promise<Room> {
    return this.get<Room>(id);
  }

  /**
   * Yeni oda oluştur
   */
  async createRoom(data: CreateRoomRequest): Promise<Room> {
    return this.create<Room, CreateRoomRequest>(data);
  }

  /**
   * Oda güncelle
   * Backend ID'yi URL'de değil body'de bekliyor
   * NOT: Backend'de RoomBusinessRules.RoomShouldExistWhenSelected henüz implement edilmemiş
   */
  async updateRoom(data: UpdateRoomRequest): Promise<Room> {
    // Backend'in beklediği formata dönüştür
    const requestData = {
      id: data.id,
      name: data.name,
      capacity: data.capacity,
      locationInfo: data.locationInfo,
      details: data.details || "" // Backend empty string bekliyor olabilir
    };
    
    try {
      // Backend '/api/Rooms' endpoint'ine PUT ile ID'yi body'de bekliyor
      const response = await apiClient.put(this.endpoint, requestData);
      
      // API response'unu kontrol et
      if (response.data && response.data.data !== undefined) {
        return response.data.data;
      } else {
        // Fallback - response'un kendisi data ise
        return response.data as Room;
      }
    } catch (error: any) {
      // Backend'deki NotImplementedException için özel hata fırlat
      if (error?.response?.data?.includes?.('NotImplementedException')) {
        const backendError = new Error('Backend\'de oda güncelleme özelliği henüz tamamlanmamış');
        backendError.name = 'NotImplementedError';
        throw backendError;
      }
      throw error;
    }
  }

  /**
   * Oda sil
   */
  async deleteRoom(id: string): Promise<void> {
    return this.delete(id);
  }

  /**
   * Aktif odaları getir
   */
  async getActiveRooms(): Promise<Room[]> {
    return this.customGet<Room[]>('?isActive=true');
  }

  async toggleRoomStatus(id: string, isActive: boolean): Promise<Room> {
    return this.customPost<Room>(`/${id}/toggle-status`, { isActive });
  }

  async getAvailableRooms(startDate: string, endDate: string, capacity?: number): Promise<Room[]> {
    const params = new URLSearchParams({
      startDate,
      endDate,
      ...(capacity && { capacity: capacity.toString() })
    });
    
    return this.customGet<Room[]>(`/available?${params.toString()}`);
  }
}

// Singleton instance
export const roomApiService = new RoomApiService();
export default roomApiService;
