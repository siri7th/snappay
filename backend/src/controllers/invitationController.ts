// controllers/invitationController.ts
import { Request, Response, NextFunction } from 'express';
import invitationService from '../services/invitationService';
import { AppError } from '../middleware/errorHandler';
import { CreateInvitationDto } from '../types/invitation.types';
import logger from '../utils/logger';

class InvitationController {
  
  /**
   * Create new invitation (primary only)
   * POST /api/invitations
   */
  async createInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const primaryId = req.user?.userId;
      const primaryName = req.user?.name || null;
      const primaryPhone = req.user?.phone;
      
      if (!primaryId || !primaryPhone) {
        throw new AppError('User not authenticated', 401);
      }

      const invitationData: CreateInvitationDto = req.body;
      
      const invitation = await invitationService.createInvitation(
        primaryId,
        primaryName,
        primaryPhone,
        invitationData
      );

      logger.info(`Invitation created by primary ${primaryId} for ${invitationData.phone}`);

      res.status(200).json({
        success: true,
        message: 'Invitation sent successfully',
        data: invitation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending invitations for current user (linked or primary)
   * GET /api/invitations/pending
   */
  async getPendingInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const invitations = await invitationService.getPendingInvitationsByUserId(userId);

      res.status(200).json({
        success: true,
        data: invitations
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accept invitation by ID (linked user)
   * POST /api/invitations/:invitationId/accept
   */
  async acceptInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invitationId } = req.params;
      const userId = req.user?.userId;
      const userPhone = req.user?.phone;
      const userName = req.user?.name || null;

      if (!userId || !userPhone) {
        throw new AppError('User not authenticated', 401);
      }

      // 🔥 FIXED: Validate invitationId
      if (!invitationId) {
        throw new AppError('Invitation ID is required', 400);
      }

      const result = await invitationService.acceptInvitation(
        invitationId,
        userId,
        userPhone,
        userName
      );

      logger.info(`Invitation ${invitationId} accepted by user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Invitation accepted successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject invitation (linked user)
   * POST /api/invitations/:invitationId/reject
   */
  async rejectInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invitationId } = req.params;
      const userId = req.user?.userId;
      const userPhone = req.user?.phone;
      const userName = req.user?.name || null;

      if (!userId || !userPhone) {
        throw new AppError('User not authenticated', 401);
      }

      // 🔥 FIXED: Validate invitationId
      if (!invitationId) {
        throw new AppError('Invitation ID is required', 400);
      }

      await invitationService.rejectInvitation(
        invitationId,
        userId,
        userPhone,
        userName
      );

      logger.info(`Invitation ${invitationId} rejected by user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Invitation rejected'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new InvitationController();