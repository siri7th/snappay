import { RemovalResult } from '../types/accountRemoval.types';
export declare class AccountRemovalService {
    removeFamilyMember(primaryId: string, memberId: string, transferBalance?: boolean): Promise<RemovalResult>;
    disconnectFromPrimary(linkedId: string, transferBalance?: boolean): Promise<RemovalResult>;
    getRemovalSummary(userId: string, targetId?: string): Promise<{
        type: string;
        name: string;
        phone: string;
        relationship: string | null;
        currentBalance: number;
        willTransfer: boolean;
        pendingRequests: number;
        primaryName?: undefined;
        primaryPhone?: undefined;
    } | {
        type: string;
        primaryName: string;
        primaryPhone: string;
        relationship: string | null;
        currentBalance: number;
        willTransfer: boolean;
        pendingRequests: number;
        name?: undefined;
        phone?: undefined;
    }>;
    private countPendingRequests;
}
declare const _default: AccountRemovalService;
export default _default;
//# sourceMappingURL=accountRemovalService.d.ts.map