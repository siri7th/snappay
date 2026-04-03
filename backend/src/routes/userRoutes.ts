// routes/userRoutes.ts
import { Router } from 'express';
import { param, query } from 'express-validator';
import userController from '../controllers/userController';
import { authenticate, requirePrimary } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * Get all users (primary only)
 * GET /api/users
 */
router.get(
  '/',
  requirePrimary,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('role').optional().isIn(['PRIMARY', 'LINKED']),
    query('status').optional().isIn(['ACTIVE', 'PAUSED', 'BLOCKED', 'PENDING']),
  ],
  validate,
  userController.getAllUsers
);

/**
 * Get user statistics (primary only)
 * GET /api/users/stats
 */
router.get('/stats', requirePrimary, userController.getUserStats);

/**
 * Get user by ID (own profile or primary)
 * GET /api/users/:id
 */
router.get(
  '/:id',
  [param('id').isString().notEmpty().withMessage('User ID is required')],
  validate,
  userController.getUserById
);

/**
 * Update user status (primary only)
 * PUT /api/users/:id/status
 */
router.put(
  '/:id/status',
  requirePrimary,
  [
    param('id').isString().notEmpty(),
    query('status').isIn(['ACTIVE', 'PAUSED', 'BLOCKED']).withMessage('Invalid status'),
  ],
  validate,
  userController.updateUserStatus
);

/**
 * Delete user (soft delete, primary only)
 * DELETE /api/users/:id
 */
router.delete(
  '/:id',
  requirePrimary,
  [param('id').isString().notEmpty()],
  validate,
  userController.deleteUser
);

export default router;