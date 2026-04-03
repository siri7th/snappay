// services/limitService.ts
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

    // Reset daily if new day
    if (member.lastResetDate < today) {
      await prisma.familyMember.update({
        where: { id: member.id },
        data: {
          dailySpent: 0,
          lastResetDate: today,
        },
      });
      member.dailySpent = 0;
    }

    // Reset monthly if new month (only if lastResetDate is before this month)
    if (member.lastResetDate < firstDayOfMonth) {
      await prisma.familyMember.update({
        where: { id: member.id },
        data: {
          monthlySpent: 0,
          lastResetDate: today, // Update to today to avoid repeated resets
        },
      });
      member.monthlySpent = 0;
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