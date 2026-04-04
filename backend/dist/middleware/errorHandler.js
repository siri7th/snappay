"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const multer_1 = require("multer");
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    logger_1.default.error(`${err.name}: ${err.message} ${err.stack || ''}`);
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002':
                error = new AppError('Duplicate entry already exists', 400);
                break;
            case 'P2025':
                error = new AppError('Record not found', 404);
                break;
            case 'P2003':
                error = new AppError('Related record does not exist', 400);
                break;
            default:
                error = new AppError('Database operation failed', 400);
        }
    }
    if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        error = new AppError('Invalid data provided to database', 400);
    }
    if (err.name === 'JsonWebTokenError') {
        error = new AppError('Invalid token', 401);
    }
    if (err.name === 'TokenExpiredError') {
        error = new AppError('Token expired', 401);
    }
    if (err instanceof multer_1.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            error = new AppError('File too large. Max size is 5MB', 400);
        }
        else {
            error = new AppError(`File upload error: ${err.message}`, 400);
        }
    }
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map