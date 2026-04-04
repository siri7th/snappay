import { Request } from 'express';
import { USER_ROLES, USER_STATUS, FAMILY_MEMBER_STATUS, INVITATION_STATUS, TRANSACTION_TYPES, TRANSACTION_STATUS, PAYMENT_METHODS, RECHARGE_TYPES, NOTIFICATION_TYPES, OTP_PURPOSES, LIMIT_REQUEST_DURATION } from '../utils/constants';
export interface User {
    id: string;
    phone: string;
    email?: string | null;
    name?: string | null;
    dateOfBirth?: Date | null;
    gender?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    country?: string;
    aadharNumber?: string | null;
    panNumber?: string | null;
    isKycVerified: boolean;
    kycVerifiedAt?: Date | null;
    kycRejectionReason?: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
    emailVerifiedAt?: Date | null;
    phoneVerifiedAt?: Date | null;
    role: typeof USER_ROLES[keyof typeof USER_ROLES];
    status: typeof USER_STATUS[keyof typeof USER_STATUS];
    familyRole?: string | null;
    joinedFamilyAt?: Date | null;
    pin?: string | null;
    avatar?: string | null;
    lastLoginAt?: Date | null;
    failedLoginAttempts: number;
    lockedUntil?: Date | null;
    lastPasswordChange?: Date | null;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string | null;
    lastLoginIp?: string | null;
    lastLoginDevice?: string | null;
    riskScore?: number | null;
    isFraudulent: boolean;
    fraudReason?: string | null;
    fraudReportedAt?: Date | null;
    language: string;
    profileComplete: boolean;
    preferences?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface Wallet {
    id: string;
    balance: number;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface BankAccount {
    id: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolder: string;
    balance: number;
    isDefault: boolean;
    isVerified: boolean;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface FamilyMember {
    id: string;
    primaryId: string;
    linkedId: string;
    relationship?: string | null;
    dailyLimit: number;
    monthlyLimit: number;
    perTransactionLimit: number;
    dailySpent: number;
    monthlySpent: number;
    lastResetDate: Date;
    permissions: {
        sendMoney: boolean;
        scanPay: boolean;
        recharge: boolean;
        viewHistory: boolean;
    };
    status: typeof FAMILY_MEMBER_STATUS[keyof typeof FAMILY_MEMBER_STATUS];
    createdAt: Date;
    updatedAt: Date;
}
export interface Invitation {
    id: string;
    inviteCode: string;
    primaryId: string;
    invitedPhone: string;
    invitedUserId?: string | null;
    relationship?: string | null;
    dailyLimit: number;
    monthlyLimit: number;
    perTransactionLimit: number;
    message?: string | null;
    status: typeof INVITATION_STATUS[keyof typeof INVITATION_STATUS];
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    acceptedAt?: Date | null;
}
export interface LimitRequest {
    id: string;
    familyMemberId: string;
    requesterId: string;
    approverId: string;
    amount: number;
    reason?: string | null;
    duration: typeof LIMIT_REQUEST_DURATION[keyof typeof LIMIT_REQUEST_DURATION];
    status: 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELLED';
    createdAt: Date;
    updatedAt: Date;
    respondedAt?: Date | null;
}
export interface Transaction {
    id: string;
    transactionId: string;
    amount: number;
    type: typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES];
    status: typeof TRANSACTION_STATUS[keyof typeof TRANSACTION_STATUS];
    senderId?: string | null;
    receiverId?: string | null;
    walletId?: string | null;
    bankId?: string | null;
    familyMemberId?: string | null;
    description?: string | null;
    paymentMethod: typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];
    reference?: string | null;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date | null;
}
export interface Recharge {
    id: string;
    transactionId: string;
    type: typeof RECHARGE_TYPES[keyof typeof RECHARGE_TYPES];
    operator?: string | null;
    accountNumber: string;
    amount: number;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    userId: string;
    metadata?: any;
    createdAt: Date;
    completedAt?: Date | null;
}
export interface Notification {
    id: string;
    userId: string;
    type: typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
    title: string;
    message: string;
    data?: any;
    isRead: boolean;
    createdAt: Date;
}
export interface OTP {
    id: string;
    phone: string;
    code: string;
    purpose: typeof OTP_PURPOSES[keyof typeof OTP_PURPOSES];
    expiresAt: Date;
    isUsed: boolean;
    attempts: number;
    createdAt: Date;
    usedAt?: Date | null;
}
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        phone: string;
        role: string;
        name?: string | null;
        email?: string | null;
    };
}
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: Array<{
        field: string;
        message: string;
    }>;
    stack?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface SendOTPDTO {
    phone: string;
}
export interface VerifyOTPDTO {
    phone: string;
    otp: string;
    userType?: 'primary' | 'linked';
}
export interface SendMoneyDTO {
    toMobile?: string;
    toAccount?: string;
    toIFSC?: string;
    toUPI?: string;
    amount: number;
    note?: string;
    paymentMethod?: typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];
    bankId?: string;
}
export interface AddBankDTO {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolder: string;
}
export interface UpdateBankDTO {
    bankName?: string;
    accountHolder?: string;
    isDefault?: boolean;
}
export interface FamilyInviteDTO {
    phone: string;
    relationship?: string;
    dailyLimit?: number;
    monthlyLimit?: number;
    perTransactionLimit?: number;
}
export interface UpdateLimitsDTO {
    dailyLimit?: number;
    monthlyLimit?: number;
    perTransactionLimit?: number;
}
export interface RechargeDTO {
    type: typeof RECHARGE_TYPES[keyof typeof RECHARGE_TYPES];
    accountNumber: string;
    amount: number;
    operator?: string;
    paymentMethod?: typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];
    bankId?: string;
}
export interface CreateLimitRequestDTO {
    amount: number;
    reason?: string;
    duration?: typeof LIMIT_REQUEST_DURATION[keyof typeof LIMIT_REQUEST_DURATION];
}
export interface SocketEvents {
    notification: (data: Notification) => void;
    'notification-read': (data: {
        id: string;
    }) => void;
    'all-notifications-read': () => void;
    'notification-deleted': (data: {
        id: string;
    }) => void;
    'all-notifications-deleted': () => void;
    'limit-updated': (data: {
        memberId: string;
        newLimit: number;
    }) => void;
    'payment-received': (data: {
        amount: number;
        from: string;
    }) => void;
    typing: (data: {
        from: string;
        to: string;
        isTyping: boolean;
    }) => void;
    'join-family': (familyId: string) => void;
    'leave-family': (familyId: string) => void;
}
export interface JwtPayload {
    userId: string;
    phone: string;
    role: string;
    iat?: number;
    exp?: number;
}
//# sourceMappingURL=index.d.ts.map