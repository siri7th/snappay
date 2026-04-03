// routes/walletRoutes.ts
import { Router } from 'express';
import { body, query, param } from 'express-validator';
import walletController from '../controllers/walletController';
import { authenticate, requirePrimary } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All wallet routes require authentication
router.use(authenticate);

/**
 * Get wallet balance
 * GET /api/wallet/balance
 */
router.get('/balance', walletController.getBalance);

/**
 * Get wallet transactions with pagination
 * GET /api/wallet/transactions
 */
router.get(
  '/transactions',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('type').optional().isString(),
    query('fromDate').optional().isISO8601().withMessage('Invalid from date format'),
    query('toDate').optional().isISO8601().withMessage('Invalid to date format'),
  ],
  validate,
  walletController.getTransactions
);

/**
 * Get wallet statistics
 * GET /api/wallet/stats
 */
router.get('/stats', walletController.getWalletStats);

/**
 * Get single transaction by ID
 * GET /api/wallet/transactions/:id
 */
router.get(
  '/transactions/:id',
  [param('id').isString().notEmpty().withMessage('Transaction ID is required')],
  validate,
  walletController.getTransactionById
);

/**
 * Add money to wallet from bank
 * POST /api/wallet/add
 */
router.post(
  '/add',
  [
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    body('bankId').isString().notEmpty().withMessage('Bank account is required'),
  ],
  validate,
  walletController.addMoney
);

/**
 * Withdraw money from wallet to bank
 * POST /api/wallet/withdraw
 */
router.post(
  '/withdraw',
  [
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    body('bankId').isString().notEmpty().withMessage('Bank account is required'),
  ],
  validate,
  walletController.withdrawMoney
);

/**
 * Get individual family member's wallet balance (primary only)
 * GET /api/wallet/member/:memberId
 */
router.get(
  '/member/:memberId',
  requirePrimary,
  [param('memberId').isString().notEmpty()],
  validate,
  walletController.getMemberWalletBalance
);

/**
 * Get multiple family members' wallet balances (primary only)
 * POST /api/wallet/members/balances
 */
router.post(
  '/members/balances',
  requirePrimary,
  [
    body('memberIds').isArray().withMessage('Member IDs array is required'),
    body('memberIds.*').isString().notEmpty(),
  ],
  validate,
  walletController.getAllMemberBalances
);

export default router;