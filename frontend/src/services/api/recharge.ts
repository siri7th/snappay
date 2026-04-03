// src/services/api/recharge.ts
import apiClient from './client';

export interface MobileRechargeRequest {
  mobileNumber: string;
  amount: number;
  operator: string;
  planId?: string;
  paymentMethod?: 'wallet' | 'bank';
  bankId?: string;
}

export interface ElectricityBillRequest {
  consumerNumber: string;
  amount: number;
  board: string;
  paymentMethod?: 'wallet' | 'bank';
  bankId?: string;
}

export interface FastagRechargeRequest {
  vehicleNumber: string;
  amount: number;
  paymentMethod?: 'wallet' | 'bank';
  bankId?: string;
}

export interface GetPlansParams {
  type?: 'mobile' | 'electricity' | 'fastag' | 'dth';
  operator?: string;
}

export interface GetHistoryParams {
  page?: number;
  limit?: number;
  type?: string;
  from?: string;
  to?: string;
}

export const rechargeAPI = {
  /**
   * Get recharge plans
   */
  getPlans: (params?: GetPlansParams) => 
    apiClient.get('/recharge/plans', { params }),

  /**
   * Mobile recharge
   */
  mobileRecharge: (data: MobileRechargeRequest) => 
    apiClient.post('/recharge/mobile', data),

  /**
   * Electricity bill payment
   */
  electricityBill: (data: ElectricityBillRequest) => 
    apiClient.post('/recharge/electricity', data),

  /**
   * FASTag recharge
   */
  fastagRecharge: (data: FastagRechargeRequest) => 
    apiClient.post('/recharge/fastag', data),

  /**
   * Get recharge history
   */
  getHistory: (params?: GetHistoryParams) => 
    apiClient.get('/recharge/history', { params }),
};