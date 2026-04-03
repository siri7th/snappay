// controllers/walletController.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import notificationService from '../services/notificationService';
import { TRANSACTION_TYPES, TRANSACTION_STATUS, PAYMENT_METHODS } from '../utils/constants';
import { generateTxnId, maskAccountNumber } from '../utils/helpers'; // 🔥 FIXED: Import maskAccountNumber

class WalletController {
  /**
   * Get wallet balance
   * GET /api/wallet/balance
   */
  async getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      logger.debug(`💰 Fetching wallet balance for user: ${userId}`);

      let wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        // Create wallet if it doesn't exist
        wallet = await prisma.wallet.create({
          data: { userId, balance: 0 },
        });
        logger.info(`✅ Created new wallet for user: ${userId}`);
      }

      res.status(200).json({
        success: true,
        data: {
          balance: Number(wallet.balance),
          currency: 'INR',
        },
      });
    } catch (error) {
      logger.error('❌ Error in getBalance:', error);
      next(error);
    }
  }

  /**
   * Get individual family member's wallet balance (for primary users)
   * GET /api/wallet/member/:memberId
   */
  async getMemberWalletBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { memberId } = req.params;
      const primaryId = req.user?.userId;

      if (!primaryId) {
        throw new AppError('User not authenticated', 401);
      }

      logger.debug(`💰 Fetching member wallet balance for member: ${memberId}`);

      // Verify the family member belongs to this primary user
      const familyMember = await prisma.familyMember.findFirst({
        where: { id: memberId, primaryId },
        include: { linked: { select: { id: true, name: true, phone: true } } },
      });

      if (!familyMember) {
        throw new AppError('Family member not found', 404);
      }

      const wallet = await prisma.wallet.findUnique({
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
    } catch (error) {
      logger.error('❌ Error in getMemberWalletBalance:', error);
      next(error);
    }
  }

  /**
   * Get multiple family members' wallet balances at once (for primary users)
   * POST /api/wallet/members/balances
   */
  async getAllMemberBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { memberIds } = req.body;
      const primaryId = req.user?.userId;

      if (!primaryId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
        throw new AppError('Member IDs array is required', 400);
      }

      logger.debug(`💰 Fetching balances for members: ${memberIds}`);

      // Get all family members that belong to this primary
      const familyMembers = await prisma.familyMember.findMany({
        where: { id: { in: memberIds }, primaryId },
        include: { linked: { select: { id: true, name: true, phone: true } } },
      });

      const linkedUserIds = familyMembers.map((fm) => fm.linkedId);

      // Get wallets for all linked users
      const wallets = await prisma.wallet.findMany({
        where: { userId: { in: linkedUserIds } },
      });

      const walletMap = new Map(wallets.map((w) => [w.userId, Number(w.balance)]));

      const balances: Record<string, any> = {};
      familyMembers.forEach((member) => {
        balances[member.id] = {
          memberId: member.id,
          linkedId: member.linkedId,
          memberName: member.linked.name,
          memberPhone: member.linked.phone,
          balance: walletMap.get(member.linkedId) || 0,
        };
      });

      logger.debug(`✅ Member balances fetched: ${Object.keys(balances).length}`);

      res.status(200).json({
        success: true,
        data: balances,
      });
    } catch (error) {
      logger.error('❌ Error in getAllMemberBalances:', error);
      next(error);
    }
  }

  /**
   * Add money to wallet from bank
   * POST /api/wallet/add
   */
  async addMoney(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount, bankId } = req.body;
      const userId = req.user?.userId;

      logger.info('💰 Add money request:', { amount, bankId, userId });

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!amount || amount <= 0) {
        throw new AppError('Valid amount is required', 400);
      }

      if (!bankId) {
        throw new AppError('Bank account is required', 400);
      }

      // Start transaction to prevent race conditions
      const result = await prisma.$transaction(async (tx) => {
        
        // 1. Check Bank INSIDE the transaction
        const bank = await tx.bankAccount.findFirst({
          where: { id: bankId, userId },
        });

        if (!bank) {
          throw new AppError('Bank account not found', 404);
        }

        if (!bank.isVerified) {
          throw new AppError('Bank account must be verified to add money', 400);
        }

        if (Number(bank.balance) < amount) {
          throw new AppError(
            `Insufficient balance in ${bank.bankName}. Available: ₹${Number(bank.balance)}`,
            400
          );
        }

        // 2. Ensure wallet exists INSIDE the transaction
        let wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet) {
          wallet = await tx.wallet.create({ data: { userId, balance: 0 } });
        }

        // 3. Deduct from bank
        const updatedBank = await tx.bankAccount.update({
          where: { id: bankId },
          data: { balance: { decrement: amount } },
        });

        // 4. Add to wallet
        const updatedWallet = await tx.wallet.update({
          where: { userId },
          data: { balance: { increment: amount } },
        });

        // 5. Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            transactionId: generateTxnId('TXN'),
            amount,
            type: TRANSACTION_TYPES.ADD_TO_WALLET,
            status: TRANSACTION_STATUS.SUCCESS,
            senderId: userId,
            bankId,
            description: `Added ₹${amount} from ${bank.bankName}`,
            paymentMethod: PAYMENT_METHODS.BANK,
            metadata: JSON.stringify({
              bankName: bank.bankName,
              accountNumber: `****${bank.accountNumber.slice(-4)}`,
            }),
          },
        });

        return { wallet: updatedWallet, transaction, bank: updatedBank };
      });

      // Send notification (Using details returned from the transaction)
      await notificationService.create({
        userId,
        type: 'WALLET_CREDIT',
        title: 'Money Added to Wallet',
        message: `₹${amount} has been added to your wallet from ${result.bank.bankName}`,
        data: { amount, bankName: result.bank.bankName, newBalance: Number(result.wallet.balance) },
      });

      logger.info(`✅ Money added successfully. New balance: ${Number(result.wallet.balance)}`);

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
    } catch (error) {
      logger.error('❌ Error in addMoney:', error);
      next(error);
    }
  }

  /**
   * Withdraw money from wallet to bank
   * POST /api/wallet/withdraw
   */
  async withdrawMoney(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount, bankId } = req.body;
      const userId = req.user?.userId;

      logger.info('💸 Withdraw money request:', { amount, bankId, userId });

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!amount || amount <= 0) {
        throw new AppError('Valid amount is required', 400);
      }

      if (!bankId) {
        throw new AppError('Bank account is required', 400);
      }

      // Start transaction to prevent race conditions
      const result = await prisma.$transaction(async (tx) => {
        
        // 1. Check wallet INSIDE transaction
        const wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet) {
          throw new AppError('Wallet not found', 404);
        }

        if (Number(wallet.balance) < amount) {
          throw new AppError(`Insufficient wallet balance. Available: ₹${Number(wallet.balance)}`, 400);
        }

        // 2. Check bank INSIDE transaction
        const bank = await tx.bankAccount.findFirst({
          where: { id: bankId, userId },
        });

        if (!bank) {
          throw new AppError('Bank account not found', 404);
        }

        if (!bank.isVerified) {
          throw new AppError('Bank account must be verified to withdraw money', 400);
        }

        // 3. Deduct from wallet
        const updatedWallet = await tx.wallet.update({
          where: { userId },
          data: { balance: { decrement: amount } },
        });

        // 4. Add to bank
        const updatedBank = await tx.bankAccount.update({
          where: { id: bankId },
          data: { balance: { increment: amount } },
        });

        // 5. Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            transactionId: generateTxnId('TXN'),
            amount,
            type: TRANSACTION_TYPES.WITHDRAW,
            status: TRANSACTION_STATUS.SUCCESS,
            senderId: userId,
            bankId,
            description: `Withdrawn ₹${amount} to ${bank.bankName}`,
            paymentMethod: PAYMENT_METHODS.BANK,
          },
        });

        return { wallet: updatedWallet, transaction, bank: updatedBank };
      });

      // Send notification
      await notificationService.create({
        userId,
        type: 'WALLET_DEBIT',
        title: 'Money Withdrawn from Wallet',
        message: `₹${amount} has been withdrawn to your ${result.bank.bankName} account`,
        data: { amount, bankName: result.bank.bankName, newBalance: Number(result.wallet.balance) },
      });

      logger.info(`✅ Withdrawal completed. New balance: ${Number(result.wallet.balance)}`);

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
    } catch (error) {
      logger.error('❌ Error in withdrawMoney:', error);
      next(error);
    }
  }

  /**
   * Get wallet transactions with pagination and filtering
   * GET /api/wallet/transactions
   */
  async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const type = req.query.type as string;
      const fromDate = req.query.fromDate as string;
      const toDate = req.query.toDate as string;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      logger.debug(`📊 Fetching transactions for user: ${userId}`, { page, limit, type });

      const where: any = {
        OR: [{ senderId: userId }, { receiverId: userId }],
      };

      if (type && type !== 'all') {
        where.type = type;
      }

      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = new Date(fromDate);
        if (toDate) where.createdAt.lte = new Date(toDate);
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
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
        prisma.transaction.count({ where }),
      ]);

      // Calculate summary stats
      const totalIn = transactions
        .filter((t) => t.type === TRANSACTION_TYPES.ADD_TO_WALLET)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalOut = transactions
        .filter((t) =>
          [TRANSACTION_TYPES.WITHDRAW, TRANSACTION_TYPES.SEND].includes(t.type as any)
        )
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
            accountNumber: t.bank ? maskAccountNumber(t.bank.accountNumber) : undefined, 
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
    } catch (error) {
      logger.error('❌ Error in getTransactions:', error);
      next(error);
    }
  }

  /**
   * Get single transaction by ID
   * GET /api/wallet/transactions/:id
   */
  async getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      logger.debug('🔍 Fetching transaction:', id);

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const transaction = await prisma.transaction.findFirst({
        where: { id, OR: [{ senderId: userId }, { receiverId: userId }] },
        include: {
          bank: { select: { bankName: true, accountNumber: true } },
          sender: { select: { name: true, phone: true } },
          receiver: { select: { name: true, phone: true } },
        },
      });

      if (!transaction) {
        throw new AppError('Transaction not found', 404);
      }

      res.status(200).json({
        success: true,
        data: {
          ...transaction,
          amount: Number(transaction.amount),
          bankName: transaction.bank?.bankName,
          accountNumber: transaction.bank ? maskAccountNumber(transaction.bank.accountNumber) : undefined,
        },
      });
    } catch (error) {
      logger.error('❌ Error in getTransactionById:', error);
      next(error);
    }
  }

  /**
   * Get wallet statistics
   * GET /api/wallet/stats
   */
  async getWalletStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      logger.debug('📈 Fetching wallet stats for user:', userId);

      const wallet = await prisma.wallet.findUnique({ where: { userId } });

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [todayTotal, weekTotal, monthTotal, allTime] = await Promise.all([
        // Today's spend (money out)
        prisma.transaction.aggregate({
          where: {
            senderId: userId,
            type: { in: [TRANSACTION_TYPES.WITHDRAW, TRANSACTION_TYPES.SEND, TRANSACTION_TYPES.RECHARGE] },
            createdAt: { gte: todayStart },
          },
          _sum: { amount: true },
        }),
        // This week's spend
        prisma.transaction.aggregate({
          where: {
            senderId: userId,
            type: { in: [TRANSACTION_TYPES.WITHDRAW, TRANSACTION_TYPES.SEND, TRANSACTION_TYPES.RECHARGE] },
            createdAt: { gte: weekStart },
          },
          _sum: { amount: true },
        }),
        // This month's spend
        prisma.transaction.aggregate({
          where: {
            senderId: userId,
            type: { in: [TRANSACTION_TYPES.WITHDRAW, TRANSACTION_TYPES.SEND, TRANSACTION_TYPES.RECHARGE] },
            createdAt: { gte: monthStart },
          },
          _sum: { amount: true },
        }),
        // All time stats
        prisma.transaction.groupBy({
          by: ['type'],
          where: { OR: [{ senderId: userId }, { receiverId: userId }] },
          _sum: { amount: true },
        }),
      ]);

      let totalIn = 0;
      let totalOut = 0;

      allTime.forEach((item) => {
        if (item.type === TRANSACTION_TYPES.ADD_TO_WALLET) {
          totalIn += Number(item._sum?.amount || 0);
        } else if (
          [TRANSACTION_TYPES.WITHDRAW, TRANSACTION_TYPES.SEND, TRANSACTION_TYPES.RECHARGE].includes(
            item.type as any
          )
        ) {
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
    } catch (error) {
      logger.error('❌ Error in getWalletStats:', error);
      next(error);
    }
  }
}

export default new WalletController();