import { INVITATION_STATUS } from '../utils/constants';
export interface CreateInvitationDto {
    phone: string;
    relationship?: string;
    dailyLimit?: number;
    monthlyLimit?: number;
    perTransactionLimit?: number;
}
export interface InvitationResponse {
    id: string;
    inviteCode: string;
    primaryId: string;
    primaryName: string | null;
    primaryPhone: string;
    primaryEmail?: string | null;
    phone: string;
    relationship: string;
    dailyLimit: number;
    monthlyLimit: number;
    perTransactionLimit: number;
    status: typeof INVITATION_STATUS[keyof typeof INVITATION_STATUS];
    expiresAt: Date;
    createdAt: Date;
}
export interface InvitationWithPrimary extends InvitationResponse {
    primary: {
        id: string;
        name: string | null;
        phone: string;
        email: string | null;
    };
}
//# sourceMappingURL=invitation.types.d.ts.map