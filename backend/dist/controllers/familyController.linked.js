"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
const invitationService_1 = __importDefault(require("../services/invitationService"));
const notificationService_1 = __importDefault(require("../services/notificationService"));
const constants_1 = require("../utils/constants");
const getMyPrimaryDetails = async (req, res, next) => {
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
};
const getMyLimits = async (req, res, next) => {
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
};
const connectToPrimary = async (req, res, next) => {
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
};
const acceptConnectionRequest = async (req, res, next) => {
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
};
exports.default = {
    getMyPrimaryDetails,
    getMyLimits,
    connectToPrimary,
    acceptConnectionRequest,
};
//# sourceMappingURL=familyController.linked.js.map