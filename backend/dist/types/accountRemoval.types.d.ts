export interface RemoveMemberDto {
    memberId: string;
    password: string;
    transferBalance?: boolean;
}
export interface DisconnectFromPrimaryDto {
    password: string;
    otp: string;
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
//# sourceMappingURL=accountRemoval.types.d.ts.map