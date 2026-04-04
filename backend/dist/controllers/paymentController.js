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
class PaymentController {
    static async requireValidPin(senderId, pin) {
        const user = await database_1.default.user.findUnique({
            where: { id: senderId },
            select: { pin: true },
        });
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        if (!user.pin)
            throw new errorHandler_1.AppError('Please set your PIN to activate payments', 403);
        const ok = await authService_1.default.verifyPin(pin, user.pin);
        if (!ok)
            throw new errorHandler_1.AppError('Invalid PIN', 401);
    }
    async sendToMobile(req, res, next) {
        try {
            const { toMobile, amount, note, paymentMethod = 'wallet', bankId, pin } = req.body;
            const senderId = req.user?.userId;
            logger_1.default.info('📱 Send money request:', {
                toMobile, amount, paymentMethod, bankId: bankId || 'none', senderId,
            });
            if (!senderId)
                throw new errorHandler_1.AppError('User not authenticated', 401);
            if (!toMobile || !amount || amount <= 0)
                throw new errorHandler_1.AppError('Valid recipient and amount are required', 400);
            if (!pin)
                throw new errorHandler_1.AppError('PIN is required', 400);
            await PaymentController.requireValidPin(senderId, String(pin));
            const sender = await database_1.default.user.findUnique({
                where: { id: senderId },
                select: { id: true, phone: true, role: true }
            });
            if (!sender)
                throw new errorHandler_1.AppError('Sender not found', 404);
            let recipient = await database_1.default.user.findUnique({
                where: { phone: toMobile },
                select: { id: true, phone: true, name: true }
            });
            if (!recipient) {
                recipient = await database_1.default.user.create({
                    data: {
                        phone: toMobile,
                        name: `User${toMobile.slice(-4)}`,
                        role: 'PRIMARY',
                        status: 'ACTIVE',
                        wallet: { create: { balance: 0.00 } },
                    },
                    select: { id: true, phone: true, name: true }
                });
                logger_1.default.info('✅ Created new recipient user:', recipient.phone);
            }
            const transactionResult = await database_1.default.$transaction(async (tx) => {
                if (sender.role === 'LINKED') {
                    await PaymentController.checkAndUpdateLimitsTx(tx, sender.id, amount);
                }
                let newBalance = null;
                let transactionRecord;
                if (paymentMethod === constants_1.PAYMENT_METHODS.WALLET) {
                    const senderWallet = await tx.wallet.findUnique({ where: { userId: sender.id } });
                    if (!senderWallet || Number(senderWallet.balance) < amount) {
                        throw new errorHandler_1.AppError(`Insufficient wallet balance. Available: ₹${senderWallet?.balance || 0}`, 400);
                    }
                    const updatedSenderWallet = await tx.wallet.update({
                        where: { userId: sender.id },
                        data: { balance: { decrement: amount } },
                    });
                    newBalance = updatedSenderWallet.balance;
                    await tx.wallet.upsert({
                        where: { userId: recipient.id },
                        update: { balance: { increment: amount } },
                        create: { userId: recipient.id, balance: amount },
                    });
                    transactionRecord = await tx.transaction.create({
                        data: {
                            transactionId: (0, helpers_1.generateTxnId)('TXN'),
                            amount,
                            type: constants_1.TRANSACTION_TYPES.SEND,
                            status: constants_1.TRANSACTION_STATUS.SUCCESS,
                            senderId: sender.id,
                            receiverId: recipient.id,
                            description: note || `Payment to ${toMobile}`,
                            paymentMethod: constants_1.PAYMENT_METHODS.WALLET,
                        },
                    });
                }
                else if (paymentMethod === constants_1.PAYMENT_METHODS.BANK) {
                    if (!bankId)
                        throw new errorHandler_1.AppError('Bank account is required for bank payment', 400);
                    const bank = await tx.bankAccount.findFirst({ where: { id: bankId, userId: sender.id } });
                    if (!bank || !bank.isVerified)
                        throw new errorHandler_1.AppError('Verified bank account required', 400);
                    if (Number(bank.balance) < amount)
                        throw new errorHandler_1.AppError(`Insufficient bank balance. Available: ₹${bank.balance}`, 400);
                    await tx.bankAccount.update({
                        where: { id: bankId },
                        data: { balance: { decrement: amount } },
                    });
                    await tx.wallet.upsert({
                        where: { userId: recipient.id },
                        update: { balance: { increment: amount } },
                        create: { userId: recipient.id, balance: amount },
                    });
                    transactionRecord = await tx.transaction.create({
                        data: {
                            transactionId: (0, helpers_1.generateTxnId)('TXN'),
                            amount,
                            type: constants_1.TRANSACTION_TYPES.SEND,
                            status: constants_1.TRANSACTION_STATUS.SUCCESS,
                            senderId: sender.id,
                            receiverId: recipient.id,
                            description: note || `Payment to ${toMobile} from bank`,
                            paymentMethod: constants_1.PAYMENT_METHODS.BANK,
                            bankId,
                            metadata: JSON.stringify({
                                bankName: bank.bankName,
                                accountNumber: `****${bank.accountNumber.slice(-4)}`,
                            }),
                        },
                    });
                }
                else {
                    throw new errorHandler_1.AppError('Invalid payment method', 400);
                }
                return { transaction: transactionRecord, newBalance };
            });
            await notificationService_1.default.create({
                userId: recipient.id,
                type: 'PAYMENT_RECEIVED',
                title: 'Money Received',
                message: `You received ₹${amount} from ${sender.phone}${note ? ` (${note})` : ''}`,
                data: { senderId, amount, senderPhone: sender.phone },
            });
            await notificationService_1.default.create({
                userId: senderId,
                type: 'PAYMENT_SENT',
                title: 'Payment Sent',
                message: `You sent ₹${amount} to ${toMobile}${note ? ` (${note})` : ''}`,
                data: { receiverId: recipient.id, amount, receiverPhone: toMobile },
            });
            res.status(200).json({
                success: true,
                message: 'Payment sent successfully',
                data: {
                    transactionId: transactionResult.transaction.transactionId,
                    amount,
                    to: toMobile,
                    toName: recipient.name,
                    newBalance: transactionResult.newBalance ? Number(transactionResult.newBalance) : null,
                },
            });
        }
        catch (error) {
            logger_1.default.error('❌ Payment error:', error);
            next(error);
        }
    }
    async sendToBank(req, res, next) {
        try {
            const { accountNumber, ifscCode, amount, note, paymentMethod = 'wallet', bankId, pin } = req.body;
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            if (!userId)
                throw new errorHandler_1.AppError('User not authenticated', 401);
            if (!accountNumber || !ifscCode || !amount || amount <= 0) {
                throw new errorHandler_1.AppError('Valid account details and amount are required', 400);
            }
            if (!pin)
                throw new errorHandler_1.AppError('PIN is required', 400);
            await PaymentController.requireValidPin(userId, String(pin));
            const result = await database_1.default.$transaction(async (tx) => {
                if (userRole === 'LINKED') {
                    await PaymentController.checkAndUpdateLimitsTx(tx, userId, amount);
                }
                let newBalance = null;
                let paymentSource = '';
                if (paymentMethod === constants_1.PAYMENT_METHODS.WALLET) {
                    const wallet = await tx.wallet.findUnique({ where: { userId } });
                    if (!wallet || Number(wallet.balance) < amount) {
                        throw new errorHandler_1.AppError(`Insufficient wallet balance. Available: ₹${wallet?.balance || 0}`, 400);
                    }
                    paymentSource = 'wallet';
                    const updatedWallet = await tx.wallet.update({
                        where: { userId },
                        data: { balance: { decrement: amount } },
                    });
                    newBalance = updatedWallet.balance;
                }
                else if (paymentMethod === constants_1.PAYMENT_METHODS.BANK) {
                    if (!bankId)
                        throw new errorHandler_1.AppError('Bank account is required for bank payment', 400);
                    const bank = await tx.bankAccount.findFirst({ where: { id: bankId, userId } });
                    if (!bank || !bank.isVerified)
                        throw new errorHandler_1.AppError('Verified bank account required', 400);
                    if (Number(bank.balance) < amount)
                        throw new errorHandler_1.AppError(`Insufficient balance in ${bank.bankName}`, 400);
                    paymentSource = `bank:${bank.bankName}`;
                    await tx.bankAccount.update({
                        where: { id: bankId },
                        data: { balance: { decrement: amount } },
                    });
                }
                else {
                    throw new errorHandler_1.AppError('Invalid payment method', 400);
                }
                const transaction = await tx.transaction.create({
                    data: {
                        transactionId: (0, helpers_1.generateTxnId)('TXN'),
                        amount,
                        type: constants_1.TRANSACTION_TYPES.SEND,
                        status: constants_1.TRANSACTION_STATUS.SUCCESS,
                        senderId: userId,
                        description: note || `Bank transfer to ${accountNumber.slice(-4)}`,
                        paymentMethod,
                        metadata: JSON.stringify({
                            accountNumber: accountNumber.slice(-4),
                            ifscCode,
                            source: paymentSource,
                        }),
                    },
                });
                return { transaction, newBalance };
            });
            await notificationService_1.default.create({
                userId,
                type: 'BANK_TRANSFER',
                title: 'Bank Transfer',
                message: `₹${amount} transferred to account ${accountNumber.slice(-4)}`,
                data: { amount, accountNumber: accountNumber.slice(-4) },
            });
            res.status(200).json({
                success: true,
                message: 'Bank transfer initiated successfully',
                data: {
                    transactionId: result.transaction.transactionId,
                    amount,
                    accountNumber: `xxxx${accountNumber.slice(-4)}`,
                    newBalance: result.newBalance ? Number(result.newBalance) : null,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async processQRPayment(req, res, next) {
        try {
            const { qrData, amount, paymentMethod = constants_1.PAYMENT_METHODS.WALLET, bankId, pin } = req.body;
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            if (!userId)
                throw new errorHandler_1.AppError('User not authenticated', 401);
            if (!qrData || !amount || amount <= 0)
                throw new errorHandler_1.AppError('Valid QR data and amount are required', 400);
            if (!pin)
                throw new errorHandler_1.AppError('PIN is required', 400);
            await PaymentController.requireValidPin(userId, String(pin));
            let recipientUPI;
            let merchantName;
            try {
                const qrInfo = JSON.parse(qrData);
                recipientUPI = qrInfo.upiId || qrInfo.vpa;
                merchantName = qrInfo.name || 'Merchant';
            }
            catch {
                recipientUPI = qrData;
                merchantName = 'Merchant';
            }
            const result = await database_1.default.$transaction(async (tx) => {
                if (userRole === 'LINKED') {
                    await PaymentController.checkAndUpdateLimitsTx(tx, userId, amount);
                }
                let newBalance = null;
                if (paymentMethod === constants_1.PAYMENT_METHODS.WALLET) {
                    const wallet = await tx.wallet.findUnique({ where: { userId } });
                    if (!wallet || Number(wallet.balance) < amount)
                        throw new errorHandler_1.AppError('Insufficient wallet balance', 400);
                    const updatedWallet = await tx.wallet.update({
                        where: { userId },
                        data: { balance: { decrement: amount } },
                    });
                    newBalance = updatedWallet.balance;
                }
                else if (paymentMethod === constants_1.PAYMENT_METHODS.BANK) {
                    if (!bankId)
                        throw new errorHandler_1.AppError('Bank account is required', 400);
                    const bank = await tx.bankAccount.findFirst({ where: { id: bankId, userId } });
                    if (!bank || Number(bank.balance) < amount)
                        throw new errorHandler_1.AppError('Insufficient bank balance', 400);
                    await tx.bankAccount.update({
                        where: { id: bankId },
                        data: { balance: { decrement: amount } },
                    });
                }
                else {
                    throw new errorHandler_1.AppError('Invalid payment method', 400);
                }
                const transaction = await tx.transaction.create({
                    data: {
                        transactionId: (0, helpers_1.generateTxnId)('TXN'),
                        amount,
                        type: constants_1.TRANSACTION_TYPES.PAYMENT,
                        status: constants_1.TRANSACTION_STATUS.SUCCESS,
                        senderId: userId,
                        description: `Payment to ${merchantName}`,
                        paymentMethod: constants_1.PAYMENT_METHODS.QR,
                        metadata: JSON.stringify({
                            upiId: recipientUPI,
                            merchantName,
                            qrData: qrData.substring(0, 100),
                            sourcePaymentMethod: paymentMethod,
                        }),
                    },
                });
                return { transaction, newBalance };
            });
            await notificationService_1.default.create({
                userId,
                type: 'QR_PAYMENT',
                title: 'QR Payment',
                message: `₹${amount} paid to ${merchantName}`,
                data: { amount, merchant: merchantName },
            });
            res.status(200).json({
                success: true,
                message: 'Payment successful',
                data: {
                    transactionId: result.transaction.transactionId,
                    amount,
                    merchant: merchantName,
                    newBalance: result.newBalance ? Number(result.newBalance) : null,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getTransactionById(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            if (!userId)
                throw new errorHandler_1.AppError('User not authenticated', 401);
            const transaction = await database_1.default.transaction.findUnique({
                where: { transactionId: id },
                include: {
                    sender: { select: { name: true, phone: true } },
                    receiver: { select: { name: true, phone: true } },
                },
            });
            if (!transaction)
                throw new errorHandler_1.AppError('Transaction not found', 404);
            if (transaction.senderId !== userId && transaction.receiverId !== userId) {
                throw new errorHandler_1.AppError('Access denied', 403);
            }
            res.status(200).json({
                success: true,
                data: {
                    ...transaction,
                    amount: Number(transaction.amount),
                    metadata: transaction.metadata ? JSON.parse(transaction.metadata) : null,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async requestMoney(req, res, next) {
        try {
            const { fromPhone, amount, note } = req.body;
            const userId = req.user?.userId;
            const userPhone = req.user?.phone;
            if (!userId || !userPhone)
                throw new errorHandler_1.AppError('User not authenticated', 401);
            if (!fromPhone || !amount || amount <= 0)
                throw new errorHandler_1.AppError('Valid requester and amount required', 400);
            const requester = await database_1.default.user.findUnique({ where: { phone: fromPhone } });
            if (!requester)
                throw new errorHandler_1.AppError('User not found', 404);
            await notificationService_1.default.create({
                userId: requester.id,
                type: 'PAYMENT_REQUEST',
                title: 'Money Request',
                message: `${userPhone} requested ₹${amount}${note ? `: ${note}` : ''}`,
                data: { fromUserId: userId, fromPhone: userPhone, amount, note },
            });
            res.status(200).json({ success: true, message: 'Money request sent successfully' });
        }
        catch (error) {
            next(error);
        }
    }
    static async checkAndUpdateLimitsTx(tx, linkedUserId, amount) {
        const member = await tx.familyMember.findUnique({
            where: { linkedId: linkedUserId },
        });
        if (!member)
            throw new errorHandler_1.AppError('Family member not found', 404);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const isNewDay = member.lastResetDate < today;
        const isNewMonth = member.lastResetDate < firstDayOfMonth;
        const currentDailySpent = isNewDay ? 0 : Number(member.dailySpent);
        const currentMonthlySpent = isNewMonth ? 0 : Number(member.monthlySpent);
        if (currentDailySpent + amount > Number(member.dailyLimit)) {
            throw new errorHandler_1.AppError(`Daily limit of ₹${member.dailyLimit} exceeded. Used: ₹${currentDailySpent}`, 400);
        }
        if (currentMonthlySpent + amount > Number(member.monthlyLimit)) {
            throw new errorHandler_1.AppError(`Monthly limit of ₹${member.monthlyLimit} exceeded. Used: ₹${currentMonthlySpent}`, 400);
        }
        if (amount > Number(member.perTransactionLimit)) {
            throw new errorHandler_1.AppError(`Per transaction limit is ₹${member.perTransactionLimit}`, 400);
        }
        await tx.familyMember.update({
            where: { id: member.id },
            data: {
                dailySpent: isNewDay ? amount : { increment: amount },
                monthlySpent: isNewMonth ? amount : { increment: amount },
                lastResetDate: today,
            },
        });
    }
}
exports.default = new PaymentController();
//# sourceMappingURL=paymentController.js.map