"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const notificationService_1 = __importDefault(require("./notificationService"));
const helpers_1 = require("../utils/helpers");
const constants_1 = require("../utils/constants");
class InvitationService {
    calculateExpiryDate(days = 7) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date;
    }
    formatInvitationResponse(invitation) {
        return {
            id: invitation.id,
            inviteCode: invitation.inviteCode,
            primaryId: invitation.primaryId,
            primaryName: invitation.primary?.name || 'Family Account',
            primaryPhone: invitation.primary?.phone,
            primaryEmail: invitation.primary?.email,
            phone: invitation.invitedPhone,
            relationship: invitation.relationship,
            dailyLimit: Number(invitation.dailyLimit),
            monthlyLimit: Number(invitation.monthlyLimit),
            perTransactionLimit: Number(invitation.perTransactionLimit),
            status: invitation.status,
            expiresAt: invitation.expiresAt,
            createdAt: invitation.createdAt,
        };
    }
    validateInvitation(invitation, userPhone) {
        if (invitation.invitedPhone !== userPhone) {
            throw new errorHandler_1.AppError('This invitation was not sent to you', 403);
        }
        if (invitation.status !== constants_1.INVITATION_STATUS.PENDING) {
            throw new errorHandler_1.AppError(`This invitation has already been ${invitation.status.toLowerCase()}`, 400);
        }
        if (invitation.expiresAt < new Date()) {
            throw new errorHandler_1.AppError('This invitation has expired', 400);
        }
    }
    async createInvitation(primaryId, primaryName, primaryPhone, data) {
        const { phone, relationship, dailyLimit, monthlyLimit, perTransactionLimit } = data;
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            throw new errorHandler_1.AppError('Please enter a valid 10-digit phone number', 400);
        }
        const existingUser = await database_1.default.user.findUnique({ where: { phone } });
        if (existingUser) {
            const existingMember = await database_1.default.familyMember.findFirst({
                where: { primaryId, linkedId: existingUser.id },
            });
            if (existingMember) {
                throw new errorHandler_1.AppError('User is already in your family', 400);
            }
            const existingInvite = await database_1.default.invitation.findFirst({
                where: {
                    invitedPhone: phone,
                    primaryId,
                    status: constants_1.INVITATION_STATUS.PENDING,
                    expiresAt: { gt: new Date() },
                },
            });
            if (existingInvite) {
                throw new errorHandler_1.AppError('An invitation has already been sent to this number', 400);
            }
        }
        else {
            const existingInvite = await database_1.default.invitation.findFirst({
                where: {
                    invitedPhone: phone,
                    primaryId,
                    status: constants_1.INVITATION_STATUS.PENDING,
                    expiresAt: { gt: new Date() },
                },
            });
            if (existingInvite) {
                throw new errorHandler_1.AppError('An invitation has already been sent to this number', 400);
            }
        }
        const inviteCode = (0, helpers_1.generateInviteCode)();
        const invitation = await database_1.default.invitation.create({
            data: {
                inviteCode,
                primaryId,
                invitedPhone: phone,
                invitedUserId: existingUser?.id,
                relationship: relationship || 'Family Member',
                dailyLimit: dailyLimit || constants_1.LIMITS.DEFAULT_DAILY,
                monthlyLimit: monthlyLimit || constants_1.LIMITS.DEFAULT_MONTHLY,
                perTransactionLimit: perTransactionLimit || constants_1.LIMITS.DEFAULT_PER_TXN,
                expiresAt: this.calculateExpiryDate(7),
                status: constants_1.INVITATION_STATUS.PENDING,
            },
            include: { primary: { select: { name: true, phone: true, email: true } } },
        });
        await this.sendInvitationNotifications(existingUser, invitation, primaryName, primaryPhone);
        return this.formatInvitationResponse(invitation);
    }
    async sendInvitationNotifications(existingUser, invitation, primaryName, primaryPhone) {
        if (existingUser) {
            await notificationService_1.default.create({
                userId: existingUser.id,
                type: constants_1.NOTIFICATION_TYPES.FAMILY_INVITATION,
                title: 'Family Invitation',
                message: `${primaryName || 'Someone'} has invited you to join their family as a ${invitation.relationship}`,
                data: {
                    invitationId: invitation.id,
                    inviteCode: invitation.inviteCode,
                    primaryId: invitation.primaryId,
                    primaryName,
                    primaryPhone,
                    relationship: invitation.relationship,
                    dailyLimit: Number(invitation.dailyLimit),
                    monthlyLimit: Number(invitation.monthlyLimit),
                    expiresAt: invitation.expiresAt,
                },
            });
        }
        else {
        }
    }
    async getInvitationByCode(code) {
        const invitation = await database_1.default.invitation.findUnique({
            where: { inviteCode: code },
            include: {
                primary: { select: { id: true, name: true, phone: true, email: true } },
                invitedUser: { select: { id: true, name: true, phone: true } },
            },
        });
        if (!invitation) {
            throw new errorHandler_1.AppError('Invalid invitation code', 404);
        }
        return this.formatInvitationResponse(invitation);
    }
    async getInvitationById(id) {
        const invitation = await database_1.default.invitation.findUnique({
            where: { id },
            include: {
                primary: { select: { id: true, name: true, phone: true, email: true } },
                invitedUser: { select: { id: true, name: true, phone: true } },
            },
        });
        if (!invitation) {
            throw new errorHandler_1.AppError('Invitation not found', 404);
        }
        return this.formatInvitationResponse(invitation);
    }
    async getPendingInvitationsByUserId(userId) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
            select: { phone: true },
        });
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        return this.getPendingInvitationsByPhone(user.phone);
    }
    async getPendingInvitationsByPhone(phone) {
        const invitations = await database_1.default.invitation.findMany({
            where: {
                invitedPhone: phone,
                status: constants_1.INVITATION_STATUS.PENDING,
                expiresAt: { gt: new Date() },
            },
            include: {
                primary: { select: { id: true, name: true, phone: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return invitations.map((inv) => this.formatInvitationResponse(inv));
    }
    async getPrimaryPendingInvitations(primaryId) {
        const invitations = await database_1.default.invitation.findMany({
            where: {
                primaryId,
                status: constants_1.INVITATION_STATUS.PENDING,
                expiresAt: { gt: new Date() },
            },
            include: {
                invitedUser: { select: { name: true, phone: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return invitations.map((inv) => ({
            id: inv.id,
            inviteCode: inv.inviteCode,
            invitedPhone: inv.invitedPhone,
            invitedUser: inv.invitedUser,
            relationship: inv.relationship,
            dailyLimit: Number(inv.dailyLimit),
            monthlyLimit: Number(inv.monthlyLimit),
            perTransactionLimit: Number(inv.perTransactionLimit),
            status: inv.status,
            expiresAt: inv.expiresAt,
            createdAt: inv.createdAt,
        }));
    }
    async acceptInvitation(invitationId, userId, userPhone, userName) {
        const invitation = await database_1.default.invitation.findUnique({
            where: { id: invitationId },
            include: { primary: true },
        });
        if (!invitation) {
            throw new errorHandler_1.AppError('Invitation not found', 404);
        }
        this.validateInvitation(invitation, userPhone);
        const existingFamily = await database_1.default.familyMember.findFirst({
            where: { linkedId: userId, status: { in: ['ACTIVE', 'PENDING'] } },
        });
        if (existingFamily) {
            throw new errorHandler_1.AppError('You are already part of a family', 400);
        }
        const existingLink = await database_1.default.familyMember.findFirst({
            where: { primaryId: invitation.primaryId, linkedId: userId },
        });
        if (existingLink) {
            throw new errorHandler_1.AppError('You are already linked to this primary account', 400);
        }
        const result = await database_1.default.$transaction(async (tx) => {
            const familyMember = await tx.familyMember.create({
                data: {
                    primaryId: invitation.primaryId,
                    linkedId: userId,
                    relationship: invitation.relationship || 'Family Member',
                    dailyLimit: invitation.dailyLimit,
                    monthlyLimit: invitation.monthlyLimit,
                    perTransactionLimit: invitation.perTransactionLimit,
                    dailySpent: 0,
                    monthlySpent: 0,
                    status: 'ACTIVE',
                    permissions: JSON.stringify({
                        sendMoney: true,
                        scanPay: true,
                        recharge: true,
                        viewHistory: true,
                    }),
                },
            });
            await tx.invitation.update({
                where: { id: invitationId },
                data: {
                    status: constants_1.INVITATION_STATUS.ACCEPTED,
                    invitedUserId: userId,
                    acceptedAt: new Date(),
                },
            });
            return familyMember;
        });
        await notificationService_1.default.create({
            userId: invitation.primaryId,
            type: constants_1.NOTIFICATION_TYPES.FAMILY_JOINED,
            title: 'Family Member Joined',
            message: `${userName || userPhone} has accepted your invitation and joined your family`,
            data: { linkedUserId: userId, familyMemberId: result.id, relationship: invitation.relationship },
        });
        return {
            primaryId: invitation.primaryId,
            primaryName: invitation.primary.name,
            familyMemberId: result.id,
            limits: {
                daily: Number(result.dailyLimit),
                monthly: Number(result.monthlyLimit),
                perTransaction: Number(result.perTransactionLimit),
            },
        };
    }
    async acceptInvitationByCode(inviteCode, userId, userPhone, userName) {
        const invitation = await database_1.default.invitation.findUnique({
            where: { inviteCode },
            include: { primary: true },
        });
        if (!invitation) {
            throw new errorHandler_1.AppError('Invalid invitation code', 404);
        }
        return this.acceptInvitation(invitation.id, userId, userPhone, userName);
    }
    async acceptConnectionRequest(invitationId, primaryId, primaryPhone, primaryName) {
        const invitation = await database_1.default.invitation.findUnique({
            where: { id: invitationId },
            include: { primary: true, invitedUser: true },
        });
        if (!invitation) {
            throw new errorHandler_1.AppError('Invitation not found', 404);
        }
        if (invitation.primaryId !== primaryId) {
            throw new errorHandler_1.AppError('This invitation does not belong to you', 403);
        }
        if (invitation.status !== constants_1.INVITATION_STATUS.PENDING) {
            throw new errorHandler_1.AppError(`This invitation has already been ${invitation.status.toLowerCase()}`, 400);
        }
        if (invitation.expiresAt < new Date()) {
            throw new errorHandler_1.AppError('This invitation has expired', 400);
        }
        const invitedUser = await database_1.default.user.findUnique({ where: { phone: invitation.invitedPhone } });
        if (!invitedUser) {
            throw new errorHandler_1.AppError('The invited user has not registered yet', 400);
        }
        const existingFamily = await database_1.default.familyMember.findFirst({
            where: { linkedId: invitedUser.id, status: { in: ['ACTIVE', 'PENDING'] } },
        });
        if (existingFamily) {
            throw new errorHandler_1.AppError('This user is already part of a family', 400);
        }
        const existingLink = await database_1.default.familyMember.findFirst({
            where: { primaryId: invitation.primaryId, linkedId: invitedUser.id },
        });
        if (existingLink) {
            throw new errorHandler_1.AppError('This user is already linked to your account', 400);
        }
        const result = await database_1.default.$transaction(async (tx) => {
            const familyMember = await tx.familyMember.create({
                data: {
                    primaryId: invitation.primaryId,
                    linkedId: invitedUser.id,
                    relationship: invitation.relationship || 'Family Member',
                    dailyLimit: invitation.dailyLimit,
                    monthlyLimit: invitation.monthlyLimit,
                    perTransactionLimit: invitation.perTransactionLimit,
                    dailySpent: 0,
                    monthlySpent: 0,
                    status: 'ACTIVE',
                    permissions: JSON.stringify({
                        sendMoney: true,
                        scanPay: true,
                        recharge: true,
                        viewHistory: true,
                    }),
                },
            });
            await tx.invitation.update({
                where: { id: invitationId },
                data: { status: constants_1.INVITATION_STATUS.ACCEPTED, invitedUserId: invitedUser.id, acceptedAt: new Date() },
            });
            return familyMember;
        });
        await notificationService_1.default.create({
            userId: invitedUser.id,
            type: constants_1.NOTIFICATION_TYPES.CONNECTION_APPROVED,
            title: 'Connection Approved!',
            message: `Your request to connect has been approved by ${primaryName || 'the primary account'}`,
            data: { primaryId: invitation.primaryId, primaryName, familyMemberId: result.id },
        });
        return {
            success: true,
            message: 'Connection request accepted',
            data: {
                familyMemberId: result.id,
                linkedUserId: invitedUser.id,
                linkedName: invitedUser.name,
                linkedPhone: invitedUser.phone,
                limits: {
                    daily: Number(result.dailyLimit),
                    monthly: Number(result.monthlyLimit),
                    perTransaction: Number(result.perTransactionLimit),
                },
            },
        };
    }
    async rejectInvitation(invitationId, userId, userPhone, userName) {
        const invitation = await database_1.default.invitation.findUnique({
            where: { id: invitationId },
            include: { primary: true },
        });
        if (!invitation) {
            throw new errorHandler_1.AppError('Invitation not found', 404);
        }
        if (invitation.invitedPhone !== userPhone) {
            throw new errorHandler_1.AppError('This invitation was not sent to you', 403);
        }
        if (invitation.status !== constants_1.INVITATION_STATUS.PENDING) {
            throw new errorHandler_1.AppError(`This invitation has already been ${invitation.status.toLowerCase()}`, 400);
        }
        if (invitation.expiresAt < new Date()) {
            throw new errorHandler_1.AppError('This invitation has expired', 400);
        }
        await database_1.default.invitation.update({
            where: { id: invitationId },
            data: { status: constants_1.INVITATION_STATUS.REJECTED },
        });
        await notificationService_1.default.create({
            userId: invitation.primaryId,
            type: constants_1.NOTIFICATION_TYPES.INVITATION_REJECTED,
            title: 'Invitation Rejected',
            message: `${userName || userPhone} has declined your family invitation`,
            data: { linkedUserId: userId, phone: userPhone },
        });
        return { success: true };
    }
    async cancelInvitation(invitationId, primaryId) {
        const invitation = await database_1.default.invitation.findUnique({ where: { id: invitationId } });
        if (!invitation) {
            throw new errorHandler_1.AppError('Invitation not found', 404);
        }
        if (invitation.primaryId !== primaryId) {
            throw new errorHandler_1.AppError('You can only cancel invitations you sent', 403);
        }
        if (invitation.status !== constants_1.INVITATION_STATUS.PENDING) {
            throw new errorHandler_1.AppError(`This invitation has already been ${invitation.status.toLowerCase()}`, 400);
        }
        await database_1.default.invitation.update({
            where: { id: invitationId },
            data: { status: constants_1.INVITATION_STATUS.CANCELLED },
        });
        if (invitation.invitedUserId) {
            await notificationService_1.default.create({
                userId: invitation.invitedUserId,
                type: constants_1.NOTIFICATION_TYPES.INVITATION_CANCELLED,
                title: 'Invitation Cancelled',
                message: 'Your family invitation has been cancelled by the primary account',
                data: { invitationId },
            });
        }
        return { success: true };
    }
    async cleanupExpiredInvitations() {
        const result = await database_1.default.invitation.updateMany({
            where: {
                status: constants_1.INVITATION_STATUS.PENDING,
                expiresAt: { lt: new Date() },
            },
            data: { status: constants_1.INVITATION_STATUS.EXPIRED },
        });
        return result.count;
    }
}
exports.default = new InvitationService();
//# sourceMappingURL=invitationService.js.map