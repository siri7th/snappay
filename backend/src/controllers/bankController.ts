// controllers/bankController.ts
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { maskAccountNumber } from '../utils/helpers';

class BankController {
  /**
   * Get all banks for the authenticated user
   * GET /api/banks
   */
  async getUserBanks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      logger.debug(`Fetching banks for user: ${userId}`);

      const banks = await prisma.bankAccount.findMany({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });

      // Convert Decimal to number for calculation
      const totalBalance = banks.reduce((sum, bank) => sum + Number(bank.balance), 0);
      const verifiedCount = banks.filter((bank) => bank.isVerified).length;
      const unverifiedCount = banks.length - verifiedCount;

      res.status(200).json({
        success: true,
        data: {
          banks: banks.map((bank) => ({
            id: bank.id,
            bankName: bank.bankName,
            accountNumber: maskAccountNumber(bank.accountNumber),
            ifscCode: bank.ifscCode,
            accountHolder: bank.accountHolder,
            balance: Number(bank.balance),
            isDefault: bank.isDefault,
            isVerified: bank.isVerified,
            createdAt: bank.createdAt,
            updatedAt: bank.updatedAt,
          })),
          totalBalance,
          verifiedCount,
          unverifiedCount,
          count: banks.length,
          hasDefault: banks.some((bank) => bank.isDefault),
        },
      });
    } catch (error) {
      logger.error('Error in getUserBanks:', error);
      next(error);
    }
  }

  /**
   * Get a single bank account by ID
   * GET /api/banks/:id
   */
  async getBankById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const bank = await prisma.bankAccount.findFirst({
        where: { id, userId },
      });

      if (!bank) {
        throw new AppError('Bank account not found', 404);
      }

      res.status(200).json({
        success: true,
        data: {
          id: bank.id,
          bankName: bank.bankName,
          accountNumber: bank.accountNumber, // For internal use (should be masked in frontend)
          maskedAccountNumber: maskAccountNumber(bank.accountNumber),
          ifscCode: bank.ifscCode,
          accountHolder: bank.accountHolder,
          balance: Number(bank.balance),
          isDefault: bank.isDefault,
          isVerified: bank.isVerified,
          createdAt: bank.createdAt,
          updatedAt: bank.updatedAt,
        },
      });
    } catch (error) {
      logger.error('Error in getBankById:', error);
      next(error);
    }
  }

  /**
   * Add a new bank account
   * POST /api/banks
   */
  async addBankAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { bankName, accountNumber, ifscCode, accountHolder, initialBalance } = req.body;
      const userId = req.user?.userId;

      // Validate required fields
      if (!bankName || !accountNumber || !ifscCode || !accountHolder) {
        throw new AppError('All fields are required', 400);
      }

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Check if account already exists
      const existingBank = await prisma.bankAccount.findUnique({
        where: {
          accountNumber_ifscCode: {
            accountNumber,
            ifscCode,
          },
        },
      });

      if (existingBank) {
        throw new AppError('Bank account already exists', 400);
      }

      // Get current bank count
      const bankCount = await prisma.bankAccount.count({
        where: { userId },
      });

      // Create new bank account
      // NOTE: For real systems, balance must never be set by client.
      // For this college project/demo, allow initialBalance only outside production.
      const allowDemoBalance = process.env.NODE_ENV !== 'production';
      const demoBalance =
        allowDemoBalance && initialBalance !== undefined && initialBalance !== null && initialBalance !== ''
          ? Number(initialBalance)
          : 0;

      if (allowDemoBalance && (Number.isNaN(demoBalance) || demoBalance < 0 || demoBalance > 1_000_000)) {
        throw new AppError('Invalid initial balance (demo mode)', 400);
      }

      const bank = await prisma.bankAccount.create({
        data: {
          bankName,
          accountNumber,
          ifscCode,
          accountHolder,
          balance: demoBalance, // demo-only initial balance
          userId,
          isDefault: bankCount === 0, // First bank is default
          isVerified: allowDemoBalance ? true : false,
        },
      });

      logger.info(`Bank account added for user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Bank account added successfully',
        data: {
          id: bank.id,
          bankName: bank.bankName,
          accountNumber: maskAccountNumber(bank.accountNumber),
          ifscCode: bank.ifscCode,
          accountHolder: bank.accountHolder,
          balance: Number(bank.balance),
          isDefault: bank.isDefault,
          isVerified: bank.isVerified,
        },
      });
    } catch (error) {
      logger.error('Error in addBankAccount:', error);
      next(error);
    }
  }

  /**
   * Update bank account details (name, holder, default status)
   * PUT /api/banks/:id
   */
  async updateBankAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { bankName, accountHolder, isDefault } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Check if bank exists and belongs to user
      const bank = await prisma.bankAccount.findFirst({
        where: { id, userId },
      });

      if (!bank) {
        throw new AppError('Bank account not found', 404);
      }

      // If setting as default, remove default from others
      if (isDefault === true && !bank.isDefault) {
        await prisma.bankAccount.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      // Update bank
      const updatedBank = await prisma.bankAccount.update({
        where: { id },
        data: {
          bankName: bankName || undefined,
          accountHolder: accountHolder || undefined,
          isDefault: isDefault !== undefined ? isDefault : undefined,
        },
      });

      logger.info(`Bank account ${id} updated for user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Bank account updated successfully',
        data: {
          id: updatedBank.id,
          bankName: updatedBank.bankName,
          accountHolder: updatedBank.accountHolder,
          isDefault: updatedBank.isDefault,
          isVerified: updatedBank.isVerified,
        },
      });
    } catch (error) {
      logger.error('Error in updateBankAccount:', error);
      next(error);
    }
  }

  /**
   * Delete a bank account
   * DELETE /api/banks/:id
   */
  async deleteBankAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Check if bank exists and belongs to user
      const bank = await prisma.bankAccount.findFirst({
        where: { id, userId },
      });

      if (!bank) {
        throw new AppError('Bank account not found', 404);
      }

      // Don't allow deletion if it's the only bank
      const bankCount = await prisma.bankAccount.count({
        where: { userId },
      });

      if (bankCount === 1) {
        throw new AppError('Cannot delete the only bank account', 400);
      }

      // If this was default, set another bank as default
      if (bank.isDefault) {
        const anotherBank = await prisma.bankAccount.findFirst({
          where: { userId, id: { not: id } },
        });

        if (anotherBank) {
          await prisma.bankAccount.update({
            where: { id: anotherBank.id },
            data: { isDefault: true },
          });
        }
      }

      // Delete bank
      await prisma.bankAccount.delete({
        where: { id },
      });

      logger.info(`Bank account ${id} deleted for user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Bank account deleted successfully',
      });
    } catch (error) {
      logger.error('Error in deleteBankAccount:', error);
      next(error);
    }
  }

  /**
   * Verify bank account (simulated)
   * POST /api/banks/:id/verify
   */
  async verifyBankAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const bank = await prisma.bankAccount.findFirst({
        where: { id, userId },
      });

      if (!bank) {
        throw new AppError('Bank account not found', 404);
      }

      if (bank.isVerified) {
        throw new AppError('Bank account is already verified', 400);
      }

      // In production, implement actual verification logic:
      // e.g., micro-deposit verification, OTP verification, etc.
      const updatedBank = await prisma.bankAccount.update({
        where: { id },
        data: { isVerified: true },
      });

      logger.info(`Bank account ${id} verified for user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Bank account verified successfully',
        data: { id: updatedBank.id, isVerified: updatedBank.isVerified },
      });
    } catch (error) {
      logger.error('Error in verifyBankAccount:', error);
      next(error);
    }
  }

  /**
   * Get transactions for a specific bank account
   * GET /api/banks/:id/transactions
   */
  async getBankTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Verify bank belongs to user
      const bank = await prisma.bankAccount.findFirst({
        where: { id, userId },
      });

      if (!bank) {
        throw new AppError('Bank account not found', 404);
      }

      // Get transactions for this bank
      const transactions = await prisma.transaction.findMany({
        where: {
          OR: [
            { bankId: id },
            { AND: [{ senderId: userId }, { paymentMethod: 'bank' }] },
          ],
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: { select: { name: true, phone: true } },
          receiver: { select: { name: true, phone: true } },
        },
      });

      const total = await prisma.transaction.count({
        where: {
          OR: [
            { bankId: id },
            { AND: [{ senderId: userId }, { paymentMethod: 'bank' }] },
          ],
        },
      });

      // Convert Decimal amounts to numbers
      const formattedTransactions = transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      }));

      res.status(200).json({
        success: true,
        data: {
          transactions: formattedTransactions,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
          },
          bankInfo: {
            id: bank.id,
            name: bank.bankName,
            accountNumber: maskAccountNumber(bank.accountNumber),
          },
        },
      });
    } catch (error) {
      logger.error('Error in getBankTransactions:', error);
      next(error);
    }
  }

  /**
   * Set a bank as default
   * POST /api/banks/:id/default
   */
  async setDefaultBank(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Check if bank exists and belongs to user
      const bank = await prisma.bankAccount.findFirst({
        where: { id, userId },
      });

      if (!bank) {
        throw new AppError('Bank account not found', 404);
      }

      if (bank.isDefault) {
        throw new AppError('Bank account is already default', 400);
      }

      // Remove default from all other banks
      await prisma.bankAccount.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      // Set this bank as default
      const updatedBank = await prisma.bankAccount.update({
        where: { id },
        data: { isDefault: true },
      });

      logger.info(`Bank account ${id} set as default for user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Default bank updated successfully',
        data: { id: updatedBank.id, isDefault: updatedBank.isDefault },
      });
    } catch (error) {
      logger.error('Error in setDefaultBank:', error);
      next(error);
    }
  }
}

export default new BankController();