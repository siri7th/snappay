"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const otpService_1 = __importDefault(require("../services/otpService"));
const authService_1 = __importDefault(require("../services/authService"));
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
const constants_1 = require("../utils/constants");
const safeParsePreferences = (prefs) => {
    if (!prefs)
        return {};
    try {
        const parsed = JSON.parse(prefs);
        return parsed && typeof parsed === 'object' ? parsed : {};
    }
    catch {
        return {};
    }
};
class AuthController {
    async sendOTP(req, res, next) {
        try {
            const { phone, userType, mode = 'login' } = req.body;
            if (!phone) {
                throw new errorHandler_1.AppError('Phone number is required', 400);
            }
            const existingUser = await database_1.default.user.findUnique({
                where: { phone },
                select: { id: true },
            });
            if (mode === 'login' && !existingUser) {
                throw new errorHandler_1.AppError('Account not found. Please create account first.', 404);
            }
            if (mode === 'signup' && existingUser) {
                throw new errorHandler_1.AppError('Account already exists. Please login instead.', 409);
            }
            await otpService_1.default.sendOTP(phone, 'login', userType || 'primary');
            res.status(200).json({
                success: true,
                message: 'OTP sent successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async verifyOTP(req, res, next) {
        try {
            const { phone, otp, userType, mode = 'login' } = req.body;
            if (!phone || !otp) {
                throw new errorHandler_1.AppError('Phone and OTP are required', 400);
            }
            await otpService_1.default.verifyOTP(phone, otp, 'login');
            let user = await database_1.default.user.findUnique({
                where: { phone },
                include: {
                    wallet: true,
                    banks: true,
                },
            });
            const isNewUser = !user;
            if (mode === 'login' && !user) {
                throw new errorHandler_1.AppError('Account not found. Please create account first.', 404);
            }
            if (mode === 'signup' && user) {
                throw new errorHandler_1.AppError('Account already exists. Please login instead.', 409);
            }
            if (!user) {
                user = await database_1.default.user.create({
                    data: {
                        phone,
                        role: userType === 'primary' ? constants_1.USER_ROLES.PRIMARY : constants_1.USER_ROLES.LINKED,
                        status: constants_1.USER_STATUS.ACTIVE,
                        wallet: {
                            create: {
                                balance: 0,
                            },
                        },
                    },
                    include: {
                        wallet: true,
                        banks: true,
                    },
                });
                logger_1.default.info(`New user created: ${phone} as ${user.role}`);
            }
            const token = authService_1.default.generateToken(user.id, user.phone, user.role);
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            const prefs = safeParsePreferences(user.preferences);
            const userData = {
                id: user.id,
                phone: user.phone,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                address: user.address,
                city: user.city,
                state: user.state,
                pincode: user.pincode,
                country: user.country,
                alternatePhone: prefs.alternatePhone || null,
                occupation: prefs.occupation || null,
                walletBalance: user.wallet?.balance || 0,
                hasBank: (user.banks?.length || 0) > 0,
                profileComplete: user.profileComplete,
                hasPin: Boolean(user.pin),
            };
            res.status(200).json({
                success: true,
                message: 'OTP verified successfully',
                data: {
                    user: userData,
                    token,
                    isNewUser,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getMe(req, res, next) {
        try {
            const user = await database_1.default.user.findUnique({
                where: { id: req.user?.userId },
                include: {
                    wallet: true,
                    banks: {
                        take: 5,
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            bankName: true,
                            accountNumber: true,
                            ifscCode: true,
                            isDefault: true,
                            isVerified: true,
                        },
                    },
                    primaryFamily: {
                        include: {
                            linked: {
                                select: {
                                    id: true,
                                    name: true,
                                    phone: true,
                                },
                            },
                        },
                    },
                    linkedFamily: {
                        include: {
                            primary: {
                                select: {
                                    id: true,
                                    name: true,
                                    phone: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!user) {
                throw new errorHandler_1.AppError('User not found', 404);
            }
            const prefs = safeParsePreferences(user.preferences);
            const userData = {
                id: user.id,
                phone: user.phone,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                address: user.address,
                city: user.city,
                state: user.state,
                pincode: user.pincode,
                country: user.country,
                alternatePhone: prefs.alternatePhone || null,
                occupation: prefs.occupation || null,
                walletBalance: user.wallet?.balance || 0,
                hasBank: user.banks.length > 0,
                profileComplete: user.profileComplete,
                hasPin: Boolean(user.pin),
                banks: user.banks.map((bank) => ({
                    id: bank.id,
                    bankName: bank.bankName,
                    accountNumber: `****${bank.accountNumber.slice(-4)}`,
                    ifscCode: bank.ifscCode,
                    isDefault: bank.isDefault,
                    isVerified: bank.isVerified,
                })),
                family: user.role === constants_1.USER_ROLES.PRIMARY
                    ? user.primaryFamily.map((f) => ({
                        id: f.linked.id,
                        name: f.linked.name,
                        phone: f.linked.phone,
                        relationship: f.relationship,
                        dailyLimit: Number(f.dailyLimit),
                        monthlyLimit: Number(f.monthlyLimit),
                        dailySpent: Number(f.dailySpent),
                        monthlySpent: Number(f.monthlySpent),
                        status: f.status,
                    }))
                    : user.linkedFamily
                        ? {
                            id: user.linkedFamily.primary.id,
                            name: user.linkedFamily.primary.name,
                            phone: user.linkedFamily.primary.phone,
                            dailyLimit: Number(user.linkedFamily.dailyLimit),
                            monthlyLimit: Number(user.linkedFamily.monthlyLimit),
                            dailySpent: Number(user.linkedFamily.dailySpent),
                            monthlySpent: Number(user.linkedFamily.monthlySpent),
                        }
                        : null,
            };
            res.status(200).json({
                success: true,
                data: userData,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async setPin(req, res, next) {
        try {
            const { pin } = req.body;
            const userId = req.user?.userId;
            if (!userId)
                throw new errorHandler_1.AppError('User not authenticated', 401);
            if (!pin || typeof pin !== 'string' || pin.length !== 4 || !/^\d+$/.test(pin)) {
                throw new errorHandler_1.AppError('PIN must be 4 digits', 400);
            }
            const user = await database_1.default.user.findUnique({ where: { id: userId }, select: { pin: true } });
            if (!user)
                throw new errorHandler_1.AppError('User not found', 404);
            if (user.pin) {
                throw new errorHandler_1.AppError('PIN already set. Use change PIN instead.', 400);
            }
            const hashedPin = await authService_1.default.hashPin(pin);
            await database_1.default.user.update({
                where: { id: userId },
                data: { pin: hashedPin },
            });
            res.status(200).json({ success: true, message: 'PIN set successfully' });
        }
        catch (error) {
            next(error);
        }
    }
    async forgotPinSendOtp(req, res, next) {
        try {
            const { phone } = req.body;
            if (!phone)
                throw new errorHandler_1.AppError('Phone number is required', 400);
            const user = await database_1.default.user.findUnique({ where: { phone }, select: { id: true } });
            if (!user)
                throw new errorHandler_1.AppError('User not found', 404);
            await otpService_1.default.sendOTP(phone, 'reset_pin');
            res.status(200).json({ success: true, message: 'OTP sent for PIN reset' });
        }
        catch (error) {
            next(error);
        }
    }
    async forgotPinVerify(req, res, next) {
        try {
            const { phone, otp, newPin } = req.body;
            if (!phone || !otp || !newPin)
                throw new errorHandler_1.AppError('Phone, OTP and new PIN are required', 400);
            if (typeof newPin !== 'string' || newPin.length !== 4 || !/^\d+$/.test(newPin)) {
                throw new errorHandler_1.AppError('New PIN must be 4 digits', 400);
            }
            await otpService_1.default.verifyOTP(phone, otp, 'reset_pin');
            const user = await database_1.default.user.findUnique({ where: { phone }, select: { id: true } });
            if (!user)
                throw new errorHandler_1.AppError('User not found', 404);
            const hashedPin = await authService_1.default.hashPin(newPin);
            await database_1.default.user.update({ where: { id: user.id }, data: { pin: hashedPin } });
            res.status(200).json({ success: true, message: 'PIN reset successfully' });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            res.clearCookie('token');
            res.status(200).json({
                success: true,
                message: 'Logged out successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const { name, email, dateOfBirth, gender, address, city, state, pincode, country, alternatePhone, occupation, } = req.body;
            const existing = await database_1.default.user.findUnique({
                where: { id: req.user?.userId },
                select: { preferences: true },
            });
            const existingPrefs = safeParsePreferences(existing?.preferences);
            const updatedPrefs = {
                ...existingPrefs,
                ...(alternatePhone !== undefined ? { alternatePhone } : {}),
                ...(occupation !== undefined ? { occupation } : {}),
            };
            const user = await database_1.default.user.update({
                where: { id: req.user?.userId },
                data: {
                    name: name || undefined,
                    email: email || undefined,
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                    gender: gender || undefined,
                    address: address || undefined,
                    city: city || undefined,
                    state: state || undefined,
                    pincode: pincode || undefined,
                    country: country || undefined,
                    preferences: JSON.stringify(updatedPrefs),
                    profileComplete: Boolean(name),
                },
            });
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    name: user.name,
                    email: user.email,
                    dateOfBirth: user.dateOfBirth,
                    gender: user.gender,
                    address: user.address,
                    city: user.city,
                    state: user.state,
                    pincode: user.pincode,
                    country: user.country,
                    alternatePhone: updatedPrefs.alternatePhone || null,
                    occupation: updatedPrefs.occupation || null,
                    profileComplete: user.profileComplete,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async changePin(req, res, next) {
        try {
            const { oldPin, newPin } = req.body;
            if (!oldPin || !newPin) {
                throw new errorHandler_1.AppError('Old PIN and new PIN are required', 400);
            }
            if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
                throw new errorHandler_1.AppError('PIN must be 4 digits', 400);
            }
            const user = await database_1.default.user.findUnique({
                where: { id: req.user?.userId },
                select: { pin: true },
            });
            if (!user) {
                throw new errorHandler_1.AppError('User not found', 404);
            }
            if (user.pin) {
                const isValid = await authService_1.default.verifyPin(oldPin, user.pin);
                if (!isValid) {
                    throw new errorHandler_1.AppError('Invalid current PIN', 401);
                }
            }
            const hashedPin = await authService_1.default.hashPin(newPin);
            await database_1.default.user.update({
                where: { id: req.user?.userId },
                data: { pin: hashedPin },
            });
            logger_1.default.info(`PIN changed for user ${req.user?.userId}`);
            res.status(200).json({
                success: true,
                message: 'PIN changed successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new AuthController();
//# sourceMappingURL=authController.js.map