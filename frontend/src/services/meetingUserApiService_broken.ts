import { BaseApiService } from './BaseApiService';
import apiClient from '../utils/axios';
import type { AxiosResponse } from 'axios';
import type { User } from '../types/api';

export interface MeetingUser {
  id: string;
  userId: string;
  meetingId: string;
  status: MeetingUserStatus;
  responseDate?: string;
  createdDate: string;
  updatedDate?: string;
}

export enum MeetingUserStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2
}

export interface PendingApproval {
  id: string;
  userId: string;
  meetingId: string;
  status: MeetingUserStatus;
  responseDate?: string;
  createdDate: string;
  meetingSubject: string;
  meetingContent: string;
  meetingStartDate: string;
  meetingDuration: string;
  meetingCreatedByName: string;
  meetingRoomId?: string | null;
  meetingRoomName?: string;
}

export interface CreateMeetingUserCommand {
  userId: string;
  meetingId: string;
}

export interface UpdateMeetingUserStatusCommand {
  id: string;
  status: MeetingUserStatus;
}

/**
 * MeetingUser API Service
 */
class MeetingUserApiService extends BaseApiService {
  constructor() {
    super('/MeetingUsers');
  }

  /**
   * Add participant to meeting
   */
  async addParticipant(command: CreateMeetingUserCommand): Promise<MeetingUser> {
    const response: AxiosResponse<MeetingUser> = await apiClient.post('/MeetingUsers', command);
    return response.data;
  }

  /**
   * Update meeting user status (approve/reject participation)
   */
  async updateStatus(command: UpdateMeetingUserStatusCommand): Promise<MeetingUser> {
    const response: AxiosResponse<MeetingUser> = await apiClient.put('/MeetingUsers/status', command);
    return response.data;
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingApprovals(userId: string): Promise<PendingApproval[]> {
    try {
      const response: AxiosResponse<{items: PendingApproval[]} | PendingApproval[]> = 
        await apiClient.get(`/MeetingUsers/pending-approvals/${userId}?PageIndex=0&PageSize=100`);
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && 'items' in response.data && Array.isArray(response.data.items)) {
        return response.data.items;
      } else {
        console.warn('Unexpected pending approvals response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      return [];
    }
  }

  /**
   * Remove participant from meeting
   */
  async removeParticipant(meetingUserId: string): Promise<void> {
    await apiClient.delete(`/MeetingUsers/${meetingUserId}`);
  }

  /**
   * Get all users for participant selection
   */
  async getUsers(): Promise<User[]> {
    try {
      const response: AxiosResponse<{items: User[]} | User[]> = await apiClient.get('/Users?PageIndex=0&PageSize=100');
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && 'items' in response.data && Array.isArray(response.data.items)) {
        return response.data.items;
      } else {
        console.warn('Unexpected users response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  /**
   * Get meeting participants with their status
   */
  async getMeetingParticipants(meetingId: string): Promise<MeetingUser[]> {
    try {
      const response: AxiosResponse<{items: MeetingUser[]} | MeetingUser[]> = 
        await apiClient.get(`/MeetingUsers?PageIndex=0&PageSize=100`);
      
      let participants: MeetingUser[] = [];
      if (response.data && Array.isArray(response.data)) {
        participants = response.data;
      } else if (response.data && 'items' in response.data && Array.isArray(response.data.items)) {
        participants = response.data.items;
      }
      
      // Filter by meetingId
      return participants.filter(p => p.meetingId === meetingId);
    } catch (error) {
      console.error('Error fetching meeting participants:', error);
      return [];
    }
  }

  /**
   * Get status label for display
   */
  getStatusLabel(status: MeetingUserStatus): string {
    switch (status) {
      case MeetingUserStatus.Pending:
        return 'Beklemede';
      case MeetingUserStatus.Approved:
        return 'Onaylandı';
      case MeetingUserStatus.Rejected:
        return 'Reddedildi';
      default:
        return 'Bilinmiyor';
    }
  }

  /**
   * Get status color for display
   */
  getStatusColor(status: MeetingUserStatus): string {
    switch (status) {
      case MeetingUserStatus.Pending:
        return 'warning';
      case MeetingUserStatus.Approved:
        return 'success';
      case MeetingUserStatus.Rejected:
        return 'danger';
      default:
        return 'gray';
    }
  }
}

// Singleton instance
export const meetingUserApiService = new MeetingUserApiService();
export default meetingUserApiService;
