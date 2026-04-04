"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const database_1 = __importDefault(require("../config/database"));
const socket_1 = require("../config/socket");
const constants_1 = require("../utils/constants");
const logger_1 = __importDefault(require("../utils/logger"));
class NotificationService {
    async create(data) {
        try {
            const notification = await database_1.default.notification.create({
                data: {
                    userId: data.userId,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    data: data.data ? JSON.stringify(data.data) : null,
                },
            });
            try {
                const io = (0, socket_1.getIO)();
                io.to(`user:${data.userId}`).emit('notification', {
                    ...notification,
                    data: notification.data ? JSON.parse(notification.data) : null,
                });
            }
            catch (socketError) {
                logger_1.default.warn(`Socket.IO not available for notification: ${socketError}`);
            }
            return notification;
        }
        catch (error) {
            logger_1.default.error('Error creating notification:', error);
            throw error;
        }
    }
    async markAsRead(notificationId, userId) {
        const notification = await database_1.default.notification.update({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
        try {
            const io = (0, socket_1.getIO)();
            io.to(`user:${userId}`).emit('notification-read', { id: notificationId });
        }
        catch (error) {
            logger_1.default.warn('Socket.IO not available for markAsRead');
        }
        return notification;
    }
    async markAllAsRead(userId) {
        const result = await database_1.default.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        try {
            const io = (0, socket_1.getIO)();
            io.to(`user:${userId}`).emit('all-notifications-read');
        }
        catch (error) {
            logger_1.default.warn('Socket.IO not available for markAllAsRead');
        }
        return result.count;
    }
    async getUnreadCount(userId) {
        return database_1.default.notification.count({
            where: { userId, isRead: false },
        });
    }
    async sendPaymentSuccess(userId, amount, to) {
        return this.create({
            userId,
            type: constants_1.NOTIFICATION_TYPES.PAYMENT_SUCCESS,
            title: 'Payment Successful',
            message: `₹${amount} sent to ${to} successfully`,
            data: { amount, to },
        });
    }
    async sendPaymentFailed(userId, amount, reason) {
        return this.create({
            userId,
            type: constants_1.NOTIFICATION_TYPES.PAYMENT_FAILED,
            title: 'Payment Failed',
            message: `Payment of ₹${amount} failed: ${reason}`,
            data: { amount, reason },
        });
    }
    async sendLimitAlert(userId, limitType, percent) {
        return this.create({
            userId,
            type: constants_1.NOTIFICATION_TYPES.LIMIT_ALERT,
            title: 'Limit Alert',
            message: `You've used ${percent}% of your ${limitType} limit`,
            data: { limitType, percent },
        });
    }
    async sendRequestNotification(primaryId, linkedName, amount) {
        return this.create({
            userId: primaryId,
            type: constants_1.NOTIFICATION_TYPES.LIMIT_REQUEST,
            title: 'Limit Increase Request',
            message: `${linkedName} requested ₹${amount} limit increase`,
            data: { linkedName, amount },
        });
    }
}
exports.NotificationService = NotificationService;
exports.default = new NotificationService();
//# sourceMappingURL=notificationService.js.map