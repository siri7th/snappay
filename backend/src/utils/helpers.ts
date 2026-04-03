// utils/helpers.ts
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Format currency in Indian Rupees
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Mask account number (show only last 4 digits)
 */
export const maskAccountNumber = (accNo: string): string => {
  if (!accNo) return '';
  if (accNo.length <= 4) return '****';
  return `****${accNo.slice(-4)}`;
};

/**
 * Mask phone number (show first 2 and last 2 digits)
 */
export const maskPhoneNumber = (phone: string): string => {
  if (!phone || phone.length < 6) return '******';
  return `${phone.slice(0, 2)}****${phone.slice(-2)}`;
};

/**
 * Generate a secure transaction ID with prefix
 */
export const generateTxnId = (prefix: string = 'TXN'): string => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

/**
 * Generate a secure invite code (8 characters)
 */
export const generateInviteCode = (): string => {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars
};

/**
 * Hash data using bcrypt
 */
export const hashData = async (data: string): Promise<string> => {
  return bcrypt.hash(data, 10);
};

/**
 * Compare data with hash
 */
export const compareHash = async (data: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(data, hash);
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Format date
 */
export const formatDate = (date: Date, format: 'short' | 'long' = 'short'): string => {
  const options: Intl.DateTimeFormatOptions =
    format === 'long'
      ? { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: '2-digit', year: 'numeric' };
  return new Intl.DateTimeFormat('en-IN', options).format(date);
};

/**
 * Get start of day (00:00:00)
 */
export const getStartOfDay = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get end of day (23:59:59.999)
 */
export const getEndOfDay = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Get start of month
 */
export const getStartOfMonth = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get end of month
 */
export const getEndOfMonth = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Add days to a date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Sleep for ms
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Safely parse JSON with fallback
 */
export const parseJSON = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

/**
 * Omit fields from an object
 */
export const omitFields = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
};

/**
 * Pick fields from an object
 */
export const pickFields = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  return keys.reduce(
    (acc, key) => {
      if (key in obj) acc[key] = obj[key];
      return acc;
    },
    {} as Pick<T, K>
  );
};