"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const walletController_1 = __importDefault(require("../controllers/walletController"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/balance', walletController_1.default.getBalance);
router.get('/transactions', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('type').optional().isString(),
    (0, express_validator_1.query)('fromDate').optional().isISO8601().withMessage('Invalid from date format'),
    (0, express_validator_1.query)('toDate').optional().isISO8601().withMessage('Invalid to date format'),
], validation_1.validate, walletController_1.default.getTransactions);
router.get('/stats', walletController_1.default.getWalletStats);
router.get('/transactions/:id', [(0, express_validator_1.param)('id').isString().notEmpty().withMessage('Transaction ID is required')], validation_1.validate, walletController_1.default.getTransactionById);
router.post('/add', [
    (0, express_validator_1.body)('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    (0, express_validator_1.body)('bankId').isString().notEmpty().withMessage('Bank account is required'),
], validation_1.validate, walletController_1.default.addMoney);
router.post('/withdraw', [
    (0, express_validator_1.body)('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
    (0, express_validator_1.body)('bankId').isString().notEmpty().withMessage('Bank account is required'),
], validation_1.validate, walletController_1.default.withdrawMoney);
router.get('/member/:memberId', auth_1.requirePrimary, [(0, express_validator_1.param)('memberId').isString().notEmpty()], validation_1.validate, walletController_1.default.getMemberWalletBalance);
router.post('/members/balances', auth_1.requirePrimary, [
    (0, express_validator_1.body)('memberIds').isArray().withMessage('Member IDs array is required'),
    (0, express_validator_1.body)('memberIds.*').isString().notEmpty(),
], validation_1.validate, walletController_1.default.getAllMemberBalances);
exports.default = router;
//# sourceMappingURL=walletRoutes.js.map