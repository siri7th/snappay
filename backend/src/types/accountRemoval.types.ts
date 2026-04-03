// types/accountRemoval.types.ts

export interface RemoveMemberDto {
  memberId: string;
  password: string;
  transferBalance?: boolean; // optional, defaults to true
}

export interface DisconnectFromPrimaryDto {
  password: string;
  otp: string; // required, not optional
  transferBalance?: boolean;
}

export interface RemovalResult {
  success: boolean;
  transferredAmount?: number;
  message: string;
  remainingBalance?: number;
}

export interface VerificationResult {
  valid: boolean;
  message?: string;
}

export interface RemovalSummary {
  type: 'member' | 'self';
  name?: string;
  phone?: string;
  primaryName?: string;
  primaryPhone?: string;
  relationship?: string | null;
  currentBalance: number;
  willTransfer: boolean;
  pendingRequests: number;
}