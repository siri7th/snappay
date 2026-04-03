// routes/bankRoutes.ts
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import bankController from '../controllers/bankController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All bank routes require authentication
router.use(authenticate);

// Get all banks for user
router.get('/', bankController.getUserBanks);

// Add new bank account
router.post(
  '/',
  [
    body('bankName').isString().notEmpty().withMessage('Bank name is required'),
    body('accountNumber').isLength({ min: 9, max: 18 }).isNumeric().withMessage('Account number must be 9-18 digits'),
    body('ifscCode').matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Invalid IFSC code format'),
    body('accountHolder').isString().notEmpty().withMessage('Account holder name is required'),
    // Balance is NOT accepted from client for security
  ],
  validate,
  bankController.addBankAccount
);

// Get bank by ID
router.get(
  '/:id',
  [param('id').isString().notEmpty().withMessage('Bank ID is required')],
  validate,
  bankController.getBankById
);

// Update bank account
router.put(
  '/:id',
  [
    param('id').isString().notEmpty(),
    body('bankName').optional().isString(),
    body('accountHolder').optional().isString(),
    body('isDefault').optional().isBoolean(),
  ],
  validate,
  bankController.updateBankAccount
);

// Delete bank account
router.delete(
  '/:id',
  [param('id').isString().notEmpty()],
  validate,
  bankController.deleteBankAccount
);

// Verify bank account (simulated)
router.post(
  '/:id/verify',
  [param('id').isString().notEmpty()],
  validate,
  bankController.verifyBankAccount
);

// Get transactions for a bank account
router.get(
  '/:id/transactions',
  [
    param('id').isString().notEmpty(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  bankController.getBankTransactions
);

// Set bank as default
router.post(
  '/:id/default',
  [param('id').isString().notEmpty()],
  validate,
  bankController.setDefaultBank
);

export default router;