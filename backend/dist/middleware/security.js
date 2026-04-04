"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOTPVerification = exports.verifyOTP = exports.requirePasswordVerification = exports.verifyPassword = void 0;
const errorHandler_1 = require("./errorHandler");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
const otpService_1 = __importDefault(require("../services/otpService"));
const constants_1 = require("../utils/constants");
const logger_1 = __importDefault(require("../utils/logger"));
const verifyPassword = async (userId, password) => {
    try {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
            select: { pin: true },
        });
        if (!user || !user.pin) {
            return false;
        }
        return await bcryptjs_1.default.compare(password, user.pin);
    }
    catch (error) {
        logger_1.default.error('Password verification error:', error);
        return false;
    }
};
exports.verifyPassword = verifyPassword;
const requirePasswordVerification = async (req, res, next) => {
    try {
        const { password } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            throw new errorHandler_1.AppError('User not authenticated', 401);
        }
        if (!password) {
            throw new errorHandler_1.AppError('Password is required', 400);
        }
        const isValid = await (0, exports.verifyPassword)(userId, password);
        if (!isValid) {
            throw new errorHandler_1.AppError('Invalid password', 401);
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requirePasswordVerification = requirePasswordVerification;
const verifyOTP = async (phone, otp, purpose) => {
    return otpService_1.default.verifyOTP(phone, otp, purpose);
};
exports.verifyOTP = verifyOTP;
const requireOTPVerification = async (req, res, next) => {
    try {
        const { otp } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            throw new errorHandler_1.AppError('User not authenticated', 401);
        }
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
            select: { phone: true },
        });
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        if (!otp) {
            throw new errorHandler_1.AppError('OTP is required', 400);
        }
        const isValid = await (0, exports.verifyOTP)(user.phone, otp, constants_1.OTP_PURPOSES.DISCONNECT);
        if (!isValid) {
            throw new errorHandler_1.AppError('Invalid or expired OTP', 401);
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireOTPVerification = requireOTPVerification;
//# sourceMappingURL=security.js.map