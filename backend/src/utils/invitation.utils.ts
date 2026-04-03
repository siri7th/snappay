// utils/invitation.utils.ts
import { InvitationResponse } from '../types/invitation.types';

export const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const calculateExpiryDate = (days: number = 7): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

export const formatInvitationResponse = (invitation: any): InvitationResponse => {
  return {
    id: invitation.id,
    inviteCode: invitation.inviteCode,
    primaryId: invitation.primaryId,
    primaryName: invitation.primary?.name || 'Family Account',
    primaryPhone: invitation.primary?.phone,
    primaryEmail: invitation.primary?.email,
    phone: invitation.phone,
    relationship: invitation.relationship,
    dailyLimit: Number(invitation.dailyLimit),
    monthlyLimit: Number(invitation.monthlyLimit),
    perTransactionLimit: Number(invitation.perTransactionLimit),
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt
  };
};