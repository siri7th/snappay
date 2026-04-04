"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const accountRemovalController_1 = __importDefault(require("../controllers/accountRemovalController"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const security_1 = require("../middleware/security");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/summary/:memberId?', [(0, express_validator_1.param)('memberId').optional().isString().notEmpty()], validation_1.validate, accountRemovalController_1.default.getRemovalSummary);
router.post('/request-otp', auth_1.requireLinked, rateLimiter_1.authLimiter, accountRemovalController_1.default.requestDisconnectOTP);
router.post('/remove-member', auth_1.requirePrimary, [
    (0, express_validator_1.body)('memberId').isString().notEmpty().withMessage('Member ID is required'),
    (0, express_validator_1.body)('password').isString().notEmpty().withMessage('Password is required'),
    (0, express_validator_1.body)('transferBalance').optional().isBoolean()
], validation_1.validate, security_1.requirePasswordVerification, accountRemovalController_1.default.removeFamilyMember);
router.post('/disconnect', auth_1.requireLinked, [
    (0, express_validator_1.body)('password').isString().notEmpty().withMessage('Password is required'),
    (0, express_validator_1.body)('otp').isString().notEmpty().withMessage('OTP is required'),
    (0, express_validator_1.body)('transferBalance').optional().isBoolean()
], validation_1.validate, security_1.requirePasswordVerification, security_1.requireOTPVerification, accountRemovalController_1.default.disconnectFromPrimary);
exports.default = router;
//# sourceMappingURL=accountRemovalRoutes.js.map