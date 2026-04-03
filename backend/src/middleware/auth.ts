// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import prisma from '../config/database';
import logger from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        phone: string;
        role: string;
        name?: string | null;
        email?: string | null;
      };
    }
  }
}

/**
 * Generate JWT token for user
 */
export const generateToken = (user: { id: string; phone: string; role: string }): string => {
  return jwt.sign(
    { userId: user.id, phone: user.phone, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
  );
};

/**
 * Generate refresh token (longer expiry)
 */
export const generateRefreshToken = (id: string): string => {
  return jwt.sign(
    { userId: id, type: 'refresh' },
    process.env.JWT_SECRET as string,
    { expiresIn: '30d' }
  );
};

/**
 * Verify and decode token
 */
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string);
  } catch (error) {
    throw error;
  }
};

/**
 * Authentication middleware
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError('Please log in to access this resource', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    if (!decoded.userId) {
      throw new AppError('Invalid token format', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        phone: true,
        role: true,
        name: true,
        email: true,
        status: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new AppError('User no longer exists', 401);
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError(`Account is ${user.status.toLowerCase()}. Please contact support.`, 403);
    }

    req.user = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn(`JWT error: ${error.message}`);
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('JWT expired');
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }
    next(error);
  }
};

/**
 * Require primary account role
 */
export const requirePrimary = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }
  if (req.user.role !== 'PRIMARY') {
    return next(new AppError('This action requires a primary account', 403));
  }
  next();
};

/**
 * Require linked account role
 */
export const requireLinked = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }
  if (req.user.role !== 'LINKED') {
    return next(new AppError('This action requires a linked account', 403));
  }
  next();
};

/**
 * Optional authentication (does not throw if no token)
 */
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    if (!decoded.userId) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, phone: true, role: true, name: true, email: true, status: true },
    });

    if (user && user.status === 'ACTIVE') {
      req.user = {
        userId: user.id,
        phone: user.phone,
        role: user.role,
        name: user.name,
        email: user.email,
      };
    }

    next();
  } catch (error) {
    // Ignore errors, just proceed without user
    next();
  }
};

/**
 * Set token cookie in response
 */
export const setTokenCookie = (res: Response, token: string) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Clear token cookie
 */
export const clearTokenCookie = (res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
};