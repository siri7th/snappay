// services/invitationService.ts
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import notificationService from './notificationService';
import { generateInviteCode } from '../utils/helpers';
import { INVITATION_STATUS, NOTIFICATION_TYPES, LIMITS } from '../utils/constants';
import { CreateInvitationDto, InvitationResponse } from '../types/invitation.types';

class InvitationService {
  // Calculate expiry date (default: 7 days)
  private calculateExpiryDate(days: number = 7): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  // Format invitation response (remove sensitive/internal data)
  private formatInvitationResponse(invitation: any): InvitationResponse {
    return {
      id: invitation.id,
      inviteCode: invitation.inviteCode,
      primaryId: invitation.primaryId,
      primaryName: invitation.primary?.name || 'Family Account',
      primaryPhone: invitation.primary?.phone,
      primaryEmail: invitation.primary?.email,
      phone: invitation.invitedPhone,
      relationship: invitation.relationship,
      dailyLimit: Number(invitation.dailyLimit),
      monthlyLimit: Number(invitation.monthlyLimit),
      perTransactionLimit: Number(invitation.perTransactionLimit),
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    };
  }

  // Validate invitation
  private validateInvitation(invitation: any, userPhone: string) {
    if (invitation.invitedPhone !== userPhone) {
      throw new AppError('This invitation was not sent to you', 403);
    }
    if (invitation.status !== INVITATION_STATUS.PENDING) {
      throw new AppError(`This invitation has already been ${invitation.status.toLowerCase()}`, 400);
    }
    if (invitation.expiresAt < new Date()) {
      throw new AppError('This invitation has expired', 400);
    }
  }

  // ========== MAIN METHODS ==========

  /**
   * Create a new invitation (primary user)
   */
  async createInvitation(
    primaryId: string,
    primaryName: string | null,
    primaryPhone: string,
    data: CreateInvitationDto
  ) {
    const { phone, relationship, dailyLimit, monthlyLimit, perTransactionLimit } = data;

    // Validate phone number
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      throw new AppError('Please enter a valid 10-digit phone number', 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { phone } });

    if (existingUser) {
      // Check if already in family
      const existingMember = await prisma.familyMember.findFirst({
        where: { primaryId, linkedId: existingUser.id },
      });
      if (existingMember) {
        throw new AppError('User is already in your family', 400);
      }

      // Check if there's a pending invitation
      const existingInvite = await prisma.invitation.findFirst({
        where: {
          invitedPhone: phone,
          primaryId,
          status: INVITATION_STATUS.PENDING,
          expiresAt: { gt: new Date() },
        },
      });
      if (existingInvite) {
        throw new AppError('An invitation has already been sent to this number', 400);
      }
    } else {
      // Check for pending invitation for non-user
      const existingInvite = await prisma.invitation.findFirst({
        where: {
          invitedPhone: phone,
          primaryId,
          status: INVITATION_STATUS.PENDING,
          expiresAt: { gt: new Date() },
        },
      });
      if (existingInvite) {
        throw new AppError('An invitation has already been sent to this number', 400);
      }
    }

    // Generate unique invite code
    const inviteCode = generateInviteCode();

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        inviteCode,
        primaryId,
        invitedPhone: phone,
        invitedUserId: existingUser?.id,
        relationship: relationship || 'Family Member',
        dailyLimit: dailyLimit || LIMITS.DEFAULT_DAILY,
        monthlyLimit: monthlyLimit || LIMITS.DEFAULT_MONTHLY,
        perTransactionLimit: perTransactionLimit || LIMITS.DEFAULT_PER_TXN,
        expiresAt: this.calculateExpiryDate(7),
        status: INVITATION_STATUS.PENDING,
      },
      include: { primary: { select: { name: true, phone: true, email: true } } },
    });

    // Send notifications
    await this.sendInvitationNotifications(existingUser, invitation, primaryName, primaryPhone);

    return this.formatInvitationResponse(invitation);
  }

  /**
   * Send notifications for invitation
   */
  private async sendInvitationNotifications(
    existingUser: any,
    invitation: any,
    primaryName: string | null,
    primaryPhone: string
  ) {
    if (existingUser) {
      // In-app notification
      await notificationService.create({
        userId: existingUser.id,
        type: NOTIFICATION_TYPES.FAMILY_INVITATION,
        title: 'Family Invitation',
        message: `${primaryName || 'Someone'} has invited you to join their family as a ${invitation.relationship}`,
        data: {
          invitationId: invitation.id,
          inviteCode: invitation.inviteCode,
          primaryId: invitation.primaryId,
          primaryName,
          primaryPhone,
          relationship: invitation.relationship,
          dailyLimit: Number(invitation.dailyLimit),
          monthlyLimit: Number(invitation.monthlyLimit),
          expiresAt: invitation.expiresAt,
        },
      });

      // Optionally send SMS (implementation omitted)
    } else {
      // Send SMS to non-user with instructions (implementation omitted)
    }
  }

  /**
   * Get invitation by code
   */
  async getInvitationByCode(code: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { inviteCode: code },
      include: {
        primary: { select: { id: true, name: true, phone: true, email: true } },
        invitedUser: { select: { id: true, name: true, phone: true } },
      },
    });

    if (!invitation) {
      throw new AppError('Invalid invitation code', 404);
    }

    return this.formatInvitationResponse(invitation);
  }

  /**
   * Get invitation by ID
   */
  async getInvitationById(id: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: {
        primary: { select: { id: true, name: true, phone: true, email: true } },
        invitedUser: { select: { id: true, name: true, phone: true } },
      },
    });

    if (!invitation) {
      throw new AppError('Invitation not found', 404);
    }

    return this.formatInvitationResponse(invitation);
  }

  /**
   * Get pending invitations for a user by userId
   */
  async getPendingInvitationsByUserId(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return this.getPendingInvitationsByPhone(user.phone);
  }

  /**
   * Get pending invitations for a user by phone
   */
  async getPendingInvitationsByPhone(phone: string) {
    const invitations = await prisma.invitation.findMany({
      where: {
        invitedPhone: phone,
        status: INVITATION_STATUS.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: {
        primary: { select: { id: true, name: true, phone: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => this.formatInvitationResponse(inv));
  }

  /**
   * Get all pending invitations sent by a primary user
   */
  async getPrimaryPendingInvitations(primaryId: string) {
    const invitations = await prisma.invitation.findMany({
      where: {
        primaryId,
        status: INVITATION_STATUS.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedUser: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      inviteCode: inv.inviteCode,
      invitedPhone: inv.invitedPhone,
      invitedUser: inv.invitedUser,
      relationship: inv.relationship,
      dailyLimit: Number(inv.dailyLimit),
      monthlyLimit: Number(inv.monthlyLimit),
      perTransactionLimit: Number(inv.perTransactionLimit),
      status: inv.status,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
    }));
  }

  /**
   * Accept invitation by ID (for linked users)
   */
  async acceptInvitation(invitationId: string, userId: string, userPhone: string, userName: string | null) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { primary: true },
    });

    if (!invitation) {
      throw new AppError('Invitation not found', 404);
    }

    // Validate invitation
    this.validateInvitation(invitation, userPhone);

    // Check if user is already in any family
    const existingFamily = await prisma.familyMember.findFirst({
      where: { linkedId: userId, status: { in: ['ACTIVE', 'PENDING'] } },
    });

    if (existingFamily) {
      throw new AppError('You are already part of a family', 400);
    }

    // Check if already linked to this specific primary
    const existingLink = await prisma.familyMember.findFirst({
      where: { primaryId: invitation.primaryId, linkedId: userId },
    });

    if (existingLink) {
      throw new AppError('You are already linked to this primary account', 400);
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create family member
      const familyMember = await tx.familyMember.create({
        data: {
          primaryId: invitation.primaryId,
          linkedId: userId,
          relationship: invitation.relationship || 'Family Member',
          dailyLimit: invitation.dailyLimit,
          monthlyLimit: invitation.monthlyLimit,
          perTransactionLimit: invitation.perTransactionLimit,
          dailySpent: 0,
          monthlySpent: 0,
          status: 'ACTIVE',
          permissions: JSON.stringify({
            sendMoney: true,
            scanPay: true,
            recharge: true,
            viewHistory: true,
          }),
        },
      });

      // Update invitation status
      await tx.invitation.update({
        where: { id: invitationId },
        data: {
          status: INVITATION_STATUS.ACCEPTED,
          invitedUserId: userId,
          acceptedAt: new Date(),
        },
      });

      return familyMember;
    });

    // Notify primary
    await notificationService.create({
      userId: invitation.primaryId,
      type: NOTIFICATION_TYPES.FAMILY_JOINED,
      title: 'Family Member Joined',
      message: `${userName || userPhone} has accepted your invitation and joined your family`,
      data: { linkedUserId: userId, familyMemberId: result.id, relationship: invitation.relationship },
    });

    return {
      primaryId: invitation.primaryId,
      primaryName: invitation.primary.name,
      familyMemberId: result.id,
      limits: {
        daily: Number(result.dailyLimit),
        monthly: Number(result.monthlyLimit),
        perTransaction: Number(result.perTransactionLimit),
      },
    };
  }

  /**
   * Accept invitation by code (for linked users)
   */
  async acceptInvitationByCode(inviteCode: string, userId: string, userPhone: string, userName: string | null) {
    const invitation = await prisma.invitation.findUnique({
      where: { inviteCode },
      include: { primary: true },
    });

    if (!invitation) {
      throw new AppError('Invalid invitation code', 404);
    }

    return this.acceptInvitation(invitation.id, userId, userPhone, userName);
  }

  /**
   * Accept connection request (for primary users)
   * This is called when a primary accepts a linked user's manual connection request
   */
  async acceptConnectionRequest(
    invitationId: string,
    primaryId: string,
    primaryPhone: string,
    primaryName: string | null
  ) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { primary: true, invitedUser: true },
    });

    if (!invitation) {
      throw new AppError('Invitation not found', 404);
    }

    if (invitation.primaryId !== primaryId) {
      throw new AppError('This invitation does not belong to you', 403);
    }

    if (invitation.status !== INVITATION_STATUS.PENDING) {
      throw new AppError(`This invitation has already been ${invitation.status.toLowerCase()}`, 400);
    }

    if (invitation.expiresAt < new Date()) {
      throw new AppError('This invitation has expired', 400);
    }

    const invitedUser = await prisma.user.findUnique({ where: { phone: invitation.invitedPhone } });
    if (!invitedUser) {
      throw new AppError('The invited user has not registered yet', 400);
    }

    const existingFamily = await prisma.familyMember.findFirst({
      where: { linkedId: invitedUser.id, status: { in: ['ACTIVE', 'PENDING'] } },
    });
    if (existingFamily) {
      throw new AppError('This user is already part of a family', 400);
    }

    const existingLink = await prisma.familyMember.findFirst({
      where: { primaryId: invitation.primaryId, linkedId: invitedUser.id },
    });
    if (existingLink) {
      throw new AppError('This user is already linked to your account', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const familyMember = await tx.familyMember.create({
        data: {
          primaryId: invitation.primaryId,
          linkedId: invitedUser.id,
          relationship: invitation.relationship || 'Family Member',
          dailyLimit: invitation.dailyLimit,
          monthlyLimit: invitation.monthlyLimit,
          perTransactionLimit: invitation.perTransactionLimit,
          dailySpent: 0,
          monthlySpent: 0,
          status: 'ACTIVE',
          permissions: JSON.stringify({
            sendMoney: true,
            scanPay: true,
            recharge: true,
            viewHistory: true,
          }),
        },
      });

      await tx.invitation.update({
        where: { id: invitationId },
        data: { status: INVITATION_STATUS.ACCEPTED, invitedUserId: invitedUser.id, acceptedAt: new Date() },
      });

      return familyMember;
    });

    await notificationService.create({
      userId: invitedUser.id,
      type: NOTIFICATION_TYPES.CONNECTION_APPROVED,
      title: 'Connection Approved!',
      message: `Your request to connect has been approved by ${primaryName || 'the primary account'}`,
      data: { primaryId: invitation.primaryId, primaryName, familyMemberId: result.id },
    });

    return {
      success: true,
      message: 'Connection request accepted',
      data: {
        familyMemberId: result.id,
        linkedUserId: invitedUser.id,
        linkedName: invitedUser.name,
        linkedPhone: invitedUser.phone,
        limits: {
          daily: Number(result.dailyLimit),
          monthly: Number(result.monthlyLimit),
          perTransaction: Number(result.perTransactionLimit),
        },
      },
    };
  }

  /**
   * Reject invitation (for invited user)
   */
  async rejectInvitation(invitationId: string, userId: string, userPhone: string, userName: string | null) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { primary: true },
    });

    if (!invitation) {
      throw new AppError('Invitation not found', 404);
    }

    if (invitation.invitedPhone !== userPhone) {
      throw new AppError('This invitation was not sent to you', 403);
    }

    if (invitation.status !== INVITATION_STATUS.PENDING) {
      throw new AppError(`This invitation has already been ${invitation.status.toLowerCase()}`, 400);
    }

    if (invitation.expiresAt < new Date()) {
      throw new AppError('This invitation has expired', 400);
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: INVITATION_STATUS.REJECTED },
    });

    await notificationService.create({
      userId: invitation.primaryId,
      type: NOTIFICATION_TYPES.INVITATION_REJECTED,
      title: 'Invitation Rejected',
      message: `${userName || userPhone} has declined your family invitation`,
      data: { linkedUserId: userId, phone: userPhone },
    });

    return { success: true };
  }

  /**
   * Cancel invitation (primary user cancels a sent invitation)
   */
  async cancelInvitation(invitationId: string, primaryId: string) {
    const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });

    if (!invitation) {
      throw new AppError('Invitation not found', 404);
    }

    if (invitation.primaryId !== primaryId) {
      throw new AppError('You can only cancel invitations you sent', 403);
    }

    if (invitation.status !== INVITATION_STATUS.PENDING) {
      throw new AppError(`This invitation has already been ${invitation.status.toLowerCase()}`, 400);
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: INVITATION_STATUS.CANCELLED },
    });

    if (invitation.invitedUserId) {
      await notificationService.create({
        userId: invitation.invitedUserId,
        type: NOTIFICATION_TYPES.INVITATION_CANCELLED,
        title: 'Invitation Cancelled',
        message: 'Your family invitation has been cancelled by the primary account',
        data: { invitationId },
      });
    }

    return { success: true };
  }

  /**
   * Clean up expired invitations
   */
  async cleanupExpiredInvitations() {
    const result = await prisma.invitation.updateMany({
      where: {
        status: INVITATION_STATUS.PENDING,
        expiresAt: { lt: new Date() },
      },
      data: { status: INVITATION_STATUS.EXPIRED },
    });

    return result.count;
  }
}

export default new InvitationService();