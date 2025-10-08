import { BaseApiService } from './BaseApiService';
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  PaginationParams,
  PaginatedResponse
} from '../types/api';

/**
 * User API Service
 */
class UserApiService extends BaseApiService {
  constructor() {
    super('/Users'); // Backend'de /api/Users endpoint'i kullanılıyor
  }

  /**
   * Tüm kullanıcıları getir
   */
  async getUsers(params?: PaginationParams): Promise<PaginatedResponse<User>> {
    return this.getAll<User>(params) as Promise<PaginatedResponse<User>>;
  }

  /**
   * Tek bir kullanıcıyı getir
   */
  async getUser(id: number): Promise<User> {
    return this.get<User>(id);
  }

  /**
   * Yeni kullanıcı oluştur
   */
  async createUser(userData: CreateUserDto): Promise<User> {
    return this.create<User, CreateUserDto>(userData);
  }

  /**
   * Kullanıcı güncelle
   */
  async updateUser(id: number, userData: UpdateUserDto): Promise<User> {
    return this.update<User, UpdateUserDto>(id, userData);
  }

  /**
   * Kullanıcıyı sil
   */
  async deleteUser(id: number): Promise<void> {
    return this.delete(id);
  }

  /**
   * Kullanıcı arama
   */
  async searchUsers(query: string, params?: PaginationParams): Promise<PaginatedResponse<User>> {
    return this.getAll<User>({ ...params, search: query }) as Promise<PaginatedResponse<User>>;
  }

  /**
   * Kullanıcı role'ünü güncelle
   */
  async updateUserRole(id: number, role: 'admin' | 'user' | 'moderator'): Promise<User> {
    return this.patch<User, { role: string }>(id, { role });
  }

  /**
   * Kullanıcı durumunu güncelle (aktif/pasif)
   */
  async updateUserStatus(id: number, status: 'active' | 'inactive'): Promise<User> {
    return this.patch<User, { status: string }>(id, { status });
  }

  /**
   * Kullanıcı istatistiklerini getir
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    usersByRole: Record<string, number>;
  }> {
    return this.customGet<{
      totalUsers: number;
      activeUsers: number;
      newUsers: number;
      usersByRole: Record<string, number>;
    }>('/stats');
  }

  /**
   * Kullanıcıları toplu sil
   */
  async bulkDeleteUsers(ids: number[]): Promise<void> {
    return this.customPost<void, { ids: number[] }>('/bulk-delete', { ids });
  }

  /**
   * Excel'e aktarma
   */
  async exportUsersToExcel(params?: PaginationParams): Promise<Blob> {
    const response = await this.customGet<Blob>('/export', {
      params,
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
    return response;
  }
}

// Singleton instance
export const userApiService = new UserApiService();
export default userApiService;
