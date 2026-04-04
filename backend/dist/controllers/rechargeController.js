"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
const notificationService_1 = __importDefault(require("../services/notificationService"));
const constants_1 = require("../utils/constants");
const helpers_1 = require("../utils/helpers");
const authService_1 = __importDefault(require("../services/authService"));
const client_1 = require("@prisma/client");
class RechargeController {
    async requireValidPin(userId, pin) {
        const user = await database_1.default.user.findUnique({ where: { id: userId }, select: { pin: true } });
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        if (!user.pin)
            throw new errorHandler_1.AppError('Please set your PIN to activate payments', 403);
        const ok = await authService_1.default.verifyPin(pin, user.pin);
        if (!ok)
            throw new errorHandler_1.AppError('Invalid PIN', 401);
    }
    async getPlans(req, res, next) {
        try {
            const { type } = req.query;
            const typeStr = type;
            const plans = {
                mobile: [
                    { id: '1', name: '₹199 Plan', amount: 199, validity: '28 days', data: '2GB/day', calls: 'Unlimited', sms: '100/day' },
                    { id: '2', name: '₹299 Plan', amount: 299, validity: '56 days', data: '1.5GB/day', calls: 'Unlimited', sms: '100/day' },
                    { id: '3', name: '₹499 Plan', amount: 499, validity: '84 days', data: '2GB/day', calls: 'Unlimited', sms: '100/day' },
                    { id: '4', name: '₹599 Plan', amount: 599, validity: '84 days', data: '3GB/day', calls: 'Unlimited', sms: '100/day' },
                    { id: '5', name: '₹999 Plan', amount: 999, validity: '365 days', data: '2GB/day', calls: 'Unlimited', sms: '100/day' },
                ],
                electricity: [{ id: 'e1', name: 'Bill Payment', amount: 'Any', description: 'Pay your electricity bill' }],
                fastag: [{ id: 'f1', name: 'FASTag Recharge', amount: 'Any', description: 'Recharge your FASTag' }],
                dth: [
                    { id: 'd1', name: '₹265 Plan', amount: 265, validity: '1 month', channels: 'South Sports HD Pack' },
                    { id: 'd2', name: '₹399 Plan', amount: 399, validity: '1 month', channels: 'All Sports HD Pack' },
                    { id: 'd3', name: '₹599 Plan', amount: 599, validity: '3 months', channels: 'All Sports HD Pack' },
                ],
            };
            const selectedPlans = typeStr && plans[typeStr]
                ? plans[typeStr]
                : plans.mobile;
            res.status(200).json({
                success: true,
                data: selectedPlans,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async mobileRecharge(req, res, next) {
        try {
            const { mobileNumber, operator, amount, planId, paymentMethod = constants_1.PAYMENT_METHODS.WALLET, bankId, pin } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            if (!pin) {
                throw new errorHandler_1.AppError('PIN is required', 400);
            }
            await this.requireValidPin(userId, String(pin));
            if (!mobileNumber || !amount || amount <= 0) {
                throw new errorHandler_1.AppError('Valid mobile number and amount are required', 400);
            }
            const user = await database_1.default.user.findUnique({ where: { id: userId }, select: { role: true } });
            if (user?.role === 'LINKED') {
                await this.checkAndUpdateLimits(userId, amount);
            }
            const result = await this.processRechargePayment(userId, amount, paymentMethod, bankId, constants_1.RECHARGE_TYPES.MOBILE, { mobileNumber, operator, planId });
            logger_1.default.info(`Mobile recharge: ₹${amount} for ${mobileNumber} by user ${userId}`);
            res.status(200).json({
                success: true,
                message: 'Recharge successful',
                data: {
                    transactionId: result.transaction.transactionId,
                    amount,
                    mobileNumber,
                    operator,
                    newBalance: result.newBalance ? Number(result.newBalance) : null,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async electricityBill(req, res, next) {
        try {
            const { consumerNumber, board, amount, paymentMethod = constants_1.PAYMENT_METHODS.WALLET, bankId, pin } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            if (!pin) {
                throw new errorHandler_1.AppError('PIN is required', 400);
            }
            await this.requireValidPin(userId, String(pin));
            if (!consumerNumber || !amount || amount <= 0) {
                throw new errorHandler_1.AppError('Valid consumer number and amount are required', 400);
            }
            const user = await database_1.default.user.findUnique({ where: { id: userId }, select: { role: true } });
            if (user?.role === 'LINKED') {
                await this.checkAndUpdateLimits(userId, amount);
            }
            const result = await this.processRechargePayment(userId, amount, paymentMethod, bankId, constants_1.RECHARGE_TYPES.ELECTRICITY, { consumerNumber, board });
            res.status(200).json({
                success: true,
                message: 'Bill payment successful',
                data: {
                    transactionId: result.transaction.transactionId,
                    amount,
                    consumerNumber,
                    board,
                    newBalance: result.newBalance ? Number(result.newBalance) : null,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async fastagRecharge(req, res, next) {
        try {
            const { vehicleNumber, amount, paymentMethod = constants_1.PAYMENT_METHODS.WALLET, bankId, pin } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            if (!pin) {
                throw new errorHandler_1.AppError('PIN is required', 400);
            }
            await this.requireValidPin(userId, String(pin));
            if (!vehicleNumber || !amount || amount <= 0) {
                throw new errorHandler_1.AppError('Valid vehicle number and amount are required', 400);
            }
            const user = await database_1.default.user.findUnique({ where: { id: userId }, select: { role: true } });
            if (user?.role === 'LINKED') {
                await this.checkAndUpdateLimits(userId, amount);
            }
            const result = await this.processRechargePayment(userId, amount, paymentMethod, bankId, constants_1.RECHARGE_TYPES.FASTAG, { vehicleNumber });
            res.status(200).json({
                success: true,
                message: 'FASTag recharge successful',
                data: {
                    transactionId: result.transaction.transactionId,
                    amount,
                    vehicleNumber,
                    newBalance: result.newBalance ? Number(result.newBalance) : null,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getHistory(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const type = req.query.type;
            const userId = req.user?.userId;
            const where = { userId };
            if (type)
                where.type = type;
            const [recharges, total] = await Promise.all([
                database_1.default.recharge.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                database_1.default.recharge.count({ where }),
            ]);
            const formattedRecharges = recharges.map((r) => ({
                ...r,
                amount: Number(r.amount),
                metadata: r.metadata ? JSON.parse(r.metadata) : null,
            }));
            res.status(200).json({
                success: true,
                data: {
                    recharges: formattedRecharges,
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
    async checkAndUpdateLimits(linkedUserId, amount) {
        const member = await database_1.default.familyMember.findUnique({
            where: { linkedId: linkedUserId },
        });
        if (!member) {
            throw new errorHandler_1.AppError('Family member not found', 404);
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        if (member.lastResetDate < today) {
            await database_1.default.familyMember.update({
                where: { id: member.id },
                data: { dailySpent: 0, lastResetDate: today },
            });
            member.dailySpent = new client_1.Prisma.Decimal(0);
        }
        if (member.lastResetDate < firstDayOfMonth) {
            await database_1.default.familyMember.update({
                where: { id: member.id },
                data: { monthlySpent: 0, lastResetDate: today },
            });
            member.monthlySpent = new client_1.Prisma.Decimal(0);
        }
        if (Number(member.dailySpent) + amount > Number(member.dailyLimit)) {
            throw new errorHandler_1.AppError(`Daily limit of ₹${member.dailyLimit} exceeded. Used: ₹${member.dailySpent}`, 400);
        }
        if (Number(member.monthlySpent) + amount > Number(member.monthlyLimit)) {
            throw new errorHandler_1.AppError(`Monthly limit of ₹${member.monthlyLimit} exceeded. Used: ₹${member.monthlySpent}`, 400);
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
    async processRechargePayment(userId, amount, paymentMethod, bankId, rechargeType, metadata) {
        if (paymentMethod === constants_1.PAYMENT_METHODS.WALLET) {
            const wallet = await database_1.default.wallet.findUnique({ where: { userId } });
            if (!wallet || Number(wallet.balance) < amount) {
                throw new errorHandler_1.AppError('Insufficient wallet balance', 400);
            }
        }
        else if (paymentMethod === constants_1.PAYMENT_METHODS.BANK) {
            if (!bankId)
                throw new errorHandler_1.AppError('Bank account is required', 400);
            const bank = await database_1.default.bankAccount.findFirst({ where: { id: bankId, userId } });
            if (!bank)
                throw new errorHandler_1.AppError('Bank account not found', 404);
            if (!bank.isVerified)
                throw new errorHandler_1.AppError('Bank account must be verified', 400);
            if (Number(bank.balance) < amount) {
                throw new errorHandler_1.AppError(`Insufficient balance in ${bank.bankName}`, 400);
            }
        }
        else {
            throw new errorHandler_1.AppError('Invalid payment method', 400);
        }
        const result = await database_1.default.$transaction(async (tx) => {
            if (paymentMethod === constants_1.PAYMENT_METHODS.WALLET) {
                await tx.wallet.update({
                    where: { userId },
                    data: { balance: { decrement: amount } },
                });
            }
            else if (paymentMethod === constants_1.PAYMENT_METHODS.BANK) {
                await tx.bankAccount.update({
                    where: { id: bankId },
                    data: { balance: { decrement: amount } },
                });
            }
            const transactionId = (0, helpers_1.generateTxnId)('RCH');
            const transaction = await tx.transaction.create({
                data: {
                    transactionId,
                    amount,
                    type: constants_1.TRANSACTION_TYPES.RECHARGE,
                    status: constants_1.TRANSACTION_STATUS.SUCCESS,
                    senderId: userId,
                    description: `${rechargeType} recharge`,
                    paymentMethod,
                    bankId: paymentMethod === constants_1.PAYMENT_METHODS.BANK ? bankId : undefined,
                    metadata: JSON.stringify(metadata),
                },
            });
            const recharge = await tx.recharge.create({
                data: {
                    transactionId,
                    type: rechargeType,
                    operator: metadata.operator || metadata.board || null,
                    accountNumber: metadata.mobileNumber || metadata.consumerNumber || metadata.vehicleNumber,
                    amount,
                    status: 'SUCCESS',
                    userId,
                    metadata: JSON.stringify(metadata),
                },
            });
            let newBalance = null;
            if (paymentMethod === constants_1.PAYMENT_METHODS.WALLET) {
                const updatedWallet = await tx.wallet.findUnique({ where: { userId } });
                newBalance = updatedWallet?.balance || 0;
            }
            return { transaction, recharge, newBalance };
        });
        await notificationService_1.default.create({
            userId,
            type: 'RECHARGE_SUCCESS',
            title: 'Recharge Successful',
            message: `₹${amount} ${rechargeType.toLowerCase()} recharge successful`,
            data: { amount, type: rechargeType, ...metadata },
        });
        return result;
    }
}
exports.default = new RechargeController();
//# sourceMappingURL=rechargeController.js.map