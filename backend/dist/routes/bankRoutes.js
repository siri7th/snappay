"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const bankController_1 = __importDefault(require("../controllers/bankController"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', bankController_1.default.getUserBanks);
router.post('/', [
    (0, express_validator_1.body)('bankName').isString().notEmpty().withMessage('Bank name is required'),
    (0, express_validator_1.body)('accountNumber').isLength({ min: 9, max: 18 }).isNumeric().withMessage('Account number must be 9-18 digits'),
    (0, express_validator_1.body)('ifscCode').matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Invalid IFSC code format'),
    (0, express_validator_1.body)('accountHolder').isString().notEmpty().withMessage('Account holder name is required'),
], validation_1.validate, bankController_1.default.addBankAccount);
router.get('/:id', [(0, express_validator_1.param)('id').isString().notEmpty().withMessage('Bank ID is required')], validation_1.validate, bankController_1.default.getBankById);
router.put('/:id', [
    (0, express_validator_1.param)('id').isString().notEmpty(),
    (0, express_validator_1.body)('bankName').optional().isString(),
    (0, express_validator_1.body)('accountHolder').optional().isString(),
    (0, express_validator_1.body)('isDefault').optional().isBoolean(),
], validation_1.validate, bankController_1.default.updateBankAccount);
router.delete('/:id', [(0, express_validator_1.param)('id').isString().notEmpty()], validation_1.validate, bankController_1.default.deleteBankAccount);
router.post('/:id/verify', [(0, express_validator_1.param)('id').isString().notEmpty()], validation_1.validate, bankController_1.default.verifyBankAccount);
router.get('/:id/transactions', [
    (0, express_validator_1.param)('id').isString().notEmpty(),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
], validation_1.validate, bankController_1.default.getBankTransactions);
router.post('/:id/default', [(0, express_validator_1.param)('id').isString().notEmpty()], validation_1.validate, bankController_1.default.setDefaultBank);
exports.default = router;
//# sourceMappingURL=bankRoutes.js.map