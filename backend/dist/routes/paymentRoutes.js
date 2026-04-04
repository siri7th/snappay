"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const paymentController_1 = __importDefault(require("../controllers/paymentController"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/send/mobile', rateLimiter_1.paymentLimiter, [
    (0, express_validator_1.body)('toMobile').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit mobile number required'),
    (0, express_validator_1.body)('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    (0, express_validator_1.body)('pin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits'),
    (0, express_validator_1.body)('note').optional().isString().trim().isLength({ max: 100 }),
    (0, express_validator_1.body)('paymentMethod').optional().isIn(['wallet', 'bank']).withMessage('Payment method must be wallet or bank'),
    (0, express_validator_1.body)('bankId').optional().isString().notEmpty(),
], validation_1.validate, paymentController_1.default.sendToMobile);
router.post('/send/bank', rateLimiter_1.paymentLimiter, [
    (0, express_validator_1.body)('accountNumber').isLength({ min: 9, max: 18 }).isNumeric().withMessage('Valid account number required'),
    (0, express_validator_1.body)('ifscCode').matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Valid IFSC code required'),
    (0, express_validator_1.body)('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    (0, express_validator_1.body)('pin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits'),
    (0, express_validator_1.body)('note').optional().isString().trim().isLength({ max: 100 }),
    (0, express_validator_1.body)('paymentMethod').optional().isIn(['wallet', 'bank']).withMessage('Payment method must be wallet or bank'),
    (0, express_validator_1.body)('bankId').optional().isString().notEmpty(),
], validation_1.validate, paymentController_1.default.sendToBank);
router.post('/qr', rateLimiter_1.paymentLimiter, [
    (0, express_validator_1.body)('qrData').isString().notEmpty().withMessage('QR data is required'),
    (0, express_validator_1.body)('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    (0, express_validator_1.body)('pin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits'),
    (0, express_validator_1.body)('paymentMethod').optional().isIn(['wallet', 'bank']).withMessage('Payment method must be wallet or bank'),
    (0, express_validator_1.body)('bankId').optional().isString().notEmpty(),
], validation_1.validate, paymentController_1.default.processQRPayment);
router.post('/request', [
    (0, express_validator_1.body)('fromPhone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number required'),
    (0, express_validator_1.body)('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    (0, express_validator_1.body)('note').optional().isString().trim().isLength({ max: 100 }),
], validation_1.validate, paymentController_1.default.requestMoney);
router.get('/:id', [(0, express_validator_1.param)('id').isString().notEmpty().withMessage('Transaction ID is required')], validation_1.validate, paymentController_1.default.getTransactionById);
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map