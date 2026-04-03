// src/services/api/auth.ts - COMPLETE FIXED VERSION
import apiClient from './client';

export interface SendOTPRequest {
  phone: string;
  userType?: 'primary' | 'linked';
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
  sendOTP: (data: SendOTPRequest) => apiClient.post('/api/auth/send-otp', data),  // ✅ Fixed
  verifyOTP: (data: VerifyOTPRequest) => apiClient.post('/api/auth/verify-otp', data),  // ✅ Fixed
  getMe: () => apiClient.get('/api/auth/me'),  // ✅ Fixed
  updateProfile: (data: UpdateProfileRequest) => apiClient.put('/api/auth/profile', data),  // ✅ Fixed
  changePin: (data: ChangePinRequest) => apiClient.put('/api/auth/change-pin', data),  // ✅ Fixed
  setPin: (data: SetPinRequest) => apiClient.put('/api/auth/set-pin', data),  // ✅ Fixed
  forgotPinSendOtp: (data: ForgotPinSendOtpRequest) => apiClient.post('/api/auth/forgot-pin/send-otp', data),  // ✅ Fixed
  forgotPinVerify: (data: ForgotPinVerifyRequest) => apiClient.post('/api/auth/forgot-pin/verify', data),  // ✅ Fixed
  logout: () => apiClient.post('/api/auth/logout'),  // ✅ Fixed
  refreshToken: (refreshToken: string) => apiClient.post('/api/auth/refresh', { refreshToken }),  // ✅ Fixed
};