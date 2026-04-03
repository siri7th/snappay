// routes/accountRemovalRoutes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import accountRemovalController from '../controllers/accountRemovalController';
import { authenticate, requirePrimary, requireLinked } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { requirePasswordVerification, requireOTPVerification } from '../middleware/security';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get removal summary (preview)
// - Primary: can view any member summary
// - Linked: can view their own summary
router.get(
  '/summary/:memberId?',
  [param('memberId').optional().isString().notEmpty()],
  validate,
  accountRemovalController.getRemovalSummary
);

// Request OTP for disconnection (linked users only)
router.post(
  '/request-otp',
  requireLinked,
  authLimiter, // Rate limit OTP requests
  accountRemovalController.requestDisconnectOTP
);

// Primary removes a family member
router.post(
  '/remove-member',
  requirePrimary,
  [
    body('memberId').isString().notEmpty().withMessage('Member ID is required'),
    body('password').isString().notEmpty().withMessage('Password is required'),
    body('transferBalance').optional().isBoolean()
  ],
  validate,
  requirePasswordVerification, // Middleware checks password
  accountRemovalController.removeFamilyMember
);

// Linked user disconnects from primary
router.post(
  '/disconnect',
  requireLinked,
  [
    body('password').isString().notEmpty().withMessage('Password is required'),
    body('otp').isString().notEmpty().withMessage('OTP is required'),
    body('transferBalance').optional().isBoolean()
  ],
  validate,
  requirePasswordVerification, // Check password first
  requireOTPVerification,      // Then OTP
  accountRemovalController.disconnectFromPrimary
);

export default router;