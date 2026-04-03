// src/middleware/security.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import otpService from '../services/otpService';
import { OTP_PURPOSES } from '../utils/constants';
import logger from '../utils/logger';

/**
 * Verify password for a user
 */
export const verifyPassword = async (userId: string, password: string): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pin: true },
    });

    if (!user || !user.pin) {
      return false;
    }

    return await bcrypt.compare(password, user.pin);
  } catch (error) {
    logger.error('Password verification error:', error);
    return false;
  }
};

/**
 * Middleware to verify password before proceeding
 */
export const requirePasswordVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { password } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    if (!password) {
      throw new AppError('Password is required', 400);
    }

    const isValid = await verifyPassword(userId, password);

    if (!isValid) {
      throw new AppError('Invalid password', 401);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP
 */
export const verifyOTP = async (phone: string, otp: string, purpose: string): Promise<boolean> => {
  return otpService.verifyOTP(phone, otp, purpose);
};

/**
 * Middleware to verify OTP before proceeding
 */
export const requireOTPVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { otp } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Get user's phone
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!otp) {
      throw new AppError('OTP is required', 400);
    }

    const isValid = await verifyOTP(user.phone, otp, OTP_PURPOSES.DISCONNECT); // Purpose can be dynamic

    if (!isValid) {
      throw new AppError('Invalid or expired OTP', 401);
    }

    next();
  } catch (error) {
    next(error);
  }
};