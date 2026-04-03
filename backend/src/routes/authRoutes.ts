// routes/authRoutes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Send OTP (rate limited)
router.post(
  '/send-otp',
  authLimiter,
  [
    body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number required'),
    body('mode').optional().isIn(['login', 'signup']).withMessage('Mode must be login or signup'),
  ],
  validate,
  authController.sendOTP
);

// Verify OTP and login/register
router.post(
  '/verify-otp',
  authLimiter,
  [
    body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number required'),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
    body('userType').optional().isIn(['primary', 'linked']).withMessage('User type must be primary or linked'),
    body('mode').optional().isIn(['login', 'signup']).withMessage('Mode must be login or signup'),
  ],
  validate,
  authController.verifyOTP
);

// Get current user profile
router.get('/me', authenticate, authController.getMe);

// Logout
router.post('/logout', authenticate, authController.logout);

// Update profile
router.put(
  '/profile',
  authenticate,
  [
    body('name').optional().isString().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
    body('dateOfBirth').optional().isISO8601().withMessage('Valid date of birth required'),
    body('gender').optional().isIn(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY', 'male', 'female', 'other', '']).withMessage('Valid gender required'),
    body('address').optional().isString().trim().isLength({ max: 200 }),
    body('city').optional().isString().trim().isLength({ max: 50 }),
    body('state').optional().isString().trim().isLength({ max: 50 }),
    body('pincode').optional().isString().trim().matches(/^[0-9]{6}$/).withMessage('Pincode must be 6 digits'),
    body('country').optional().isString().trim().isLength({ min: 2, max: 2 }),
    body('alternatePhone').optional().isString().trim().matches(/^[0-9]{10}$/).withMessage('Alternate phone must be 10 digits'),
    body('occupation').optional().isString().trim().isLength({ max: 50 }),
  ],
  validate,
  authController.updateProfile
);

// Change PIN (with validation)
router.put(
  '/change-pin',
  authenticate,
  [
    body('oldPin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('Old PIN must be 4 digits'),
    body('newPin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('New PIN must be 4 digits'),
  ],
  validate,
  authController.changePin
);

// Set PIN (first time)
router.put(
  '/set-pin',
  authenticate,
  [body('pin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits')],
  validate,
  authController.setPin
);

// Forgot PIN - send OTP
router.post(
  '/forgot-pin/send-otp',
  authLimiter,
  [body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number required')],
  validate,
  authController.forgotPinSendOtp
);

// Forgot PIN - verify OTP and set new PIN
router.post(
  '/forgot-pin/verify',
  authLimiter,
  [
    body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number required'),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
    body('newPin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('New PIN must be 4 digits'),
  ],
  validate,
  authController.forgotPinVerify
);

export default router;