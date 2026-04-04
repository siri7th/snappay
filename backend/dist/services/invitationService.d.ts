import { CreateInvitationDto, InvitationResponse } from '../types/invitation.types';
declare class InvitationService {
    private calculateExpiryDate;
    private formatInvitationResponse;
    private validateInvitation;
    createInvitation(primaryId: string, primaryName: string | null, primaryPhone: string, data: CreateInvitationDto): Promise<InvitationResponse>;
    private sendInvitationNotifications;
    getInvitationByCode(code: string): Promise<InvitationResponse>;
    getInvitationById(id: string): Promise<InvitationResponse>;
    getPendingInvitationsByUserId(userId: string): Promise<InvitationResponse[]>;
    getPendingInvitationsByPhone(phone: string): Promise<InvitationResponse[]>;
    getPrimaryPendingInvitations(primaryId: string): Promise<{
        id: string;
        inviteCode: string;
        invitedPhone: string;
        invitedUser: {
            phone: string;
            name: string | null;
        } | null;
        relationship: string | null;
        dailyLimit: number;
        monthlyLimit: number;
        perTransactionLimit: number;
        status: string;
        expiresAt: Date;
        createdAt: Date;
    }[]>;
    acceptInvitation(invitationId: string, userId: string, userPhone: string, userName: string | null): Promise<{
        primaryId: string;
        primaryName: string | null;
        familyMemberId: string;
        limits: {
            daily: number;
            monthly: number;
            perTransaction: number;
        };
    }>;
    acceptInvitationByCode(inviteCode: string, userId: string, userPhone: string, userName: string | null): Promise<{
        primaryId: string;
        primaryName: string | null;
        familyMemberId: string;
        limits: {
            daily: number;
            monthly: number;
            perTransaction: number;
        };
    }>;
    acceptConnectionRequest(invitationId: string, primaryId: string, primaryPhone: string, primaryName: string | null): Promise<{
        success: boolean;
        message: string;
        data: {
            familyMemberId: string;
            linkedUserId: string;
            linkedName: string | null;
            linkedPhone: string;
            limits: {
                daily: number;
                monthly: number;
                perTransaction: number;
            };
        };
    }>;
    rejectInvitation(invitationId: string, userId: string, userPhone: string, userName: string | null): Promise<{
        success: boolean;
    }>;
    cancelInvitation(invitationId: string, primaryId: string): Promise<{
        success: boolean;
    }>;
    cleanupExpiredInvitations(): Promise<number>;
}
declare const _default: InvitationService;
export default _default;
//# sourceMappingURL=invitationService.d.ts.map