// backend/src/services/otpService.ts
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { OTP_PURPOSES, OTP } from '../utils/constants';

class OTPService {
  /**
   * Generate a 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send SMS (mock implementation - replace with actual SMS provider)
   */
  private async sendSMS(phone: string, otp: string): Promise<void> {
    logger.info(`📱 OTP for ${phone}: ${otp}`);
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n🔐 OTP for ${phone}: ${otp}\n`);
    }
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(phone: string, purpose: string = 'login', userType: string = 'primary'): Promise<void> {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      throw new AppError('Invalid phone number', 400);
    }

    // Check for recent OTP (rate limiting)
    const recent = await prisma.oTP.findFirst({
      where: {
        phone: cleanPhone,
        purpose,
        createdAt: { gt: new Date(Date.now() - OTP.RESEND_WAIT_MINUTES * 60 * 1000) },
        isUsed: false,
      },
    });
    
    if (recent) {
      throw new AppError(`Please wait ${OTP.RESEND_WAIT_MINUTES} minutes before requesting another OTP`, 429);
    }

    // Invalidate any previous unused OTPs
    await prisma.oTP.updateMany({
      where: { phone: cleanPhone, purpose, isUsed: false },
      data: { isUsed: true },
    });

    const otp = this.generateOTP();
    
    // IMPORTANT: Do NOT include the user relation in OTP creation
    // This avoids the foreign key constraint error
    await prisma.oTP.create({
      data: {
        phone: cleanPhone,
        code: otp,
        purpose,
        expiresAt: new Date(Date.now() + OTP.EXPIRY_MINUTES * 60 * 1000),
        attempts: 0,
        isUsed: false,
        // Do NOT add: user: { connect: { phone: cleanPhone } }
      },
    });

    // Send SMS (async)
    this.sendSMS(cleanPhone, otp).catch((err) => {
      logger.error(`Failed to send SMS to ${cleanPhone}:`, err);
    });
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phone: string, code: string, purpose: string = OTP_PURPOSES.LOGIN): Promise<boolean> {
    const cleanPhone = phone.replace(/\D/g, '');

    const record = await prisma.oTP.findFirst({
      where: {
        phone: cleanPhone,
        code,
        purpose,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    // Mark as used
    await prisma.oTP.update({
      where: { id: record.id },
      data: { isUsed: true, usedAt: new Date() },
    });

    return true;
  }

  /**
   * Clean up expired OTPs (call via cron job)
   */
  async cleanup(): Promise<void> {
    const result = await prisma.oTP.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    logger.info(`Cleaned up ${result.count} expired OTPs`);
  }
}

export default new OTPService();