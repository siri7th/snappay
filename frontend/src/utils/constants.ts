// src/utils/constants.ts

// ============================================
// USER & ACCOUNT CONSTANTS
// ============================================

export const USER_ROLES = {
  PRIMARY: 'PRIMARY',
  LINKED: 'LINKED',
  ADMIN: 'ADMIN',
} as const;

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  BLOCKED: 'BLOCKED',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED',
} as const;

export const FAMILY_STATUS = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  PENDING: 'PENDING',
  REMOVED: 'REMOVED',
} as const;

export const REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DENIED: 'DENIED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export const REQUEST_DURATION = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  PERMANENT: 'permanent',
} as const;

export const CONNECTION_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  PENDING: 'pending',
  CHECKING: 'checking',
  EXPIRED: 'expired',
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
  QR_PAYMENT: 'QR_PAYMENT',
  BANK_TRANSFER: 'BANK_TRANSFER',
  UPI_PAYMENT: 'UPI_PAYMENT',
  BALANCE_TRANSFER: 'BALANCE_TRANSFER',
  DISCONNECT_TRANSFER: 'DISCONNECT_TRANSFER',
} as const;

export const TRANSACTION_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
} as const;

export const PAYMENT_METHODS = {
  WALLET: 'wallet',
  BANK: 'bank',
  UPI: 'upi',
  QR: 'qr',
  CARD: 'card',
  NETBANKING: 'netbanking',
  SYSTEM: 'system',
} as const;

export const RECHARGE_TYPES = {
  MOBILE: 'MOBILE',
  ELECTRICITY: 'ELECTRICITY',
  FASTAG: 'FASTAG',
  DTH: 'DTH',
  GAS: 'GAS',
  WATER: 'WATER',
  BROADBAND: 'BROADBAND',
  LANDLINE: 'LANDLINE',
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

export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
  RESEND_WAIT_SECONDS: 30,
  MAX_ATTEMPTS: 3,
} as const;

// ============================================
// LIMIT CONSTANTS
// ============================================

export const LIMITS = {
  // Default limits
  DEFAULT_DAILY: 500,
  DEFAULT_MONTHLY: 5000,
  DEFAULT_PER_TXN: 200,
  
  // Maximum limits
  MAX_DAILY: 10000,
  MAX_MONTHLY: 50000,
  MAX_PER_TXN: 1000,
  
  // Minimum limits
  MIN_AMOUNT: 1,
  MIN_DAILY: 100,
  MIN_MONTHLY: 1000,
  MIN_PER_TXN: 50,
  
  // Special limits
  MAX_RECHARGE: 10000,
  MAX_ADD_MONEY: 100000,
  MAX_WITHDRAW: 50000,
  MAX_REQUEST_INCREASE: 10000,
} as const;

// ============================================
// PAGINATION CONSTANTS
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  PAGE_SIZES: [10, 25, 50, 100],
} as const;

// ============================================
// HTTP STATUS CODES
// ============================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  TOO_MANY: 429,
  SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// ============================================
// STORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  LINKED_PRIMARY: 'linked_primary_connected',
  PRIMARY_DETAILS: 'primary_details',
  PENDING_INVITATION: 'pending_invitation_id',
  PENDING_CONNECTION: 'pending_connection',
  ONBOARDING: 'onboarding',
  DEVICE_ID: 'device_id',
  FCM_TOKEN: 'fcm_token',
} as const;

// ============================================
// APP CONFIGURATION
// ============================================

export const APP_CONFIG = {
  NAME: 'SnapPay',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: import.meta.env.VITE_SUPPORT_EMAIL || 'support@snappay.com',
  SUPPORT_PHONE: import.meta.env.VITE_SUPPORT_PHONE || '1800-123-4567',
  WEBSITE: 'https://snappay.com',
  COMPANY: 'SnapPay Technologies',
  COPYRIGHT_YEAR: new Date().getFullYear(),
} as const;

// ============================================
// ROUTES
// ============================================

export const ROUTES = {
  // Public
  HOME: '/',
  AUTH: '/auth',
  SIGNUP: '/signup',
  VERIFY_OTP: '/verify-otp',
  FORGOT_PIN: '/forgot-pin',
  ACCEPT_INVITE: '/accept-invite',
  JOIN_FAMILY: '/join-family',
  
  // Shared
  NOTIFICATIONS: '/notifications',
  PROFILE_SETUP: '/profile-setup',
  SET_PIN: '/set-pin',
  TRANSACTION_DETAILS: '/transactions/:id',
  RECEIVE: '/receive',
  
  // Primary
  PRIMARY_DASHBOARD: '/primary/dashboard',
  PRIMARY_SEND: '/primary/send',
  PRIMARY_RECEIVE: '/primary/receive',
  PRIMARY_RECHARGE: '/primary/recharge',
  PRIMARY_TRANSACTIONS: '/primary/transactions',
  PRIMARY_FAMILY: '/primary/family',
  PRIMARY_FAMILY_ADD: '/primary/family/add',
  PRIMARY_FAMILY_DETAILS: '/primary/family/:id',
  PRIMARY_FAMILY_EDIT: '/primary/family/:id/edit',
  PRIMARY_FAMILY_ADD_LIMIT: '/primary/family/:id/add-limit',
  PRIMARY_FAMILY_REQUESTS: '/primary/family/requests',
  PRIMARY_BANKS: '/primary/banks',
  PRIMARY_BANK_DETAILS: '/primary/banks/:id',
  ADD_BANK: '/add-bank',
  PRIMARY_SCAN: '/primary/scan',
  PRIMARY_SETTINGS: '/primary/settings',
  PRIMARY_SETTINGS_PROFILE: '/primary/settings/profile',
  PRIMARY_SETTINGS_SECURITY: '/primary/settings/security',
  PRIMARY_SETTINGS_NOTIFICATIONS: '/primary/settings/notifications',
  PRIMARY_SUPPORT: '/primary/support',
  
  // Linked
  LINKED_DASHBOARD: '/linked/dashboard',
  LINKED_SEND: '/linked/send',
  LINKED_RECEIVE: '/linked/receive',
  LINKED_SCAN: '/linked/scan',
  LINKED_RECHARGE: '/linked/recharge',
  LINKED_TRANSACTIONS: '/linked/transactions',
  LINKED_HISTORY: '/linked/history',
  LINKED_PROFILE: '/linked/profile',
  LINKED_CONNECT: '/linked/connect',
  LINKED_CONNECTION_STATUS: '/linked/connection-status',
  LINKED_REQUEST_INCREASE: '/linked/request-increase',
  
  // Wallet
  WALLET_ADD: '/wallet/add',
  
  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  
  // Misc
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SUPPORT: '/support',
  FEATURES: '/features',
  HOW_IT_WORKS: '/how-it-works',
  PRICING: '/pricing',
  FAQ: '/faq',
  CONTACT: '/contact',
  HELP: '/help',
  PRIVACY: '/privacy',
  TERMS: '/terms',
} as const;

// ============================================
// SOCIAL LINKS
// ============================================

export const SOCIAL_LINKS = {
  FACEBOOK: import.meta.env.VITE_FACEBOOK_URL || 'https://facebook.com/snappay',
  TWITTER: import.meta.env.VITE_TWITTER_URL || 'https://twitter.com/snappay',
  LINKEDIN: import.meta.env.VITE_LINKEDIN_URL || 'https://linkedin.com/company/snappay',
} as const;

// ============================================
// DATE FORMATS
// ============================================

export const DATE_FORMATS = {
  DISPLAY: 'dd MMM yyyy',
  DISPLAY_WITH_TIME: 'dd MMM yyyy, hh:mm a',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  TIME: 'hh:mm a',
  RELATIVE: 'relative',
} as const;

// ============================================
// CURRENCY
// ============================================

export const CURRENCY = {
  CODE: 'INR',
  SYMBOL: '₹',
  LOCALE: 'en-IN',
} as const;

// ============================================
// FILE LIMITS
// ============================================

export const FILE_LIMITS = {
  MAX_PROFILE_PICTURE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
} as const;

// ============================================
// CACHE DURATION
// ============================================

export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 60 * 60 * 1000, // 1 hour
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// ============================================
// SOCKET EVENTS
// ============================================

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  ERROR: 'error',
  
  JOIN_USER: 'join-user',
  JOIN_PRIMARY: 'join-primary',
  JOIN_FAMILY: 'join-family',
  
  NOTIFICATION: 'notification',
  
  PAYMENT_RECEIVED: 'payment-received',
  PAYMENT_SUCCESS: 'payment-success',
  PAYMENT_FAILED: 'payment-failed',
  TRANSACTION_UPDATE: 'transaction:update',
  
  LIMIT_UPDATED: 'limit-updated',
  LIMIT_REQUEST: 'limit-request',
  REQUEST_APPROVED: 'request-approved',
  REQUEST_DENIED: 'request-denied',
  
  FAMILY_MEMBER_ADDED: 'family:member-added',
  FAMILY_MEMBER_REMOVED: 'family:member-removed',
  
  INVITATION_RECEIVED: 'invitation:received',
  INVITATION_ACCEPTED: 'invitation:accepted',
  
  RECHARGE_COMPLETED: 'recharge:completed',
  RECHARGE_FAILED: 'recharge:failed',
  
  TYPING: 'typing',
  MESSAGE: 'message',
} as const;

// ============================================
// ERROR MESSAGES
// ============================================

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to server. Please check your internet connection.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
  OFFLINE: 'You are currently offline. Please check your connection.',
} as const;

// ============================================
// REGEX PATTERNS
// ============================================

export const REGEX_PATTERNS = {
  PHONE: /^[0-9]{10}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PIN: /^[0-9]{4}$/,
  OTP: /^[0-9]{6}$/,
  IFSC: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  ACCOUNT_NUMBER: /^[0-9]{9,18}$/,
  UPI_ID: /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/,
  NAME: /^[a-zA-Z\s]+$/,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  AADHAAR: /^[0-9]{12}$/,
  GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  VEHICLE: /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/,
  PINCODE: /^[0-9]{6}$/,
} as const;

// ============================================
// ANIMATION DURATIONS
// ============================================

export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
} as const;

// ============================================
// TOAST DURATION
// ============================================

export const TOAST_DURATION = {
  SHORT: 2000,
  NORMAL: 4000,
  LONG: 6000,
  VERY_LONG: 8000,
} as const;

// ============================================
// DEBOUNCE DELAY
// ============================================

export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  INPUT: 500,
  RESIZE: 250,
  SCROLL: 100,
} as const;

// ============================================
// THEME
// ============================================

export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// ============================================
// LANGUAGES
// ============================================

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
] as const;

// ============================================
// COUNTRY
// ============================================

export const COUNTRY = {
  CODE: 'IN',
  NAME: 'India',
  PHONE_CODE: '+91',
  CURRENCY: 'INR',
} as const;