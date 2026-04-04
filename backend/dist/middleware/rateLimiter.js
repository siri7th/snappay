"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentLimiter = exports.apiLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const isDevelopment = process.env.NODE_ENV === 'development';
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: isDevelopment ? 1000 : 5,
    message: { success: false, message: 'Too many attempts, try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: isDevelopment ? 1000 : 60,
    message: { success: false, message: 'Too many requests, slow down' },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.paymentLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: isDevelopment ? 1000 : 10,
    message: { success: false, message: 'Too many payment attempts, please wait' },
    standardHeaders: true,
    legacyHeaders: false,
});
//# sourceMappingURL=rateLimiter.js.map