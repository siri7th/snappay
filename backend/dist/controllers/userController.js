"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = __importDefault(require("../utils/logger"));
const constants_1 = require("../utils/constants");
class UserController {
    async getAllUsers(req, res, next) {
        try {
            if (req.user?.role !== constants_1.USER_ROLES.PRIMARY) {
                throw new errorHandler_1.AppError('Access denied. Primary account required.', 403);
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const role = req.query.role;
            const status = req.query.status;
            const where = {};
            if (role)
                where.role = role;
            if (status)
                where.status = status;
            const [users, total] = await Promise.all([
                database_1.default.user.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        phone: true,
                        name: true,
                        email: true,
                        role: true,
                        status: true,
                        createdAt: true,
                        lastLoginAt: true,
                        wallet: { select: { balance: true } },
                        _count: { select: { banks: true, sentPayments: true, receivedPayments: true } },
                    },
                }),
                database_1.default.user.count({ where }),
            ]);
            const formattedUsers = users.map((u) => ({
                ...u,
                walletBalance: u.wallet?.balance || 0,
                wallet: undefined,
            }));
            res.status(200).json({
                success: true,
                data: formattedUsers,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getUserById(req, res, next) {
        try {
            const { id } = req.params;
            const currentUserId = req.user?.userId;
            const currentUserRole = req.user?.role;
            if (currentUserId !== id && currentUserRole !== constants_1.USER_ROLES.PRIMARY) {
                throw new errorHandler_1.AppError('Access denied. You can only view your own profile.', 403);
            }
            const user = await database_1.default.user.findUnique({
                where: { id },
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
                    sentPayments: {
                        take: 10,
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            transactionId: true,
                            amount: true,
                            type: true,
                            status: true,
                            description: true,
                            createdAt: true,
                            receiver: { select: { name: true, phone: true } },
                        },
                    },
                    receivedPayments: {
                        take: 10,
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            transactionId: true,
                            amount: true,
                            type: true,
                            status: true,
                            description: true,
                            createdAt: true,
                            sender: { select: { name: true, phone: true } },
                        },
                    },
                },
            });
            if (!user) {
                throw new errorHandler_1.AppError('User not found', 404);
            }
            const allTransactions = [
                ...(user.sentPayments || []).map((t) => ({ ...t, direction: 'sent' })),
                ...(user.receivedPayments || []).map((t) => ({ ...t, direction: 'received' })),
            ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const isOwnProfile = currentUserId === id;
            const banks = user.banks.map((bank) => ({
                ...bank,
                accountNumber: isOwnProfile ? bank.accountNumber : `****${bank.accountNumber.slice(-4)}`,
            }));
            res.status(200).json({
                success: true,
                data: {
                    ...user,
                    banks,
                    transactions: allTransactions.slice(0, 10).map((t) => ({
                        ...t,
                        amount: Number(t.amount),
                    })),
                    sentPayments: undefined,
                    receivedPayments: undefined,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateUserStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (req.user?.role !== constants_1.USER_ROLES.PRIMARY) {
                throw new errorHandler_1.AppError('Access denied. Primary account required.', 403);
            }
            if (!Object.values(constants_1.USER_STATUS).includes(status)) {
                throw new errorHandler_1.AppError('Invalid status', 400);
            }
            const user = await database_1.default.user.update({
                where: { id },
                data: { status },
                select: { id: true, status: true },
            });
            logger_1.default.info(`User ${id} status updated to ${status} by primary ${req.user.userId}`);
            res.status(200).json({
                success: true,
                message: 'User status updated successfully',
                data: user,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteUser(req, res, next) {
        try {
            const { id } = req.params;
            if (req.user?.role !== constants_1.USER_ROLES.PRIMARY) {
                throw new errorHandler_1.AppError('Access denied. Primary account required.', 403);
            }
            await database_1.default.user.update({
                where: { id },
                data: { status: constants_1.USER_STATUS.BLOCKED },
            });
            logger_1.default.warn(`User ${id} soft-deleted (blocked) by primary ${req.user.userId}`);
            res.status(200).json({
                success: true,
                message: 'User deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getUserStats(req, res, next) {
        try {
            if (req.user?.role !== constants_1.USER_ROLES.PRIMARY) {
                throw new errorHandler_1.AppError('Access denied. Primary account required.', 403);
            }
            const totalUsers = await database_1.default.user.count();
            const primaryUsers = await database_1.default.user.count({ where: { role: constants_1.USER_ROLES.PRIMARY } });
            const linkedUsers = await database_1.default.user.count({ where: { role: constants_1.USER_ROLES.LINKED } });
            const activeToday = await database_1.default.user.count({
                where: {
                    updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                },
            });
            res.status(200).json({
                success: true,
                data: {
                    totalUsers,
                    primaryUsers,
                    linkedUsers,
                    activeToday,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new UserController();
//# sourceMappingURL=userController.js.map