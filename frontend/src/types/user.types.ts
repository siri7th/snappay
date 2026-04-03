// types/user.types.ts
export type UserRole = 'PRIMARY' | 'LINKED' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'PAUSED' | 'BLOCKED' | 'PENDING' | 'SUSPENDED';

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  profilePicture?: string;
  walletBalance: number;
  createdAt?: string;
  updatedAt?: string;
  
  // Profile fields
  dob?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  address?: Address;
  alternatePhone?: string;
  occupation?: string;
  company?: string;
  
  // KYC fields
  isVerified: boolean;
  kycStatus?: 'pending' | 'submitted' | 'verified' | 'rejected';
  panNumber?: string;
  aadhaarNumber?: string;
  gstNumber?: string;
  
  // Preferences
  preferences?: UserPreferences;
  
  // Security
  twoFactorEnabled?: boolean;
  biometricEnabled?: boolean;
  lastLogin?: string;
  lastLoginIp?: string;
  loginAttempts?: number;
  lockedUntil?: string;
  
  // Linked account info (for linked users)
  linkedPrimaryId?: string;
  limits?: UserLimits;
  
  // Metadata
  metadata?: Record<string, any>;
}

export interface UserLimits {
  dailyLimit: number;
  dailySpent: number;
  dailyRemaining: number;
  monthlyLimit: number;
  monthlySpent: number;
  monthlyRemaining: number;
  perTransactionLimit: number;
  relationship?: string;
  status?: 'ACTIVE' | 'PAUSED' | 'PENDING';
}

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    types: Record<string, boolean>;
  };
  privacy: {
    showProfile: boolean;
    showTransactions: boolean;
    showWalletBalance: boolean;
  };
  security: {
    loginAlerts: boolean;
    transactionAlerts: boolean;
    deviceManagement: boolean;
  };
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  lockedBalance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
  balance: number;
  isDefault: boolean;
  isVerified: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  upiIds?: string[];
}

export interface LoginRequest {
  phone: string;
  deviceInfo?: {
    deviceId?: string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    os?: string;
    browser?: string;
    appVersion?: string;
  };
}

export interface VerifyOTPRequest {
  phone: string;
  otp: string;
  userType?: UserRole;
  deviceInfo?: {
    deviceId?: string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    os?: string;
    browser?: string;
    appVersion?: string;
    fcmToken?: string;
  };
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  dob?: string;
  gender?: string;
  address?: Address;
  alternatePhone?: string;
  occupation?: string;
  company?: string;
  profilePicture?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePinRequest {
  currentPin: string;
  newPin: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  isNewUser: boolean;
  expiresIn: number;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface DeviceInfo {
  id: string;
  deviceId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  lastActive: string;
  isCurrent: boolean;
  location?: string;
  ip?: string;
}

export interface SessionInfo {
  id: string;
  userId: string;
  deviceId: string;
  createdAt: string;
  expiresAt: string;
  lastActivity: string;
  isActive: boolean;
}

export interface UserStats {
  totalTransactions: number;
  totalSpent: number;
  totalReceived: number;
  totalRecharge: number;
  averageTransaction: number;
  mostUsedPaymentMethod: PaymentMethodData;
  joinedAt: string;
  lastActive: string;
  familyMembers: number;
  linkedAccounts: number;
}