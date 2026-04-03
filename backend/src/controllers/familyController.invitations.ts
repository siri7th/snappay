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

const inviteMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
};

const generateInviteCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
};

const getPendingInvitations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('User not authenticated', 401);

    const invitations = await invitationService.getPendingInvitationsByUserId(userId);
    res.status(200).json({ success: true, data: invitations });
  } catch (error) {
    next(error);
  }
};

const getInvitationByCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { code } = req.params;
    if (!code) throw new AppError('Invitation code is required', 400);

    const invitation = await invitationService.getInvitationByCode(code);
    res.status(200).json({ success: true, data: invitation });
  } catch (error) {
    next(error);
  }
};

const acceptInvitationById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
};

const acceptInvitationByCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
};

const rejectInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
};

const cancelInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
};

const createLimitRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
};

const getRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
};

const approveRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
};

const denyRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
};

const getPendingAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
    const formattedRequests = pendingRequests.map((r) => ({ ...r, amount: Number(r.amount) }));

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
};

const generateQRCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
};

export default {
  // Invitations
  inviteMember,
  generateInviteCode,
  getPendingInvitations,
  getInvitationByCode,
  acceptInvitationById,
  acceptInvitationByCode,
  rejectInvitation,
  cancelInvitation,

  // Limit requests + approvals
  createLimitRequest,
  getRequests,
  approveRequest,
  denyRequest,

  // Bulk / QR
  getPendingAll,
  generateQRCode,
};

