"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const notificationService_1 = __importDefault(require("../services/notificationService"));
const constants_1 = require("../utils/constants");
const familyController_helpers_1 = require("./familyController.helpers");
const logger_1 = __importDefault(require("../utils/logger"));
const getFamilyMembers = async (req, res, next) => {
    try {
        const primaryId = req.user?.userId;
        if (!primaryId) {
            throw new errorHandler_1.AppError('User not authenticated', 401);
        }
        try {
            await (0, familyController_helpers_1.resetMemberLimits)(primaryId);
        }
        catch (error) {
            logger_1.default.error('Failed to reset member limits', error);
        }
        const familyMembers = await database_1.default.familyMember.findMany({
            where: { primaryId, status: { not: constants_1.FAMILY_MEMBER_STATUS.REMOVED } },
            include: {
                linked: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                        status: true,
                        createdAt: true,
                        lastLoginAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const totalDailySpent = familyMembers.reduce((sum, m) => sum + Number(m.dailySpent), 0);
        const totalMonthlySpent = familyMembers.reduce((sum, m) => sum + Number(m.monthlySpent), 0);
        const activeCount = familyMembers.filter((m) => m.status === constants_1.FAMILY_MEMBER_STATUS.ACTIVE).length;
        const pausedCount = familyMembers.filter((m) => m.status === constants_1.FAMILY_MEMBER_STATUS.PAUSED).length;
        const pendingCount = familyMembers.filter((m) => m.status === constants_1.FAMILY_MEMBER_STATUS.PENDING).length;
        const defaultPermissions = {
            sendMoney: true,
            scanPay: true,
            recharge: true,
            viewHistory: true,
        };
        const formattedMembers = familyMembers.map((m) => {
            let parsedPermissions = defaultPermissions;
            if (m.permissions) {
                try {
                    parsedPermissions = JSON.parse(m.permissions);
                }
                catch {
                    parsedPermissions = defaultPermissions;
                }
            }
            return {
                id: m.id,
                linkedId: m.linked.id,
                name: m.linked.name || 'Family Member',
                phone: m.linked.phone,
                email: m.linked.email,
                relationship: m.relationship || 'Family Member',
                dailyLimit: Number(m.dailyLimit),
                dailySpent: Number(m.dailySpent),
                dailyRemaining: Number(m.dailyLimit) - Number(m.dailySpent),
                monthlyLimit: Number(m.monthlyLimit),
                monthlySpent: Number(m.monthlySpent),
                monthlyRemaining: Number(m.monthlyLimit) - Number(m.monthlySpent),
                perTransactionLimit: Number(m.perTransactionLimit),
                status: m.status,
                memberSince: m.createdAt,
                lastActive: m.linked.lastLoginAt,
                permissions: parsedPermissions,
            };
        });
        res.status(200).json({
            success: true,
            data: {
                members: formattedMembers,
                stats: {
                    total: formattedMembers.length,
                    active: activeCount,
                    paused: pausedCount,
                    pending: pendingCount,
                    totalDailySpent,
                    totalMonthlySpent,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
const getMemberById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const primaryId = req.user?.userId;
        if (!primaryId) {
            throw new errorHandler_1.AppError('User not authenticated', 401);
        }
        const familyMember = await database_1.default.familyMember.findFirst({
            where: { id, primaryId },
            include: {
                linked: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                        status: true,
                        lastLoginAt: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!familyMember) {
            throw new errorHandler_1.AppError('Family member not found', 404);
        }
        const permissions = familyMember.permissions
            ? JSON.parse(familyMember.permissions)
            : { sendMoney: true, scanPay: true, recharge: true, viewHistory: true };
        res.status(200).json({
            success: true,
            data: {
                id: familyMember.id,
                linkedId: familyMember.linked.id,
                name: familyMember.linked.name,
                phone: familyMember.linked.phone,
                email: familyMember.linked.email,
                relationship: familyMember.relationship,
                dailyLimit: Number(familyMember.dailyLimit),
                dailySpent: Number(familyMember.dailySpent),
                monthlyLimit: Number(familyMember.monthlyLimit),
                monthlySpent: Number(familyMember.monthlySpent),
                perTransactionLimit: Number(familyMember.perTransactionLimit),
                status: familyMember.status,
                memberSince: familyMember.linked.createdAt,
                lastActive: familyMember.linked.lastLoginAt,
                permissions,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
const updateLimits = async (req, res, next) => {
    try {
        const { memberId } = req.params;
        const { dailyLimit, monthlyLimit, perTransactionLimit } = req.body;
        const primaryId = req.user?.userId;
        if (!primaryId) {
            throw new errorHandler_1.AppError('User not authenticated', 401);
        }
        const familyMember = await database_1.default.familyMember.findFirst({
            where: { id: memberId, primaryId },
        });
        if (!familyMember) {
            throw new errorHandler_1.AppError('Family member not found', 404);
        }
        const updated = await database_1.default.familyMember.update({
            where: { id: memberId },
            data: {
                dailyLimit: dailyLimit !== undefined ? dailyLimit : undefined,
                monthlyLimit: monthlyLimit !== undefined ? monthlyLimit : undefined,
                perTransactionLimit: perTransactionLimit !== undefined ? perTransactionLimit : undefined,
            },
        });
        await notificationService_1.default.create({
            userId: familyMember.linkedId,
            type: constants_1.NOTIFICATION_TYPES.LIMIT_UPDATED,
            title: 'Your limits have been updated',
            message: 'Your spending limits have been changed by the primary account',
            data: { newLimits: { dailyLimit, monthlyLimit, perTransactionLimit } },
        });
        res.status(200).json({
            success: true,
            message: 'Limits updated successfully',
            data: {
                dailyLimit: Number(updated.dailyLimit),
                monthlyLimit: Number(updated.monthlyLimit),
                perTransactionLimit: Number(updated.perTransactionLimit),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
const addToLimit = async (req, res, next) => {
    try {
        const { memberId } = req.params;
        const { amount } = req.body;
        const primaryId = req.user?.userId;
        if (!primaryId) {
            throw new errorHandler_1.AppError('User not authenticated', 401);
        }
        if (!amount || amount <= 0) {
            throw new errorHandler_1.AppError('Valid amount is required', 400);
        }
        const familyMember = await database_1.default.familyMember.findFirst({
            where: { id: memberId, primaryId },
        });
        if (!familyMember) {
            throw new errorHandler_1.AppError('Family member not found', 404);
        }
        const wallet = await database_1.default.wallet.findUnique({ where: { userId: primaryId } });
        if (!wallet || Number(wallet.balance) < amount) {
            throw new errorHandler_1.AppError('Insufficient wallet balance', 400);
        }
        const result = await database_1.default.$transaction(async (tx) => {
            const updatedWallet = await tx.wallet.update({
                where: { userId: primaryId },
                data: { balance: { decrement: amount } },
            });
            const updatedMember = await tx.familyMember.update({
                where: { id: memberId },
                data: { dailyLimit: { increment: amount } },
            });
            const transaction = await tx.transaction.create({
                data: {
                    transactionId: `TXN${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                    amount,
                    type: 'ADD_TO_LIMIT',
                    status: 'SUCCESS',
                    senderId: primaryId,
                    familyMemberId: memberId,
                    description: `Added to ${familyMember.relationship || 'member'}'s limit`,
                    paymentMethod: 'wallet',
                },
            });
            return { transaction, newBalance: updatedWallet.balance, newLimit: updatedMember.dailyLimit };
        });
        await notificationService_1.default.create({
            userId: familyMember.linkedId,
            type: constants_1.NOTIFICATION_TYPES.LIMIT_INCREASED,
            title: 'Your limit has been increased',
            message: `₹${amount} added to your daily limit`,
            data: { newLimit: Number(result.newLimit) },
        });
        res.status(200).json({
            success: true,
            message: 'Money added to limit successfully',
            data: {
                transactionId: result.transaction.transactionId,
                amount,
                newBalance: Number(result.newBalance),
                newDailyLimit: Number(result.newLimit),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
const pauseMember = async (req, res, next) => {
    try {
        const { memberId } = req.params;
        const primaryId = req.user?.userId;
        if (!primaryId) {
            throw new errorHandler_1.AppError('User not authenticated', 401);
        }
        const familyMember = await database_1.default.familyMember.findFirst({
            where: { id: memberId, primaryId },
        });
        if (!familyMember) {
            throw new errorHandler_1.AppError('Family member not found', 404);
        }
        await database_1.default.familyMember.update({
            where: { id: memberId },
            data: { status: constants_1.FAMILY_MEMBER_STATUS.PAUSED },
        });
        await notificationService_1.default.create({
            userId: familyMember.linkedId,
            type: constants_1.NOTIFICATION_TYPES.ACCOUNT_PAUSED,
            title: 'Your account has been paused',
            message: 'Your primary account holder has paused your spending',
        });
        res.status(200).json({ success: true, message: 'Member paused successfully' });
    }
    catch (error) {
        next(error);
    }
};
const resumeMember = async (req, res, next) => {
    try {
        const { memberId } = req.params;
        const primaryId = req.user?.userId;
        if (!primaryId) {
            throw new errorHandler_1.AppError('User not authenticated', 401);
        }
        const familyMember = await database_1.default.familyMember.findFirst({
            where: { id: memberId, primaryId },
        });
        if (!familyMember) {
            throw new errorHandler_1.AppError('Family member not found', 404);
        }
        await database_1.default.familyMember.update({
            where: { id: memberId },
            data: { status: constants_1.FAMILY_MEMBER_STATUS.ACTIVE },
        });
        await notificationService_1.default.create({
            userId: familyMember.linkedId,
            type: constants_1.NOTIFICATION_TYPES.ACCOUNT_RESUMED,
            title: 'Your account has been resumed',
            message: 'You can now make payments again',
        });
        res.status(200).json({ success: true, message: 'Member resumed successfully' });
    }
    catch (error) {
        next(error);
    }
};
const removeMember = async (req, res, next) => {
    try {
        const { memberId } = req.params;
        const primaryId = req.user?.userId;
        if (!primaryId) {
            throw new errorHandler_1.AppError('User not authenticated', 401);
        }
        const familyMember = await database_1.default.familyMember.findFirst({
            where: { id: memberId, primaryId },
        });
        if (!familyMember) {
            throw new errorHandler_1.AppError('Family member not found', 404);
        }
        await database_1.default.familyMember.update({
            where: { id: memberId },
            data: { status: constants_1.FAMILY_MEMBER_STATUS.REMOVED },
        });
        await notificationService_1.default.create({
            userId: familyMember.linkedId,
            type: constants_1.NOTIFICATION_TYPES.FAMILY_REMOVED,
            title: 'Removed from family',
            message: 'You have been removed from the family account',
        });
        res.status(200).json({ success: true, message: 'Member removed successfully' });
    }
    catch (error) {
        next(error);
    }
};
const getMemberTransactions = async (req, res, next) => {
    try {
        const { memberId } = req.params;
        const primaryId = req.user?.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        if (!primaryId) {
            throw new errorHandler_1.AppError('User not authenticated', 401);
        }
        const familyMember = await database_1.default.familyMember.findFirst({
            where: { id: memberId, primaryId },
        });
        if (!familyMember) {
            throw new errorHandler_1.AppError('Family member not found', 404);
        }
        const transactions = await database_1.default.transaction.findMany({
            where: {
                OR: [
                    { senderId: familyMember.linkedId },
                    { receiverId: familyMember.linkedId },
                    { familyMemberId: memberId },
                ],
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        });
        const total = await database_1.default.transaction.count({
            where: {
                OR: [
                    { senderId: familyMember.linkedId },
                    { receiverId: familyMember.linkedId },
                    { familyMemberId: memberId },
                ],
            },
        });
        const formattedTransactions = transactions.map((t) => ({ ...t, amount: Number(t.amount) }));
        res.status(200).json({
            success: true,
            data: {
                transactions: formattedTransactions,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getFamilyMembers,
    getMemberById,
    updateLimits,
    addToLimit,
    pauseMember,
    resumeMember,
    removeMember,
    getMemberTransactions,
};
//# sourceMappingURL=familyController.primary.js.map