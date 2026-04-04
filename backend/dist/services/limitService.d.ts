import { Prisma } from '@prisma/client';
export declare class LimitService {
    checkAndUpdateLimits(linkedUserId: string, amount: number): Promise<void>;
    getRemainingLimits(linkedUserId: string): Promise<{
        daily: {
            limit: number;
            spent: number;
            remaining: number;
        };
        monthly: {
            limit: number;
            spent: number;
            remaining: number;
        };
        perTransaction: number;
    }>;
    addToLimit(memberId: string, amount: number, type?: 'daily' | 'monthly'): Promise<{
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        primaryId: string;
        linkedId: string;
        relationship: string | null;
        dailyLimit: Prisma.Decimal;
        monthlyLimit: Prisma.Decimal;
        perTransactionLimit: Prisma.Decimal;
        dailySpent: Prisma.Decimal;
        monthlySpent: Prisma.Decimal;
        lastResetDate: Date;
        permissions: string;
    }>;
}
declare const _default: LimitService;
export default _default;
//# sourceMappingURL=limitService.d.ts.map