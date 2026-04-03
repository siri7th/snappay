// routes/familyRoutes.ts
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import familyController from '../controllers/familyController';
import { authenticate, requirePrimary, requireLinked } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ========== LINKED USER ROUTES ==========

// Connect to a primary account (linked user initiates)
router.post(
  '/connect',
  [
    body('method').isIn(['code', 'manual', 'qr']).withMessage('Invalid connection method'),
    body('code').optional().isString().isLength({ min: 4, max: 10 }),
    body('phone').optional().matches(/^[0-9]{10}$/),
    body('qrData').optional().isString(),
  ],
  validate,
  familyController.connectToPrimary
);

// Get primary account details for linked user
router.get('/my-primary', familyController.getMyPrimaryDetails);

// Get limits for the linked user
router.get('/me/limits', familyController.getMyLimits);

// ========== PRIMARY ROUTES ==========

// Get all family members for primary
router.get('/', requirePrimary, familyController.getFamilyMembers);

// Get a specific family member
router.get(
  '/:id',
  requirePrimary,
  [param('id').isString().notEmpty()],
  validate,
  familyController.getMemberById
);

// Update member limits
router.put(
  '/:memberId/limits',
  requirePrimary,
  [
    param('memberId').isString().notEmpty(),
    body('dailyLimit').optional().isFloat({ min: 1 }).withMessage('Daily limit must be at least ₹1'),
    body('monthlyLimit').optional().isFloat({ min: 1 }).withMessage('Monthly limit must be at least ₹1'),
    body('perTransactionLimit').optional().isFloat({ min: 1 }).withMessage('Per transaction limit must be at least ₹1'),
  ],
  validate,
  familyController.updateLimits
);

// Add money to a member's limit
router.post(
  '/:memberId/add-limit',
  requirePrimary,
  [
    param('memberId').isString().notEmpty(),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
  ],
  validate,
  familyController.addToLimit
);

// Pause a member
router.post(
  '/:memberId/pause',
  requirePrimary,
  [param('memberId').isString().notEmpty()],
  validate,
  familyController.pauseMember
);

// Resume a member
router.post(
  '/:memberId/resume',
  requirePrimary,
  [param('memberId').isString().notEmpty()],
  validate,
  familyController.resumeMember
);

// Remove a member (soft delete)
router.delete(
  '/:memberId',
  requirePrimary,
  [param('memberId').isString().notEmpty()],
  validate,
  familyController.removeMember
);

// Get member's transactions
router.get(
  '/:memberId/transactions',
  requirePrimary,
  [
    param('memberId').isString().notEmpty(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  familyController.getMemberTransactions
);

// ========== INVITATION ROUTES ==========

// Invite a new member (primary)
router.post(
  '/invite',
  requirePrimary,
  [
    body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number required'),
    body('relationship').optional().isString().trim().isLength({ min: 2, max: 50 }),
    body('dailyLimit').optional().isFloat({ min: 1, max: 100000 }),
    body('monthlyLimit').optional().isFloat({ min: 1, max: 1000000 }),
    body('perTransactionLimit').optional().isFloat({ min: 1, max: 50000 }),
  ],
  validate,
  familyController.inviteMember
);

// Generate invite code (primary)
router.post('/generate-invite', requirePrimary, familyController.generateInviteCode);

// Get pending invitations for current user
router.get('/invitations/pending', familyController.getPendingInvitations);

// Get invitation by code
router.get(
  '/invitations/code/:code',
  [param('code').isString().isLength({ min: 6, max: 10 }).withMessage('Invalid invite code format')],
  validate,
  familyController.getInvitationByCode
);

// Accept invitation by ID (linked user)
router.post(
  '/invitations/:invitationId/accept',
  [param('invitationId').isString().notEmpty()],
  validate,
  familyController.acceptInvitationById
);

// Accept invitation by code (linked user)
router.post(
  '/invitations/accept',
  [body('inviteCode').isString().isLength({ min: 6, max: 10 }).withMessage('Please enter a valid invite code')],
  validate,
  familyController.acceptInvitationByCode
);

// Reject invitation (linked user)
router.post(
  '/invitations/:invitationId/reject',
  [param('invitationId').isString().notEmpty()],
  validate,
  familyController.rejectInvitation
);

// Cancel invitation (primary)
router.post(
  '/invitations/:invitationId/cancel',
  requirePrimary,
  [param('invitationId').isString().notEmpty()],
  validate,
  familyController.cancelInvitation
);

// Accept connection request (primary accepts linked user's request)
router.post(
  '/requests/:invitationId/accept',
  requirePrimary,
  [param('invitationId').isString().notEmpty()],
  validate,
  familyController.acceptConnectionRequest
);

// ========== LIMIT REQUEST ROUTES ==========

// Create a limit increase request (linked user)
router.post(
  '/requests',
  [
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    body('reason').optional().isString().isLength({ max: 200 }),
    body('duration').optional().isIn(['today', 'week', 'month', 'permanent']).withMessage('Invalid duration'),
  ],
  validate,
  familyController.createLimitRequest
);

// Get all requests (filtered by role)
router.get(
  '/requests',
  [query('status').optional().isIn(['PENDING', 'APPROVED', 'DENIED'])],
  validate,
  familyController.getRequests
);

// Approve a limit request (primary)
router.put(
  '/requests/:requestId/approve',
  requirePrimary,
  [param('requestId').isString().notEmpty()],
  validate,
  familyController.approveRequest
);

// Deny a limit request (primary)
router.put(
  '/requests/:requestId/deny',
  requirePrimary,
  [param('requestId').isString().notEmpty()],
  validate,
  familyController.denyRequest
);

// ========== BULK OPERATIONS ==========

// Get all pending items (invitations + requests)
router.get('/pending-all', familyController.getPendingAll);

// Generate QR code for linking
router.get('/qr', requirePrimary, familyController.generateQRCode);

export default router;