// controllers/notificationController.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import notificationService from '../services/notificationService';
import { getIO } from '../config/socket';

class NotificationController {
  /**
   * Get all notifications for the current user
   * GET /notifications
   */
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const unreadOnly = req.query.unreadOnly === 'true';
      const type = req.query.type as string;

      const where: any = { userId };

      if (unreadOnly) {
        where.isRead = false;
      }

      if (type) {
        where.type = type;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId, isRead: false } }),
      ]);

      // Parse JSON data fields
      const parsedNotifications = notifications.map((n) => ({
        ...n,
        data: n.data ? JSON.parse(n.data) : null,
      }));

      res.status(200).json({
        success: true,
        data: parsedNotifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
        unreadCount,
      });
    } catch (error) {
      logger.error('Error in getNotifications:', error);
      next(error);
    }
  }

  /**
   * Get unread notifications count
   * GET /notifications/unread-count
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      const count = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notification by ID
   * GET /notifications/:id
   */
  async getNotificationById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const notification = await prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        throw new AppError('Notification not found', 404);
      }

      res.status(200).json({
        success: true,
        data: {
          ...notification,
          data: notification.data ? JSON.parse(notification.data) : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notification statistics
   * GET /notifications/stats
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const monthAgo = new Date();
      monthAgo.setDate(1);

      const [todayCount, weekCount, monthCount, totalCount, unreadCount] = await Promise.all([
        prisma.notification.count({ where: { userId, createdAt: { gte: today } } }),
        prisma.notification.count({ where: { userId, createdAt: { gte: weekAgo } } }),
        prisma.notification.count({ where: { userId, createdAt: { gte: monthAgo } } }),
        prisma.notification.count({ where: { userId } }),
        prisma.notification.count({ where: { userId, isRead: false } }),
      ]);

      // Get counts by type
      const typeCounts = await prisma.notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: { type: true },
      });

      const byType = typeCounts.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>);

      res.status(200).json({
        success: true,
        data: {
          today: todayCount,
          week: weekCount,
          month: monthCount,
          total: totalCount,
          unread: unreadCount,
          byType,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read
   * PUT /notifications/:id/read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const notification = await prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        throw new AppError('Notification not found', 404);
      }

      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      logger.info(`Notification ${id} marked as read by user ${userId}`);

      // Emit real-time update
      const io = getIO();
      io.to(`user:${userId}`).emit('notification-read', { id });

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   * PUT /notifications/read-all
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      const result = await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      logger.info(`${result.count} notifications marked as read for user ${userId}`);

      // Emit real-time update
      const io = getIO();
      io.to(`user:${userId}`).emit('all-notifications-read');

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        count: result.count,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a single notification
   * DELETE /notifications/:id
   */
  async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const notification = await prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        throw new AppError('Notification not found', 404);
      }

      await prisma.notification.delete({
        where: { id },
      });

      logger.info(`Notification ${id} deleted by user ${userId}`);

      // Emit real-time update
      const io = getIO();
      io.to(`user:${userId}`).emit('notification-deleted', { id });

      res.status(200).json({
        success: true,
        message: 'Notification deleted',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete all notifications
   * DELETE /notifications
   */
  async deleteAllNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      const result = await prisma.notification.deleteMany({
        where: { userId },
      });

      logger.info(`${result.count} notifications deleted by user ${userId}`);

      // Emit real-time update
      const io = getIO();
      io.to(`user:${userId}`).emit('all-notifications-deleted');

      res.status(200).json({
        success: true,
        message: 'All notifications deleted',
        count: result.count,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user notification preferences (mock implementation)
   * GET /notifications/preferences
   */
  async getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      // In a real app, fetch from database
      // For now, return default preferences
      const preferences = {
        email: true,
        sms: true,
        push: true,
        inApp: true,
        types: {
          payment_received: true,
          payment_sent: true,
          limit_alert: true,
          family_invitation: true,
          connection_request: true,
          request_approved: true,
          request_denied: true,
          recharge_success: true,
          recharge_failed: true,
          wallet_credit: true,
          wallet_debit: true,
        },
        quiet_hours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
        },
      };

      res.status(200).json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user notification preferences (mock)
   * PUT /notifications/preferences
   */
  async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const preferences = req.body;

      // Validate preferences structure
      if (preferences.types && typeof preferences.types !== 'object') {
        throw new AppError('Invalid preferences format', 400);
      }

      // In a real app, save to database
      logger.info(`Notification preferences updated for user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Preferences updated',
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Subscribe to push notifications (mock)
   * POST /notifications/subscribe
   */
  async subscribeToPush(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { endpoint, keys } = req.body;

      // Validate subscription data
      if (!endpoint || !keys || !keys.auth || !keys.p256dh) {
        throw new AppError('Invalid subscription data', 400);
      }

      // Save subscription to database (implementation omitted)
      logger.info(`User ${userId} subscribed to push notifications`);

      res.status(200).json({
        success: true,
        message: 'Successfully subscribed to push notifications',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unsubscribe from push notifications (mock)
   * POST /notifications/unsubscribe
   */
  async unsubscribeFromPush(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      // Remove subscription from database (implementation omitted)
      logger.info(`User ${userId} unsubscribed from push notifications`);

      res.status(200).json({
        success: true,
        message: 'Successfully unsubscribed from push notifications',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();