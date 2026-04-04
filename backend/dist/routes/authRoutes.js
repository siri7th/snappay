"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const authController_1 = __importDefault(require("../controllers/authController"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
router.post('/send-otp', rateLimiter_1.authLimiter, [
    (0, express_validator_1.body)('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number required'),
    (0, express_validator_1.body)('mode').optional().isIn(['login', 'signup']).withMessage('Mode must be login or signup'),
], validation_1.validate, authController_1.default.sendOTP);
router.post('/verify-otp', rateLimiter_1.authLimiter, [
    (0, express_validator_1.body)('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number required'),
    (0, express_validator_1.body)('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
    (0, express_validator_1.body)('userType').optional().isIn(['primary', 'linked']).withMessage('User type must be primary or linked'),
    (0, express_validator_1.body)('mode').optional().isIn(['login', 'signup']).withMessage('Mode must be login or signup'),
], validation_1.validate, authController_1.default.verifyOTP);
router.get('/me', auth_1.authenticate, authController_1.default.getMe);
router.post('/logout', auth_1.authenticate, authController_1.default.logout);
router.put('/profile', auth_1.authenticate, [
    (0, express_validator_1.body)('name').optional().isString().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
    (0, express_validator_1.body)('dateOfBirth').optional().isISO8601().withMessage('Valid date of birth required'),
    (0, express_validator_1.body)('gender').optional().isIn(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY', 'male', 'female', 'other', '']).withMessage('Valid gender required'),
    (0, express_validator_1.body)('address').optional().isString().trim().isLength({ max: 200 }),
    (0, express_validator_1.body)('city').optional().isString().trim().isLength({ max: 50 }),
    (0, express_validator_1.body)('state').optional().isString().trim().isLength({ max: 50 }),
    (0, express_validator_1.body)('pincode').optional().isString().trim().matches(/^[0-9]{6}$/).withMessage('Pincode must be 6 digits'),
    (0, express_validator_1.body)('country').optional().isString().trim().isLength({ min: 2, max: 2 }),
    (0, express_validator_1.body)('alternatePhone').optional().isString().trim().matches(/^[0-9]{10}$/).withMessage('Alternate phone must be 10 digits'),
    (0, express_validator_1.body)('occupation').optional().isString().trim().isLength({ max: 50 }),
], validation_1.validate, authController_1.default.updateProfile);
router.put('/change-pin', auth_1.authenticate, [
    (0, express_validator_1.body)('oldPin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('Old PIN must be 4 digits'),
    (0, express_validator_1.body)('newPin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('New PIN must be 4 digits'),
], validation_1.validate, authController_1.default.changePin);
router.put('/set-pin', auth_1.authenticate, [(0, express_validator_1.body)('pin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits')], validation_1.validate, authController_1.default.setPin);
router.post('/forgot-pin/send-otp', rateLimiter_1.authLimiter, [(0, express_validator_1.body)('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number required')], validation_1.validate, authController_1.default.forgotPinSendOtp);
router.post('/forgot-pin/verify', rateLimiter_1.authLimiter, [
    (0, express_validator_1.body)('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number required'),
    (0, express_validator_1.body)('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
    (0, express_validator_1.body)('newPin').isLength({ min: 4, max: 4 }).isNumeric().withMessage('New PIN must be 4 digits'),
], validation_1.validate, authController_1.default.forgotPinVerify);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map