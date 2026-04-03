// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

// Configure limits based on environment
const isDevelopment = process.env.NODE_ENV === 'development';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 5, // 5 attempts in production
  message: { success: false, message: 'Too many attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDevelopment ? 1000 : 60, // 60 requests per minute in production
  message: { success: false, message: 'Too many requests, slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDevelopment ? 1000 : 10, // 10 payment attempts per minute in production
  message: { success: false, message: 'Too many payment attempts, please wait' },
  standardHeaders: true,
  legacyHeaders: false,
});