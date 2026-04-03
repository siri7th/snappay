// routes/invitationRoutes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import invitationController from '../controllers/invitationController';
import { authenticate, requirePrimary } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

router.use(authenticate);

// Create invitation (primary only)
router.post(
  '/',
  requirePrimary,
  [
    body('phone').matches(/^[0-9]{10}$/),
    body('relationship').optional().isString(),
    body('dailyLimit').optional().isFloat({ min: 1 }),
    body('monthlyLimit').optional().isFloat({ min: 1 }),
    body('perTransactionLimit').optional().isFloat({ min: 1 }),
  ],
  validate,
  invitationController.createInvitation
);

// Get pending invitations for current user
router.get('/pending', invitationController.getPendingInvitations);

// Accept invitation by ID
router.post(
  '/:invitationId/accept',
  [param('invitationId').isString().notEmpty()],
  validate,
  invitationController.acceptInvitation
);

// Reject invitation by ID
router.post(
  '/:invitationId/reject',
  [param('invitationId').isString().notEmpty()],
  validate,
  invitationController.rejectInvitation
);

export default router;