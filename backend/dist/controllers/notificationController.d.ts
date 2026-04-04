import { Request, Response, NextFunction } from 'express';
declare class NotificationController {
    getNotifications(req: Request, res: Response, next: NextFunction): Promise<void>;
    getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void>;
    getNotificationById(req: Request, res: Response, next: NextFunction): Promise<void>;
    getStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    markAsRead(req: Request, res: Response, next: NextFunction): Promise<void>;
    markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteAllNotifications(req: Request, res: Response, next: NextFunction): Promise<void>;
    getPreferences(req: Request, res: Response, next: NextFunction): Promise<void>;
    updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void>;
    subscribeToPush(req: Request, res: Response, next: NextFunction): Promise<void>;
    unsubscribeFromPush(req: Request, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: NotificationController;
export default _default;
//# sourceMappingURL=notificationController.d.ts.map