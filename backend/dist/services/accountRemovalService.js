"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountRemovalService = void 0;
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const notificationService_1 = __importDefault(require("./notificationService"));
const constants_1 = require("../utils/constants");
const helpers_1 = require("../utils/helpers");
class AccountRemovalService {
    async removeFamilyMember(primaryId, memberId, transferBalance = true) {
        const familyMember = await database_1.default.familyMember.findFirst({
            where: { id: memberId, primaryId },
            include: {
                linked: { include: { wallet: true } },
            },
        });
        if (!familyMember) {
            throw new errorHandler_1.AppError('Family member not found', 404);
        }
        let transferredAmount = 0;
        let remainingBalance = 0;
        const result = await database_1.default.$transaction(async (tx) => {
            if (familyMember.linked.wallet && familyMember.linked.wallet.balance.gt(0)) {
                const linkedBalance = Number(familyMember.linked.wallet.balance);
                if (transferBalance && linkedBalance > 0) {
                    let primaryWallet = await tx.wallet.findUnique({ where: { userId: primaryId } });
                    if (!primaryWallet) {
                        primaryWallet = await tx.wallet.create({
                            data: { userId: primaryId, balance: 0 },
                        });
                    }
                    await tx.wallet.update({
                        where: { userId: primaryId },
                        data: { balance: { increment: linkedBalance } },
                    });
                    await tx.wallet.update({
                        where: { userId: familyMember.linkedId },
                        data: { balance: 0 },
                    });
                    transferredAmount = linkedBalance;
                    await tx.transaction.create({
                        data: {
                            transactionId: (0, helpers_1.generateTxnId)('TRF'),
                            amount: linkedBalance,
                            type: 'BALANCE_TRANSFER',
                            status: 'SUCCESS',
                            senderId: familyMember.linkedId,
                            receiverId: primaryId,
                            description: 'Balance transferred on account removal',
                            paymentMethod: constants_1.PAYMENT_METHODS.SYSTEM,
                        },
                    });
                }
            }
            await tx.limitRequest.updateMany({
                where: { familyMemberId: memberId, status: 'PENDING' },
                data: { status: 'CANCELLED' },
            });
            await tx.familyMember.update({
                where: { id: memberId },
                data: { status: 'REMOVED' },
            });
            return { transferredAmount };
        });
        await notificationService_1.default.create({
            userId: familyMember.linkedId,
            type: constants_1.NOTIFICATION_TYPES.FAMILY_REMOVED,
            title: 'Removed from Family',
            message: `You have been removed from the family account${transferBalance ? ' and your wallet balance has been transferred' : ''}`,
            data: { transferredAmount: result.transferredAmount, primaryId },
        });
        const primaryWallet = await database_1.default.wallet.findUnique({ where: { userId: primaryId } });
        return {
            success: true,
            transferredAmount: result.transferredAmount,
            message: 'Family member removed successfully',
            remainingBalance: primaryWallet ? Number(primaryWallet.balance) : 0,
        };
    }
    async disconnectFromPrimary(linkedId, transferBalance = true) {
        const familyMember = await database_1.default.familyMember.findFirst({
            where: { linkedId },
            include: {
                primary: { include: { wallet: true } },
                linked: { include: { wallet: true } },
            },
        });
        if (!familyMember) {
            throw new errorHandler_1.AppError('You are not linked to any primary account', 404);
        }
        let transferredAmount = 0;
        const result = await database_1.default.$transaction(async (tx) => {
            if (familyMember.linked.wallet && familyMember.linked.wallet.balance.gt(0)) {
                const linkedBalance = Number(familyMember.linked.wallet.balance);
                if (transferBalance && linkedBalance > 0) {
                    let primaryWallet = await tx.wallet.findUnique({ where: { userId: familyMember.primaryId } });
                    if (!primaryWallet) {
                        primaryWallet = await tx.wallet.create({
                            data: { userId: familyMember.primaryId, balance: 0 },
                        });
                    }
                    await tx.wallet.update({
                        where: { userId: familyMember.primaryId },
                        data: { balance: { increment: linkedBalance } },
                    });
                    await tx.wallet.update({
                        where: { userId: linkedId },
                        data: { balance: 0 },
                    });
                    transferredAmount = linkedBalance;
                    await tx.transaction.create({
                        data: {
                            transactionId: (0, helpers_1.generateTxnId)('DISC'),
                            amount: linkedBalance,
                            type: 'DISCONNECT_TRANSFER',
                            status: 'SUCCESS',
                            senderId: linkedId,
                            receiverId: familyMember.primaryId,
                            description: 'Balance transferred on disconnection from primary',
                            paymentMethod: constants_1.PAYMENT_METHODS.SYSTEM,
                        },
                    });
                }
            }
            await tx.limitRequest.updateMany({
                where: { familyMemberId: familyMember.id, status: 'PENDING' },
                data: { status: 'CANCELLED' },
            });
            await tx.familyMember.update({
                where: { id: familyMember.id },
                data: { status: 'REMOVED' },
            });
            return { transferredAmount };
        });
        await notificationService_1.default.create({
            userId: familyMember.primaryId,
            type: constants_1.NOTIFICATION_TYPES.LINKED_DISCONNECTED,
            title: 'Family Member Disconnected',
            message: `A linked user has disconnected from your family${result.transferredAmount > 0 ? ` and ₹${result.transferredAmount} has been added to your wallet` : ''}`,
            data: { linkedId, transferredAmount: result.transferredAmount },
        });
        const linkedWallet = await database_1.default.wallet.findUnique({ where: { userId: linkedId } });
        return {
            success: true,
            transferredAmount: result.transferredAmount,
            message: 'Successfully disconnected from primary account',
            remainingBalance: linkedWallet ? Number(linkedWallet.balance) : 0,
        };
    }
    async getRemovalSummary(userId, targetId) {
        if (targetId) {
            const familyMember = await database_1.default.familyMember.findFirst({
                where: { id: targetId, primaryId: userId },
                include: { linked: { include: { wallet: true } } },
            });
            if (!familyMember) {
                throw new errorHandler_1.AppError('Family member not found', 404);
            }
            return {
                type: 'member',
                name: familyMember.linked.name || 'Family Member',
                phone: familyMember.linked.phone,
                relationship: familyMember.relationship,
                currentBalance: familyMember.linked.wallet ? Number(familyMember.linked.wallet.balance) : 0,
                willTransfer: true,
                pendingRequests: await this.countPendingRequests(familyMember.id),
            };
        }
        const familyMember = await database_1.default.familyMember.findFirst({
            where: { linkedId: userId },
            include: {
                primary: { include: { wallet: true } },
                linked: { include: { wallet: true } },
            },
        });
        if (!familyMember) {
            throw new errorHandler_1.AppError('Not linked to any primary account', 404);
        }
        return {
            type: 'self',
            primaryName: familyMember.primary.name || 'Primary Account',
            primaryPhone: familyMember.primary.phone,
            relationship: familyMember.relationship,
            currentBalance: familyMember.linked.wallet ? Number(familyMember.linked.wallet.balance) : 0,
            willTransfer: true,
            pendingRequests: await this.countPendingRequests(familyMember.id),
        };
    }
    async countPendingRequests(familyMemberId) {
        return database_1.default.limitRequest.count({
            where: { familyMemberId, status: 'PENDING' },
        });
    }
}
exports.AccountRemovalService = AccountRemovalService;
exports.default = new AccountRemovalService();
//# sourceMappingURL=accountRemovalService.js.map