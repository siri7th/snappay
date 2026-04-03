// src/services/api/payments.ts
import apiClient from './client';

export interface SendToMobileRequest {
  toMobile: string;
  amount: number;
  pin: string;
  note?: string;
  paymentMethod?: 'wallet' | 'bank';
  bankId?: string;
}

export interface SendToBankRequest {
  accountNumber: string;
  ifscCode: string;
  amount: number;
  pin: string;
  note?: string;
  paymentMethod?: 'wallet' | 'bank';
  bankId?: string;
}

export interface ProcessQRRequest {
  qrData: string;
  amount: number;
  pin: string;
  note?: string;
  paymentMethod?: 'wallet' | 'bank';
  bankId?: string;
}

export interface RequestMoneyRequest {
  fromPhone: string;
  amount: number;
  note?: string;
}

export const paymentAPI = {
  /**
   * Send money to mobile number
   */
  sendToMobile: (data: SendToMobileRequest) => 
    apiClient.post('/payments/send/mobile', data),

  /**
   * Send money to bank account
   */
  sendToBank: (data: SendToBankRequest) => 
    apiClient.post('/payments/send/bank', data),

  /**
   * Process QR code payment
   */
  processQR: (data: ProcessQRRequest) => 
    apiClient.post('/payments/qr', data),

  /**
   * Request money from someone
   */
  requestMoney: (data: RequestMoneyRequest) => 
    apiClient.post('/payments/request', data),

  /**
   * Get transaction by ID
   */
  getTransactionById: (id: string) => 
    apiClient.get(`/payments/${id}`),
};