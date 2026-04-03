// controllers/rechargeController.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import notificationService from '../services/notificationService';
import { RECHARGE_TYPES, TRANSACTION_TYPES, TRANSACTION_STATUS, PAYMENT_METHODS, LIMITS } from '../utils/constants';
import { generateTxnId } from '../utils/helpers';
import authService from '../services/authService';
import { Prisma } from "@prisma/client";

// Define types for plans
interface Plan {
  id: string;
  name: string;
  amount: number | string;
  validity?: string;
  data?: string;
  calls?: string;
  sms?: string;
  description?: string;
  channels?: string;
}

interface PlansType {
  mobile: Plan[];
  electricity: Plan[];
  fastag: Plan[];
  dth: Plan[];
}

class RechargeController {
  private async requireValidPin(userId: string, pin: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { pin: true } });
    if (!user) throw new AppError('User not found', 404);
    if (!user.pin) throw new AppError('Please set your PIN to activate payments', 403);
    const ok = await authService.verifyPin(pin, user.pin);
    if (!ok) throw new AppError('Invalid PIN', 401);
  }
  /**
   * Get recharge plans (mock data)
   * GET /api/recharge/plans
   */
  async getPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.query;
      const typeStr = type as string;

      // Mock data - in production, would fetch from operator APIs
      const plans: PlansType = {
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

      const selectedPlans = typeStr && plans[typeStr as keyof PlansType]
        ? plans[typeStr as keyof PlansType]
        : plans.mobile;

      res.status(200).json({
        success: true,
        data: selectedPlans,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mobile recharge
   * POST /api/recharge/mobile
   */
  async mobileRecharge(req: Request, res: Response, next: NextFunction) {
    try {
      const { mobileNumber, operator, amount, planId, paymentMethod = PAYMENT_METHODS.WALLET, bankId, pin } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }
      if (!pin) {
        throw new AppError('PIN is required', 400);
      }
      await this.requireValidPin(userId, String(pin));

      if (!mobileNumber || !amount || amount <= 0) {
        throw new AppError('Valid mobile number and amount are required', 400);
      }

      // Check limits if user is linked
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (user?.role === 'LINKED') {
        await this.checkAndUpdateLimits(userId, amount);
      }

      // Process payment based on method
      const result = await this.processRechargePayment(
        userId,
        amount,
        paymentMethod,
        bankId,
        RECHARGE_TYPES.MOBILE,
        { mobileNumber, operator, planId }
      );

      logger.info(`Mobile recharge: ₹${amount} for ${mobileNumber} by user ${userId}`);

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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Electricity bill payment
   * POST /api/recharge/electricity
   */
  async electricityBill(req: Request, res: Response, next: NextFunction) {
    try {
      const { consumerNumber, board, amount, paymentMethod = PAYMENT_METHODS.WALLET, bankId, pin } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }
      if (!pin) {
        throw new AppError('PIN is required', 400);
      }
      await this.requireValidPin(userId, String(pin));

      if (!consumerNumber || !amount || amount <= 0) {
        throw new AppError('Valid consumer number and amount are required', 400);
      }

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (user?.role === 'LINKED') {
        await this.checkAndUpdateLimits(userId, amount);
      }

      const result = await this.processRechargePayment(
        userId,
        amount,
        paymentMethod,
        bankId,
        RECHARGE_TYPES.ELECTRICITY,
        { consumerNumber, board }
      );

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
    } catch (error) {
      next(error);
    }
  }

  /**
   * FASTag recharge
   * POST /api/recharge/fastag
   */
  async fastagRecharge(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleNumber, amount, paymentMethod = PAYMENT_METHODS.WALLET, bankId, pin } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }
      if (!pin) {
        throw new AppError('PIN is required', 400);
      }
      await this.requireValidPin(userId, String(pin));

      if (!vehicleNumber || !amount || amount <= 0) {
        throw new AppError('Valid vehicle number and amount are required', 400);
      }

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (user?.role === 'LINKED') {
        await this.checkAndUpdateLimits(userId, amount);
      }

      const result = await this.processRechargePayment(
        userId,
        amount,
        paymentMethod,
        bankId,
        RECHARGE_TYPES.FASTAG,
        { vehicleNumber }
      );

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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recharge history
   * GET /api/recharge/history
   */
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const type = req.query.type as string;
      const userId = req.user?.userId;

      const where: any = { userId };
      if (type) where.type = type;

      const [recharges, total] = await Promise.all([
        prisma.recharge.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.recharge.count({ where }),
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
    } catch (error) {
      next(error);
    }
  }

  // ========== PRIVATE HELPERS ==========

  /**
   * Check and update limits for a linked user
   */
  private async checkAndUpdateLimits(linkedUserId: string, amount: number): Promise<void> {
    const member = await prisma.familyMember.findUnique({
      where: { linkedId: linkedUserId },
    });

    if (!member) {
      throw new AppError('Family member not found', 404);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Reset daily if new day
    if (member.lastResetDate < today) {
      await prisma.familyMember.update({
        where: { id: member.id },
        data: { dailySpent: 0, lastResetDate: today },
      });
      member.dailySpent = new Prisma.Decimal(0);
    }

    // Reset monthly if new month
    if (member.lastResetDate < firstDayOfMonth) {
      await prisma.familyMember.update({
        where: { id: member.id },
        data: { monthlySpent: 0, lastResetDate: today },
      });
      member.monthlySpent = new Prisma.Decimal(0);
    }

    // Check limits
    if (Number(member.dailySpent) + amount > Number(member.dailyLimit)) {
      throw new AppError(`Daily limit of ₹${member.dailyLimit} exceeded. Used: ₹${member.dailySpent}`, 400);
    }
    if (Number(member.monthlySpent) + amount > Number(member.monthlyLimit)) {
      throw new AppError(`Monthly limit of ₹${member.monthlyLimit} exceeded. Used: ₹${member.monthlySpent}`, 400);
    }
    if (amount > Number(member.perTransactionLimit)) {
      throw new AppError(`Per transaction limit is ₹${member.perTransactionLimit}`, 400);
    }

    // Update spent
    await prisma.familyMember.update({
      where: { id: member.id },
      data: {
        dailySpent: { increment: amount },
        monthlySpent: { increment: amount },
      },
    });
  }

  /**
   * Process recharge payment (common logic)
   */
  private async processRechargePayment(
    userId: string,
    amount: number,
    paymentMethod: string,
    bankId: string | undefined,
    rechargeType: string,
    metadata: Record<string, any>
  ) {
    // Validate payment source
    if (paymentMethod === PAYMENT_METHODS.WALLET) {
      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      if (!wallet || Number(wallet.balance) < amount) {
        throw new AppError('Insufficient wallet balance', 400);
      }
    } else if (paymentMethod === PAYMENT_METHODS.BANK) {
      if (!bankId) throw new AppError('Bank account is required', 400);
      const bank = await prisma.bankAccount.findFirst({ where: { id: bankId, userId } });
      if (!bank) throw new AppError('Bank account not found', 404);
      if (!bank.isVerified) throw new AppError('Bank account must be verified', 400);
      if (Number(bank.balance) < amount) {
        throw new AppError(`Insufficient balance in ${bank.bankName}`, 400);
      }
    } else {
      throw new AppError('Invalid payment method', 400);
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from source
      if (paymentMethod === PAYMENT_METHODS.WALLET) {
        await tx.wallet.update({
          where: { userId },
          data: { balance: { decrement: amount } },
        });
      } else if (paymentMethod === PAYMENT_METHODS.BANK) {
        await tx.bankAccount.update({
          where: { id: bankId },
          data: { balance: { decrement: amount } },
        });
      }

      const transactionId = generateTxnId('RCH');

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          transactionId,
          amount,
          type: TRANSACTION_TYPES.RECHARGE,
          status: TRANSACTION_STATUS.SUCCESS,
          senderId: userId,
          description: `${rechargeType} recharge`,
          paymentMethod,
          bankId: paymentMethod === PAYMENT_METHODS.BANK ? bankId : undefined,
          metadata: JSON.stringify(metadata),
        },
      });

      // Create recharge record
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

      // Get updated wallet balance if applicable
      let newBalance = null;
      if (paymentMethod === PAYMENT_METHODS.WALLET) {
        const updatedWallet = await tx.wallet.findUnique({ where: { userId } });
        newBalance = updatedWallet?.balance || 0;
      }

      return { transaction, recharge, newBalance };
    });

    // Send notification
    await notificationService.create({
      userId,
      type: 'RECHARGE_SUCCESS',
      title: 'Recharge Successful',
      message: `₹${amount} ${rechargeType.toLowerCase()} recharge successful`,
      data: { amount, type: rechargeType, ...metadata },
    });

    return result;
  }
}

export default new RechargeController();