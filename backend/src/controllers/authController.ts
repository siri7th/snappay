// controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import otpService from '../services/otpService';
import authService from '../services/authService';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { USER_ROLES, USER_STATUS } from '../utils/constants';

const safeParsePreferences = (prefs: string | null | undefined): Record<string, any> => {
  if (!prefs) return {};
  try {
    const parsed = JSON.parse(prefs);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

class AuthController {
  /**
   * Send OTP to mobile number
   * POST /api/auth/send-otp
   */
// backend/src/controllers/authController.ts
  async sendOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, userType, mode = 'login' } = req.body;

      if (!phone) {
        throw new AppError('Phone number is required', 400);
      }

      const existingUser = await prisma.user.findUnique({
        where: { phone },
        select: { id: true },
      });

      if (mode === 'login' && !existingUser) {
        throw new AppError('Account not found. Please create account first.', 404);
      }
      if (mode === 'signup' && existingUser) {
        throw new AppError('Account already exists. Please login instead.', 409);
      }

      // Pass userType to the OTP service
      await otpService.sendOTP(phone, 'login', userType || 'primary');

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify OTP and create/return user
   * POST /api/auth/verify-otp
   */
  async verifyOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, otp, userType, mode = 'login' } = req.body;

      if (!phone || !otp) {
        throw new AppError('Phone and OTP are required', 400);
      }

      // Verify OTP
      await otpService.verifyOTP(phone, otp, 'login');

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { phone },
        include: {
          wallet: true,
          banks: true,
        },
      });

      const isNewUser = !user;

      if (mode === 'login' && !user) {
        throw new AppError('Account not found. Please create account first.', 404);
      }
      if (mode === 'signup' && user) {
        throw new AppError('Account already exists. Please login instead.', 409);
      }

      if (!user) {
        // Create new user based on type
        user = await prisma.user.create({
          data: {
            phone,
            role: userType === 'primary' ? USER_ROLES.PRIMARY : USER_ROLES.LINKED,
            status: USER_STATUS.ACTIVE,
            wallet: {
              create: {
                balance: 0,
              },
            },
          },
          include: {
            wallet: true,
            banks: true,
          },
        });

        logger.info(`New user created: ${phone} as ${user.role}`);
      }

      // Generate JWT token
      const token = authService.generateToken(user.id, user.phone, user.role);

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return user data (excluding sensitive fields)
      const prefs = safeParsePreferences((user as any).preferences);
      const userData = {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        country: (user as any).country,
        alternatePhone: prefs.alternatePhone || null,
        occupation: prefs.occupation || null,
        walletBalance: user.wallet?.balance || 0,
        hasBank: (user.banks?.length || 0) > 0,
        profileComplete: user.profileComplete,
        hasPin: Boolean(user.pin),
      };

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          user: userData,
          token,
          isNewUser,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user?.userId },
        include: {
          wallet: true,
          banks: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              bankName: true,
              accountNumber: true,
              ifscCode: true,
              isDefault: true,
              isVerified: true,
            },
          },
          primaryFamily: {
            include: {
              linked: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
          linkedFamily: {
            include: {
              primary: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const prefs = safeParsePreferences((user as any).preferences);
      const userData = {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        country: (user as any).country,
        alternatePhone: prefs.alternatePhone || null,
        occupation: prefs.occupation || null,
        walletBalance: user.wallet?.balance || 0,
        hasBank: user.banks.length > 0,
        profileComplete: user.profileComplete,
        hasPin: Boolean(user.pin),
        banks: user.banks.map((bank) => ({
          id: bank.id,
          bankName: bank.bankName,
          accountNumber: `****${bank.accountNumber.slice(-4)}`,
          ifscCode: bank.ifscCode,
          isDefault: bank.isDefault,
          isVerified: bank.isVerified,
        })),
        family:
          user.role === USER_ROLES.PRIMARY
            ? user.primaryFamily.map((f) => ({
                id: f.linked.id,
                name: f.linked.name,
                phone: f.linked.phone,
                relationship: f.relationship,
                dailyLimit: Number(f.dailyLimit),
                monthlyLimit: Number(f.monthlyLimit),
                dailySpent: Number(f.dailySpent),
                monthlySpent: Number(f.monthlySpent),
                status: f.status,
              }))
            : user.linkedFamily
              ? {
                  id: user.linkedFamily.primary.id,
                  name: user.linkedFamily.primary.name,
                  phone: user.linkedFamily.primary.phone,
                  dailyLimit: Number(user.linkedFamily.dailyLimit),
                  monthlyLimit: Number(user.linkedFamily.monthlyLimit),
                  dailySpent: Number(user.linkedFamily.dailySpent),
                  monthlySpent: Number(user.linkedFamily.monthlySpent),
                }
              : null,
      };

      res.status(200).json({
        success: true,
        data: userData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set PIN for first time (no old PIN)
   * PUT /api/auth/set-pin
   */
  async setPin(req: Request, res: Response, next: NextFunction) {
    try {
      const { pin } = req.body;
      const userId = req.user?.userId;

      if (!userId) throw new AppError('User not authenticated', 401);
      if (!pin || typeof pin !== 'string' || pin.length !== 4 || !/^\d+$/.test(pin)) {
        throw new AppError('PIN must be 4 digits', 400);
      }

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { pin: true } });
      if (!user) throw new AppError('User not found', 404);
      if (user.pin) {
        throw new AppError('PIN already set. Use change PIN instead.', 400);
      }

      const hashedPin = await authService.hashPin(pin);
      await prisma.user.update({
        where: { id: userId },
        data: { pin: hashedPin },
      });

      res.status(200).json({ success: true, message: 'PIN set successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot PIN - send OTP
   * POST /api/auth/forgot-pin/send-otp
   */
  async forgotPinSendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone } = req.body;
      if (!phone) throw new AppError('Phone number is required', 400);

      const user = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
      if (!user) throw new AppError('User not found', 404);

      await otpService.sendOTP(phone, 'reset_pin');
      res.status(200).json({ success: true, message: 'OTP sent for PIN reset' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot PIN - verify OTP and set new PIN
   * POST /api/auth/forgot-pin/verify
   */
  async forgotPinVerify(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, otp, newPin } = req.body;
      if (!phone || !otp || !newPin) throw new AppError('Phone, OTP and new PIN are required', 400);
      if (typeof newPin !== 'string' || newPin.length !== 4 || !/^\d+$/.test(newPin)) {
        throw new AppError('New PIN must be 4 digits', 400);
      }

      await otpService.verifyOTP(phone, otp, 'reset_pin');

      const user = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
      if (!user) throw new AppError('User not found', 404);

      const hashedPin = await authService.hashPin(newPin);
      await prisma.user.update({ where: { id: user.id }, data: { pin: hashedPin } });

      res.status(200).json({ success: true, message: 'PIN reset successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie('token');
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        name,
        email,
        dateOfBirth,
        gender,
        address,
        city,
        state,
        pincode,
        country,
        alternatePhone,
        occupation,
      } = req.body;

      const existing = await prisma.user.findUnique({
        where: { id: req.user?.userId },
        select: { preferences: true },
      });

      const existingPrefs = safeParsePreferences(existing?.preferences);
      const updatedPrefs = {
        ...existingPrefs,
        ...(alternatePhone !== undefined ? { alternatePhone } : {}),
        ...(occupation !== undefined ? { occupation } : {}),
      };

      const user = await prisma.user.update({
        where: { id: req.user?.userId },
        data: {
          name: name || undefined,
          email: email || undefined,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender: gender || undefined,
          address: address || undefined,
          city: city || undefined,
          state: state || undefined,
          pincode: pincode || undefined,
          country: country || undefined,
          preferences: JSON.stringify(updatedPrefs),
          profileComplete: Boolean(name),
        },
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          name: user.name,
          email: user.email,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          address: user.address,
          city: user.city,
          state: user.state,
          pincode: user.pincode,
          country: (user as any).country,
          alternatePhone: updatedPrefs.alternatePhone || null,
          occupation: updatedPrefs.occupation || null,
          profileComplete: user.profileComplete,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change PIN (hashed)
   * PUT /api/auth/change-pin
   */
  async changePin(req: Request, res: Response, next: NextFunction) {
    try {
      const { oldPin, newPin } = req.body;

      if (!oldPin || !newPin) {
        throw new AppError('Old PIN and new PIN are required', 400);
      }

      if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
        throw new AppError('PIN must be 4 digits', 400);
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user?.userId },
        select: { pin: true },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify old PIN (if set)
      if (user.pin) {
        const isValid = await authService.verifyPin(oldPin, user.pin);
        if (!isValid) {
          throw new AppError('Invalid current PIN', 401);
        }
      }

      // Hash new PIN
      const hashedPin = await authService.hashPin(newPin);

      await prisma.user.update({
        where: { id: req.user?.userId },
        data: { pin: hashedPin },
      });

      logger.info(`PIN changed for user ${req.user?.userId}`);

      res.status(200).json({
        success: true,
        message: 'PIN changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();