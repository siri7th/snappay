// types/family.types.ts
import { User } from './user.types';

export type FamilyMemberStatus = 'ACTIVE' | 'PAUSED' | 'PENDING' | 'REMOVED';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED' | 'CANCELLED';
export type RequestDuration = 'today' | 'week' | 'permanent';

export interface FamilyMember {
  id: string;
  linkedId: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  dailyLimit: number;
  dailySpent: number;
  dailyRemaining: number;
  monthlyLimit: number;
  monthlySpent: number;
  monthlyRemaining: number;
  perTransactionLimit: number;
  status: FamilyMemberStatus;
  memberSince: string;
  lastActive?: string;
  permissions: {
    sendMoney: boolean;
    scanPay: boolean;
    recharge: boolean;
    viewHistory: boolean;
  };
  walletBalance?: number;
}

export interface ConnectionRequest {
  id: string;
  userId: string;
  phone: string;
  name?: string;
  status: RequestStatus;
  createdAt: string;
  message?: string;
  notificationId?: string;
  invitationId?: string;
  inviteCode?: string;
  relationship?: string;
  dailyLimit?: number;
  monthlyLimit?: number;
  perTransactionLimit?: number;
  isForPrimary?: boolean;
  primaryInfo?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  linkedInfo?: {
    id: string;
    name: string;
    phone: string;
  };
}

export interface Invitation {
  id: string;
  inviteCode: string;
  primaryId: string;
  primaryName?: string;
  primaryPhone?: string;
  invitedPhone: string;
  relationship: string;
  dailyLimit: number;
  monthlyLimit: number;
  perTransactionLimit: number;
  message?: string;
  status: RequestStatus;
  createdAt: string;
  expiresAt: string;
}

export interface LimitRequest {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  reason?: string;
  duration: RequestDuration;
  status: RequestStatus;
  createdAt: string;
  currentLimit?: number;
  currentSpent?: number;
}

export interface FamilyStats {
  total: number;
  active: number;
  paused: number;
  pending: number;
  totalDailySpent: number;
  totalMonthlySpent: number;
  totalMembers: number;
  activeMembers: number;
}

export interface PrimaryDetails {
  primary: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    memberSince: string;
    walletBalance: number;
  };
  limits: {
    dailyLimit: number;
    dailySpent: number;
    monthlyLimit: number;
    monthlySpent: number;
    perTransactionLimit: number;
    relationship: string;
    status: FamilyMemberStatus;
  };
  permissions: FamilyMember['permissions'];
  joinedAt: string;
}