// controllers/accountRemovalController.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import accountRemovalService from '../services/accountRemovalService';
import { requirePasswordVerification, requireOTPVerification } from '../middleware/security';
import notificationService from '../services/notificationService';
import otpService from '../services/otpService';
import { OTP_PURPOSES } from '../utils/constants';
import logger from '../utils/logger';
import prisma from '../config/database';

class AccountRemovalController {
  
  /**
   * Primary removes a family member
   * POST /api/account/remove-member
   * Requires: password verification (handled by middleware)
   */
  async removeFamilyMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { memberId, transferBalance = true } = req.body;
      const primaryId = req.user?.userId;

      if (!primaryId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!memberId) {
        throw new AppError('Member ID is required', 400);
      }

      // Perform removal
      const result = await accountRemovalService.removeFamilyMember(
        primaryId,
        memberId,
        transferBalance
      );

      logger.info(`Primary ${primaryId} removed family member ${memberId}`);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          transferredAmount: result.transferredAmount,
          remainingBalance: result.remainingBalance
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Linked user disconnects from primary
   * POST /api/account/disconnect
   * Requires: password + OTP verification (handled by middleware)
   */
  async disconnectFromPrimary(req: Request, res: Response, next: NextFunction) {
    try {
      const { transferBalance = true } = req.body;
      const linkedId = req.user?.userId;

      if (!linkedId) {
        throw new AppError('User not authenticated', 401);
      }

      // Perform disconnection
      const result = await accountRemovalService.disconnectFromPrimary(
        linkedId,
        transferBalance
      );

      logger.info(`Linked user ${linkedId} disconnected from primary`);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          transferredAmount: result.transferredAmount,
          remainingBalance: result.remainingBalance
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get removal summary (preview what will happen)
   * GET /api/account/summary/:memberId?
   */
  async getRemovalSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { memberId } = req.params;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const summary = await accountRemovalService.getRemovalSummary(userId, memberId);

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request OTP for disconnection (linked users only)
   * POST /api/account/request-otp
   */
  async requestDisconnectOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Send OTP using otpService (which handles cooldown, storage, etc.)
      await otpService.sendOTP(user.phone, OTP_PURPOSES.DISCONNECT);

      logger.info(`Disconnect OTP requested for user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AccountRemovalController();