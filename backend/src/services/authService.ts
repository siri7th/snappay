// services/authService.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { USER_STATUS } from '../utils/constants';

export class AuthService {
  /**
   * Generate JWT token
   */
  generateToken(userId: string, phone: string, role: string): string {
    return jwt.sign(
      { userId, phone, role },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
    );
  }

  /**
   * Generate refresh token (longer expiry)
   */
  generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );
  }

  /**
   * Hash a PIN
   */
  async hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, 10);
  }

  /**
   * Verify a PIN against a hash
   */
  async verifyPin(pin: string, hash: string): Promise<boolean> {
    return bcrypt.compare(pin, hash);
  }

  /**
   * Validate user access (active status)
   */
  async validateUserAccess(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });
    return user?.status === USER_STATUS.ACTIVE;
  }

  /**
   * Refresh token (generate new token from old one)
   */
  async refreshToken(oldToken: string): Promise<string> {
    try {
      const decoded = jwt.verify(oldToken, process.env.JWT_SECRET!) as any;
      // Check if it's a refresh token
      if (decoded.type !== 'refresh') {
        throw new AppError('Invalid token type', 401);
      }
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user || user.status !== USER_STATUS.ACTIVE) {
        throw new AppError('User not found or inactive', 401);
      }
      return this.generateToken(user.id, user.phone, user.role);
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }
}

export default new AuthService();