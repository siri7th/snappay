// types/payment.types.ts
export type TransactionType =
  | 'SEND'
  | 'RECEIVE'
  | 'RECHARGE'
  | 'ADD_TO_WALLET'
  | 'ADD_TO_LIMIT'
  | 'WITHDRAW'
  | 'PAYMENT'
  | 'QR_PAYMENT'
  | 'BANK_TRANSFER'
  | 'UPI_PAYMENT';

export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type PaymentMethod = 'wallet' | 'bank' | 'upi' | 'qr' | 'card' | 'netbanking';
export type RechargeType = 'MOBILE' | 'ELECTRICITY' | 'FASTAG' | 'DTH' | 'GAS' | 'WATER';

export interface Transaction {
  id: string;
  transactionId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  senderId?: string;
  receiverId?: string;
  description?: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  fee?: number;
  totalAmount?: number;

  sender?: {
    id?: string;
    name?: string;
    phone: string;
    email?: string;
    avatar?: string;
  };
  receiver?: {
    id?: string;
    name?: string;
    phone: string;
    email?: string;
    avatar?: string;
  };
  
  metadata?: {
    ip?: string;
    location?: string;
    device?: string;
    userAgent?: string;
    [key: string]: any;
  };
}

export interface Recharge extends Omit<Transaction, 'type' | 'paymentMethod'> {
  type: Extract<TransactionType, 'RECHARGE'>;
  rechargeType: RechargeType;
  operator?: string;
  accountNumber: string;
  mobileNumber?: string;
  consumerNumber?: string;
  vehicleNumber?: string;
  planDetails?: {
    name: string;
    validity: string;
    data?: string;
    sms?: string;
    description?: string;
  };
}

export interface SendMoneyRequest {
  toMobile?: string;
  toAccount?: string;
  toIFSC?: string;
  toUPI?: string;
  amount: number;
  pin: string;
  note?: string;
  paymentMethod: 'wallet' | 'bank';
  bankId?: string;
  scheduleAt?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';
}

export interface QRPaymentRequest {
  qrData: string;
  amount: number;
  pin: string;
  note?: string;
  paymentMethod?: 'wallet' | 'bank';
  bankId?: string;
}

export interface MoneyRequest {
  fromPhone: string;
  amount: number;
  note?: string;
  expiryHours?: number;
}

export interface MoneyRequestResponse {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expiresAt: string;
}

export interface RechargeRequest {
  type: RechargeType;
  accountNumber: string;
  amount: number;
  operator?: string;
  planId?: string;
  paymentMethod?: 'wallet' | 'bank';
  bankId?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  amount: number;
  status: TransactionStatus;
  message?: string;
  receipt?: string;
}

export interface TransactionStats {
  today: {
    count: number;
    amount: number;
    sent: number;
    received: number;
    recharge: number;
  };
  week: {
    count: number;
    amount: number;
    sent: number;
    received: number;
    recharge: number;
  };
  month: {
    count: number;
    amount: number;
    sent: number;
    received: number;
    recharge: number;
  };
  total: {
    count: number;
    amount: number;
    sent: number;
    received: number;
    recharge: number;
  };
  byType: Record<TransactionType, number>;
  byStatus: Record<TransactionStatus, number>;
}