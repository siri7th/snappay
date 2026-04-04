"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatInvitationResponse = exports.calculateExpiryDate = exports.generateInviteCode = void 0;
const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};
exports.generateInviteCode = generateInviteCode;
const calculateExpiryDate = (days = 7) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};
exports.calculateExpiryDate = calculateExpiryDate;
const formatInvitationResponse = (invitation) => {
    return {
        id: invitation.id,
        inviteCode: invitation.inviteCode,
        primaryId: invitation.primaryId,
        primaryName: invitation.primary?.name || 'Family Account',
        primaryPhone: invitation.primary?.phone,
        primaryEmail: invitation.primary?.email,
        phone: invitation.phone,
        relationship: invitation.relationship,
        dailyLimit: Number(invitation.dailyLimit),
        monthlyLimit: Number(invitation.monthlyLimit),
        perTransactionLimit: Number(invitation.perTransactionLimit),
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt
    };
};
exports.formatInvitationResponse = formatInvitationResponse;
//# sourceMappingURL=invitation.utils.js.map