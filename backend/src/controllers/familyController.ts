import linkedFamilyController from './familyController.linked';
import primaryFamilyController from './familyController.primary';
import invitationFamilyController from './familyController.invitations';

export default {
  ...linkedFamilyController,
  ...primaryFamilyController,
  ...invitationFamilyController,
};

// controllers/familyController.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import invitationService from '../services/invitationService';
import notificationService from '../services/notificationService';
import {
  USER_ROLES,
  FAMILY_MEMBER_STATUS,
  INVITATION_STATUS,
  NOTIFICATION_TYPES,
  LIMITS,
} from '../utils/constants';

class FamilyController {
  // ========== LINKED USER ROUTES ==========

  /**
   * Get primary account details for linked user
   * GET /api/family/my-primary
   */
  async getMyPrimaryDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        throw new AppError('User not found', 401);
      }

      if (user.role === USER_ROLES.PRIMARY) {
        res.status(200).json({
          success: true,
          data: null,
          message: 'This endpoint is for linked users only',
        });
        return; 
      }

      const familyMember = await prisma.familyMember.findFirst({
        where: { linkedId: userId, status: { not: FAMILY_MEMBER_STATUS.REMOVED } },
        include: {
          primary: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              createdAt: true,
            },
          },
        },
      });

      if (!familyMember || !familyMember.primary) {
        res.status(200).json({
          success: true,
          data: null,
          message: 'No primary account linked',
        });
        return; 
      }

      const primaryWallet = await prisma.wallet.findUnique({
        where: { userId: familyMember.primaryId },
        select: { balance: true },
      });

      const responseData = {
        primary: {
          id: familyMember.primary.id,
          name: familyMember.primary.name || 'Family Account',
          phone: familyMember.primary.phone,
          email: familyMember.primary.email,
          memberSince: familyMember.primary.createdAt,
          walletBalance: primaryWallet ? Number(primaryWallet.balance) : 0, // FIXED: Decimal to Number
        },
        limits: {
          dailyLimit: Number(familyMember.dailyLimit), // FIXED: Decimal to Number
          dailySpent: Number(familyMember.dailySpent), // FIXED: Decimal to Number
          monthlyLimit: Number(familyMember.monthlyLimit), // FIXED: Decimal to Number
          monthlySpent: Number(familyMember.monthlySpent), // FIXED: Decimal to Number
          perTransactionLimit: Number(familyMember.perTransactionLimit), // FIXED: Decimal to Number
          relationship: familyMember.relationship,
          status: familyMember.status,
        },
        permissions: familyMember.permissions ? JSON.parse(familyMember.permissions) : null,
        joinedAt: familyMember.createdAt,
      };

      res.status(200).json({ success: true, data: responseData });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get limits for the linked user
   * GET /api/family/me/limits
   */
  async getMyLimits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) throw new AppError('User not found', 404);
      if (user.role === USER_ROLES.PRIMARY) {
        throw new AppError('This endpoint is for linked users only', 403);
      }

      const familyMember = await prisma.familyMember.findFirst({
        where: { linkedId: userId, status: FAMILY_MEMBER_STATUS.ACTIVE },
        include: { primary: { select: { name: true } } },
      });

      if (!familyMember) {
        throw new AppError('No active family membership found', 404);
      }

      res.status(200).json({
        success: true,
        data: {
          dailyLimit: Number(familyMember.dailyLimit), // FIXED: Decimal to Number
          dailySpent: Number(familyMember.dailySpent), // FIXED: Decimal to Number
          monthlyLimit: Number(familyMember.monthlyLimit), // FIXED: Decimal to Number
          monthlySpent: Number(familyMember.monthlySpent), // FIXED: Decimal to Number
          perTransactionLimit: Number(familyMember.perTransactionLimit), // FIXED: Decimal to Number
          primaryName: familyMember.primary.name,
          relationship: familyMember.relationship,
          status: familyMember.status,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Connect to a primary account (linked user initiates)
   * POST /api/family/connect
   */
  async connectToPrimary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const linkedId = req.user?.userId;
      const { method, code, phone } = req.body;
      const userPhone = req.user?.phone;

      if (!linkedId || !userPhone) {
        throw new AppError('User not authenticated', 401);
      }

      // Check if already linked
      const existingLink = await prisma.familyMember.findFirst({
        where: {
          linkedId,
          status: { in: [FAMILY_MEMBER_STATUS.ACTIVE, FAMILY_MEMBER_STATUS.PAUSED, FAMILY_MEMBER_STATUS.PENDING] },
        },
        include: { primary: { select: { name: true, phone: true } } },
      });

      if (existingLink) {
        res.status(400).json({
          success: false,
          message: 'You are already linked to a primary account',
          data: {
            primaryId: existingLink.primaryId,
            primaryName: existingLink.primary.name,
            primaryPhone: existingLink.primary.phone,
            status: existingLink.status,
            relationship: existingLink.relationship,
          },
        });
        return; 
      }

      if (method === 'code' && code) {
        try {
          const invitation = await invitationService.getInvitationByCode(code);
          if (invitation) {
            const result = await invitationService.acceptInvitationByCode(
              code,
              linkedId,
              userPhone,
              req.user?.name || null
            );

            await notificationService.create({
              userId: linkedId,
              type: NOTIFICATION_TYPES.CONNECTION_APPROVED,
              title: 'Connection Approved!',
              message: `You are now connected to ${invitation.primaryName || 'primary account'}`,
              data: { primaryId: invitation.primaryId, primaryName: invitation.primaryName },
            });

            res.status(200).json({
              success: true,
              message: 'Successfully connected to primary account',
              data: result,
            });
            return; 
          }
        } catch (error) {
          logger.debug('Invitation not found, trying manual connection');
        }
      }

      if (method === 'manual' && phone) {
        const primaryUser = await prisma.user.findFirst({
          where: { phone, role: USER_ROLES.PRIMARY },
        });

        if (!primaryUser) {
          res.status(404).json({
            success: false,
            message: 'No primary account found with this phone number',
          });
          return; 
        }

        if (primaryUser.id === linkedId) {
          throw new AppError('You cannot connect to your own account', 400);
        }

        // Create pending invitation
        const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const invitation = await prisma.invitation.create({
          data: {
            inviteCode,
            primaryId: primaryUser.id,
            invitedPhone: userPhone,
            relationship: 'Family Member',
            dailyLimit: LIMITS.DEFAULT_DAILY,
            monthlyLimit: LIMITS.DEFAULT_MONTHLY,
            perTransactionLimit: LIMITS.DEFAULT_PER_TXN,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: INVITATION_STATUS.PENDING,
          },
          include: { primary: { select: { name: true, phone: true } } },
        });

        await notificationService.create({
          userId: primaryUser.id,
          type: NOTIFICATION_TYPES.CONNECTION_REQUEST,
          title: 'New Connection Request',
          message: `${userPhone} wants to connect to your family`,
          data: { invitationId: invitation.id, phone: userPhone },
        });

        logger.info(`Connection request sent to primary ${primaryUser.id} from linked user ${linkedId}`);

        res.status(200).json({
          success: true,
          message: 'Connection request sent. Waiting for approval.',
          data: {
            invitationId: invitation.id,
            status: INVITATION_STATUS.PENDING,
            primaryId: primaryUser.id,
            primaryName: primaryUser.name,
            primaryPhone: primaryUser.phone,
          },
        });
        return; 
      }

      throw new AppError('Invalid connection method or missing information', 400);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accept connection request (primary accepts linked user's request)
   * POST /api/family/requests/:invitationId/accept
   */
  async acceptConnectionRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invitationId } = req.params;
      const primaryId = req.user?.userId;
      const primaryName = req.user?.name || null;
      const primaryPhone = req.user?.phone;

      if (!primaryId || !primaryPhone) {
        throw new AppError('User not authenticated', 401);
      }

      if (!invitationId) { 
        throw new AppError('Invitation ID is required', 400);
      }

      const result = await invitationService.acceptConnectionRequest(
        invitationId,
        primaryId,
        primaryPhone,
        primaryName
      );

      logger.info(`Primary ${primaryId} accepted connection request ${invitationId}`);

      res.status(200).json({
        success: true,
        message: 'Connection request accepted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ========== PRIMARY USER ROUTES ==========

  /**
   * Get all family members for primary
   * GET /api/family
   */
  async getFamilyMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const primaryId = req.user?.userId;

      if (!primaryId) {
        throw new AppError('User not authenticated', 401);
      }

      // Reset limits if needed (daily/monthly)
      await this.resetMemberLimits(primaryId);

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

      const formattedMembers = familyMembers.map((m) => ({
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
        permissions: m.permissions ? JSON.parse(m.permissions) : {
          sendMoney: true,
          scanPay: true,
          recharge: true,
          viewHistory: true,
        },
      }));

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
  }

  /**
   * Get a specific family member
   * GET /api/family/:id
   */
  async getMemberById(req: Request, res: Response, next: NextFunction): Promise<void> {
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
  }

  /**
   * Update member limits
   * PUT /api/family/:memberId/limits
   */
  async updateLimits(req: Request, res: Response, next: NextFunction): Promise<void> {
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
  }

  /**
   * Add money to a member's limit (increase daily limit)
   * POST /api/family/:memberId/add-limit
   */
  async addToLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      if (!wallet || Number(wallet.balance) < amount) { // FIXED: Decimal to Number Check
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
  }

  /**
   * Pause a member
   * POST /api/family/:memberId/pause
   */
  async pauseMember(req: Request, res: Response, next: NextFunction): Promise<void> {
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
  }

  /**
   * Resume a member
   * POST /api/family/:memberId/resume
   */
  async resumeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
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
  }

  /**
   * Remove a member (primary removes linked user)
   * DELETE /api/family/:memberId
   */
  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
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
  }

  /**
   * Get member's transactions
   * GET /api/family/:memberId/transactions
   */
  async getMemberTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
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
  }

  // ========== INVITATION ROUTES ==========

  /**
   * Invite a new member (primary)
   * POST /api/family/invite
   */
  async inviteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone, relationship, dailyLimit, monthlyLimit, perTransactionLimit } = req.body;
      const primaryId = req.user?.userId;
      const primaryName = req.user?.name || null;
      const primaryPhone = req.user?.phone;

      if (!phone) throw new AppError('Phone number is required', 400);
      if (!primaryId || !primaryPhone) throw new AppError('User not authenticated', 401);

      const invitation = await invitationService.createInvitation(
        primaryId,
        primaryName,
        primaryPhone,
        { phone, relationship, dailyLimit, monthlyLimit, perTransactionLimit }
      );

      logger.info(`Family invitation sent to ${phone} by primary ${primaryId}`);

      res.status(200).json({
        success: true,
        message: 'Invitation sent successfully',
        data: invitation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate invite code (primary)
   * POST /api/family/generate-invite
   */
  async generateInviteCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const primaryId = req.user?.userId;

      if (!primaryId) {
        throw new AppError('User not authenticated', 401);
      }

      const user = await prisma.user.findUnique({ where: { id: primaryId } });
      if (user?.role !== USER_ROLES.PRIMARY) {
        throw new AppError('Only primary accounts can generate invite codes', 403);
      }

      const code = Math.random().toString(36).substring(2, 10).toUpperCase();

      const invitation = await prisma.invitation.create({
        data: {
          inviteCode: code,
          primaryId,
          invitedPhone: 'pending',
          relationship: 'Family Member',
          dailyLimit: LIMITS.DEFAULT_DAILY,
          monthlyLimit: LIMITS.DEFAULT_MONTHLY,
          perTransactionLimit: LIMITS.DEFAULT_PER_TXN,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: INVITATION_STATUS.PENDING,
        },
      });

      logger.info(`Invite code generated for primary ${primaryId}`);

      res.status(200).json({
        success: true,
        data: { code: invitation.inviteCode, expiresAt: invitation.expiresAt },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending invitations for current user
   * GET /api/family/invitations/pending
   */
  async getPendingInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('User not authenticated', 401);

      const invitations = await invitationService.getPendingInvitationsByUserId(userId);
      res.status(200).json({ success: true, data: invitations });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get invitation by code
   * GET /api/family/invitations/code/:code
   */
  async getInvitationByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.params;
      if (!code) throw new AppError('Invitation code is required', 400);

      const invitation = await invitationService.getInvitationByCode(code);
      res.status(200).json({ success: true, data: invitation });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accept invitation by ID (linked user)
   * POST /api/family/invitations/:invitationId/accept
   */
  async acceptInvitationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invitationId } = req.params;
      const linkedId = req.user?.userId;

      if (!linkedId) throw new AppError('User not authenticated', 401);
      if (!invitationId) throw new AppError('Invitation ID is required', 400);

      const user = await prisma.user.findUnique({ where: { id: linkedId } });
      if (!user) throw new AppError('User not found', 404);

      const result = await invitationService.acceptInvitation(
        invitationId,
        linkedId,
        user.phone,
        user.name
      );

      logger.info(`User ${linkedId} accepted invitation ${invitationId}`);
      res.status(200).json({
        success: true,
        message: 'Successfully joined family',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accept invitation by code (linked user)
   * POST /api/family/invitations/accept
   */
  async acceptInvitationByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { inviteCode } = req.body;
      const linkedId = req.user?.userId;

      if (!linkedId) throw new AppError('User not authenticated', 401);
      if (!inviteCode) throw new AppError('Invite code is required', 400);

      const user = await prisma.user.findUnique({ where: { id: linkedId } });
      if (!user) throw new AppError('User not found', 404);

      const result = await invitationService.acceptInvitationByCode(
        inviteCode,
        linkedId,
        user.phone,
        user.name
      );

      logger.info(`User ${linkedId} accepted invitation with code ${inviteCode}`);
      res.status(200).json({
        success: true,
        message: 'Successfully joined family',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject invitation (linked user)
   * POST /api/family/invitations/:invitationId/reject
   */
  async rejectInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invitationId } = req.params;
      const userId = req.user?.userId;

      if (!userId) throw new AppError('User not authenticated', 401);
      if (!invitationId) throw new AppError('Invitation ID is required', 400);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError('User not found', 404);

      const result = await invitationService.rejectInvitation(invitationId, userId, user.phone, user.name);

      res.status(200).json({ success: true, message: 'Invitation rejected successfully', data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel invitation (primary user)
   * POST /api/family/invitations/:invitationId/cancel
   */
  async cancelInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invitationId } = req.params;
      const primaryId = req.user?.userId;

      if (!primaryId) throw new AppError('User not authenticated', 401);
      if (!invitationId) throw new AppError('Invitation ID is required', 400);

      const result = await invitationService.cancelInvitation(invitationId, primaryId);

      res.status(200).json({ success: true, message: 'Invitation cancelled successfully', data: result });
    } catch (error) {
      next(error);
    }
  }

  // ========== LIMIT REQUEST ROUTES ==========

  /**
   * Create a limit increase request (linked user)
   * POST /api/family/requests
   */
  async createLimitRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount, reason, duration } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const familyMember = await prisma.familyMember.findFirst({
        where: { linkedId: userId, status: FAMILY_MEMBER_STATUS.ACTIVE },
      });

      if (!familyMember) {
        throw new AppError('You are not linked to any active primary account', 404);
      }

      const request = await prisma.limitRequest.create({
        data: {
          familyMemberId: familyMember.id,
          requesterId: userId,
          approverId: familyMember.primaryId,
          amount, // Amount is Decimal, correctly passed from req.body
          reason: reason || null,
          duration: duration || 'today',
          status: 'PENDING',
        },
      });

      await notificationService.create({
        userId: familyMember.primaryId,
        type: NOTIFICATION_TYPES.LIMIT_REQUEST,
        title: 'Limit Increase Request',
        message: `A family member has requested a limit increase of ₹${amount}`,
        data: { requestId: request.id, amount, reason, duration },
      });

      res.status(200).json({
        success: true,
        message: 'Limit request created successfully',
        data: { ...request, amount: Number(request.amount) }, // FIXED: Decimal to Number
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all requests (filtered by role)
   * GET /api/family/requests
   */
  async getRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { status } = req.query;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError('User not found', 404);

      let requests: any[] = [];

      if (user.role === USER_ROLES.PRIMARY) {
        const familyMembers = await prisma.familyMember.findMany({
          where: { primaryId: userId },
          select: { id: true },
        });
        const familyMemberIds = familyMembers.map((fm) => fm.id);

        requests = await prisma.limitRequest.findMany({
          where: {
            familyMemberId: { in: familyMemberIds },
            ...(status && { status: status as string }),
          },
          include: {
            familyMember: {
              include: { linked: { select: { name: true, phone: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        const familyMember = await prisma.familyMember.findFirst({
          where: { linkedId: userId },
        });
        if (familyMember) {
          requests = await prisma.limitRequest.findMany({
            where: {
              familyMemberId: familyMember.id,
              ...(status && { status: status as string }),
            },
            orderBy: { createdAt: 'desc' },
          });
        }
      }

      // FIXED: Map Decimal to Number
      const formattedRequests = requests.map((r) => ({ ...r, amount: Number(r.amount) }));

      res.status(200).json({ success: true, data: formattedRequests });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve a limit request (primary)
   * PUT /api/family/requests/:requestId/approve
   */
  async approveRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { requestId } = req.params;
      const primaryId = req.user?.userId;

      if (!primaryId) {
        throw new AppError('User not authenticated', 401);
      }

      const request = await prisma.limitRequest.findUnique({
        where: { id: requestId },
        include: { familyMember: true },
      });

      if (!request) throw new AppError('Request not found', 404);
      if (request.approverId !== primaryId) {
        throw new AppError('You are not authorized to approve this request', 403);
      }
      if (request.status !== 'PENDING') {
        throw new AppError(`This request has already been ${request.status.toLowerCase()}`, 400);
      }

      const updateData: any = {};

      if (request.duration === 'today' || request.duration === 'permanent') {
        updateData.dailyLimit = { increment: request.amount };
      }
      if (['week', 'month', 'permanent'].includes(request.duration)) {
        updateData.monthlyLimit = { increment: request.amount };
      }

      // Uses proper Prisma transaction arrays (Atomic)
      await prisma.$transaction([
        prisma.familyMember.update({
          where: { id: request.familyMemberId },
          data: updateData,
        }),
        prisma.limitRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED', respondedAt: new Date() },
        }),
      ]);

      await notificationService.create({
        userId: request.requesterId,
        type: NOTIFICATION_TYPES.REQUEST_APPROVED,
        title: 'Request Approved',
        message: `Your request for ₹${request.amount} limit increase has been approved`,
        data: { requestId },
      });

      res.status(200).json({ success: true, message: 'Request approved successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deny a limit request (primary)
   * PUT /api/family/requests/:requestId/deny
   */
  async denyRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { requestId } = req.params;
      const primaryId = req.user?.userId;

      if (!primaryId) {
        throw new AppError('User not authenticated', 401);
      }

      const request = await prisma.limitRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) throw new AppError('Request not found', 404);
      if (request.approverId !== primaryId) {
        throw new AppError('You are not authorized to deny this request', 403);
      }
      if (request.status !== 'PENDING') {
        throw new AppError(`This request has already been ${request.status.toLowerCase()}`, 400);
      }

      await prisma.limitRequest.update({
        where: { id: requestId },
        data: { status: 'DENIED', respondedAt: new Date() },
      });

      await notificationService.create({
        userId: request.requesterId,
        type: NOTIFICATION_TYPES.REQUEST_DENIED,
        title: 'Request Denied',
        message: `Your request for ₹${request.amount} limit increase has been denied`,
        data: { requestId },
      });

      res.status(200).json({ success: true, message: 'Request denied successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all pending items (invitations + requests) for current user
   * GET /api/family/pending-all
   */
  async getPendingAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('User not authenticated', 401);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError('User not found', 404);

      let pendingInvitations: any[] = [];
      let pendingRequests: any[] = [];

      if (user.role === USER_ROLES.PRIMARY) {
        pendingInvitations = await invitationService.getPrimaryPendingInvitations(userId);

        const familyMembers = await prisma.familyMember.findMany({
          where: { primaryId: userId },
          select: { id: true },
        });
        const familyMemberIds = familyMembers.map((fm) => fm.id);

        pendingRequests = await prisma.limitRequest.findMany({
          where: { familyMemberId: { in: familyMemberIds }, status: 'PENDING' },
          include: {
            familyMember: {
              include: { linked: { select: { name: true, phone: true } } },
            },
          },
        });
      } else {
        pendingInvitations = await invitationService.getPendingInvitationsByUserId(userId);

        const familyMember = await prisma.familyMember.findFirst({
          where: { linkedId: userId },
        });
        if (familyMember) {
          pendingRequests = await prisma.limitRequest.findMany({
            where: { familyMemberId: familyMember.id, status: 'PENDING' },
          });
        }
      }

      // FIXED: Map Decimal to Number for frontend
      const formattedRequests = pendingRequests.map(r => ({...r, amount: Number(r.amount)}));

      res.status(200).json({
        success: true,
        data: {
          invitations: pendingInvitations,
          requests: formattedRequests,
          total: pendingInvitations.length + formattedRequests.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate QR code for family linking
   * GET /api/family/qr
   */
  async generateQRCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const linkingToken = jwt.sign(
        { primaryId: userId, type: 'family_link', exp: Math.floor(Date.now() / 1000) + 600 }, // 10 min expiry
        process.env.JWT_SECRET!
      );

      const qrData = {
        type: 'family_link',
        primaryId: userId,
        token: linkingToken,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      res.status(200).json({
        success: true,
        data: { qrData: JSON.stringify(qrData), expiresIn: 600 },
      });
    } catch (error) {
      next(error);
    }
  }

  // ========== PRIVATE HELPERS ==========

  /**
   * Reset daily/monthly spent for all members of a primary account
   */
  private async resetMemberLimits(primaryId: string): Promise<void> {
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
}

// export default new FamilyController();