"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearTokenCookie = exports.setTokenCookie = exports.optionalAuthenticate = exports.requireLinked = exports.requirePrimary = exports.authenticate = exports.verifyToken = exports.generateRefreshToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({ userId: user.id, phone: user.phone, role: user.role }, process.env.JWT_SECRET, { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') });
};
exports.generateToken = generateToken;
const generateRefreshToken = (id) => {
    return jsonwebtoken_1.default.sign({ userId: id, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '30d' });
};
exports.generateRefreshToken = generateRefreshToken;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    }
    catch (error) {
        throw error;
    }
};
exports.verifyToken = verifyToken;
const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new errorHandler_1.AppError('Please log in to access this resource', 401);
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!decoded.userId) {
            throw new errorHandler_1.AppError('Invalid token format', 401);
        }
        const user = await database_1.default.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                phone: true,
                role: true,
                name: true,
                email: true,
                status: true,
                lastLoginAt: true,
            },
        });
        if (!user) {
            throw new errorHandler_1.AppError('User no longer exists', 401);
        }
        if (user.status !== 'ACTIVE') {
            throw new errorHandler_1.AppError(`Account is ${user.status.toLowerCase()}. Please contact support.`, 403);
        }
        req.user = {
            userId: user.id,
            phone: user.phone,
            role: user.role,
            name: user.name,
            email: user.email,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            logger_1.default.warn(`JWT error: ${error.message}`);
            return next(new errorHandler_1.AppError('Invalid token. Please log in again.', 401));
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            logger_1.default.warn('JWT expired');
            return next(new errorHandler_1.AppError('Your session has expired. Please log in again.', 401));
        }
        next(error);
    }
};
exports.authenticate = authenticate;
const requirePrimary = (req, res, next) => {
    if (!req.user) {
        return next(new errorHandler_1.AppError('Authentication required', 401));
    }
    if (req.user.role !== 'PRIMARY') {
        return next(new errorHandler_1.AppError('This action requires a primary account', 403));
    }
    next();
};
exports.requirePrimary = requirePrimary;
const requireLinked = (req, res, next) => {
    if (!req.user) {
        return next(new errorHandler_1.AppError('Authentication required', 401));
    }
    if (req.user.role !== 'LINKED') {
        return next(new errorHandler_1.AppError('This action requires a linked account', 403));
    }
    next();
};
exports.requireLinked = requireLinked;
const optionalAuthenticate = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return next();
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!decoded.userId) {
            return next();
        }
        const user = await database_1.default.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, phone: true, role: true, name: true, email: true, status: true },
        });
        if (user && user.status === 'ACTIVE') {
            req.user = {
                userId: user.id,
                phone: user.phone,
                role: user.role,
                name: user.name,
                email: user.email,
            };
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
const setTokenCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};
exports.setTokenCookie = setTokenCookie;
const clearTokenCookie = (res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
};
exports.clearTokenCookie = clearTokenCookie;
//# sourceMappingURL=auth.js.map