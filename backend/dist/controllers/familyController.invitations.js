"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
const invitationService_1 = __importDefault(require("../services/invitationService"));
const notificationService_1 = __importDefault(require("../services/notificationService"));
const constants_1 = require("../utils/constants");
const inviteMember = async (req, res, next) => {
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
};
const generateInviteCode = async (req, res, next) => {
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
};
const getPendingInvitations = async (req, res, next) => {
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
};
const getInvitationByCode = async (req, res, next) => {
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
};
const acceptInvitationById = async (req, res, next) => {
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
};
const acceptInvitationByCode = async (req, res, next) => {
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
};
const rejectInvitation = async (req, res, next) => {
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
};
const cancelInvitation = async (req, res, next) => {
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
};
const createLimitRequest = async (req, res, next) => {
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
};
const getRequests = async (req, res, next) => {
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
};
const approveRequest = async (req, res, next) => {
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
};
const denyRequest = async (req, res, next) => {
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
};
const getPendingAll = async (req, res, next) => {
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
        const formattedRequests = pendingRequests.map((r) => ({ ...r, amount: Number(r.amount) }));
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
};
const generateQRCode = async (req, res, next) => {
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
};
exports.default = {
    inviteMember,
    generateInviteCode,
    getPendingInvitations,
    getInvitationByCode,
    acceptInvitationById,
    acceptInvitationByCode,
    rejectInvitation,
    cancelInvitation,
    createLimitRequest,
    getRequests,
    approveRequest,
    denyRequest,
    getPendingAll,
    generateQRCode,
};
//# sourceMappingURL=familyController.invitations.js.map