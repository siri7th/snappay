import prisma from '../config/database';

/**
 * Reset daily/monthly spent for all members of a primary account.
 * Kept as a standalone function so controller files can stay small.
 */
export async function resetMemberLimits(primaryId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  await prisma.$transaction(async (tx) => {
    // Reset daily spent for members whose lastResetDate < today
    await tx.familyMember.updateMany({
      where: {
        primaryId,
        lastResetDate: { lt: today },
      },
      data: {
        dailySpent: 0,
        lastResetDate: today,
      },
    });

    // Reset monthly spent for members whose lastResetDate < firstDayOfMonth
    await tx.familyMember.updateMany({
      where: {
        primaryId,
        lastResetDate: { lt: firstDayOfMonth },
      },
      data: {
        monthlySpent: 0,
        lastResetDate: today, // update to today to avoid repeated resets
      },
    });
  });
}

