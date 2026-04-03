// src/services/api/auth.ts
import apiClient from './client';

export interface SendOTPRequest {
  phone: string;
  userType?: 'primary' | 'linked';  // Add userType
  mode?: 'login' | 'signup';
}

export interface VerifyOTPRequest {
  phone: string;
  otp: string;
  userType?: 'primary' | 'linked';
  mode?: 'login' | 'signup';
}

export interface ChangePinRequest {
  oldPin: string;
  newPin: string;
}

export interface SetPinRequest {
  pin: string;
}

export interface ForgotPinSendOtpRequest {
  phone: string;
}

export interface ForgotPinVerifyRequest {
  phone: string;
  otp: string;
  newPin: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  alternatePhone?: string;
  occupation?: string;
  profilePicture?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export const authAPI = {
  /**
   * Send OTP to phone number
   * @param data - Phone number and optional user type (primary/linked)
   */
  sendOTP: (data: SendOTPRequest) => apiClient.post('/auth/send-otp', data),

  /**
   * Verify OTP and login/register
   */
  verifyOTP: (data: VerifyOTPRequest) => apiClient.post('/auth/verify-otp', data),

  /**
   * Get current user profile
   */
  getMe: () => apiClient.get('/auth/me'),

  /**
   * Update user profile
   */
  updateProfile: (data: UpdateProfileRequest) => apiClient.put('/auth/profile', data),

  /**
   * Change PIN (aligned with backend - oldPin/newPin)
   */
  changePin: (data: ChangePinRequest) => apiClient.put('/auth/change-pin', data),

  /**
   * Set PIN (first time)
   */
  setPin: (data: SetPinRequest) => apiClient.put('/auth/set-pin', data),

  /**
   * Forgot PIN - send OTP
   */
  forgotPinSendOtp: (data: ForgotPinSendOtpRequest) => apiClient.post('/auth/forgot-pin/send-otp', data),

  /**
   * Forgot PIN - verify OTP and set new PIN
   */
  forgotPinVerify: (data: ForgotPinVerifyRequest) => apiClient.post('/auth/forgot-pin/verify', data),

  /**
   * Logout user
   */
  logout: () => apiClient.post('/auth/logout'),

  /**
   * Refresh access token
   */
  refreshToken: (refreshToken: string) => apiClient.post('/auth/refresh', { refreshToken }),
};