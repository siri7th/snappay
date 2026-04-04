"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const rechargeController_1 = __importDefault(require("../controllers/rechargeController"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/plans', [(0, express_validator_1.query)('type').optional().isIn(['mobile', 'electricity', 'fastag', 'dth'])], validation_1.validate, rechargeController_1.default.getPlans);
router.get('/history', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('type').optional().isString(),
], validation_1.validate, rechargeController_1.default.getHistory);
router.post('/mobile', rateLimiter_1.paymentLimiter, [
    (0, express_validator_1.body)('mobileNumber').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit mobile number required'),
    (0, express_validator_1.body)('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    (0, express_validator_1.body)('pin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits'),
    (0, express_validator_1.body)('operator').isString().notEmpty().withMessage('Operator is required'),
    (0, express_validator_1.body)('planId').optional().isString(),
    (0, express_validator_1.body)('paymentMethod').optional().isIn(['wallet', 'bank']).withMessage('Payment method must be wallet or bank'),
    (0, express_validator_1.body)('bankId').optional().isString().notEmpty(),
], validation_1.validate, rechargeController_1.default.mobileRecharge);
router.post('/electricity', rateLimiter_1.paymentLimiter, [
    (0, express_validator_1.body)('consumerNumber').isString().notEmpty().withMessage('Consumer number is required'),
    (0, express_validator_1.body)('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    (0, express_validator_1.body)('pin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits'),
    (0, express_validator_1.body)('board').isString().notEmpty().withMessage('Electricity board is required'),
    (0, express_validator_1.body)('paymentMethod').optional().isIn(['wallet', 'bank']),
    (0, express_validator_1.body)('bankId').optional().isString().notEmpty(),
], validation_1.validate, rechargeController_1.default.electricityBill);
router.post('/fastag', rateLimiter_1.paymentLimiter, [
    (0, express_validator_1.body)('vehicleNumber').isString().notEmpty().withMessage('Vehicle number is required'),
    (0, express_validator_1.body)('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    (0, express_validator_1.body)('pin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits'),
    (0, express_validator_1.body)('paymentMethod').optional().isIn(['wallet', 'bank']),
    (0, express_validator_1.body)('bankId').optional().isString().notEmpty(),
], validation_1.validate, rechargeController_1.default.fastagRecharge);
exports.default = router;
//# sourceMappingURL=rechargeRoutes.js.map