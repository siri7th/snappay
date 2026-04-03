// src/services/api/notifications.ts
import apiClient from './client';

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
  from?: string;
  to?: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  types: {
    [key: string]: boolean;
  };
}

export const notificationsAPI = {
  /**
   * Get all notifications for current user
   */
  getNotifications: (params?: GetNotificationsParams) =>
    apiClient.get('/notifications', { params }),

  /**
   * Get unread notifications count
   */
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),

  /**
   * Get notification by ID
   */
  getNotificationById: (id: string) => apiClient.get(`/notifications/${id}`),

  /**
   * Mark notification as read
   */
  markAsRead: (id: string) => apiClient.put(`/notifications/${id}/read`),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: () => apiClient.put('/notifications/read-all'),

  /**
   * Delete a single notification
   */
  deleteNotification: (id: string) => apiClient.delete(`/notifications/${id}`),

  /**
   * Delete all notifications
   */
  deleteAllNotifications: () => apiClient.delete('/notifications'),

  /**
   * Get user notification preferences
   */
  getPreferences: () => apiClient.get('/notifications/preferences'),

  /**
   * Update user notification preferences
   */
  updatePreferences: (data: Partial<NotificationPreferences>) => 
    apiClient.put('/notifications/preferences', data),

  /**
   * Get notification statistics
   */
  getStats: () => apiClient.get('/notifications/stats'),

  /**
   * Subscribe to push notifications
   */
  subscribeToPush: (subscription: PushSubscription) => 
    apiClient.post('/notifications/subscribe', subscription),

  /**
   * Unsubscribe from push notifications
   */
  unsubscribeFromPush: () => apiClient.post('/notifications/unsubscribe'),
};

export default notificationsAPI;