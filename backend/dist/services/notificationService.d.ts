export declare class NotificationService {
    create(data: {
        userId: string;
        type: string;
        title: string;
        message: string;
        data?: any;
    }): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        data: string | null;
        userId: string;
        type: string;
        title: string;
        isRead: boolean;
    }>;
    markAsRead(notificationId: string, userId: string): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        data: string | null;
        userId: string;
        type: string;
        title: string;
        isRead: boolean;
    }>;
    markAllAsRead(userId: string): Promise<number>;
    getUnreadCount(userId: string): Promise<number>;
    sendPaymentSuccess(userId: string, amount: number, to: string): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        data: string | null;
        userId: string;
        type: string;
        title: string;
        isRead: boolean;
    }>;
    sendPaymentFailed(userId: string, amount: number, reason: string): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        data: string | null;
        userId: string;
        type: string;
        title: string;
        isRead: boolean;
    }>;
    sendLimitAlert(userId: string, limitType: string, percent: number): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        data: string | null;
        userId: string;
        type: string;
        title: string;
        isRead: boolean;
    }>;
    sendRequestNotification(primaryId: string, linkedName: string, amount: number): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        data: string | null;
        userId: string;
        type: string;
        title: string;
        isRead: boolean;
    }>;
}
declare const _default: NotificationService;
export default _default;
//# sourceMappingURL=notificationService.d.ts.map