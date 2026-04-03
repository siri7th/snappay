import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import notificationService from '../services/notificationService';
import { FAMILY_MEMBER_STATUS, NOTIFICATION_TYPES } from '../utils/constants';
import { resetMemberLimits } from './familyController.helpers';
import logger from '../utils/logger';

const getFamilyMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const primaryId = req.user?.userId;

    if (!primaryId) {
      throw new AppError('User not authenticated', 401);
    }

    // Reset limits if needed (daily/monthly)
    try {
      await resetMemberLimits(primaryId);
    } catch (error) {
      // Avoid taking down the whole endpoint during resets.
      // We still return the family list even if reset fails.
      logger.error('Failed to reset member limits', error);
    }

    const familyMembers = await prisma.familyMember.findMany({
      where: { primaryId, status: { not: FAMILY_MEMBER_STATUS.REMOVED } },
      include: {
        linked: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            status: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // FIXED: Decimal to Number for summations
    const totalDailySpent = familyMembers.reduce((sum, m) => sum + Number(m.dailySpent), 0);
    const totalMonthlySpent = familyMembers.reduce((sum, m) => sum + Number(m.monthlySpent), 0);
    const activeCount = familyMembers.filter((m) => m.status === FAMILY_MEMBER_STATUS.ACTIVE).length;
    const pausedCount = familyMembers.filter((m) => m.status === FAMILY_MEMBER_STATUS.PAUSED).length;
    const pendingCount = familyMembers.filter((m) => m.status === FAMILY_MEMBER_STATUS.PENDING).length;

      const defaultPermissions = {
        sendMoney: true,
        scanPay: true,
        recharge: true,
        viewHistory: true,
      };

      const formattedMembers = familyMembers.map((m) => {
        let parsedPermissions = defaultPermissions;
        if (m.permissions) {
          try {
            parsedPermissions = JSON.parse(m.permissions);
          } catch {
            parsedPermissions = defaultPermissions;
          }
        }

        return {
      id: m.id,
      linkedId: m.linked.id,
      name: m.linked.name || 'Family Member',
      phone: m.linked.phone,
      email: m.linked.email,
      relationship: m.relationship || 'Family Member',
      dailyLimit: Number(m.dailyLimit), // FIXED: Decimal to Number
      dailySpent: Number(m.dailySpent), // FIXED: Decimal to Number
      dailyRemaining: Number(m.dailyLimit) - Number(m.dailySpent),
      monthlyLimit: Number(m.monthlyLimit), // FIXED: Decimal to Number
      monthlySpent: Number(m.monthlySpent), // FIXED: Decimal to Number
      monthlyRemaining: Number(m.monthlyLimit) - Number(m.monthlySpent),
      perTransactionLimit: Number(m.perTransactionLimit), // FIXED: Decimal to Number
      status: m.status,
      memberSince: m.createdAt,
      lastActive: m.linked.lastLoginAt,
        permissions: parsedPermissions,
        };
      });

    res.status(200).json({
      success: true,
      data: {
        members: formattedMembers,
        stats: {
          total: formattedMembers.length,
          active: activeCount,
          paused: pausedCount,
          pending: pendingCount,
          totalDailySpent,
          totalMonthlySpent,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMemberById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const primaryId = req.user?.userId;

    if (!primaryId) {
      throw new AppError('User not authenticated', 401);
    }

    const familyMember = await prisma.familyMember.findFirst({
      where: { id, primaryId },
      include: {
        linked: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!familyMember) {
      throw new AppError('Family member not found', 404);
    }

    const permissions = familyMember.permissions
      ? JSON.parse(familyMember.permissions)
      : { sendMoney: true, scanPay: true, recharge: true, viewHistory: true };

    res.status(200).json({
      success: true,
      data: {
        id: familyMember.id,
        linkedId: familyMember.linked.id,
        name: familyMember.linked.name,
        phone: familyMember.linked.phone,
        email: familyMember.linked.email,
        relationship: familyMember.relationship,
        dailyLimit: Number(familyMember.dailyLimit), // FIXED: Decimal to Number
        dailySpent: Number(familyMember.dailySpent), // FIXED: Decimal to Number
        monthlyLimit: Number(familyMember.monthlyLimit), // FIXED: Decimal to Number
        monthlySpent: Number(familyMember.monthlySpent), // FIXED: Decimal to Number
        perTransactionLimit: Number(familyMember.perTransactionLimit), // FIXED: Decimal to Number
        status: familyMember.status,
        memberSince: familyMember.linked.createdAt,
        lastActive: familyMember.linked.lastLoginAt,
        permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateLimits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { memberId } = req.params;
    const { dailyLimit, monthlyLimit, perTransactionLimit } = req.body;
    const primaryId = req.user?.userId;

    if (!primaryId) {
      throw new AppError('User not authenticated', 401);
    }

    const familyMember = await prisma.familyMember.findFirst({
      where: { id: memberId, primaryId },
    });

    if (!familyMember) {
      throw new AppError('Family member not found', 404);
    }

    const updated = await prisma.familyMember.update({
      where: { id: memberId },
      data: {
        dailyLimit: dailyLimit !== undefined ? dailyLimit : undefined,
        monthlyLimit: monthlyLimit !== undefined ? monthlyLimit : undefined,
        perTransactionLimit: perTransactionLimit !== undefined ? perTransactionLimit : undefined,
      },
    });

    await notificationService.create({
      userId: familyMember.linkedId,
      type: NOTIFICATION_TYPES.LIMIT_UPDATED,
      title: 'Your limits have been updated',
      message: 'Your spending limits have been changed by the primary account',
      data: { newLimits: { dailyLimit, monthlyLimit, perTransactionLimit } },
    });

    res.status(200).json({
      success: true,
      message: 'Limits updated successfully',
      data: {
        dailyLimit: Number(updated.dailyLimit), // FIXED: Decimal to Number
        monthlyLimit: Number(updated.monthlyLimit), // FIXED: Decimal to Number
        perTransactionLimit: Number(updated.perTransactionLimit), // FIXED: Decimal to Number
      },
    });
  } catch (error) {
    next(error);
  }
};

const addToLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { memberId } = req.params;
    const { amount } = req.body;
    const primaryId = req.user?.userId;

    if (!primaryId) {
      throw new AppError('User not authenticated', 401);
    }

    if (!amount || amount <= 0) {
      throw new AppError('Valid amount is required', 400);
    }

    const familyMember = await prisma.familyMember.findFirst({
      where: { id: memberId, primaryId },
    });

    if (!familyMember) {
      throw new AppError('Family member not found', 404);
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: primaryId } });
    if (!wallet || Number(wallet.balance) < amount) {
      // FIXED: Decimal to Number Check
      throw new AppError('Insufficient wallet balance', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { userId: primaryId },
        data: { balance: { decrement: amount } }, // Atomic update
      });

      const updatedMember = await tx.familyMember.update({
        where: { id: memberId },
        data: { dailyLimit: { increment: amount } }, // Atomic update
      });

      const transaction = await tx.transaction.create({
        data: {
          transactionId: `TXN${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          amount,
          type: 'ADD_TO_LIMIT',
          status: 'SUCCESS',
          senderId: primaryId,
          familyMemberId: memberId,
          description: `Added to ${familyMember.relationship || 'member'}'s limit`,
          paymentMethod: 'wallet',
        },
      });

      return { transaction, newBalance: updatedWallet.balance, newLimit: updatedMember.dailyLimit };
    });

    await notificationService.create({
      userId: familyMember.linkedId,
      type: NOTIFICATION_TYPES.LIMIT_INCREASED,
      title: 'Your limit has been increased',
      message: `₹${amount} added to your daily limit`,
      data: { newLimit: Number(result.newLimit) },
    });

    res.status(200).json({
      success: true,
      message: 'Money added to limit successfully',
      data: {
        transactionId: result.transaction.transactionId,
        amount,
        newBalance: Number(result.newBalance), // FIXED: Decimal to Number
        newDailyLimit: Number(result.newLimit), // FIXED: Decimal to Number
      },
    });
  } catch (error) {
    next(error);
  }
};

const pauseMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { memberId } = req.params;
    const primaryId = req.user?.userId;

    if (!primaryId) {
      throw new AppError('User not authenticated', 401);
    }

    const familyMember = await prisma.familyMember.findFirst({
      where: { id: memberId, primaryId },
    });

    if (!familyMember) {
      throw new AppError('Family member not found', 404);
    }

    await prisma.familyMember.update({
      where: { id: memberId },
      data: { status: FAMILY_MEMBER_STATUS.PAUSED },
    });

    await notificationService.create({
      userId: familyMember.linkedId,
      type: NOTIFICATION_TYPES.ACCOUNT_PAUSED,
      title: 'Your account has been paused',
      message: 'Your primary account holder has paused your spending',
    });

    res.status(200).json({ success: true, message: 'Member paused successfully' });
  } catch (error) {
    next(error);
  }
};

const resumeMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { memberId } = req.params;
    const primaryId = req.user?.userId;

    if (!primaryId) {
      throw new AppError('User not authenticated', 401);
    }

    const familyMember = await prisma.familyMember.findFirst({
      where: { id: memberId, primaryId },
    });

    if (!familyMember) {
      throw new AppError('Family member not found', 404);
    }

    await prisma.familyMember.update({
      where: { id: memberId },
      data: { status: FAMILY_MEMBER_STATUS.ACTIVE },
    });

    await notificationService.create({
      userId: familyMember.linkedId,
      type: NOTIFICATION_TYPES.ACCOUNT_RESUMED,
      title: 'Your account has been resumed',
      message: 'You can now make payments again',
    });

    res.status(200).json({ success: true, message: 'Member resumed successfully' });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { memberId } = req.params;
    const primaryId = req.user?.userId;

    if (!primaryId) {
      throw new AppError('User not authenticated', 401);
    }

    const familyMember = await prisma.familyMember.findFirst({
      where: { id: memberId, primaryId },
    });

    if (!familyMember) {
      throw new AppError('Family member not found', 404);
    }

    // Instead of hard delete, soft delete by setting status to REMOVED
    await prisma.familyMember.update({
      where: { id: memberId },
      data: { status: FAMILY_MEMBER_STATUS.REMOVED },
    });

    await notificationService.create({
      userId: familyMember.linkedId,
      type: NOTIFICATION_TYPES.FAMILY_REMOVED,
      title: 'Removed from family',
      message: 'You have been removed from the family account',
    });

    res.status(200).json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
};

const getMemberTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { memberId } = req.params;
    const primaryId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!primaryId) {
      throw new AppError('User not authenticated', 401);
    }

    const familyMember = await prisma.familyMember.findFirst({
      where: { id: memberId, primaryId },
    });

    if (!familyMember) {
      throw new AppError('Family member not found', 404);
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { senderId: familyMember.linkedId },
          { receiverId: familyMember.linkedId },
          { familyMemberId: memberId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await prisma.transaction.count({
      where: {
        OR: [
          { senderId: familyMember.linkedId },
          { receiverId: familyMember.linkedId },
          { familyMemberId: memberId },
        ],
      },
    });

    // FIXED: Decimal to Number
    const formattedTransactions = transactions.map((t) => ({ ...t, amount: Number(t.amount) }));

    res.status(200).json({
      success: true,
      data: {
        transactions: formattedTransactions,
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
};

export default {
  getFamilyMembers,
  getMemberById,
  updateLimits,
  addToLimit,
  pauseMember,
  resumeMember,
  removeMember,
  getMemberTransactions,
};

