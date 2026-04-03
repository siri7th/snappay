// services/limitService.ts
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { getStartOfDay, getStartOfMonth } from '../utils/helpers';

export class LimitService {
  /**
   * Check and update limits for a linked user
   * Should be called inside a transaction if possible
   */
  async checkAndUpdateLimits(linkedUserId: string, amount: number): Promise<void> {
    const member = await prisma.familyMember.findUnique({
      where: { linkedId: linkedUserId },
    });

    if (!member) {
      throw new AppError('Family member not found', 404);
    }

    const today = getStartOfDay();
    const firstDayOfMonth = getStartOfMonth();

    const shouldResetDaily = member.lastResetDate < today;
    const shouldResetMonthly = member.lastResetDate < firstDayOfMonth;

    if (shouldResetDaily) {
      await prisma.familyMember.update({
        where: { id: member.id },
        data: {
          dailySpent: 0,
          lastResetDate: today,
        },
      });
    }

    if (shouldResetMonthly) {
      await prisma.familyMember.update({
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
      throw new AppError(
        `Daily limit of ₹${member.dailyLimit} exceeded. Used: ₹${currentDailySpent}`,
        400,
      );
    }
    if (currentMonthlySpent + amount > Number(member.monthlyLimit)) {
      throw new AppError(
        `Monthly limit of ₹${member.monthlyLimit} exceeded. Used: ₹${currentMonthlySpent}`,
        400,
      );
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
   * Get remaining limits for a linked user
   */
  async getRemainingLimits(linkedUserId: string) {
    const member = await prisma.familyMember.findUnique({
      where: { linkedId: linkedUserId },
    });

    if (!member) {
      throw new AppError('Family member not found', 404);
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

  /**
   * Add to limit (increase daily/monthly limit)
   */
  async addToLimit(memberId: string, amount: number, type: 'daily' | 'monthly' = 'daily') {
    return prisma.familyMember.update({
      where: { id: memberId },
      data: type === 'daily' ? { dailyLimit: { increment: amount } } : { monthlyLimit: { increment: amount } },
    });
  }
}

export default new LimitService();