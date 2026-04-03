// routes/paymentRoutes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import paymentController from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { paymentLimiter } from '../middleware/rateLimiter';

const router = Router();

// All payment routes require authentication
router.use(authenticate);

/**
 * Send money to mobile number
 * POST /api/payments/send/mobile
 */
router.post(
  '/send/mobile',
  paymentLimiter,
  [
    body('toMobile').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit mobile number required'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    body('pin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits'),
    body('note').optional().isString().trim().isLength({ max: 100 }),
    body('paymentMethod').optional().isIn(['wallet', 'bank']).withMessage('Payment method must be wallet or bank'),
    body('bankId').optional().isString().notEmpty(),
  ],
  validate,
  paymentController.sendToMobile
);

/**
 * Send money to bank account
 * POST /api/payments/send/bank
 */
router.post(
  '/send/bank',
  paymentLimiter,
  [
    body('accountNumber').isLength({ min: 9, max: 18 }).isNumeric().withMessage('Valid account number required'),
    body('ifscCode').matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Valid IFSC code required'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    body('pin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits'),
    body('note').optional().isString().trim().isLength({ max: 100 }),
    body('paymentMethod').optional().isIn(['wallet', 'bank']).withMessage('Payment method must be wallet or bank'),
    body('bankId').optional().isString().notEmpty(),
  ],
  validate,
  paymentController.sendToBank
);

/**
 * Process QR payment
 * POST /api/payments/qr
 */
router.post(
  '/qr',
  paymentLimiter,
  [
    body('qrData').isString().notEmpty().withMessage('QR data is required'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    body('pin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits'),
    body('paymentMethod').optional().isIn(['wallet', 'bank']).withMessage('Payment method must be wallet or bank'),
    body('bankId').optional().isString().notEmpty(),
  ],
  validate,
  paymentController.processQRPayment
);

/**
 * Request money from someone
 * POST /api/payments/request
 */
router.post(
  '/request',
  [
    body('fromPhone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number required'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    body('note').optional().isString().trim().isLength({ max: 100 }),
  ],
  validate,
  paymentController.requestMoney
);

/**
 * Get transaction by ID
 * GET /api/payments/:id
 */
router.get(
  '/:id',
  [param('id').isString().notEmpty().withMessage('Transaction ID is required')],
  validate,
  paymentController.getTransactionById
);

export default router;