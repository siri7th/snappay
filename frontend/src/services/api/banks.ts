// src/services/api/banks.ts
import apiClient from './client';
import { Bank, AddBankRequest, UpdateBankRequest, BankTransaction } from '../../types/bank.types';

export interface GetBankTransactionsParams {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  type?: 'credit' | 'debit';
}

export const bankAPI = {
  /**
   * Get all banks for the logged-in user
   */
  getBanks: () => apiClient.get<{ success: boolean; data: { banks: Bank[]; totalBalance: number } }>('/banks'),

  /**
   * Get a specific bank by ID
   */
  getBankById: (id: string) => apiClient.get<{ success: boolean; data: Bank }>(`/banks/${id}`),

  /**
   * Add a new bank account
   */
  addBank: (data: AddBankRequest) => apiClient.post<{ success: boolean; data: Bank }>('/banks', data),

  /**
   * Update bank details (including set as default)
   */
  updateBank: (id: string, data: UpdateBankRequest) => apiClient.put<{ success: boolean; data: Bank }>(`/banks/${id}`, data),

  /**
   * Delete/remove a bank account
   */
  deleteBank: (id: string) => apiClient.delete<{ success: boolean }>(`/banks/${id}`),

  /**
   * Verify bank account (micro-deposit verification)
   */
  verifyBank: (id: string) => apiClient.post<{ success: boolean }>(`/banks/${id}/verify`),

  /**
   * Get transactions for a specific bank
   */
  getBankTransactions: (id: string, params?: GetBankTransactionsParams) =>
    apiClient.get<{ success: boolean; data: { transactions: BankTransaction[]; pagination?: any } }>(`/banks/${id}/transactions`, { params }),
};