// routes/rechargeRoutes.ts
import { Router } from 'express';
import { body, query } from 'express-validator';
import rechargeController from '../controllers/rechargeController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { paymentLimiter } from '../middleware/rateLimiter';

const router = Router();

// All recharge routes require authentication
router.use(authenticate);

/**
 * Get recharge plans
 * GET /api/recharge/plans
 */
router.get(
  '/plans',
  [query('type').optional().isIn(['mobile', 'electricity', 'fastag', 'dth'])],
  validate,
  rechargeController.getPlans
);

/**
 * Get recharge history
 * GET /api/recharge/history
 */
router.get(
  '/history',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('type').optional().isString(),
  ],
  validate,
  rechargeController.getHistory
);

/**
 * Mobile recharge
 * POST /api/recharge/mobile
 */
router.post(
  '/mobile',
  paymentLimiter,
  [
    body('mobileNumber').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit mobile number required'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    body('pin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits'),
    body('operator').isString().notEmpty().withMessage('Operator is required'),
    body('planId').optional().isString(),
    body('paymentMethod').optional().isIn(['wallet', 'bank']).withMessage('Payment method must be wallet or bank'),
    body('bankId').optional().isString().notEmpty(),
  ],
  validate,
  rechargeController.mobileRecharge
);

/**
 * Electricity bill payment
 * POST /api/recharge/electricity
 */
router.post(
  '/electricity',
  paymentLimiter,
  [
    body('consumerNumber').isString().notEmpty().withMessage('Consumer number is required'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    body('pin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits'),
    body('board').isString().notEmpty().withMessage('Electricity board is required'),
    body('paymentMethod').optional().isIn(['wallet', 'bank']),
    body('bankId').optional().isString().notEmpty(),
  ],
  validate,
  rechargeController.electricityBill
);

/**
 * FASTag recharge
 * POST /api/recharge/fastag
 */
router.post(
  '/fastag',
  paymentLimiter,
  [
    body('vehicleNumber').isString().notEmpty().withMessage('Vehicle number is required'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    body('pin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits'),
    body('paymentMethod').optional().isIn(['wallet', 'bank']),
    body('bankId').optional().isString().notEmpty(),
  ],
  validate,
  rechargeController.fastagRecharge
);

export default router;