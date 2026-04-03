// services/notificationService.ts
import prisma from '../config/database';
import { getIO } from '../config/socket';
import { NOTIFICATION_TYPES } from '../utils/constants';
import logger from '../utils/logger';

export class NotificationService {
  /**
   * Create a notification and emit real-time event
   */
  async create(data: { userId: string; type: string; title: string; message: string; data?: any }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data ? JSON.stringify(data.data) : null,
        },
      });

      // Emit real-time notification via Socket.IO
      try {
        const io = getIO();
        io.to(`user:${data.userId}`).emit('notification', {
          ...notification,
          data: notification.data ? JSON.parse(notification.data) : null,
        });
      } catch (socketError) {
        logger.warn(`Socket.IO not available for notification: ${socketError}`);
      }

      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.update({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });

    // Emit read event
    try {
      const io = getIO();
      io.to(`user:${userId}`).emit('notification-read', { id: notificationId });
    } catch (error) {
      logger.warn('Socket.IO not available for markAsRead');
    }

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    // Emit all-read event
    try {
      const io = getIO();
      io.to(`user:${userId}`).emit('all-notifications-read');
    } catch (error) {
      logger.warn('Socket.IO not available for markAllAsRead');
    }

    return result.count;
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  // Convenience methods for common notification types
  async sendPaymentSuccess(userId: string, amount: number, to: string) {
    return this.create({
      userId,
      type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
      title: 'Payment Successful',
      message: `₹${amount} sent to ${to} successfully`,
      data: { amount, to },
    });
  }

  async sendPaymentFailed(userId: string, amount: number, reason: string) {
    return this.create({
      userId,
      type: NOTIFICATION_TYPES.PAYMENT_FAILED,
      title: 'Payment Failed',
      message: `Payment of ₹${amount} failed: ${reason}`,
      data: { amount, reason },
    });
  }

  async sendLimitAlert(userId: string, limitType: string, percent: number) {
    return this.create({
      userId,
      type: NOTIFICATION_TYPES.LIMIT_ALERT,
      title: 'Limit Alert',
      message: `You've used ${percent}% of your ${limitType} limit`,
      data: { limitType, percent },
    });
  }

  async sendRequestNotification(primaryId: string, linkedName: string, amount: number) {
    return this.create({
      userId: primaryId,
      type: NOTIFICATION_TYPES.LIMIT_REQUEST,
      title: 'Limit Increase Request',
      message: `${linkedName} requested ₹${amount} limit increase`,
      data: { linkedName, amount },
    });
  }
}

export default new NotificationService();