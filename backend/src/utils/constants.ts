// utils/constants.ts

// ============================================
// USER & ACCOUNT CONSTANTS
// ============================================

export const USER_ROLES = {
  PRIMARY: 'PRIMARY',
  LINKED: 'LINKED',
} as const;

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  BLOCKED: 'BLOCKED',
  PENDING: 'PENDING',
} as const;

export const FAMILY_MEMBER_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  REMOVED: 'REMOVED',
} as const;

export const INVITATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

// ============================================
// TRANSACTION CONSTANTS
// ============================================

export const TRANSACTION_TYPES = {
  SEND: 'SEND',
  RECEIVE: 'RECEIVE',
  RECHARGE: 'RECHARGE',
  ADD_TO_WALLET: 'ADD_TO_WALLET',
  ADD_TO_LIMIT: 'ADD_TO_LIMIT',
  WITHDRAW: 'WITHDRAW',
  PAYMENT: 'PAYMENT',
  BALANCE_TRANSFER: 'BALANCE_TRANSFER',
  DISCONNECT_TRANSFER: 'DISCONNECT_TRANSFER',
  SEND_MONEY: 'SEND_MONEY',
  QR_PAYMENT: 'QR_PAYMENT',
} as const;

export const TRANSACTION_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export const PAYMENT_METHODS = {
  WALLET: 'wallet',
  BANK: 'bank',
  UPI: 'upi',
  QR: 'qr',
  SYSTEM: 'system',
} as const;

// ============================================
// RECHARGE CONSTANTS
// ============================================

export const RECHARGE_TYPES = {
  MOBILE: 'MOBILE',
  ELECTRICITY: 'ELECTRICITY',
  FASTAG: 'FASTAG',
  DTH: 'DTH',
  GAS: 'GAS',
  WATER: 'WATER',
} as const;

// ============================================
// NOTIFICATION CONSTANTS
// ============================================

export const NOTIFICATION_TYPES = {
  // Payment
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYMENT_SENT: 'PAYMENT_SENT',
  BANK_TRANSFER: 'BANK_TRANSFER',
  QR_PAYMENT: 'QR_PAYMENT',

  // Wallet
  WALLET_CREDIT: 'WALLET_CREDIT',
  WALLET_DEBIT: 'WALLET_DEBIT',

  // Limits
  LIMIT_REQUEST: 'LIMIT_REQUEST',
  LIMIT_APPROVED: 'LIMIT_APPROVED',
  LIMIT_DENIED: 'LIMIT_DENIED',
  LIMIT_UPDATED: 'LIMIT_UPDATED',
  LIMIT_INCREASED: 'LIMIT_INCREASED',
  LIMIT_ALERT: 'LIMIT_ALERT',

  // Family
  FAMILY_JOINED: 'FAMILY_JOINED',
  FAMILY_INVITATION: 'FAMILY_INVITATION',
  FAMILY_REMOVED: 'FAMILY_REMOVED',
  INVITATION_REJECTED: 'INVITATION_REJECTED',
  INVITATION_CANCELLED: 'INVITATION_CANCELLED',

  // Connection
  CONNECTION_REQUEST: 'CONNECTION_REQUEST',
  CONNECTION_APPROVED: 'CONNECTION_APPROVED',
  LINKED_DISCONNECTED: 'LINKED_DISCONNECTED',

  // Account
  ACCOUNT_PAUSED: 'ACCOUNT_PAUSED',
  ACCOUNT_RESUMED: 'ACCOUNT_RESUMED',

  // Requests
  REQUEST_APPROVED: 'REQUEST_APPROVED',
  REQUEST_DENIED: 'REQUEST_DENIED',

  // Recharge
  RECHARGE_SUCCESS: 'RECHARGE_SUCCESS',
  RECHARGE_FAILED: 'RECHARGE_FAILED',

  // System
  SYSTEM: 'SYSTEM',
  WELCOME: 'WELCOME',
  LOW_BALANCE: 'LOW_BALANCE',
} as const;

// ============================================
// OTP CONSTANTS
// ============================================

export const OTP_PURPOSES = {
  LOGIN: 'login',
  VERIFY_BANK: 'verify_bank',
  RESET_PIN: 'reset_pin',
  INVITE: 'invite',
  DISCONNECT: 'disconnect',
  REMOVE_ACCOUNT: 'remove_account',
} as const;

export const OTP = {
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
  RESEND_WAIT_MINUTES: 2,
} as const;

// ============================================
// LIMIT CONSTANTS
// ============================================

export const LIMITS = {
  DEFAULT_DAILY: 500,
  DEFAULT_MONTHLY: 5000,
  DEFAULT_PER_TXN: 200,
  MAX_DAILY: 10000,
  MAX_MONTHLY: 50000,
  MAX_PER_TXN: 1000,
} as const;

export const LIMIT_REQUEST_DURATION = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  PERMANENT: 'permanent',
} as const;

// ============================================
// PAGINATION CONSTANTS
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// ============================================
// HTTP STATUS CODES
// ============================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY: 429,
  SERVER_ERROR: 500,
} as const;