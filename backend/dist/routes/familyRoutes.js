"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const familyController_1 = __importDefault(require("../controllers/familyController"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/connect', [
    (0, express_validator_1.body)('method').isIn(['code', 'manual', 'qr']).withMessage('Invalid connection method'),
    (0, express_validator_1.body)('code').optional().isString().isLength({ min: 4, max: 10 }),
    (0, express_validator_1.body)('phone').optional().matches(/^[0-9]{10}$/),
    (0, express_validator_1.body)('qrData').optional().isString(),
], validation_1.validate, familyController_1.default.connectToPrimary);
router.get('/my-primary', familyController_1.default.getMyPrimaryDetails);
router.get('/me/limits', familyController_1.default.getMyLimits);
router.get('/', auth_1.requirePrimary, familyController_1.default.getFamilyMembers);
router.get('/:id', auth_1.requirePrimary, [(0, express_validator_1.param)('id').isString().notEmpty()], validation_1.validate, familyController_1.default.getMemberById);
router.put('/:memberId/limits', auth_1.requirePrimary, [
    (0, express_validator_1.param)('memberId').isString().notEmpty(),
    (0, express_validator_1.body)('dailyLimit').optional().isFloat({ min: 1 }).withMessage('Daily limit must be at least ₹1'),
    (0, express_validator_1.body)('monthlyLimit').optional().isFloat({ min: 1 }).withMessage('Monthly limit must be at least ₹1'),
    (0, express_validator_1.body)('perTransactionLimit').optional().isFloat({ min: 1 }).withMessage('Per transaction limit must be at least ₹1'),
], validation_1.validate, familyController_1.default.updateLimits);
router.post('/:memberId/add-limit', auth_1.requirePrimary, [
    (0, express_validator_1.param)('memberId').isString().notEmpty(),
    (0, express_validator_1.body)('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
], validation_1.validate, familyController_1.default.addToLimit);
router.post('/:memberId/pause', auth_1.requirePrimary, [(0, express_validator_1.param)('memberId').isString().notEmpty()], validation_1.validate, familyController_1.default.pauseMember);
router.post('/:memberId/resume', auth_1.requirePrimary, [(0, express_validator_1.param)('memberId').isString().notEmpty()], validation_1.validate, familyController_1.default.resumeMember);
router.delete('/:memberId', auth_1.requirePrimary, [(0, express_validator_1.param)('memberId').isString().notEmpty()], validation_1.validate, familyController_1.default.removeMember);
router.get('/:memberId/transactions', auth_1.requirePrimary, [
    (0, express_validator_1.param)('memberId').isString().notEmpty(),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
], validation_1.validate, familyController_1.default.getMemberTransactions);
router.post('/invite', auth_1.requirePrimary, [
    (0, express_validator_1.body)('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number required'),
    (0, express_validator_1.body)('relationship').optional().isString().trim().isLength({ min: 2, max: 50 }),
    (0, express_validator_1.body)('dailyLimit').optional().isFloat({ min: 1, max: 100000 }),
    (0, express_validator_1.body)('monthlyLimit').optional().isFloat({ min: 1, max: 1000000 }),
    (0, express_validator_1.body)('perTransactionLimit').optional().isFloat({ min: 1, max: 50000 }),
], validation_1.validate, familyController_1.default.inviteMember);
router.post('/generate-invite', auth_1.requirePrimary, familyController_1.default.generateInviteCode);
router.get('/invitations/pending', familyController_1.default.getPendingInvitations);
router.get('/invitations/code/:code', [(0, express_validator_1.param)('code').isString().isLength({ min: 6, max: 10 }).withMessage('Invalid invite code format')], validation_1.validate, familyController_1.default.getInvitationByCode);
router.post('/invitations/:invitationId/accept', [(0, express_validator_1.param)('invitationId').isString().notEmpty()], validation_1.validate, familyController_1.default.acceptInvitationById);
router.post('/invitations/accept', [(0, express_validator_1.body)('inviteCode').isString().isLength({ min: 6, max: 10 }).withMessage('Please enter a valid invite code')], validation_1.validate, familyController_1.default.acceptInvitationByCode);
router.post('/invitations/:invitationId/reject', [(0, express_validator_1.param)('invitationId').isString().notEmpty()], validation_1.validate, familyController_1.default.rejectInvitation);
router.post('/invitations/:invitationId/cancel', auth_1.requirePrimary, [(0, express_validator_1.param)('invitationId').isString().notEmpty()], validation_1.validate, familyController_1.default.cancelInvitation);
router.post('/requests/:invitationId/accept', auth_1.requirePrimary, [(0, express_validator_1.param)('invitationId').isString().notEmpty()], validation_1.validate, familyController_1.default.acceptConnectionRequest);
router.post('/requests', [
    (0, express_validator_1.body)('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    (0, express_validator_1.body)('reason').optional().isString().isLength({ max: 200 }),
    (0, express_validator_1.body)('duration').optional().isIn(['today', 'week', 'month', 'permanent']).withMessage('Invalid duration'),
], validation_1.validate, familyController_1.default.createLimitRequest);
router.get('/requests', [(0, express_validator_1.query)('status').optional().isIn(['PENDING', 'APPROVED', 'DENIED'])], validation_1.validate, familyController_1.default.getRequests);
router.put('/requests/:requestId/approve', auth_1.requirePrimary, [(0, express_validator_1.param)('requestId').isString().notEmpty()], validation_1.validate, familyController_1.default.approveRequest);
router.put('/requests/:requestId/deny', auth_1.requirePrimary, [(0, express_validator_1.param)('requestId').isString().notEmpty()], validation_1.validate, familyController_1.default.denyRequest);
router.get('/pending-all', familyController_1.default.getPendingAll);
router.get('/qr', auth_1.requirePrimary, familyController_1.default.generateQRCode);
exports.default = router;
//# sourceMappingURL=familyRoutes.js.map