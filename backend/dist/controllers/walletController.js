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
class WalletController {
    async getBalance(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            logger_1.default.debug(`💰 Fetching wallet balance for user: ${userId}`);
            let wallet = await database_1.default.wallet.findUnique({
                where: { userId },
            });
            if (!wallet) {
                wallet = await database_1.default.wallet.create({
                    data: { userId, balance: 0 },
                });
                logger_1.default.info(`✅ Created new wallet for user: ${userId}`);
            }
            res.status(200).json({
                success: true,
                data: {
                    balance: Number(wallet.balance),
                    currency: 'INR',
                },
            });
        }
        catch (error) {
            logger_1.default.error('❌ Error in getBalance:', error);
            next(error);
        }
    }
    async getMemberWalletBalance(req, res, next) {
        try {
            const { memberId } = req.params;
            const primaryId = req.user?.userId;
            if (!primaryId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            logger_1.default.debug(`💰 Fetching member wallet balance for member: ${memberId}`);
            const familyMember = await database_1.default.familyMember.findFirst({
                where: { id: memberId, primaryId },
                include: { linked: { select: { id: true, name: true, phone: true } } },
            });
            if (!familyMember) {
                throw new errorHandler_1.AppError('Family member not found', 404);
            }
            const wallet = await database_1.default.wallet.findUnique({
                where: { userId: familyMember.linkedId },
            });
            res.status(200).json({
                success: true,
                data: {
                    memberId,
                    memberName: familyMember.linked.name,
                    memberPhone: familyMember.linked.phone,
                    balance: wallet ? Number(wallet.balance) : 0,
                },
            });
        }
        catch (error) {
            logger_1.default.error('❌ Error in getMemberWalletBalance:', error);
            next(error);
        }
    }
    async getAllMemberBalances(req, res, next) {
        try {
            const { memberIds } = req.body;
            const primaryId = req.user?.userId;
            if (!primaryId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
                throw new errorHandler_1.AppError('Member IDs array is required', 400);
            }
            logger_1.default.debug(`💰 Fetching balances for members: ${memberIds}`);
            const familyMembers = await database_1.default.familyMember.findMany({
                where: { id: { in: memberIds }, primaryId },
                include: { linked: { select: { id: true, name: true, phone: true } } },
            });
            const linkedUserIds = familyMembers.map((fm) => fm.linkedId);
            const wallets = await database_1.default.wallet.findMany({
                where: { userId: { in: linkedUserIds } },
            });
            const walletMap = new Map(wallets.map((w) => [w.userId, Number(w.balance)]));
            const balances = {};
            familyMembers.forEach((member) => {
                balances[member.id] = {
                    memberId: member.id,
                    linkedId: member.linkedId,
                    memberName: member.linked.name,
                    memberPhone: member.linked.phone,
                    balance: walletMap.get(member.linkedId) || 0,
                };
            });
            logger_1.default.debug(`✅ Member balances fetched: ${Object.keys(balances).length}`);
            res.status(200).json({
                success: true,
                data: balances,
            });
        }
        catch (error) {
            logger_1.default.error('❌ Error in getAllMemberBalances:', error);
            next(error);
        }
    }
    async addMoney(req, res, next) {
        try {
            const { amount, bankId } = req.body;
            const userId = req.user?.userId;
            logger_1.default.info('💰 Add money request:', { amount, bankId, userId });
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            if (!amount || amount <= 0) {
                throw new errorHandler_1.AppError('Valid amount is required', 400);
            }
            if (!bankId) {
                throw new errorHandler_1.AppError('Bank account is required', 400);
            }
            const result = await database_1.default.$transaction(async (tx) => {
                const bank = await tx.bankAccount.findFirst({
                    where: { id: bankId, userId },
                });
                if (!bank) {
                    throw new errorHandler_1.AppError('Bank account not found', 404);
                }
                if (!bank.isVerified) {
                    throw new errorHandler_1.AppError('Bank account must be verified to add money', 400);
                }
                if (Number(bank.balance) < amount) {
                    throw new errorHandler_1.AppError(`Insufficient balance in ${bank.bankName}. Available: ₹${Number(bank.balance)}`, 400);
                }
                let wallet = await tx.wallet.findUnique({ where: { userId } });
                if (!wallet) {
                    wallet = await tx.wallet.create({ data: { userId, balance: 0 } });
                }
                const updatedBank = await tx.bankAccount.update({
                    where: { id: bankId },
                    data: { balance: { decrement: amount } },
                });
                const updatedWallet = await tx.wallet.update({
                    where: { userId },
                    data: { balance: { increment: amount } },
                });
                const transaction = await tx.transaction.create({
                    data: {
                        transactionId: (0, helpers_1.generateTxnId)('TXN'),
                        amount,
                        type: constants_1.TRANSACTION_TYPES.ADD_TO_WALLET,
                        status: constants_1.TRANSACTION_STATUS.SUCCESS,
                        senderId: userId,
                        bankId,
                        description: `Added ₹${amount} from ${bank.bankName}`,
                        paymentMethod: constants_1.PAYMENT_METHODS.BANK,
                        metadata: JSON.stringify({
                            bankName: bank.bankName,
                            accountNumber: `****${bank.accountNumber.slice(-4)}`,
                        }),
                    },
                });
                return { wallet: updatedWallet, transaction, bank: updatedBank };
            });
            await notificationService_1.default.create({
                userId,
                type: 'WALLET_CREDIT',
                title: 'Money Added to Wallet',
                message: `₹${amount} has been added to your wallet from ${result.bank.bankName}`,
                data: { amount, bankName: result.bank.bankName, newBalance: Number(result.wallet.balance) },
            });
            logger_1.default.info(`✅ Money added successfully. New balance: ${Number(result.wallet.balance)}`);
            res.status(200).json({
                success: true,
                message: 'Money added successfully',
                data: {
                    newBalance: Number(result.wallet.balance),
                    transactionId: result.transaction.transactionId,
                    amount: Number(amount),
                    bankName: result.bank.bankName,
                },
            });
        }
        catch (error) {
            logger_1.default.error('❌ Error in addMoney:', error);
            next(error);
        }
    }
    async withdrawMoney(req, res, next) {
        try {
            const { amount, bankId } = req.body;
            const userId = req.user?.userId;
            logger_1.default.info('💸 Withdraw money request:', { amount, bankId, userId });
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            if (!amount || amount <= 0) {
                throw new errorHandler_1.AppError('Valid amount is required', 400);
            }
            if (!bankId) {
                throw new errorHandler_1.AppError('Bank account is required', 400);
            }
            const result = await database_1.default.$transaction(async (tx) => {
                const wallet = await tx.wallet.findUnique({ where: { userId } });
                if (!wallet) {
                    throw new errorHandler_1.AppError('Wallet not found', 404);
                }
                if (Number(wallet.balance) < amount) {
                    throw new errorHandler_1.AppError(`Insufficient wallet balance. Available: ₹${Number(wallet.balance)}`, 400);
                }
                const bank = await tx.bankAccount.findFirst({
                    where: { id: bankId, userId },
                });
                if (!bank) {
                    throw new errorHandler_1.AppError('Bank account not found', 404);
                }
                if (!bank.isVerified) {
                    throw new errorHandler_1.AppError('Bank account must be verified to withdraw money', 400);
                }
                const updatedWallet = await tx.wallet.update({
                    where: { userId },
                    data: { balance: { decrement: amount } },
                });
                const updatedBank = await tx.bankAccount.update({
                    where: { id: bankId },
                    data: { balance: { increment: amount } },
                });
                const transaction = await tx.transaction.create({
                    data: {
                        transactionId: (0, helpers_1.generateTxnId)('TXN'),
                        amount,
                        type: constants_1.TRANSACTION_TYPES.WITHDRAW,
                        status: constants_1.TRANSACTION_STATUS.SUCCESS,
                        senderId: userId,
                        bankId,
                        description: `Withdrawn ₹${amount} to ${bank.bankName}`,
                        paymentMethod: constants_1.PAYMENT_METHODS.BANK,
                    },
                });
                return { wallet: updatedWallet, transaction, bank: updatedBank };
            });
            await notificationService_1.default.create({
                userId,
                type: 'WALLET_DEBIT',
                title: 'Money Withdrawn from Wallet',
                message: `₹${amount} has been withdrawn to your ${result.bank.bankName} account`,
                data: { amount, bankName: result.bank.bankName, newBalance: Number(result.wallet.balance) },
            });
            logger_1.default.info(`✅ Withdrawal completed. New balance: ${Number(result.wallet.balance)}`);
            res.status(200).json({
                success: true,
                message: 'Money withdrawn successfully',
                data: {
                    newBalance: Number(result.wallet.balance),
                    transactionId: result.transaction.transactionId,
                    amount: Number(amount),
                    bankName: result.bank.bankName,
                },
            });
        }
        catch (error) {
            logger_1.default.error('❌ Error in withdrawMoney:', error);
            next(error);
        }
    }
    async getTransactions(req, res, next) {
        try {
            const userId = req.user?.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const type = req.query.type;
            const fromDate = req.query.fromDate;
            const toDate = req.query.toDate;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            logger_1.default.debug(`📊 Fetching transactions for user: ${userId}`, { page, limit, type });
            const where = {
                OR: [{ senderId: userId }, { receiverId: userId }],
            };
            if (type && type !== 'all') {
                where.type = type;
            }
            if (fromDate || toDate) {
                where.createdAt = {};
                if (fromDate)
                    where.createdAt.gte = new Date(fromDate);
                if (toDate)
                    where.createdAt.lte = new Date(toDate);
            }
            const [transactions, total] = await Promise.all([
                database_1.default.transaction.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                    include: {
                        bank: { select: { bankName: true, accountNumber: true } },
                        sender: { select: { name: true, phone: true } },
                        receiver: { select: { name: true, phone: true } },
                    },
                }),
                database_1.default.transaction.count({ where }),
            ]);
            const totalIn = transactions
                .filter((t) => t.type === constants_1.TRANSACTION_TYPES.ADD_TO_WALLET)
                .reduce((sum, t) => sum + Number(t.amount), 0);
            const totalOut = transactions
                .filter((t) => [constants_1.TRANSACTION_TYPES.WITHDRAW, constants_1.TRANSACTION_TYPES.SEND].includes(t.type))
                .reduce((sum, t) => sum + Number(t.amount), 0);
            res.status(200).json({
                success: true,
                data: {
                    transactions: transactions.map((t) => ({
                        id: t.id,
                        transactionId: t.transactionId,
                        amount: Number(t.amount),
                        type: t.type,
                        status: t.status,
                        description: t.description,
                        paymentMethod: t.paymentMethod,
                        createdAt: t.createdAt,
                        bankName: t.bank?.bankName,
                        accountNumber: t.bank ? (0, helpers_1.maskAccountNumber)(t.bank.accountNumber) : undefined,
                        senderName: t.sender?.name,
                        receiverName: t.receiver?.name,
                    })),
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit),
                        hasNext: page < Math.ceil(total / limit),
                        hasPrev: page > 1,
                    },
                    summary: { totalIn, totalOut, netChange: totalIn - totalOut },
                },
            });
        }
        catch (error) {
            logger_1.default.error('❌ Error in getTransactions:', error);
            next(error);
        }
    }
    async getTransactionById(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            logger_1.default.debug('🔍 Fetching transaction:', id);
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            const transaction = await database_1.default.transaction.findFirst({
                where: { id, OR: [{ senderId: userId }, { receiverId: userId }] },
                include: {
                    bank: { select: { bankName: true, accountNumber: true } },
                    sender: { select: { name: true, phone: true } },
                    receiver: { select: { name: true, phone: true } },
                },
            });
            if (!transaction) {
                throw new errorHandler_1.AppError('Transaction not found', 404);
            }
            res.status(200).json({
                success: true,
                data: {
                    ...transaction,
                    amount: Number(transaction.amount),
                    bankName: transaction.bank?.bankName,
                    accountNumber: transaction.bank ? (0, helpers_1.maskAccountNumber)(transaction.bank.accountNumber) : undefined,
                },
            });
        }
        catch (error) {
            logger_1.default.error('❌ Error in getTransactionById:', error);
            next(error);
        }
    }
    async getWalletStats(req, res, next) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new errorHandler_1.AppError('User not authenticated', 401);
            }
            logger_1.default.debug('📈 Fetching wallet stats for user:', userId);
            const wallet = await database_1.default.wallet.findUnique({ where: { userId } });
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - 7);
            weekStart.setHours(0, 0, 0, 0);
            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);
            const [todayTotal, weekTotal, monthTotal, allTime] = await Promise.all([
                database_1.default.transaction.aggregate({
                    where: {
                        senderId: userId,
                        type: { in: [constants_1.TRANSACTION_TYPES.WITHDRAW, constants_1.TRANSACTION_TYPES.SEND, constants_1.TRANSACTION_TYPES.RECHARGE] },
                        createdAt: { gte: todayStart },
                    },
                    _sum: { amount: true },
                }),
                database_1.default.transaction.aggregate({
                    where: {
                        senderId: userId,
                        type: { in: [constants_1.TRANSACTION_TYPES.WITHDRAW, constants_1.TRANSACTION_TYPES.SEND, constants_1.TRANSACTION_TYPES.RECHARGE] },
                        createdAt: { gte: weekStart },
                    },
                    _sum: { amount: true },
                }),
                database_1.default.transaction.aggregate({
                    where: {
                        senderId: userId,
                        type: { in: [constants_1.TRANSACTION_TYPES.WITHDRAW, constants_1.TRANSACTION_TYPES.SEND, constants_1.TRANSACTION_TYPES.RECHARGE] },
                        createdAt: { gte: monthStart },
                    },
                    _sum: { amount: true },
                }),
                database_1.default.transaction.groupBy({
                    by: ['type'],
                    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
                    _sum: { amount: true },
                }),
            ]);
            let totalIn = 0;
            let totalOut = 0;
            allTime.forEach((item) => {
                if (item.type === constants_1.TRANSACTION_TYPES.ADD_TO_WALLET) {
                    totalIn += Number(item._sum?.amount || 0);
                }
                else if ([constants_1.TRANSACTION_TYPES.WITHDRAW, constants_1.TRANSACTION_TYPES.SEND, constants_1.TRANSACTION_TYPES.RECHARGE].includes(item.type)) {
                    totalOut += Number(item._sum?.amount || 0);
                }
            });
            res.status(200).json({
                success: true,
                data: {
                    balance: wallet ? Number(wallet.balance) : 0,
                    stats: {
                        today: Number(todayTotal._sum?.amount || 0),
                        week: Number(weekTotal._sum?.amount || 0),
                        month: Number(monthTotal._sum?.amount || 0),
                        totalIn,
                        totalOut,
                        transactionCount: allTime.length,
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('❌ Error in getWalletStats:', error);
            next(error);
        }
    }
}
exports.default = new WalletController();
//# sourceMappingURL=walletController.js.map