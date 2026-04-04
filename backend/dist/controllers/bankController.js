"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
const helpers_1 = require("../utils/helpers");
class BankController {
    async getUserBanks(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            logger_1.default.debug(`Fetching banks for user: ${userId}`);
            const banks = await database_1.default.bankAccount.findMany({
                where: { userId },
                orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
            });
            const totalBalance = banks.reduce((sum, bank) => sum + Number(bank.balance), 0);
            const verifiedCount = banks.filter((bank) => bank.isVerified).length;
            const unverifiedCount = banks.length - verifiedCount;
            res.status(200).json({
                success: true,
                data: {
                    banks: banks.map((bank) => ({
                        id: bank.id,
                        bankName: bank.bankName,
                        accountNumber: (0, helpers_1.maskAccountNumber)(bank.accountNumber),
                        ifscCode: bank.ifscCode,
                        accountHolder: bank.accountHolder,
                        balance: Number(bank.balance),
                        isDefault: bank.isDefault,
                        isVerified: bank.isVerified,
                        createdAt: bank.createdAt,
                        updatedAt: bank.updatedAt,
                    })),
                    totalBalance,
                    verifiedCount,
                    unverifiedCount,
                    count: banks.length,
                    hasDefault: banks.some((bank) => bank.isDefault),
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error in getUserBanks:', error);
            next(error);
        }
    }
    async getBankById(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const bank = await database_1.default.bankAccount.findFirst({
                where: { id, userId },
            });
            if (!bank) {
                throw new errorHandler_1.AppError('Bank account not found', 404);
            }
            res.status(200).json({
                success: true,
                data: {
                    id: bank.id,
                    bankName: bank.bankName,
                    accountNumber: bank.accountNumber,
                    maskedAccountNumber: (0, helpers_1.maskAccountNumber)(bank.accountNumber),
                    ifscCode: bank.ifscCode,
                    accountHolder: bank.accountHolder,
                    balance: Number(bank.balance),
                    isDefault: bank.isDefault,
                    isVerified: bank.isVerified,
                    createdAt: bank.createdAt,
                    updatedAt: bank.updatedAt,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error in getBankById:', error);
            next(error);
        }
    }
    async addBankAccount(req, res, next) {
        try {
            const { bankName, accountNumber, ifscCode, accountHolder, initialBalance } = req.body;
            const userId = req.user?.userId;
            if (!bankName || !accountNumber || !ifscCode || !accountHolder) {
                throw new errorHandler_1.AppError('All fields are required', 400);
            }
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const existingBank = await database_1.default.bankAccount.findUnique({
                where: {
                    accountNumber_ifscCode: {
                        accountNumber,
                        ifscCode,
                    },
                },
            });
            if (existingBank) {
                throw new errorHandler_1.AppError('Bank account already exists', 400);
            }
            const bankCount = await database_1.default.bankAccount.count({
                where: { userId },
            });
            const allowDemoBalance = process.env.NODE_ENV !== 'production';
            const demoBalance = allowDemoBalance && initialBalance !== undefined && initialBalance !== null && initialBalance !== ''
                ? Number(initialBalance)
                : 0;
            if (allowDemoBalance && (Number.isNaN(demoBalance) || demoBalance < 0 || demoBalance > 1_000_000)) {
                throw new errorHandler_1.AppError('Invalid initial balance (demo mode)', 400);
            }
            const bank = await database_1.default.bankAccount.create({
                data: {
                    bankName,
                    accountNumber,
                    ifscCode,
                    accountHolder,
                    balance: demoBalance,
                    userId,
                    isDefault: bankCount === 0,
                    isVerified: allowDemoBalance ? true : false,
                },
            });
            logger_1.default.info(`Bank account added for user ${userId}`);
            res.status(201).json({
                success: true,
                message: 'Bank account added successfully',
                data: {
                    id: bank.id,
                    bankName: bank.bankName,
                    accountNumber: (0, helpers_1.maskAccountNumber)(bank.accountNumber),
                    ifscCode: bank.ifscCode,
                    accountHolder: bank.accountHolder,
                    balance: Number(bank.balance),
                    isDefault: bank.isDefault,
                    isVerified: bank.isVerified,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error in addBankAccount:', error);
            next(error);
        }
    }
    async updateBankAccount(req, res, next) {
        try {
            const { id } = req.params;
            const { bankName, accountHolder, isDefault } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const bank = await database_1.default.bankAccount.findFirst({
                where: { id, userId },
            });
            if (!bank) {
                throw new errorHandler_1.AppError('Bank account not found', 404);
            }
            if (isDefault === true && !bank.isDefault) {
                await database_1.default.bankAccount.updateMany({
                    where: { userId, isDefault: true },
                    data: { isDefault: false },
                });
            }
            const updatedBank = await database_1.default.bankAccount.update({
                where: { id },
                data: {
                    bankName: bankName || undefined,
                    accountHolder: accountHolder || undefined,
                    isDefault: isDefault !== undefined ? isDefault : undefined,
                },
            });
            logger_1.default.info(`Bank account ${id} updated for user ${userId}`);
            res.status(200).json({
                success: true,
                message: 'Bank account updated successfully',
                data: {
                    id: updatedBank.id,
                    bankName: updatedBank.bankName,
                    accountHolder: updatedBank.accountHolder,
                    isDefault: updatedBank.isDefault,
                    isVerified: updatedBank.isVerified,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error in updateBankAccount:', error);
            next(error);
        }
    }
    async deleteBankAccount(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const bank = await database_1.default.bankAccount.findFirst({
                where: { id, userId },
            });
            if (!bank) {
                throw new errorHandler_1.AppError('Bank account not found', 404);
            }
            const bankCount = await database_1.default.bankAccount.count({
                where: { userId },
            });
            if (bankCount === 1) {
                throw new errorHandler_1.AppError('Cannot delete the only bank account', 400);
            }
            if (bank.isDefault) {
                const anotherBank = await database_1.default.bankAccount.findFirst({
                    where: { userId, id: { not: id } },
                });
                if (anotherBank) {
                    await database_1.default.bankAccount.update({
                        where: { id: anotherBank.id },
                        data: { isDefault: true },
                    });
                }
            }
            await database_1.default.bankAccount.delete({
                where: { id },
            });
            logger_1.default.info(`Bank account ${id} deleted for user ${userId}`);
            res.status(200).json({
                success: true,
                message: 'Bank account deleted successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error in deleteBankAccount:', error);
            next(error);
        }
    }
    async verifyBankAccount(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const bank = await database_1.default.bankAccount.findFirst({
                where: { id, userId },
            });
            if (!bank) {
                throw new errorHandler_1.AppError('Bank account not found', 404);
            }
            if (bank.isVerified) {
                throw new errorHandler_1.AppError('Bank account is already verified', 400);
            }
            const updatedBank = await database_1.default.bankAccount.update({
                where: { id },
                data: { isVerified: true },
            });
            logger_1.default.info(`Bank account ${id} verified for user ${userId}`);
            res.status(200).json({
                success: true,
                message: 'Bank account verified successfully',
                data: { id: updatedBank.id, isVerified: updatedBank.isVerified },
            });
        }
        catch (error) {
            logger_1.default.error('Error in verifyBankAccount:', error);
            next(error);
        }
    }
    async getBankTransactions(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const bank = await database_1.default.bankAccount.findFirst({
                where: { id, userId },
            });
            if (!bank) {
                throw new errorHandler_1.AppError('Bank account not found', 404);
            }
            const transactions = await database_1.default.transaction.findMany({
                where: {
                    OR: [
                        { bankId: id },
                        { AND: [{ senderId: userId }, { paymentMethod: 'bank' }] },
                    ],
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    sender: { select: { name: true, phone: true } },
                    receiver: { select: { name: true, phone: true } },
                },
            });
            const total = await database_1.default.transaction.count({
                where: {
                    OR: [
                        { bankId: id },
                        { AND: [{ senderId: userId }, { paymentMethod: 'bank' }] },
                    ],
                },
            });
            const formattedTransactions = transactions.map((t) => ({
                ...t,
                amount: Number(t.amount),
            }));
            res.status(200).json({
                success: true,
                data: {
                    transactions: formattedTransactions,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit),
                        hasNext: page < Math.ceil(total / limit),
                        hasPrev: page > 1,
                    },
                    bankInfo: {
                        id: bank.id,
                        name: bank.bankName,
                        accountNumber: (0, helpers_1.maskAccountNumber)(bank.accountNumber),
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error in getBankTransactions:', error);
            next(error);
        }
    }
    async setDefaultBank(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const bank = await database_1.default.bankAccount.findFirst({
                where: { id, userId },
            });
            if (!bank) {
                throw new errorHandler_1.AppError('Bank account not found', 404);
            }
            if (bank.isDefault) {
                throw new errorHandler_1.AppError('Bank account is already default', 400);
            }
            await database_1.default.bankAccount.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
            const updatedBank = await database_1.default.bankAccount.update({
                where: { id },
                data: { isDefault: true },
            });
            logger_1.default.info(`Bank account ${id} set as default for user ${userId}`);
            res.status(200).json({
                success: true,
                message: 'Default bank updated successfully',
                data: { id: updatedBank.id, isDefault: updatedBank.isDefault },
            });
        }
        catch (error) {
            logger_1.default.error('Error in setDefaultBank:', error);
            next(error);
        }
    }
}
exports.default = new BankController();
//# sourceMappingURL=bankController.js.map