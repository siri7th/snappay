"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const constants_1 = require("../utils/constants");
class AuthService {
    generateToken(userId, phone, role) {
        return jsonwebtoken_1.default.sign({ userId, phone, role }, process.env.JWT_SECRET, { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') });
    }
    generateRefreshToken(userId) {
        return jsonwebtoken_1.default.sign({ userId, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '30d' });
    }
    async hashPin(pin) {
        return bcryptjs_1.default.hash(pin, 10);
    }
    async verifyPin(pin, hash) {
        return bcryptjs_1.default.compare(pin, hash);
    }
    async validateUserAccess(userId) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
            select: { status: true },
        });
        return user?.status === constants_1.USER_STATUS.ACTIVE;
    }
    async refreshToken(oldToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(oldToken, process.env.JWT_SECRET);
            if (decoded.type !== 'refresh') {
                throw new errorHandler_1.AppError('Invalid token type', 401);
            }
            const user = await database_1.default.user.findUnique({ where: { id: decoded.userId } });
            if (!user || user.status !== constants_1.USER_STATUS.ACTIVE) {
                throw new errorHandler_1.AppError('User not found or inactive', 401);
            }
            return this.generateToken(user.id, user.phone, user.role);
        }
        catch (error) {
            throw new errorHandler_1.AppError('Invalid refresh token', 401);
        }
    }
}
exports.AuthService = AuthService;
exports.default = new AuthService();
//# sourceMappingURL=authService.js.map