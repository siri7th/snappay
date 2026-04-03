// utils/validators.ts
import { AppError } from '../middleware/errorHandler';
import {
  USER_ROLES,
  USER_STATUS,
  FAMILY_MEMBER_STATUS,
  INVITATION_STATUS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  PAYMENT_METHODS,
  RECHARGE_TYPES,
  NOTIFICATION_TYPES,
  OTP_PURPOSES,
  LIMIT_REQUEST_DURATION,
} from './constants';

// ============================================
// Basic Validators (return boolean)
// ============================================

export const validatePhone = (phone: string): boolean => {
  return /^[0-9]{10}$/.test(phone);
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePIN = (pin: string): boolean => {
  return /^[0-9]{4}$/.test(pin);
};

export const validateAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 1000000; // Max 10 lakhs
};

export const validateIFSC = (ifsc: string): boolean => {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
};

export const validateAccountNumber = (accNo: string): boolean => {
  return /^[0-9]{9,18}$/.test(accNo);
};

export const validateUPIId = (upiId: string): boolean => {
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId);
};

export const validateName = (name: string): boolean => {
  return name.length >= 2 && name.length <= 50 && /^[a-zA-Z\s]+$/.test(name);
};

// ============================================
// Pagination Validators
// ============================================

export const validatePage = (page: any): number => {
  const num = parseInt(page);
  return !isNaN(num) && num > 0 ? num : 1;
};

export const validateLimit = (limit: any): number => {
  const num = parseInt(limit);
  return !isNaN(num) && num > 0 && num <= 100 ? num : 10;
};

// ============================================
// Date Range Validator (throws AppError)
// ============================================

export const validateDateRange = (startDate?: string, endDate?: string) => {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new AppError('Invalid date format', 400);
  }
  if (start > end) {
    throw new AppError('Start date cannot be after end date', 400);
  }

  return { start, end };
};

// ============================================
// Enum Validators (type guards)
// ============================================

export const validateUserRole = (role: string): role is typeof USER_ROLES[keyof typeof USER_ROLES] => {
  return Object.values(USER_ROLES).includes(role as any);
};

export const validateUserStatus = (status: string): status is typeof USER_STATUS[keyof typeof USER_STATUS] => {
  return Object.values(USER_STATUS).includes(status as any);
};

export const validateFamilyMemberStatus = (status: string): status is typeof FAMILY_MEMBER_STATUS[keyof typeof FAMILY_MEMBER_STATUS] => {
  return Object.values(FAMILY_MEMBER_STATUS).includes(status as any);
};

export const validateInvitationStatus = (status: string): status is typeof INVITATION_STATUS[keyof typeof INVITATION_STATUS] => {
  return Object.values(INVITATION_STATUS).includes(status as any);
};

export const validateTransactionType = (type: string): type is typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES] => {
  return Object.values(TRANSACTION_TYPES).includes(type as any);
};

export const validateTransactionStatus = (status: string): status is typeof TRANSACTION_STATUS[keyof typeof TRANSACTION_STATUS] => {
  return Object.values(TRANSACTION_STATUS).includes(status as any);
};

export const validatePaymentMethod = (method: string): method is typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS] => {
  return Object.values(PAYMENT_METHODS).includes(method as any);
};

export const validateRechargeType = (type: string): type is typeof RECHARGE_TYPES[keyof typeof RECHARGE_TYPES] => {
  return Object.values(RECHARGE_TYPES).includes(type as any);
};

export const validateNotificationType = (type: string): type is typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES] => {
  return Object.values(NOTIFICATION_TYPES).includes(type as any);
};

export const validateOTPPurpose = (purpose: string): purpose is typeof OTP_PURPOSES[keyof typeof OTP_PURPOSES] => {
  return Object.values(OTP_PURPOSES).includes(purpose as any);
};

export const validateLimitRequestDuration = (duration: string): duration is typeof LIMIT_REQUEST_DURATION[keyof typeof LIMIT_REQUEST_DURATION] => {
  return Object.values(LIMIT_REQUEST_DURATION).includes(duration as any);
};

// ============================================
// Generic Enum Validator
// ============================================

export const validateEnum = <T extends Record<string, string>>(
  value: string,
  enumObj: T
): value is T[keyof T] => {
  return Object.values(enumObj).includes(value as any);
};

// ============================================
// Assertion Validators (throw AppError)
// ============================================

export const assertRequired = (value: any, field: string): void => {
  if (value === undefined || value === null || value === '') {
    throw new AppError(`${field} is required`, 400);
  }
};

export const assertLength = (value: string, min: number, max: number, field: string): void => {
  if (value.length < min || value.length > max) {
    throw new AppError(`${field} must be between ${min} and ${max} characters`, 400);
  }
};

export const assertPhone = (phone: string): void => {
  if (!validatePhone(phone)) {
    throw new AppError('Invalid phone number format. Must be 10 digits.', 400);
  }
};

export const assertEmail = (email: string): void => {
  if (!validateEmail(email)) {
    throw new AppError('Invalid email format', 400);
  }
};

export const assertPIN = (pin: string): void => {
  if (!validatePIN(pin)) {
    throw new AppError('PIN must be 4 digits', 400);
  }
};

export const assertAmount = (amount: number): void => {
  if (!validateAmount(amount)) {
    throw new AppError('Amount must be positive and less than ₹10,00,000', 400);
  }
};

export const assertIFSC = (ifsc: string): void => {
  if (!validateIFSC(ifsc)) {
    throw new AppError('Invalid IFSC code format', 400);
  }
};

export const assertAccountNumber = (accNo: string): void => {
  if (!validateAccountNumber(accNo)) {
    throw new AppError('Account number must be 9-18 digits', 400);
  }
};

export const assertUPIId = (upiId: string): void => {
  if (!validateUPIId(upiId)) {
    throw new AppError('Invalid UPI ID format', 400);
  }
};