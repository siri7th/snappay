// controllers/userController.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { USER_ROLES, USER_STATUS } from '../utils/constants';

class UserController {
  /**
   * Get all users (admin only)
   * GET /api/users
   */
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if user is primary (acting as admin) – in a real app, you'd have an ADMIN role
      if (req.user?.role !== USER_ROLES.PRIMARY) {
        throw new AppError('Access denied. Primary account required.', 403);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const role = req.query.role as string;
      const status = req.query.status as string;

      const where: any = {};
      if (role) where.role = role;
      if (status) where.status = status;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
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
        prisma.user.count({ where }),
      ]);

      const formattedUsers = users.map((u) => ({
        ...u,
        walletBalance: u.wallet?.balance || 0,
        wallet: undefined, // remove nested wallet object
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID (own profile or primary access)
   * GET /api/users/:id
   */
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.userId;
      const currentUserRole = req.user?.role;

      // Allow if user is viewing their own profile OR if they are a primary user (acting as admin)
      if (currentUserId !== id && currentUserRole !== USER_ROLES.PRIMARY) {
        throw new AppError('Access denied. You can only view your own profile.', 403);
      }

      const user = await prisma.user.findUnique({
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
        throw new AppError('User not found', 404);
      }

      // Combine sent and received payments for response
      const allTransactions = [
        ...(user.sentPayments || []).map((t) => ({ ...t, direction: 'sent' })),
        ...(user.receivedPayments || []).map((t) => ({ ...t, direction: 'received' })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Remove sensitive data if viewer is not the user themselves
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user status (primary only)
   * PUT /api/users/:id/status
   */
  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (req.user?.role !== USER_ROLES.PRIMARY) {
        throw new AppError('Access denied. Primary account required.', 403);
      }

      if (!Object.values(USER_STATUS).includes(status)) {
        throw new AppError('Invalid status', 400);
      }

      const user = await prisma.user.update({
        where: { id },
        data: { status },
        select: { id: true, status: true },
      });

      logger.info(`User ${id} status updated to ${status} by primary ${req.user.userId}`);

      res.status(200).json({
        success: true,
        message: 'User status updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user (primary only)
   * DELETE /api/users/:id
   */
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (req.user?.role !== USER_ROLES.PRIMARY) {
        throw new AppError('Access denied. Primary account required.', 403);
      }

      // Soft delete by setting status to BLOCKED or actually delete? For safety, soft delete.
      await prisma.user.update({
        where: { id },
        data: { status: USER_STATUS.BLOCKED },
      });

      logger.warn(`User ${id} soft-deleted (blocked) by primary ${req.user.userId}`);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user statistics (primary only)
   * GET /api/users/stats
   */
  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== USER_ROLES.PRIMARY) {
        throw new AppError('Access denied. Primary account required.', 403);
      }

      const totalUsers = await prisma.user.count();
      const primaryUsers = await prisma.user.count({ where: { role: USER_ROLES.PRIMARY } });
      const linkedUsers = await prisma.user.count({ where: { role: USER_ROLES.LINKED } });
      const activeToday = await prisma.user.count({
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
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();