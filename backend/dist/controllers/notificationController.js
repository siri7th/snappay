"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
const socket_1 = require("../config/socket");
class NotificationController {
    async getNotifications(req, res, next) {
        try {
            const userId = req.user?.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;
            const unreadOnly = req.query.unreadOnly === 'true';
            const type = req.query.type;
            const where = { userId };
            if (unreadOnly) {
                where.isRead = false;
            }
            if (type) {
                where.type = type;
            }
            const [notifications, total, unreadCount] = await Promise.all([
                database_1.default.notification.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                database_1.default.notification.count({ where }),
                database_1.default.notification.count({ where: { userId, isRead: false } }),
            ]);
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
        }
        catch (error) {
            logger_1.default.error('Error in getNotifications:', error);
            next(error);
        }
    }
    async getUnreadCount(req, res, next) {
        try {
            const userId = req.user?.userId;
            const count = await database_1.default.notification.count({
                where: { userId, isRead: false },
            });
            res.status(200).json({
                success: true,
                data: { count },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getNotificationById(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            const notification = await database_1.default.notification.findFirst({
                where: { id, userId },
            });
            if (!notification) {
                throw new errorHandler_1.AppError('Notification not found', 404);
            }
            res.status(200).json({
                success: true,
                data: {
                    ...notification,
                    data: notification.data ? JSON.parse(notification.data) : null,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getStats(req, res, next) {
        try {
            const userId = req.user?.userId;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const monthAgo = new Date();
            monthAgo.setDate(1);
            const [todayCount, weekCount, monthCount, totalCount, unreadCount] = await Promise.all([
                database_1.default.notification.count({ where: { userId, createdAt: { gte: today } } }),
                database_1.default.notification.count({ where: { userId, createdAt: { gte: weekAgo } } }),
                database_1.default.notification.count({ where: { userId, createdAt: { gte: monthAgo } } }),
                database_1.default.notification.count({ where: { userId } }),
                database_1.default.notification.count({ where: { userId, isRead: false } }),
            ]);
            const typeCounts = await database_1.default.notification.groupBy({
                by: ['type'],
                where: { userId },
                _count: { type: true },
            });
            const byType = typeCounts.reduce((acc, item) => {
                acc[item.type] = item._count.type;
                return acc;
            }, {});
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
        }
        catch (error) {
            next(error);
        }
    }
    async markAsRead(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            const notification = await database_1.default.notification.findFirst({
                where: { id, userId },
            });
            if (!notification) {
                throw new errorHandler_1.AppError('Notification not found', 404);
            }
            await database_1.default.notification.update({
                where: { id },
                data: { isRead: true },
            });
            logger_1.default.info(`Notification ${id} marked as read by user ${userId}`);
            const io = (0, socket_1.getIO)();
            io.to(`user:${userId}`).emit('notification-read', { id });
            res.status(200).json({
                success: true,
                message: 'Notification marked as read',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async markAllAsRead(req, res, next) {
        try {
            const userId = req.user?.userId;
            const result = await database_1.default.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true },
            });
            logger_1.default.info(`${result.count} notifications marked as read for user ${userId}`);
            const io = (0, socket_1.getIO)();
            io.to(`user:${userId}`).emit('all-notifications-read');
            res.status(200).json({
                success: true,
                message: 'All notifications marked as read',
                count: result.count,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteNotification(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            const notification = await database_1.default.notification.findFirst({
                where: { id, userId },
            });
            if (!notification) {
                throw new errorHandler_1.AppError('Notification not found', 404);
            }
            await database_1.default.notification.delete({
                where: { id },
            });
            logger_1.default.info(`Notification ${id} deleted by user ${userId}`);
            const io = (0, socket_1.getIO)();
            io.to(`user:${userId}`).emit('notification-deleted', { id });
            res.status(200).json({
                success: true,
                message: 'Notification deleted',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteAllNotifications(req, res, next) {
        try {
            const userId = req.user?.userId;
            const result = await database_1.default.notification.deleteMany({
                where: { userId },
            });
            logger_1.default.info(`${result.count} notifications deleted by user ${userId}`);
            const io = (0, socket_1.getIO)();
            io.to(`user:${userId}`).emit('all-notifications-deleted');
            res.status(200).json({
                success: true,
                message: 'All notifications deleted',
                count: result.count,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getPreferences(req, res, next) {
        try {
            const userId = req.user?.userId;
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
        }
        catch (error) {
            next(error);
        }
    }
    async updatePreferences(req, res, next) {
        try {
            const userId = req.user?.userId;
            const preferences = req.body;
            if (preferences.types && typeof preferences.types !== 'object') {
                throw new errorHandler_1.AppError('Invalid preferences format', 400);
            }
            logger_1.default.info(`Notification preferences updated for user ${userId}`);
            res.status(200).json({
                success: true,
                message: 'Preferences updated',
                data: preferences,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async subscribeToPush(req, res, next) {
        try {
            const userId = req.user?.userId;
            const { endpoint, keys } = req.body;
            if (!endpoint || !keys || !keys.auth || !keys.p256dh) {
                throw new errorHandler_1.AppError('Invalid subscription data', 400);
            }
            logger_1.default.info(`User ${userId} subscribed to push notifications`);
            res.status(200).json({
                success: true,
                message: 'Successfully subscribed to push notifications',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async unsubscribeFromPush(req, res, next) {
        try {
            const userId = req.user?.userId;
            logger_1.default.info(`User ${userId} unsubscribed from push notifications`);
            res.status(200).json({
                success: true,
                message: 'Successfully unsubscribed from push notifications',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new NotificationController();
//# sourceMappingURL=notificationController.js.map