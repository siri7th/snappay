"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
const constants_1 = require("../utils/constants");
class OTPService {
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    async sendSMS(phone, otp) {
        logger_1.default.info(`📱 OTP for ${phone}: ${otp}`);
        if (process.env.NODE_ENV === 'development') {
            console.log(`\n🔐 OTP for ${phone}: ${otp}\n`);
        }
    }
    async sendOTP(phone, purpose = 'login', userType = 'primary') {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length !== 10) {
            throw new errorHandler_1.AppError('Invalid phone number', 400);
        }
        const recent = await database_1.default.oTP.findFirst({
            where: {
                phone: cleanPhone,
                purpose,
                createdAt: { gt: new Date(Date.now() - constants_1.OTP.RESEND_WAIT_MINUTES * 60 * 1000) },
                isUsed: false,
            },
        });
        if (recent) {
            throw new errorHandler_1.AppError(`Please wait ${constants_1.OTP.RESEND_WAIT_MINUTES} minutes before requesting another OTP`, 429);
        }
        await database_1.default.oTP.updateMany({
            where: { phone: cleanPhone, purpose, isUsed: false },
            data: { isUsed: true },
        });
        const otp = this.generateOTP();
        await database_1.default.oTP.create({
            data: {
                phone: cleanPhone,
                code: otp,
                purpose,
                expiresAt: new Date(Date.now() + constants_1.OTP.EXPIRY_MINUTES * 60 * 1000),
                attempts: 0,
                isUsed: false,
            },
        });
        this.sendSMS(cleanPhone, otp).catch((err) => {
            logger_1.default.error(`Failed to send SMS to ${cleanPhone}:`, err);
        });
    }
    async verifyOTP(phone, code, purpose = constants_1.OTP_PURPOSES.LOGIN) {
        const cleanPhone = phone.replace(/\D/g, '');
        const record = await database_1.default.oTP.findFirst({
            where: {
                phone: cleanPhone,
                code,
                purpose,
                isUsed: false,
                expiresAt: { gt: new Date() },
            },
        });
        if (!record) {
            throw new errorHandler_1.AppError('Invalid or expired OTP', 400);
        }
        await database_1.default.oTP.update({
            where: { id: record.id },
            data: { isUsed: true, usedAt: new Date() },
        });
        return true;
    }
    async cleanup() {
        const result = await database_1.default.oTP.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
        logger_1.default.info(`Cleaned up ${result.count} expired OTPs`);
    }
}
exports.default = new OTPService();
//# sourceMappingURL=otpService.js.map