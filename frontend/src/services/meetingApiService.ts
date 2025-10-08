import { BaseApiService } from './BaseApiService';
import apiClient from '../utils/axios';
import type { AxiosResponse } from 'axios';

export interface Meeting {
  id: string;
  subject: string;
  content: string;
  roomId: string | null; // Backend'de nullable
  roomName?: string; // ✅ YENİ EKLENEN: Backend'den direkt roomName gelecek
  room?: Room; // Backend'den room object gelebilir (eski format için backward compatibility)
  startDate: string; // ISO string
  duration: string; // TimeSpan format "HH:MM:SS"
  isApproved: boolean;
  createdByUserId?: string;
  createdByUserName?: string; // Oluşturan kullanıcının adı
  approvedByUserId?: string;
  approvedByUserName?: string; // Onaylayan kullanıcının adı
  approvedDate?: string;
  rejectedDate?: string; // Reddedilme tarihi
  status?: 'pending' | 'approved' | 'rejected'; // Toplantının mevcut durumu
}

export interface CreateMeetingCommand {
  command?: {
    subject: string;
    content: string;
    roomId: string | null;
    roomName?: string | null;
    startDate: string;
    duration: string;
  };
  // Alternatif: Direkt fields
  subject: string;
  content: string;
  roomId: string | null; // GUID format olmalı
  roomName?: string | null; // Oda adı (opsiyonel)
  startDate: string; // ISO string
  duration: string; // TimeSpan format "HH:MM:SS"
}

export interface UpdateMeetingCommand extends CreateMeetingCommand {
  id: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  locationInfo?: string;
  details?: string;
  createdDate?: string;
  updatedDate?: string;
  deletedDate?: string;
}

// Backend'den gelen RecommendedDto için interface
export interface RecommendedDto {
  roomId: string;
  roomName: string;
  roomCapacity: number;
  recommendedStartDateTime: string; // ISO string
  availableOptionalUserCount: number;
}

// Backend'den gelen GetRecommendedRoomsListResponse için interface
export interface GetRecommendedRoomsListResponse {
  recommendedRooms: RecommendedDto[];
}

// Frontend'de query parametreleri için interface
export interface GetRecommendedRoomsListQuery {
  requiredUserIdList: string[];
  optionalUserIdList: string[];
  duration: string; // TimeSpan format "HH:MM:SS"
}

export interface AlternativeSlot {
  type: 'time' | 'room';
  roomId: string;
  roomName: string;
  startDate: string;
  duration: string;
  suggestion: string;
}

/**
 * Meeting API Service
 */
class MeetingApiService extends BaseApiService {
  constructor() {
    super('/Meetings');
  }

  /**
   * Get all meetings
   */
  async getMeetings(): Promise<Meeting[]> {
    try {
      const response: AxiosResponse<{items: Meeting[]} | Meeting[]> = await apiClient.get('/Meetings?PageIndex=0&PageSize=100');
      // Backend'den gelen response format'ını kontrol et
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && 'items' in response.data && Array.isArray(response.data.items)) {
        return response.data.items;
      } else {
        console.warn('Unexpected meetings response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      return [];
    }
  }

    async getMyMeetings(): Promise<Meeting[]> {
    try {
      const response: AxiosResponse<{items: Meeting[]} | Meeting[]> = await apiClient.get('/Meetings/GetUserMeetingsFromAuth?PageIndex=0&PageSize=100');
      // Backend'den gelen response format'ını kontrol et
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && 'items' in response.data && Array.isArray(response.data.items)) {
        return response.data.items;
      } else {
        console.warn('Unexpected meetings response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      return [];
    }
  }

  /**
   * Get meetings for a specific room within a date range
   */
  async getRoomMeetings(roomId: string, startDate: string, endDate: string): Promise<Meeting[]> {
    try {
      // Backend'de özel endpoint varsa onu kullan
      const response: AxiosResponse<{items: Meeting[]} | Meeting[]> = await apiClient.get(
        `/Meetings/room/${roomId}?startDate=${startDate}&endDate=${endDate}&PageIndex=0&PageSize=1000`
      );
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && 'items' in response.data && Array.isArray(response.data.items)) {
        return response.data.items;
      } else {
        console.warn('Unexpected room meetings response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching room meetings, falling back to filter all meetings:', error);
      
      // Fallback: Tüm toplantıları al ve filtrele
      const [allMeetings, pendingMeetings] = await Promise.all([
        this.getMeetings(),
        this.getPendingMeetings()
      ]);
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      return [...allMeetings, ...pendingMeetings].filter(meeting => {
        if (meeting.roomId !== roomId) return false;
        
        const meetingDate = new Date(meeting.startDate);
        return meetingDate >= start && meetingDate <= end;
      });
    }
  }

  /**
   * Get pending meetings (waiting for approval)
   */
  async getPendingMeetings(): Promise<Meeting[]> {
    try {
      const response: AxiosResponse<{items: Meeting[]} | Meeting[]> = await apiClient.get('/Meetings/pending?PageIndex=0&PageSize=100');
      // Backend'den gelen response format'ını kontrol et
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && 'items' in response.data && Array.isArray(response.data.items)) {
        return response.data.items;
      } else {
        console.warn('Unexpected pending meetings response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching pending meetings:', error);
      return [];
    }
  }

  /**
   * Get my meetings with their approval status (for System.User role)
   * Bu endpoint kullanıcının kendi oluşturduğu toplantıları ve onay durumlarını döndürür
   */
  async getMyMeetingsWithStatus(): Promise<Meeting[]> {
    try {
      const response: AxiosResponse<{items: Meeting[]} | Meeting[]> = await apiClient.get('/Meetings/GetUserMeetingsWithStatusFromAuth?PageIndex=0&PageSize=100');
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && 'items' in response.data && Array.isArray(response.data.items)) {
        return response.data.items;
      } else {
        console.warn('Unexpected my meetings with status response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching my meetings with status:', error);
      // Fallback olarak normal my meetings endpoint'ini kullan
      return this.getMyMeetings();
    }
  }

  /**
   * Approve meeting
   */
  async approveMeeting(meetingId: string): Promise<void> {
    try {
      await apiClient.post(`/Meetings/approve/${meetingId}`);
    } catch (error: any) {
      // Alternatif endpoint formatları dene
      if (error.response?.status === 404) {
        console.log('Trying alternative approve endpoint formats...');
        try {
          await apiClient.put(`/Meetings/${meetingId}/approve`);
        } catch (error2: any) {
          if (error2.response?.status === 404) {
            await apiClient.patch(`/Meetings/${meetingId}`, { status: 'approved' });
          } else {
            throw error2;
          }
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Reject meeting
   */
  async rejectMeeting(meetingId: string): Promise<void> {
    try {
      await apiClient.post(`/Meetings/reject/${meetingId}`);
    } catch (error: any) {
      // Alternatif endpoint formatları dene
      if (error.response?.status === 404) {
        console.log('Trying alternative reject endpoint formats...');
        try {
          await apiClient.put(`/Meetings/${meetingId}/reject`);
        } catch (error2: any) {
          if (error2.response?.status === 404) {
            await apiClient.patch(`/Meetings/${meetingId}`, { status: 'rejected' });
          } else {
            throw error2;
          }
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Get all rooms
   */
  async getRooms(): Promise<Room[]> {
    try {
      // Backend'de /api/Rooms endpoint'i var mı kontrol et
      const response: AxiosResponse<{items: Room[]} | Room[]> = await apiClient.get('/Rooms?PageIndex=0&PageSize=100');
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && 'items' in response.data && Array.isArray(response.data.items)) {
        return response.data.items;
      } else {
        console.warn('Unexpected rooms response format:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('❌ Error fetching rooms from /Rooms endpoint:', error);
      
      // Eğer /Rooms endpoint'i yoksa geliştirici için detaylı bilgi ver
      if (error.response?.status === 404) {
        console.error(`
🚨 BACKEND EKSİK ENDPOINT:
Senin API listende Rooms endpoint'i boş görünüyor.
Lütfen backend'de şu endpoint'i implement et:

GET /api/Rooms
- Tüm odaları döndürmeli
- Format: {id: string, name: string, capacity: number}[]
- Ya da paginated: {items: Room[], totalCount: number}

Şu anda oda seçimi manuel olarak çalışmayacak.
        `);
        return [];
      }
      return [];
    }
  }

  /**
   * Get meeting by id
   */
  async getMeeting(id: string): Promise<Meeting> {
    const response: AxiosResponse<Meeting> = await apiClient.get(`/Meetings/${id}`);
    return response.data;
  }

  /**
   * Create new meeting
   */
  async createMeeting(meeting: CreateMeetingCommand): Promise<Meeting> {
    const response: AxiosResponse<Meeting> = await apiClient.post('/Meetings', meeting);
    return response.data;
  }

  /**
   * Update meeting
   */
  async updateMeeting(meeting: UpdateMeetingCommand): Promise<Meeting> {

    const response: AxiosResponse<Meeting> = await apiClient.put('/Meetings', meeting);
    return response.data;
  }

  /**
   * Delete meeting
   */
  async deleteMeeting(id: string): Promise<void> {
    await apiClient.delete(`/Meetings/${id}`);
  }

  /**
   * Check room availability for specific time slot
   * 🔥 BACKEND GÜNCELLEME: Artık sadece gelecekteki/devam eden toplantıları kontrol ediyor
   * ✅ Geçmiş toplantılar artık çakışma yaratmıyor
   * ✅ Silinmiş toplantılar artık çakışma yaratmıyor  
   * ✅ Bitmiş toplantılar artık çakışma yaratmıyor
   */
  async checkRoomAvailability(roomId: string, startDate: string, duration: string, excludeMeetingId?: string): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      console.log('🔍 BACKEND GÜNCELLEMESI - Room availability check:', {
        roomId,
        startDate,
        duration,
        excludeMeetingId,
        currentTime: now,
        improvement: 'Sadece gelecekteki/devam eden toplantılar kontrol ediliyor'
      });

      const response: AxiosResponse<{isAvailable: boolean}> = await apiClient.post('/Meetings/check-availability', {
        roomId,
        startDate,
        duration,
        excludeMeetingId: excludeMeetingId || null
      });

      console.log('✅ BACKEND GÜNCELLEMESI - API response:', {
        isAvailable: response.data.isAvailable,
        benefit: response.data.isAvailable 
          ? 'Başarılı! Geçmiş/silinmiş toplantılar artık engel olmuyor' 
          : 'Gerçek çakışma tespit edildi (doğru davranış)'
      });
      
      return response.data.isAvailable;
    } catch (error: any) {
      console.error('❌ Error checking room availability:', error);
      
      // API'den gelen hata mesajını yakalayalım
      if (error.response?.status === 400) {
        console.error('🔍 Backend conflict detection - Room not available:', error.response.data);
        return false; // Room müsait değil
      }
      
      // Backend'de endpoint yoksa, mevcut meeting'leri kontrol ederek fallback yapalım
      console.log('🔄 Falling back to client-side conflict check...');
      return this.checkRoomAvailabilityFallback(roomId, startDate, duration, excludeMeetingId);
    }
  }

  /**
   * Fallback room availability check using existing meetings
   */
  private async checkRoomAvailabilityFallback(roomId: string, startDate: string, duration: string, excludeMeetingId?: string): Promise<boolean> {
    try {
      // ✅ APPROVED VE PENDING MEETING'LERİ BERABER AL
      const [approvedMeetings, pendingMeetings] = await Promise.all([
        this.getMeetings(),
        this.getPendingMeetings()
      ]);
      
      // Tüm meeting'leri birleştir
      const allMeetings = [...approvedMeetings, ...pendingMeetings];
      
      const checkStartTime = new Date(startDate);
      const durationMinutes = this.timeSpanToMinutes(duration);
      const checkEndTime = new Date(checkStartTime.getTime() + durationMinutes * 60 * 1000);

      console.log('🔍 Enhanced client-side conflict check:', {
        roomId,
        checkStartTime: checkStartTime.toISOString(),
        checkEndTime: checkEndTime.toISOString(),
        durationMinutes,
        excludeMeetingId,
        totalMeetings: allMeetings.length,
        approvedCount: approvedMeetings.length,
        pendingCount: pendingMeetings.length
      });

      // Bu odadaki TÜM toplantıları filtrele (pending + approved)
      const roomMeetings = allMeetings.filter(meeting => {
        const isRoomMatch = meeting.roomId === roomId;
        const isNotExcluded = meeting.id !== excludeMeetingId;
        
        console.log('🔍 Meeting filter check:', {
          meetingId: meeting.id,
          meetingSubject: meeting.subject,
          meetingRoomId: meeting.roomId,
          isRoomMatch,
          isNotExcluded,
          isApproved: meeting.isApproved
        });
        
        return isRoomMatch && isNotExcluded; // ✅ ARTIK TÜM MEETING'LERİ KONTROL ET (pending dahil)
      });

      console.log('🔍 Found room meetings for conflict check:', roomMeetings);

      // Her toplantı ile çakışma kontrolü yap
      for (const meeting of roomMeetings) {
        const meetingStartTime = new Date(meeting.startDate);
        const meetingDurationMinutes = this.timeSpanToMinutes(meeting.duration);
        const meetingEndTime = new Date(meetingStartTime.getTime() + meetingDurationMinutes * 60 * 1000);

        console.log('🔍 Checking conflict with meeting:', {
          meetingId: meeting.id,
          meetingSubject: meeting.subject,
          meetingStart: meetingStartTime.toISOString(),
          meetingEnd: meetingEndTime.toISOString(),
          checkStart: checkStartTime.toISOString(),
          checkEnd: checkEndTime.toISOString()
        });

        // ✅ GÜÇLENDIRILMIŞ ÇAKIŞMA KONTROLÜ
        const hasConflict = (
          // Yeni toplantı, mevcut toplantının başlangıcından önce başlayıp içinde bitiyor
          (checkStartTime < meetingStartTime && checkEndTime > meetingStartTime) ||
          // Yeni toplantı, mevcut toplantının içinde başlıyor
          (checkStartTime >= meetingStartTime && checkStartTime < meetingEndTime) ||
          // Yeni toplantı, mevcut toplantının bitiminden önce başlayıp sonra bitiyor
          (checkStartTime < meetingEndTime && checkEndTime > meetingEndTime) ||
          // Yeni toplantı, mevcut toplantıyı tamamen kapsıyor
          (checkStartTime <= meetingStartTime && checkEndTime >= meetingEndTime) ||
          // Tam aynı zaman
          (checkStartTime.getTime() === meetingStartTime.getTime())
        );

        if (hasConflict) {
          console.log('❌ CONFLICT DETECTED! Meeting cannot be created:', {
            conflictType: 'time_overlap',
            existingMeeting: {
              id: meeting.id,
              subject: meeting.subject,
              start: meetingStartTime.toISOString(),
              end: meetingEndTime.toISOString(),
              isApproved: meeting.isApproved
            },
            newMeeting: {
              start: checkStartTime.toISOString(),
              end: checkEndTime.toISOString(),
              roomId
            }
          });
          return false;
        }
      }

      console.log('✅ No conflicts found, room is available');
      return true;
    } catch (error) {
      console.error('❌ Error in fallback availability check:', error);
      return false;
    }
  }

  /**
   * Get alternative time slots and rooms when conflict occurs
   */
  async getAlternativeSlots(roomId: string, startDate: string, duration: string): Promise<AlternativeSlot[]> {
    try {
      const response: AxiosResponse<AlternativeSlot[]> = await apiClient.post('/Meetings/alternatives', {
        roomId,
        startDate,
        duration
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error getting alternative slots:', error);
      
      // Backend'de endpoint yoksa, mock alternatives döndür
      console.log('🔄 Generating mock alternative slots...');
      return this.generateMockAlternatives(roomId, startDate, duration);
    }
  }

  /**
   * Generate mock alternative slots when backend endpoint is not available
   */
  private async generateMockAlternatives(roomId: string, startDate: string, duration: string): Promise<AlternativeSlot[]> {
    try {
      const alternatives: AlternativeSlot[] = [];
      const originalDate = new Date(startDate);
      const rooms = await this.getRooms();
      const originalRoom = rooms.find(r => r.id === roomId);

      // 1. Aynı gün içinde farklı saatler öner
      for (let hourOffset = 1; hourOffset <= 3; hourOffset++) {
        const newTime = new Date(originalDate.getTime() + hourOffset * 60 * 60 * 1000);
        const isAvailable = await this.checkRoomAvailability(roomId, newTime.toISOString(), duration);
        
        if (isAvailable) {
          alternatives.push({
            type: 'time',
            roomId: roomId,
            roomName: originalRoom?.name || 'Unknown Room',
            startDate: newTime.toISOString(),
            duration: duration,
            suggestion: `${hourOffset} saat sonra aynı odada`
          });
        }
      }

      // 2. Aynı saatte farklı odalar öner
      for (const room of rooms.filter(r => r.id !== roomId)) {
        const isAvailable = await this.checkRoomAvailability(room.id, startDate, duration);
        
        if (isAvailable) {
          alternatives.push({
            type: 'room',
            roomId: room.id,
            roomName: room.name,
            startDate: startDate,
            duration: duration,
            suggestion: `Aynı saatte ${room.name} odasında`
          });
        }
      }

      console.log('✅ Generated mock alternatives:', alternatives);
      return alternatives.slice(0, 5); // Maksimum 5 alternatif döndür
    } catch (error) {
      console.error('❌ Error generating mock alternatives:', error);
      return [];
    }
  }

  /**
   * Convert minutes to TimeSpan format (HH:MM:SS)
   */
  minutesToTimeSpan(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:00`;
  }

  /**
   * Get recommended rooms based on required/optional users and duration
   * Backend'deki GetRecommendedRoomsList endpoint'ini çağırır
   */
  async getRecommendedRooms(queryParams: GetRecommendedRoomsListQuery): Promise<GetRecommendedRoomsListResponse> {
    try {
      // Query parameters'ları URL'e çevir
      const params = new URLSearchParams();
      
      // RequiredUserIdList'i array olarak ekle
      queryParams.requiredUserIdList.forEach((userId, index) => {
        params.append(`RequiredUserIdList[${index}]`, userId);
      });
      
      // OptionalUserIdList'i array olarak ekle
      queryParams.optionalUserIdList.forEach((userId, index) => {
        params.append(`OptionalUserIdList[${index}]`, userId);
      });
      
      // Duration'ı ekle
      params.append('Duration', queryParams.duration);

      console.log('🔍 Calling GetRecommendedRoomsList with params:', {
        requiredUsers: queryParams.requiredUserIdList,
        optionalUsers: queryParams.optionalUserIdList,
        duration: queryParams.duration,
        url: `/Meetings/GetRecommendedRoomsList?${params.toString()}`
      });

      const response: AxiosResponse<GetRecommendedRoomsListResponse> = await apiClient.get(
        `/Meetings/GetRecommendedRoomsList?${params.toString()}`
      );

      console.log('✅ GetRecommendedRoomsList response:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error getting recommended rooms:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // Hata durumunda boş response döndür
      return {
        recommendedRooms: []
      };
    }
  }

  /**
   * Convert TimeSpan format (HH:MM:SS) to minutes
   */
  timeSpanToMinutes(timeSpan: string): number {
    const parts = timeSpan.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    return hours * 60 + minutes;
  }
}

// Singleton instance
export const meetingApiService = new MeetingApiService();
export default meetingApiService;
