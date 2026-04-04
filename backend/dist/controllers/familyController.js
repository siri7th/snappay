"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const familyController_linked_1 = __importDefault(require("./familyController.linked"));
const familyController_primary_1 = __importDefault(require("./familyController.primary"));
const familyController_invitations_1 = __importDefault(require("./familyController.invitations"));
exports.default = {
    ...familyController_linked_1.default,
    ...familyController_primary_1.default,
    ...familyController_invitations_1.default,
};
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
const invitationService_1 = __importDefault(require("../services/invitationService"));
const notificationService_1 = __importDefault(require("../services/notificationService"));
const constants_1 = require("../utils/constants");
class FamilyController {
    async getMyPrimaryDetails(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const user = await database_1.default.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });
            if (!user) {
                throw new errorHandler_1.AppError('User not found', 401);
            }
            if (user.role === constants_1.USER_ROLES.PRIMARY) {
                res.status(200).json({
                    success: true,
                    data: null,
                    message: 'This endpoint is for linked users only',
                });
                return;
            }
            const familyMember = await database_1.default.familyMember.findFirst({
                where: { linkedId: userId, status: { not: constants_1.FAMILY_MEMBER_STATUS.REMOVED } },
                include: {
                    primary: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            email: true,
                            createdAt: true,
                        },
                    },
                },
            });
            if (!familyMember || !familyMember.primary) {
                res.status(200).json({
                    success: true,
                    data: null,
                    message: 'No primary account linked',
                });
                return;
            }
            const primaryWallet = await database_1.default.wallet.findUnique({
                where: { userId: familyMember.primaryId },
                select: { balance: true },
            });
            const responseData = {
                primary: {
                    id: familyMember.primary.id,
                    name: familyMember.primary.name || 'Family Account',
                    phone: familyMember.primary.phone,
                    email: familyMember.primary.email,
                    memberSince: familyMember.primary.createdAt,
                    walletBalance: primaryWallet ? Number(primaryWallet.balance) : 0,
                },
                limits: {
                    dailyLimit: Number(familyMember.dailyLimit),
                    dailySpent: Number(familyMember.dailySpent),
                    monthlyLimit: Number(familyMember.monthlyLimit),
                    monthlySpent: Number(familyMember.monthlySpent),
                    perTransactionLimit: Number(familyMember.perTransactionLimit),
                    relationship: familyMember.relationship,
                    status: familyMember.status,
                },
                permissions: familyMember.permissions ? JSON.parse(familyMember.permissions) : null,
                joinedAt: familyMember.createdAt,
            };
            res.status(200).json({ success: true, data: responseData });
        }
        catch (error) {
            next(error);
        }
    }
    async getMyLimits(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const user = await database_1.default.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });
            if (!user)
                throw new errorHandler_1.AppError('User not found', 404);
            if (user.role === constants_1.USER_ROLES.PRIMARY) {
                throw new errorHandler_1.AppError('This endpoint is for linked users only', 403);
            }
            const familyMember = await database_1.default.familyMember.findFirst({
                where: { linkedId: userId, status: constants_1.FAMILY_MEMBER_STATUS.ACTIVE },
                include: { primary: { select: { name: true } } },
            });
            if (!familyMember) {
                throw new errorHandler_1.AppError('No active family membership found', 404);
            }
            res.status(200).json({
                success: true,
                data: {
                    dailyLimit: Number(familyMember.dailyLimit),
                    dailySpent: Number(familyMember.dailySpent),
                    monthlyLimit: Number(familyMember.monthlyLimit),
                    monthlySpent: Number(familyMember.monthlySpent),
                    perTransactionLimit: Number(familyMember.perTransactionLimit),
                    primaryName: familyMember.primary.name,
                    relationship: familyMember.relationship,
                    status: familyMember.status,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async connectToPrimary(req, res, next) {
        try {
            const linkedId = req.user?.userId;
            const { method, code, phone } = req.body;
            const userPhone = req.user?.phone;
            if (!linkedId || !userPhone) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const existingLink = await database_1.default.familyMember.findFirst({
                where: {
                    linkedId,
                    status: { in: [constants_1.FAMILY_MEMBER_STATUS.ACTIVE, constants_1.FAMILY_MEMBER_STATUS.PAUSED, constants_1.FAMILY_MEMBER_STATUS.PENDING] },
                },
                include: { primary: { select: { name: true, phone: true } } },
            });
            if (existingLink) {
                res.status(400).json({
                    success: false,
                    message: 'You are already linked to a primary account',
                    data: {
                        primaryId: existingLink.primaryId,
                        primaryName: existingLink.primary.name,
                        primaryPhone: existingLink.primary.phone,
                        status: existingLink.status,
                        relationship: existingLink.relationship,
                    },
                });
                return;
            }
            if (method === 'code' && code) {
                try {
                    const invitation = await invitationService_1.default.getInvitationByCode(code);
                    if (invitation) {
                        const result = await invitationService_1.default.acceptInvitationByCode(code, linkedId, userPhone, req.user?.name || null);
                        await notificationService_1.default.create({
                            userId: linkedId,
                            type: constants_1.NOTIFICATION_TYPES.CONNECTION_APPROVED,
                            title: 'Connection Approved!',
                            message: `You are now connected to ${invitation.primaryName || 'primary account'}`,
                            data: { primaryId: invitation.primaryId, primaryName: invitation.primaryName },
                        });
                        res.status(200).json({
                            success: true,
                            message: 'Successfully connected to primary account',
                            data: result,
                        });
                        return;
                    }
                }
                catch (error) {
                    logger_1.default.debug('Invitation not found, trying manual connection');
                }
            }
            if (method === 'manual' && phone) {
                const primaryUser = await database_1.default.user.findFirst({
                    where: { phone, role: constants_1.USER_ROLES.PRIMARY },
                });
                if (!primaryUser) {
                    res.status(404).json({
                        success: false,
                        message: 'No primary account found with this phone number',
                    });
                    return;
                }
                if (primaryUser.id === linkedId) {
                    throw new errorHandler_1.AppError('You cannot connect to your own account', 400);
                }
                const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
                const invitation = await database_1.default.invitation.create({
                    data: {
                        inviteCode,
                        primaryId: primaryUser.id,
                        invitedPhone: userPhone,
                        relationship: 'Family Member',
                        dailyLimit: constants_1.LIMITS.DEFAULT_DAILY,
                        monthlyLimit: constants_1.LIMITS.DEFAULT_MONTHLY,
                        perTransactionLimit: constants_1.LIMITS.DEFAULT_PER_TXN,
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        status: constants_1.INVITATION_STATUS.PENDING,
                    },
                    include: { primary: { select: { name: true, phone: true } } },
                });
                await notificationService_1.default.create({
                    userId: primaryUser.id,
                    type: constants_1.NOTIFICATION_TYPES.CONNECTION_REQUEST,
                    title: 'New Connection Request',
                    message: `${userPhone} wants to connect to your family`,
                    data: { invitationId: invitation.id, phone: userPhone },
                });
                logger_1.default.info(`Connection request sent to primary ${primaryUser.id} from linked user ${linkedId}`);
                res.status(200).json({
                    success: true,
                    message: 'Connection request sent. Waiting for approval.',
                    data: {
                        invitationId: invitation.id,
                        status: constants_1.INVITATION_STATUS.PENDING,
                        primaryId: primaryUser.id,
                        primaryName: primaryUser.name,
                        primaryPhone: primaryUser.phone,
                    },
                });
                return;
            }
            throw new errorHandler_1.AppError('Invalid connection method or missing information', 400);
        }
        catch (error) {
            next(error);
        }
    }
    async acceptConnectionRequest(req, res, next) {
        try {
            const { invitationId } = req.params;
            const primaryId = req.user?.userId;
            const primaryName = req.user?.name || null;
            const primaryPhone = req.user?.phone;
            if (!primaryId || !primaryPhone) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            if (!invitationId) {
                throw new errorHandler_1.AppError('Invitation ID is required', 400);
            }
            const result = await invitationService_1.default.acceptConnectionRequest(invitationId, primaryId, primaryPhone, primaryName);
            logger_1.default.info(`Primary ${primaryId} accepted connection request ${invitationId}`);
            res.status(200).json({
                success: true,
                message: 'Connection request accepted successfully',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getFamilyMembers(req, res, next) {
        try {
            const primaryId = req.user?.userId;
            if (!primaryId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            await this.resetMemberLimits(primaryId);
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
            const formattedMembers = familyMembers.map((m) => ({
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
                permissions: m.permissions ? JSON.parse(m.permissions) : {
                    sendMoney: true,
                    scanPay: true,
                    recharge: true,
                    viewHistory: true,
                },
            }));
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
    }
    async getMemberById(req, res, next) {
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
    }
    async updateLimits(req, res, next) {
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
    }
    async addToLimit(req, res, next) {
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
    }
    async pauseMember(req, res, next) {
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
    }
    async resumeMember(req, res, next) {
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
    }
    async removeMember(req, res, next) {
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
    }
    async getMemberTransactions(req, res, next) {
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
    }
    async inviteMember(req, res, next) {
        try {
            const { phone, relationship, dailyLimit, monthlyLimit, perTransactionLimit } = req.body;
            const primaryId = req.user?.userId;
            const primaryName = req.user?.name || null;
            const primaryPhone = req.user?.phone;
            if (!phone)
                throw new errorHandler_1.AppError('Phone number is required', 400);
            if (!primaryId || !primaryPhone)
                throw new errorHandler_1.AppError('User not authenticated', 401);
            const invitation = await invitationService_1.default.createInvitation(primaryId, primaryName, primaryPhone, { phone, relationship, dailyLimit, monthlyLimit, perTransactionLimit });
            logger_1.default.info(`Family invitation sent to ${phone} by primary ${primaryId}`);
            res.status(200).json({
                success: true,
                message: 'Invitation sent successfully',
                data: invitation,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async generateInviteCode(req, res, next) {
        try {
            const primaryId = req.user?.userId;
            if (!primaryId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const user = await database_1.default.user.findUnique({ where: { id: primaryId } });
            if (user?.role !== constants_1.USER_ROLES.PRIMARY) {
                throw new errorHandler_1.AppError('Only primary accounts can generate invite codes', 403);
            }
            const code = Math.random().toString(36).substring(2, 10).toUpperCase();
            const invitation = await database_1.default.invitation.create({
                data: {
                    inviteCode: code,
                    primaryId,
                    invitedPhone: 'pending',
                    relationship: 'Family Member',
                    dailyLimit: constants_1.LIMITS.DEFAULT_DAILY,
                    monthlyLimit: constants_1.LIMITS.DEFAULT_MONTHLY,
                    perTransactionLimit: constants_1.LIMITS.DEFAULT_PER_TXN,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    status: constants_1.INVITATION_STATUS.PENDING,
                },
            });
            logger_1.default.info(`Invite code generated for primary ${primaryId}`);
            res.status(200).json({
                success: true,
                data: { code: invitation.inviteCode, expiresAt: invitation.expiresAt },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getPendingInvitations(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId)
                throw new errorHandler_1.AppError('User not authenticated', 401);
            const invitations = await invitationService_1.default.getPendingInvitationsByUserId(userId);
            res.status(200).json({ success: true, data: invitations });
        }
        catch (error) {
            next(error);
        }
    }
    async getInvitationByCode(req, res, next) {
        try {
            const { code } = req.params;
            if (!code)
                throw new errorHandler_1.AppError('Invitation code is required', 400);
            const invitation = await invitationService_1.default.getInvitationByCode(code);
            res.status(200).json({ success: true, data: invitation });
        }
        catch (error) {
            next(error);
        }
    }
    async acceptInvitationById(req, res, next) {
        try {
            const { invitationId } = req.params;
            const linkedId = req.user?.userId;
            if (!linkedId)
                throw new errorHandler_1.AppError('User not authenticated', 401);
            if (!invitationId)
                throw new errorHandler_1.AppError('Invitation ID is required', 400);
            const user = await database_1.default.user.findUnique({ where: { id: linkedId } });
            if (!user)
                throw new errorHandler_1.AppError('User not found', 404);
            const result = await invitationService_1.default.acceptInvitation(invitationId, linkedId, user.phone, user.name);
            logger_1.default.info(`User ${linkedId} accepted invitation ${invitationId}`);
            res.status(200).json({
                success: true,
                message: 'Successfully joined family',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async acceptInvitationByCode(req, res, next) {
        try {
            const { inviteCode } = req.body;
            const linkedId = req.user?.userId;
            if (!linkedId)
                throw new errorHandler_1.AppError('User not authenticated', 401);
            if (!inviteCode)
                throw new errorHandler_1.AppError('Invite code is required', 400);
            const user = await database_1.default.user.findUnique({ where: { id: linkedId } });
            if (!user)
                throw new errorHandler_1.AppError('User not found', 404);
            const result = await invitationService_1.default.acceptInvitationByCode(inviteCode, linkedId, user.phone, user.name);
            logger_1.default.info(`User ${linkedId} accepted invitation with code ${inviteCode}`);
            res.status(200).json({
                success: true,
                message: 'Successfully joined family',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async rejectInvitation(req, res, next) {
        try {
            const { invitationId } = req.params;
            const userId = req.user?.userId;
            if (!userId)
                throw new errorHandler_1.AppError('User not authenticated', 401);
            if (!invitationId)
                throw new errorHandler_1.AppError('Invitation ID is required', 400);
            const user = await database_1.default.user.findUnique({ where: { id: userId } });
            if (!user)
                throw new errorHandler_1.AppError('User not found', 404);
            const result = await invitationService_1.default.rejectInvitation(invitationId, userId, user.phone, user.name);
            res.status(200).json({ success: true, message: 'Invitation rejected successfully', data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async cancelInvitation(req, res, next) {
        try {
            const { invitationId } = req.params;
            const primaryId = req.user?.userId;
            if (!primaryId)
                throw new errorHandler_1.AppError('User not authenticated', 401);
            if (!invitationId)
                throw new errorHandler_1.AppError('Invitation ID is required', 400);
            const result = await invitationService_1.default.cancelInvitation(invitationId, primaryId);
            res.status(200).json({ success: true, message: 'Invitation cancelled successfully', data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async createLimitRequest(req, res, next) {
        try {
            const { amount, reason, duration } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const familyMember = await database_1.default.familyMember.findFirst({
                where: { linkedId: userId, status: constants_1.FAMILY_MEMBER_STATUS.ACTIVE },
            });
            if (!familyMember) {
                throw new errorHandler_1.AppError('You are not linked to any active primary account', 404);
            }
            const request = await database_1.default.limitRequest.create({
                data: {
                    familyMemberId: familyMember.id,
                    requesterId: userId,
                    approverId: familyMember.primaryId,
                    amount,
                    reason: reason || null,
                    duration: duration || 'today',
                    status: 'PENDING',
                },
            });
            await notificationService_1.default.create({
                userId: familyMember.primaryId,
                type: constants_1.NOTIFICATION_TYPES.LIMIT_REQUEST,
                title: 'Limit Increase Request',
                message: `A family member has requested a limit increase of ₹${amount}`,
                data: { requestId: request.id, amount, reason, duration },
            });
            res.status(200).json({
                success: true,
                message: 'Limit request created successfully',
                data: { ...request, amount: Number(request.amount) },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getRequests(req, res, next) {
        try {
            const userId = req.user?.userId;
            const { status } = req.query;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const user = await database_1.default.user.findUnique({ where: { id: userId } });
            if (!user)
                throw new errorHandler_1.AppError('User not found', 404);
            let requests = [];
            if (user.role === constants_1.USER_ROLES.PRIMARY) {
                const familyMembers = await database_1.default.familyMember.findMany({
                    where: { primaryId: userId },
                    select: { id: true },
                });
                const familyMemberIds = familyMembers.map((fm) => fm.id);
                requests = await database_1.default.limitRequest.findMany({
                    where: {
                        familyMemberId: { in: familyMemberIds },
                        ...(status && { status: status }),
                    },
                    include: {
                        familyMember: {
                            include: { linked: { select: { name: true, phone: true } } },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                });
            }
            else {
                const familyMember = await database_1.default.familyMember.findFirst({
                    where: { linkedId: userId },
                });
                if (familyMember) {
                    requests = await database_1.default.limitRequest.findMany({
                        where: {
                            familyMemberId: familyMember.id,
                            ...(status && { status: status }),
                        },
                        orderBy: { createdAt: 'desc' },
                    });
                }
            }
            const formattedRequests = requests.map((r) => ({ ...r, amount: Number(r.amount) }));
            res.status(200).json({ success: true, data: formattedRequests });
        }
        catch (error) {
            next(error);
        }
    }
    async approveRequest(req, res, next) {
        try {
            const { requestId } = req.params;
            const primaryId = req.user?.userId;
            if (!primaryId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const request = await database_1.default.limitRequest.findUnique({
                where: { id: requestId },
                include: { familyMember: true },
            });
            if (!request)
                throw new errorHandler_1.AppError('Request not found', 404);
            if (request.approverId !== primaryId) {
                throw new errorHandler_1.AppError('You are not authorized to approve this request', 403);
            }
            if (request.status !== 'PENDING') {
                throw new errorHandler_1.AppError(`This request has already been ${request.status.toLowerCase()}`, 400);
            }
            const updateData = {};
            if (request.duration === 'today' || request.duration === 'permanent') {
                updateData.dailyLimit = { increment: request.amount };
            }
            if (['week', 'month', 'permanent'].includes(request.duration)) {
                updateData.monthlyLimit = { increment: request.amount };
            }
            await database_1.default.$transaction([
                database_1.default.familyMember.update({
                    where: { id: request.familyMemberId },
                    data: updateData,
                }),
                database_1.default.limitRequest.update({
                    where: { id: requestId },
                    data: { status: 'APPROVED', respondedAt: new Date() },
                }),
            ]);
            await notificationService_1.default.create({
                userId: request.requesterId,
                type: constants_1.NOTIFICATION_TYPES.REQUEST_APPROVED,
                title: 'Request Approved',
                message: `Your request for ₹${request.amount} limit increase has been approved`,
                data: { requestId },
            });
            res.status(200).json({ success: true, message: 'Request approved successfully' });
        }
        catch (error) {
            next(error);
        }
    }
    async denyRequest(req, res, next) {
        try {
            const { requestId } = req.params;
            const primaryId = req.user?.userId;
            if (!primaryId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const request = await database_1.default.limitRequest.findUnique({
                where: { id: requestId },
            });
            if (!request)
                throw new errorHandler_1.AppError('Request not found', 404);
            if (request.approverId !== primaryId) {
                throw new errorHandler_1.AppError('You are not authorized to deny this request', 403);
            }
            if (request.status !== 'PENDING') {
                throw new errorHandler_1.AppError(`This request has already been ${request.status.toLowerCase()}`, 400);
            }
            await database_1.default.limitRequest.update({
                where: { id: requestId },
                data: { status: 'DENIED', respondedAt: new Date() },
            });
            await notificationService_1.default.create({
                userId: request.requesterId,
                type: constants_1.NOTIFICATION_TYPES.REQUEST_DENIED,
                title: 'Request Denied',
                message: `Your request for ₹${request.amount} limit increase has been denied`,
                data: { requestId },
            });
            res.status(200).json({ success: true, message: 'Request denied successfully' });
        }
        catch (error) {
            next(error);
        }
    }
    async getPendingAll(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId)
                throw new errorHandler_1.AppError('User not authenticated', 401);
            const user = await database_1.default.user.findUnique({ where: { id: userId } });
            if (!user)
                throw new errorHandler_1.AppError('User not found', 404);
            let pendingInvitations = [];
            let pendingRequests = [];
            if (user.role === constants_1.USER_ROLES.PRIMARY) {
                pendingInvitations = await invitationService_1.default.getPrimaryPendingInvitations(userId);
                const familyMembers = await database_1.default.familyMember.findMany({
                    where: { primaryId: userId },
                    select: { id: true },
                });
                const familyMemberIds = familyMembers.map((fm) => fm.id);
                pendingRequests = await database_1.default.limitRequest.findMany({
                    where: { familyMemberId: { in: familyMemberIds }, status: 'PENDING' },
                    include: {
                        familyMember: {
                            include: { linked: { select: { name: true, phone: true } } },
                        },
                    },
                });
            }
            else {
                pendingInvitations = await invitationService_1.default.getPendingInvitationsByUserId(userId);
                const familyMember = await database_1.default.familyMember.findFirst({
                    where: { linkedId: userId },
                });
                if (familyMember) {
                    pendingRequests = await database_1.default.limitRequest.findMany({
                        where: { familyMemberId: familyMember.id, status: 'PENDING' },
                    });
                }
            }
            const formattedRequests = pendingRequests.map(r => ({ ...r, amount: Number(r.amount) }));
            res.status(200).json({
                success: true,
                data: {
                    invitations: pendingInvitations,
                    requests: formattedRequests,
                    total: pendingInvitations.length + formattedRequests.length,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async generateQRCode(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const linkingToken = jsonwebtoken_1.default.sign({ primaryId: userId, type: 'family_link', exp: Math.floor(Date.now() / 1000) + 600 }, process.env.JWT_SECRET);
            const qrData = {
                type: 'family_link',
                primaryId: userId,
                token: linkingToken,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            };
            res.status(200).json({
                success: true,
                data: { qrData: JSON.stringify(qrData), expiresIn: 600 },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resetMemberLimits(primaryId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        await database_1.default.$transaction(async (tx) => {
            await tx.familyMember.updateMany({
                where: {
                    primaryId,
                    lastResetDate: { lt: today },
                },
                data: {
                    dailySpent: 0,
                    lastResetDate: today,
                },
            });
            await tx.familyMember.updateMany({
                where: {
                    primaryId,
                    lastResetDate: { lt: firstDayOfMonth },
                },
                data: {
                    monthlySpent: 0,
                    lastResetDate: today,
                },
            });
        });
    }
}
//# sourceMappingURL=familyController.js.map