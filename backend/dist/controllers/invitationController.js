"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invitationService_1 = __importDefault(require("../services/invitationService"));
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
class InvitationController {
    async createInvitation(req, res, next) {
        try {
            const primaryId = req.user?.userId;
            const primaryName = req.user?.name || null;
            const primaryPhone = req.user?.phone;
            if (!primaryId || !primaryPhone) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const invitationData = req.body;
            const invitation = await invitationService_1.default.createInvitation(primaryId, primaryName, primaryPhone, invitationData);
            logger_1.default.info(`Invitation created by primary ${primaryId} for ${invitationData.phone}`);
            res.status(200).json({
                success: true,
                message: 'Invitation sent successfully',
                data: invitation
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getPendingInvitations(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const invitations = await invitationService_1.default.getPendingInvitationsByUserId(userId);
            res.status(200).json({
                success: true,
                data: invitations
            });
        }
        catch (error) {
            next(error);
        }
    }
    async acceptInvitation(req, res, next) {
        try {
            const { invitationId } = req.params;
            const userId = req.user?.userId;
            const userPhone = req.user?.phone;
            const userName = req.user?.name || null;
            if (!userId || !userPhone) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            if (!invitationId) {
                throw new errorHandler_1.AppError('Invitation ID is required', 400);
            }
            const result = await invitationService_1.default.acceptInvitation(invitationId, userId, userPhone, userName);
            logger_1.default.info(`Invitation ${invitationId} accepted by user ${userId}`);
            res.status(200).json({
                success: true,
                message: 'Invitation accepted successfully',
                data: result
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
            const userPhone = req.user?.phone;
            const userName = req.user?.name || null;
            if (!userId || !userPhone) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            if (!invitationId) {
                throw new errorHandler_1.AppError('Invitation ID is required', 400);
            }
            await invitationService_1.default.rejectInvitation(invitationId, userId, userPhone, userName);
            logger_1.default.info(`Invitation ${invitationId} rejected by user ${userId}`);
            res.status(200).json({
                success: true,
                message: 'Invitation rejected'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new InvitationController();
//# sourceMappingURL=invitationController.js.map