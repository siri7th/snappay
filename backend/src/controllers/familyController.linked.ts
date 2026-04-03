import { Request, Response, NextFunction } from 'express';
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

const getMyPrimaryDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
};

const getMyLimits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
};

const connectToPrimary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
};

const acceptConnectionRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
};

export default {
  getMyPrimaryDetails,
  getMyLimits,
  connectToPrimary,
  acceptConnectionRequest,
};

