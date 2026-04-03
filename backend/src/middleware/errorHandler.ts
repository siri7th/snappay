// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { MulterError } from 'multer';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(`${err.name}: ${err.message} ${err.stack || ''}`);

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // Unique constraint violation
        error = new AppError('Duplicate entry already exists', 400);
        break;
      case 'P2025': // Record not found
        error = new AppError('Record not found', 404);
        break;
      case 'P2003': // Foreign key constraint failed
        error = new AppError('Related record does not exist', 400);
        break;
      default:
        error = new AppError('Database operation failed', 400);
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    error = new AppError('Invalid data provided to database', 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  }

  // Multer errors
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new AppError('File too large. Max size is 5MB', 400);
    } else {
      error = new AppError(`File upload error: ${err.message}`, 400);
    }
  }

  const statusCode = (error as AppError).statusCode || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};