// src/services/api/wallet.ts
import apiClient from './client';

export interface GetTransactionsParams {
  page?: number;
  limit?: number;
  type?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface AddMoneyRequest {
  amount: number;
  bankId: string;
}

export interface WithdrawMoneyRequest {
  amount: number;
  bankId: string;
}

export interface GetAllMemberBalancesRequest {
  memberIds: string[];
}

export const walletAPI = {
  /**
   * Get wallet balance
   */
  getBalance: () => apiClient.get('/wallet/balance'),

  /**
   * Get wallet transactions with pagination
   */
  getTransactions: (params?: GetTransactionsParams) => 
    apiClient.get('/wallet/transactions', { params }),

  /**
   * Add money to wallet from bank
   */
  addMoney: (data: AddMoneyRequest) => 
    apiClient.post('/wallet/add', data),

  /**
   * Withdraw money from wallet to bank
   */
  withdrawMoney: (data: WithdrawMoneyRequest) => 
    apiClient.post('/wallet/withdraw', data),

  /**
   * Get wallet statistics
   */
  getStats: () => apiClient.get('/wallet/stats'),

  /**
   * Get member wallet balance (for primary users)
   */
  getMemberWalletBalance: (memberId: string) => 
    apiClient.get(`/wallet/member/${memberId}`),

  /**
   * Get all member balances (for primary users)
   */
  getAllMemberBalances: (memberIds: string[]) => 
    apiClient.post('/wallet/members/balances', { memberIds }),

  /**
   * Get member transactions (for primary users)
   */
  getMemberTransactions: (memberId: string, params?: { page?: number; limit?: number }) => 
    apiClient.get(`/family/${memberId}/transactions`, { params }),

  /**
   * Get transaction by ID
   */
  getTransactionById: (id: string) => 
    apiClient.get(`/wallet/transactions/${id}`),
};