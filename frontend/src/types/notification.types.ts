// types/notification.types.ts
export type NotificationType =
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_SENT'
  | 'LIMIT_REQUEST'
  | 'LIMIT_APPROVED'
  | 'LIMIT_DENIED'
  | 'LIMIT_ALERT'
  | 'FAMILY_INVITATION'
  | 'INVITATION_ACCEPTED'
  | 'INVITATION_REJECTED'
  | 'CONNECTION_REQUEST'
  | 'CONNECTION_APPROVED'
  | 'CONNECTION_DENIED'
  | 'FAMILY_JOINED'
  | 'FAMILY_REMOVED'
  | 'LINKED_DISCONNECTED'
  | 'WALLET_CREDIT'
  | 'WALLET_DEBIT'
  | 'RECHARGE_SUCCESS'
  | 'RECHARGE_FAILED'
  | 'BANK_TRANSFER'
  | 'QR_PAYMENT'
  | 'ACCOUNT_PAUSED'
  | 'ACCOUNT_RESUMED';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  types: {
    [K in NotificationType]?: boolean;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}