// services/accountRemovalService.ts
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import notificationService from './notificationService';
import { RemovalResult } from '../types/accountRemoval.types';
import { TRANSACTION_TYPES, PAYMENT_METHODS, NOTIFICATION_TYPES } from '../utils/constants';
import { generateTxnId } from '../utils/helpers';

export class AccountRemovalService {
  /**
   * Primary removes a family member
   * - Transfers remaining balance back to primary
   * - Removes family member record
   * - Notifies both parties
   */
  async removeFamilyMember(
    primaryId: string,
    memberId: string,
    transferBalance: boolean = true
  ): Promise<RemovalResult> {
    // Find the family member record
    const familyMember = await prisma.familyMember.findFirst({
      where: { id: memberId, primaryId },
      include: {
        linked: { include: { wallet: true } },
      },
    });

    if (!familyMember) {
      throw new AppError('Family member not found', 404);
    }

    let transferredAmount = 0;
    let remainingBalance = 0;

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if linked user has wallet balance
      if (familyMember.linked.wallet && familyMember.linked.wallet.balance.gt(0)) {
        const linkedBalance = Number(familyMember.linked.wallet.balance);

        if (transferBalance && linkedBalance > 0) {
          // Ensure primary has a wallet
          let primaryWallet = await tx.wallet.findUnique({ where: { userId: primaryId } });
          if (!primaryWallet) {
            primaryWallet = await tx.wallet.create({
              data: { userId: primaryId, balance: 0 },
            });
          }

          // Transfer balance to primary
          await tx.wallet.update({
            where: { userId: primaryId },
            data: { balance: { increment: linkedBalance } },
          });

          // Set linked wallet to zero
          await tx.wallet.update({
            where: { userId: familyMember.linkedId },
            data: { balance: 0 },
          });

          transferredAmount = linkedBalance;

          // Create transaction record for the transfer
          await tx.transaction.create({
            data: {
              transactionId: generateTxnId('TRF'),
              amount: linkedBalance,
              type: 'BALANCE_TRANSFER',
              status: 'SUCCESS',
              senderId: familyMember.linkedId,
              receiverId: primaryId,
              description: 'Balance transferred on account removal',
              paymentMethod: PAYMENT_METHODS.SYSTEM,
            },
          });
        }
      }

      // Cancel any pending limit requests
      await tx.limitRequest.updateMany({
        where: { familyMemberId: memberId, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });

      // Soft delete the family member record
      await tx.familyMember.update({
        where: { id: memberId },
        data: { status: 'REMOVED' },
      });

      return { transferredAmount };
    });

    // Notify linked user
    await notificationService.create({
      userId: familyMember.linkedId,
      type: NOTIFICATION_TYPES.FAMILY_REMOVED,
      title: 'Removed from Family',
      message: `You have been removed from the family account${
        transferBalance ? ' and your wallet balance has been transferred' : ''
      }`,
      data: { transferredAmount: result.transferredAmount, primaryId },
    });

    // Get primary's updated balance
    const primaryWallet = await prisma.wallet.findUnique({ where: { userId: primaryId } });

    return {
      success: true,
      transferredAmount: result.transferredAmount,
      message: 'Family member removed successfully',
      remainingBalance: primaryWallet ? Number(primaryWallet.balance) : 0,
    };
  }

  /**
   * Linked user disconnects from primary account
   * - Transfers remaining balance to primary
   * - Removes family member record
   * - Notifies both parties
   */
  async disconnectFromPrimary(
    linkedId: string,
    transferBalance: boolean = true
  ): Promise<RemovalResult> {
    // Find the family member record
    const familyMember = await prisma.familyMember.findFirst({
      where: { linkedId },
      include: {
        primary: { include: { wallet: true } },
        linked: { include: { wallet: true } },
      },
    });

    if (!familyMember) {
      throw new AppError('You are not linked to any primary account', 404);
    }

    let transferredAmount = 0;

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if linked user has wallet balance
      if (familyMember.linked.wallet && familyMember.linked.wallet.balance.gt(0)) {
        const linkedBalance = Number(familyMember.linked.wallet.balance);

        if (transferBalance && linkedBalance > 0) {
          // Ensure primary has a wallet
          let primaryWallet = await tx.wallet.findUnique({ where: { userId: familyMember.primaryId } });
          if (!primaryWallet) {
            primaryWallet = await tx.wallet.create({
              data: { userId: familyMember.primaryId, balance: 0 },
            });
          }

          // Transfer balance to primary
          await tx.wallet.update({
            where: { userId: familyMember.primaryId },
            data: { balance: { increment: linkedBalance } },
          });

          // Set linked wallet to zero
          await tx.wallet.update({
            where: { userId: linkedId },
            data: { balance: 0 },
          });

          transferredAmount = linkedBalance;

          // Create transaction record for the transfer
          await tx.transaction.create({
            data: {
              transactionId: generateTxnId('DISC'),
              amount: linkedBalance,
              type: 'DISCONNECT_TRANSFER',
              status: 'SUCCESS',
              senderId: linkedId,
              receiverId: familyMember.primaryId,
              description: 'Balance transferred on disconnection from primary',
              paymentMethod: PAYMENT_METHODS.SYSTEM,
            },
          });
        }
      }

      // Cancel any pending limit requests
      await tx.limitRequest.updateMany({
        where: { familyMemberId: familyMember.id, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });

      // Soft delete the family member record
      await tx.familyMember.update({
        where: { id: familyMember.id },
        data: { status: 'REMOVED' },
      });

      return { transferredAmount };
    });

    // Notify primary
    await notificationService.create({
      userId: familyMember.primaryId,
      type: NOTIFICATION_TYPES.LINKED_DISCONNECTED,
      title: 'Family Member Disconnected',
      message: `A linked user has disconnected from your family${
        result.transferredAmount > 0 ? ` and ₹${result.transferredAmount} has been added to your wallet` : ''
      }`,
      data: { linkedId, transferredAmount: result.transferredAmount },
    });

    // Get linked user's wallet balance (should be 0 now)
    const linkedWallet = await prisma.wallet.findUnique({ where: { userId: linkedId } });

    return {
      success: true,
      transferredAmount: result.transferredAmount,
      message: 'Successfully disconnected from primary account',
      remainingBalance: linkedWallet ? Number(linkedWallet.balance) : 0,
    };
  }

  /**
   * Get removal summary (what will happen when removing)
   */
  async getRemovalSummary(userId: string, targetId?: string) {
    // For primary viewing a member
    if (targetId) {
      const familyMember = await prisma.familyMember.findFirst({
        where: { id: targetId, primaryId: userId },
        include: { linked: { include: { wallet: true } } },
      });

      if (!familyMember) {
        throw new AppError('Family member not found', 404);
      }

      return {
        type: 'member',
        name: familyMember.linked.name || 'Family Member',
        phone: familyMember.linked.phone,
        relationship: familyMember.relationship,
        currentBalance: familyMember.linked.wallet ? Number(familyMember.linked.wallet.balance) : 0,
        willTransfer: true,
        pendingRequests: await this.countPendingRequests(familyMember.id),
      };
    }

    // For linked user viewing their own connection
    const familyMember = await prisma.familyMember.findFirst({
      where: { linkedId: userId },
      include: {
        primary: { include: { wallet: true } },
        linked: { include: { wallet: true } },
      },
    });

    if (!familyMember) {
      throw new AppError('Not linked to any primary account', 404);
    }

    return {
      type: 'self',
      primaryName: familyMember.primary.name || 'Primary Account',
      primaryPhone: familyMember.primary.phone,
      relationship: familyMember.relationship,
      currentBalance: familyMember.linked.wallet ? Number(familyMember.linked.wallet.balance) : 0,
      willTransfer: true,
      pendingRequests: await this.countPendingRequests(familyMember.id),
    };
  }

  private async countPendingRequests(familyMemberId: string): Promise<number> {
    return prisma.limitRequest.count({
      where: { familyMemberId, status: 'PENDING' },
    });
  }
}

export default new AccountRemovalService();