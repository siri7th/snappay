"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LimitService = void 0;
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const helpers_1 = require("../utils/helpers");
class LimitService {
    async checkAndUpdateLimits(linkedUserId, amount) {
        const member = await database_1.default.familyMember.findUnique({
            where: { linkedId: linkedUserId },
        });
        if (!member) {
            throw new errorHandler_1.AppError('Family member not found', 404);
        }
        const today = (0, helpers_1.getStartOfDay)();
        const firstDayOfMonth = (0, helpers_1.getStartOfMonth)();
        const shouldResetDaily = member.lastResetDate < today;
        const shouldResetMonthly = member.lastResetDate < firstDayOfMonth;
        if (shouldResetDaily) {
            await database_1.default.familyMember.update({
                where: { id: member.id },
                data: {
                    dailySpent: 0,
                    lastResetDate: today,
                },
            });
        }
        if (shouldResetMonthly) {
            await database_1.default.familyMember.update({
                where: { id: member.id },
                data: {
                    monthlySpent: 0,
                    lastResetDate: today,
                },
            });
        }
        const currentDailySpent = shouldResetDaily ? 0 : Number(member.dailySpent);
        const currentMonthlySpent = shouldResetMonthly ? 0 : Number(member.monthlySpent);
        if (currentDailySpent + amount > Number(member.dailyLimit)) {
            throw new errorHandler_1.AppError(`Daily limit of ₹${member.dailyLimit} exceeded. Used: ₹${currentDailySpent}`, 400);
        }
        if (currentMonthlySpent + amount > Number(member.monthlyLimit)) {
            throw new errorHandler_1.AppError(`Monthly limit of ₹${member.monthlyLimit} exceeded. Used: ₹${currentMonthlySpent}`, 400);
        }
        if (amount > Number(member.perTransactionLimit)) {
            throw new errorHandler_1.AppError(`Per transaction limit is ₹${member.perTransactionLimit}`, 400);
        }
        await database_1.default.familyMember.update({
            where: { id: member.id },
            data: {
                dailySpent: { increment: amount },
                monthlySpent: { increment: amount },
            },
        });
    }
    async getRemainingLimits(linkedUserId) {
        const member = await database_1.default.familyMember.findUnique({
            where: { linkedId: linkedUserId },
        });
        if (!member) {
            throw new errorHandler_1.AppError('Family member not found', 404);
        }
        return {
            daily: {
                limit: Number(member.dailyLimit),
                spent: Number(member.dailySpent),
                remaining: Number(member.dailyLimit) - Number(member.dailySpent),
            },
            monthly: {
                limit: Number(member.monthlyLimit),
                spent: Number(member.monthlySpent),
                remaining: Number(member.monthlyLimit) - Number(member.monthlySpent),
            },
            perTransaction: Number(member.perTransactionLimit),
        };
    }
    async addToLimit(memberId, amount, type = 'daily') {
        return database_1.default.familyMember.update({
            where: { id: memberId },
            data: type === 'daily' ? { dailyLimit: { increment: amount } } : { monthlyLimit: { increment: amount } },
        });
    }
}
exports.LimitService = LimitService;
exports.default = new LimitService();
//# sourceMappingURL=limitService.js.map