import { BaseApiService } from './BaseApiService';
import apiClient from '../utils/axios';
import type { AxiosResponse } from 'axios';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdDate: string;
  data?: any; // Additional notification data
}

export enum NotificationType {
  MeetingInvitation = 'MeetingInvitation',
  MeetingApproved = 'MeetingApproved',
  MeetingRejected = 'MeetingRejected',
  MeetingCancelled = 'MeetingCancelled',
  MeetingUpdated = 'MeetingUpdated',
  General = 'General'
}

export interface CreateNotificationCommand {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: any;
}

/**
 * Notification API Service
 */
class NotificationApiService extends BaseApiService {
  constructor() {
    super('/Notifications');
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const response: AxiosResponse<{items: Notification[]} | Notification[]> = 
        await apiClient.get(`/Notifications/user/${userId}?PageIndex=0&PageSize=50`);
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && 'items' in response.data && Array.isArray(response.data.items)) {
        return response.data.items;
      } else {
        console.warn('Unexpected notifications response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const response: AxiosResponse<{count: number}> = 
        await apiClient.get(`/Notifications/unread-count/${userId}`);
      return response.data.count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(`/Notifications/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await apiClient.patch(`/Notifications/user/${userId}/read-all`);
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/Notifications/${notificationId}`);
  }

  /**
   * Create notification (usually called by backend, but can be used for testing)
   */
  async createNotification(command: CreateNotificationCommand): Promise<Notification> {
    const response: AxiosResponse<Notification> = await apiClient.post('/Notifications', command);
    return response.data;
  }

  /**
   * Send meeting invitation notifications to participants
   */
  async sendMeetingInvitationNotifications(meetingId: string, participantIds: string[]): Promise<void> {
    await apiClient.post('/Notifications/meeting-invitation', {
      meetingId,
      participantIds
    });
  }

  /**
   * Send meeting status notification (approved/rejected)
   */
  async sendMeetingStatusNotification(meetingId: string, status: 'approved' | 'rejected'): Promise<void> {
    await apiClient.post('/Notifications/meeting-status', {
      meetingId,
      status
    });
  }

  /**
   * Format notification type for display
   */
  getTypeLabel(type: NotificationType): string {
    switch (type) {
      case NotificationType.MeetingInvitation:
        return 'Toplantı Daveti';
      case NotificationType.MeetingApproved:
        return 'Toplantı Onaylandı';
      case NotificationType.MeetingRejected:
        return 'Toplantı Reddedildi';
      case NotificationType.MeetingCancelled:
        return 'Toplantı İptal Edildi';
      case NotificationType.MeetingUpdated:
        return 'Toplantı Güncellendi';
      case NotificationType.General:
        return 'Genel';
      default:
        return 'Bildirim';
    }
  }

  /**
   * Get notification icon based on type
   */
  getTypeIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.MeetingInvitation:
        return '📅';
      case NotificationType.MeetingApproved:
        return '✅';
      case NotificationType.MeetingRejected:
        return '❌';
      case NotificationType.MeetingCancelled:
        return '🚫';
      case NotificationType.MeetingUpdated:
        return '📝';
      case NotificationType.General:
        return '📢';
      default:
        return '🔔';
    }
  }

  /**
   * Format relative time
   */
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Az önce';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} dakika önce`;
    } else if (diffHours < 24) {
      return `${diffHours} saat önce`;
    } else if (diffDays < 7) {
      return `${diffDays} gün önce`;
    } else {
      return date.toLocaleDateString('tr-TR');
    }
  }
}

// Singleton instance
export const notificationApiService = new NotificationApiService();
export default notificationApiService;
