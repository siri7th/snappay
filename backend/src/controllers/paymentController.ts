// controllers/paymentController.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import notificationService from '../services/notificationService';
import { TRANSACTION_TYPES, TRANSACTION_STATUS, PAYMENT_METHODS } from '../utils/constants';
import { generateTxnId } from '../utils/helpers';
import authService from '../services/authService';

class PaymentController {
  private static async requireValidPin(senderId: string, pin: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: senderId },
      select: { pin: true },
    });
    if (!user) throw new AppError('User not found', 404);
    if (!user.pin) throw new AppError('Please set your PIN to activate payments', 403);
    const ok = await authService.verifyPin(pin, user.pin);
    if (!ok) throw new AppError('Invalid PIN', 401);
  }

  /**
   * Send money to mobile number (wallet or bank)
   * POST /api/payments/send/mobile
   */
  async sendToMobile(req: Request, res: Response, next: NextFunction) {
    try {
      const { toMobile, amount, note, paymentMethod = 'wallet', bankId, pin } = req.body;
      const senderId = req.user?.userId;

      logger.info('📱 Send money request:', {
        toMobile, amount, paymentMethod, bankId: bankId || 'none', senderId,
      });

      if (!senderId) throw new AppError('User not authenticated', 401);
      if (!toMobile || !amount || amount <= 0) throw new AppError('Valid recipient and amount are required', 400);
      if (!pin) throw new AppError('PIN is required', 400);

      await PaymentController.requireValidPin(senderId, String(pin));

      // Get sender details (without locking yet, just for checks)
      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { id: true, phone: true, role: true }
      });

      if (!sender) throw new AppError('Sender not found', 404);

      // Find or create recipient
      let recipient = await prisma.user.findUnique({
        where: { phone: toMobile },
        select: { id: true, phone: true, name: true }
      });

      if (!recipient) {
        recipient = await prisma.user.create({
          data: {
            phone: toMobile,
            name: `User${toMobile.slice(-4)}`,
            role: 'PRIMARY',
            status: 'ACTIVE',
            wallet: { create: { balance: 0.00 } },
          },
          select: { id: true, phone: true, name: true }
        });
        logger.info('✅ Created new recipient user:', recipient.phone);
      }

      // Execute EVERYTHING inside a single, safe transaction
      const transactionResult = await prisma.$transaction(async (tx) => {
        
        // 1. Check and Update Limits if sender is LINKED
        if (sender.role === 'LINKED') {
          await PaymentController.checkAndUpdateLimitsTx(tx, sender.id, amount);
        }

        let newBalance = null;
        let transactionRecord;

        // 2. Process Wallet Payment
        if (paymentMethod === PAYMENT_METHODS.WALLET) {
          const senderWallet = await tx.wallet.findUnique({ where: { userId: sender.id } });
          
          if (!senderWallet || Number(senderWallet.balance) < amount) {
            throw new AppError(`Insufficient wallet balance. Available: ₹${senderWallet?.balance || 0}`, 400);
          }

          const updatedSenderWallet = await tx.wallet.update({
            where: { userId: sender.id },
            data: { balance: { decrement: amount } },
          });
          newBalance = updatedSenderWallet.balance;

          // Upsert recipient wallet safely
          await tx.wallet.upsert({
            where: { userId: recipient.id },
            update: { balance: { increment: amount } },
            create: { userId: recipient.id, balance: amount },
          });

          transactionRecord = await tx.transaction.create({
            data: {
              transactionId: generateTxnId('TXN'),
              amount,
              type: TRANSACTION_TYPES.SEND,
              status: TRANSACTION_STATUS.SUCCESS,
              senderId: sender.id,
              receiverId: recipient.id,
              description: note || `Payment to ${toMobile}`,
              paymentMethod: PAYMENT_METHODS.WALLET,
            },
          });
        } 
        // 3. Process Bank Payment
        else if (paymentMethod === PAYMENT_METHODS.BANK) {
          if (!bankId) throw new AppError('Bank account is required for bank payment', 400);
          
          const bank = await tx.bankAccount.findFirst({ where: { id: bankId, userId: sender.id } });
          
          if (!bank || !bank.isVerified) throw new AppError('Verified bank account required', 400);
          if (Number(bank.balance) < amount) throw new AppError(`Insufficient bank balance. Available: ₹${bank.balance}`, 400);

          await tx.bankAccount.update({
            where: { id: bankId },
            data: { balance: { decrement: amount } },
          });

          // Add to recipient wallet
          await tx.wallet.upsert({
            where: { userId: recipient.id },
            update: { balance: { increment: amount } },
            create: { userId: recipient.id, balance: amount },
          });

          transactionRecord = await tx.transaction.create({
            data: {
              transactionId: generateTxnId('TXN'),
              amount,
              type: TRANSACTION_TYPES.SEND,
              status: TRANSACTION_STATUS.SUCCESS,
              senderId: sender.id,
              receiverId: recipient.id,
              description: note || `Payment to ${toMobile} from bank`,
              paymentMethod: PAYMENT_METHODS.BANK,
              bankId,
              metadata: JSON.stringify({
                bankName: bank.bankName,
                accountNumber: `****${bank.accountNumber.slice(-4)}`,
              }),
            },
          });
        } else {
          throw new AppError('Invalid payment method', 400);
        }

        return { transaction: transactionRecord, newBalance };
      });

      // Send notifications (Outside transaction so it doesn't slow down the DB lock)
      await notificationService.create({
        userId: recipient.id,
        type: 'PAYMENT_RECEIVED',
        title: 'Money Received',
        message: `You received ₹${amount} from ${sender.phone}${note ? ` (${note})` : ''}`,
        data: { senderId, amount, senderPhone: sender.phone },
      });

      await notificationService.create({
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
    } catch (error) {
      logger.error('❌ Payment error:', error);
      next(error);
    }
  }

  /**
   * Send money to bank account
   * POST /api/payments/send/bank
   */
  async sendToBank(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountNumber, ifscCode, amount, note, paymentMethod = 'wallet', bankId, pin } = req.body;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId) throw new AppError('User not authenticated', 401);
      if (!accountNumber || !ifscCode || !amount || amount <= 0) {
        throw new AppError('Valid account details and amount are required', 400);
      }
      if (!pin) throw new AppError('PIN is required', 400);

      await PaymentController.requireValidPin(userId, String(pin));

      const result = await prisma.$transaction(async (tx) => {
        
        // 1. Check Limits for Linked User
        if (userRole === 'LINKED') {
          await PaymentController.checkAndUpdateLimitsTx(tx, userId, amount);
        }

        let newBalance = null;
        let paymentSource = '';

        // 2. Process Wallet Deduction
        if (paymentMethod === PAYMENT_METHODS.WALLET) {
          const wallet = await tx.wallet.findUnique({ where: { userId } });
          if (!wallet || Number(wallet.balance) < amount) {
            throw new AppError(`Insufficient wallet balance. Available: ₹${wallet?.balance || 0}`, 400);
          }
          
          paymentSource = 'wallet';
          const updatedWallet = await tx.wallet.update({
            where: { userId },
            data: { balance: { decrement: amount } },
          });
          newBalance = updatedWallet.balance;
        } 
        // 3. Process Bank Deduction
        else if (paymentMethod === PAYMENT_METHODS.BANK) {
          if (!bankId) throw new AppError('Bank account is required for bank payment', 400);
          
          const bank = await tx.bankAccount.findFirst({ where: { id: bankId, userId } });
          if (!bank || !bank.isVerified) throw new AppError('Verified bank account required', 400);
          if (Number(bank.balance) < amount) throw new AppError(`Insufficient balance in ${bank.bankName}`, 400);
          
          paymentSource = `bank:${bank.bankName}`;
          await tx.bankAccount.update({
            where: { id: bankId },
            data: { balance: { decrement: amount } },
          });
        } else {
          throw new AppError('Invalid payment method', 400);
        }

        const transaction = await tx.transaction.create({
          data: {
            transactionId: generateTxnId('TXN'),
            amount,
            type: TRANSACTION_TYPES.SEND,
            status: TRANSACTION_STATUS.SUCCESS,
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

      await notificationService.create({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process QR payment
   * POST /api/payments/qr
   */
  async processQRPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { qrData, amount, paymentMethod = PAYMENT_METHODS.WALLET, bankId, pin } = req.body;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId) throw new AppError('User not authenticated', 401);
      if (!qrData || !amount || amount <= 0) throw new AppError('Valid QR data and amount are required', 400);
      if (!pin) throw new AppError('PIN is required', 400);

      await PaymentController.requireValidPin(userId, String(pin));

      let recipientUPI: string;
      let merchantName: string;

      try {
        const qrInfo = JSON.parse(qrData);
        recipientUPI = qrInfo.upiId || qrInfo.vpa;
        merchantName = qrInfo.name || 'Merchant';
      } catch {
        recipientUPI = qrData;
        merchantName = 'Merchant';
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Limit check for Linked users
        if (userRole === 'LINKED') {
          await PaymentController.checkAndUpdateLimitsTx(tx, userId, amount);
        }

        let newBalance = null;

        // 2. Process Wallet Deduction
        if (paymentMethod === PAYMENT_METHODS.WALLET) {
          const wallet = await tx.wallet.findUnique({ where: { userId } });
          if (!wallet || Number(wallet.balance) < amount) throw new AppError('Insufficient wallet balance', 400);
          
          const updatedWallet = await tx.wallet.update({
            where: { userId },
            data: { balance: { decrement: amount } },
          });
          newBalance = updatedWallet.balance;
        } 
        // 3. Process Bank Deduction
        else if (paymentMethod === PAYMENT_METHODS.BANK) {
          if (!bankId) throw new AppError('Bank account is required', 400);
          const bank = await tx.bankAccount.findFirst({ where: { id: bankId, userId } });
          if (!bank || Number(bank.balance) < amount) throw new AppError('Insufficient bank balance', 400);
          
          await tx.bankAccount.update({
            where: { id: bankId },
            data: { balance: { decrement: amount } },
          });
        } else {
          throw new AppError('Invalid payment method', 400);
        }

        const transaction = await tx.transaction.create({
          data: {
            transactionId: generateTxnId('TXN'),
            amount,
            type: TRANSACTION_TYPES.PAYMENT,
            status: TRANSACTION_STATUS.SUCCESS,
            senderId: userId,
            description: `Payment to ${merchantName}`,
            paymentMethod: PAYMENT_METHODS.QR,
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

      await notificationService.create({
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) throw new AppError('User not authenticated', 401);

      const transaction = await prisma.transaction.findUnique({
        where: { transactionId: id },
        include: {
          sender: { select: { name: true, phone: true } },
          receiver: { select: { name: true, phone: true } },
        },
      });

      if (!transaction) throw new AppError('Transaction not found', 404);
      if (transaction.senderId !== userId && transaction.receiverId !== userId) {
        throw new AppError('Access denied', 403);
      }

      res.status(200).json({
        success: true,
        data: {
          ...transaction,
          amount: Number(transaction.amount),
          metadata: transaction.metadata ? JSON.parse(transaction.metadata) : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request money from someone
   */
  async requestMoney(req: Request, res: Response, next: NextFunction) {
    try {
      const { fromPhone, amount, note } = req.body;
      const userId = req.user?.userId;
      const userPhone = req.user?.phone;

      if (!userId || !userPhone) throw new AppError('User not authenticated', 401);
      if (!fromPhone || !amount || amount <= 0) throw new AppError('Valid requester and amount required', 400);

      const requester = await prisma.user.findUnique({ where: { phone: fromPhone } });
      if (!requester) throw new AppError('User not found', 404);

      await notificationService.create({
        userId: requester.id,
        type: 'PAYMENT_REQUEST',
        title: 'Money Request',
        message: `${userPhone} requested ₹${amount}${note ? `: ${note}` : ''}`,
        data: { fromUserId: userId, fromPhone: userPhone, amount, note },
      });

      res.status(200).json({ success: true, message: 'Money request sent successfully' });
    } catch (error) {
      next(error);
    }
  }

  // ========== STATIC HELPERS ==========

  /**
   * Check and update limits for a linked user (Executed INSIDE a transaction)
   * This is made static so it doesn't rely on 'this' context issues inside Prisma callbacks.
   */
  public static async checkAndUpdateLimitsTx(tx: any, linkedUserId: string, amount: number): Promise<void> {
    const member = await tx.familyMember.findUnique({
      where: { linkedId: linkedUserId },
    });

    if (!member) throw new AppError('Family member not found', 404);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const isNewDay = member.lastResetDate < today;
    const isNewMonth = member.lastResetDate < firstDayOfMonth;

    // Use current DB values or 0 if a reset is required
    const currentDailySpent = isNewDay ? 0 : Number(member.dailySpent);
    const currentMonthlySpent = isNewMonth ? 0 : Number(member.monthlySpent);

    // Hard Limit Checks
    if (currentDailySpent + amount > Number(member.dailyLimit)) {
      throw new AppError(`Daily limit of ₹${member.dailyLimit} exceeded. Used: ₹${currentDailySpent}`, 400);
    }
    if (currentMonthlySpent + amount > Number(member.monthlyLimit)) {
      throw new AppError(`Monthly limit of ₹${member.monthlyLimit} exceeded. Used: ₹${currentMonthlySpent}`, 400);
    }
    if (amount > Number(member.perTransactionLimit)) {
      throw new AppError(`Per transaction limit is ₹${member.perTransactionLimit}`, 400);
    }

    // Atomic Updates
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

export default new PaymentController();