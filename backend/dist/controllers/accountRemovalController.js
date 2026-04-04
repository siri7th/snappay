"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandler_1 = require("../middleware/errorHandler");
const accountRemovalService_1 = __importDefault(require("../services/accountRemovalService"));
const otpService_1 = __importDefault(require("../services/otpService"));
const constants_1 = require("../utils/constants");
const logger_1 = __importDefault(require("../utils/logger"));
const database_1 = __importDefault(require("../config/database"));
class AccountRemovalController {
    async removeFamilyMember(req, res, next) {
        try {
            const { memberId, transferBalance = true } = req.body;
            const primaryId = req.user?.userId;
            if (!primaryId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            if (!memberId) {
                throw new errorHandler_1.AppError('Member ID is required', 400);
            }
            const result = await accountRemovalService_1.default.removeFamilyMember(primaryId, memberId, transferBalance);
            logger_1.default.info(`Primary ${primaryId} removed family member ${memberId}`);
            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    transferredAmount: result.transferredAmount,
                    remainingBalance: result.remainingBalance
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    async disconnectFromPrimary(req, res, next) {
        try {
            const { transferBalance = true } = req.body;
            const linkedId = req.user?.userId;
            if (!linkedId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const result = await accountRemovalService_1.default.disconnectFromPrimary(linkedId, transferBalance);
            logger_1.default.info(`Linked user ${linkedId} disconnected from primary`);
            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    transferredAmount: result.transferredAmount,
                    remainingBalance: result.remainingBalance
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getRemovalSummary(req, res, next) {
        try {
            const userId = req.user?.userId;
            const { memberId } = req.params;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const summary = await accountRemovalService_1.default.getRemovalSummary(userId, memberId);
            res.status(200).json({
                success: true,
                data: summary
            });
        }
        catch (error) {
            next(error);
        }
    }
    async requestDisconnectOTP(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const user = await database_1.default.user.findUnique({
                where: { id: userId },
                select: { phone: true }
            });
            if (!user) {
                throw new errorHandler_1.AppError('User not found', 404);
            }
            await otpService_1.default.sendOTP(user.phone, constants_1.OTP_PURPOSES.DISCONNECT);
            logger_1.default.info(`Disconnect OTP requested for user ${userId}`);
            res.status(200).json({
                success: true,
                message: 'OTP sent successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new AccountRemovalController();
//# sourceMappingURL=accountRemovalController.js.map