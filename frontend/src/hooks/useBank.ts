// src/hooks/useBank.ts
import { useState, useCallback, useEffect } from 'react';
import { bankAPI } from '../services/api/banks';
import { Bank, AddBankRequest, UpdateBankRequest } from '../types/bank.types';
import toast from 'react-hot-toast';

// Define response type
interface BankApiResponse {
  success: boolean;
  data: {
    banks: Bank[];
    totalBalance: number;
  };
}

export const useBank = () => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Type guard to check if response matches expected structure
  const isBankApiResponse = (data: any): data is BankApiResponse => {
    return data && 
           typeof data === 'object' && 
           'success' in data && 
           'data' in data &&
           data.data &&
           'banks' in data.data &&
           'totalBalance' in data.data;
  };

  // Get all banks
  const fetchBanks = useCallback(async (showToast: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await bankAPI.getBanks();
      const data = response.data;
      
      if (isBankApiResponse(data) && data.success) {
        setBanks(data.data.banks);
        setTotalBalance(data.data.totalBalance);
        return data.data;
      } 
      
      // Try alternative structures
      if (data && typeof data === 'object') {
        if ('banks' in data && Array.isArray(data.banks)) {
          setBanks(data.banks);
          setTotalBalance('totalBalance' in data ? (data.totalBalance as number) : 0);
          return data;
        }
        
        if ('data' in data && data.data && typeof data.data === 'object') {
          const nestedData = data.data as any;
          if (nestedData.banks) {
            setBanks(nestedData.banks);
            setTotalBalance(nestedData.totalBalance || 0);
            return nestedData;
          }
        }
      }
      
      return { banks: [], totalBalance: 0 };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch banks';
      setError(errorMessage);
      
      if (showToast) {
        toast.error(errorMessage);
      }
      
      return { banks: [], totalBalance: 0 };
    } finally {
      setLoading(false);
      if (!initialized) setInitialized(true);
    }
  }, [initialized]);

  // Add new bank account
  const addBank = useCallback(async (bankData: AddBankRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await bankAPI.addBank(bankData);
      
      if (response.data?.success) {
        toast.success('Bank account added successfully!');
        await fetchBanks(true);
        return response.data;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to add bank';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchBanks]);

  // Update bank account
  const updateBank = useCallback(async (id: string, data: UpdateBankRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await bankAPI.updateBank(id, data);
      
      if (response.data?.success) {
        toast.success('Bank updated successfully');
        await fetchBanks(true);
        return response.data;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Update failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchBanks]);

  // Delete bank account
  const deleteBank = useCallback(async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this bank account?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await bankAPI.deleteBank(id);
      
      toast.success('Bank account removed successfully');
      await fetchBanks(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to remove bank';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchBanks]);

  // Set bank as default
  const setDefaultBank = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await bankAPI.updateBank(id, { isDefault: true });
      
      if (response.data?.success) {
        await fetchBanks(true);
        toast.success('Default bank updated successfully');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to set default bank';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchBanks]);

  // Verify bank account
  const verifyBank = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await bankAPI.verifyBank(id);
      
      if (response.data?.success) {
        toast.success('Bank verified successfully');
        await fetchBanks(true);
        return response.data;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Verification failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchBanks]);

  // Get single bank details
  const getBankDetails = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await bankAPI.getBankById(id);
      
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Bank not found';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get bank transactions
  const getBankTransactions = useCallback(async (id: string, params?: { page?: number; limit?: number }) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await bankAPI.getBankTransactions(id, params);
      
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return response.data || { transactions: [], pagination: null };
    } catch (err: any) {
      return { transactions: [], pagination: null };
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate total balance from all banks
  const calculateTotalBalance = useCallback(() => {
    const total = banks.reduce((sum, bank) => sum + (bank.balance || 0), 0);
    setTotalBalance(total);
    return total;
  }, [banks]);

  // Get default bank
  const getDefaultBank = useCallback(() => {
    return banks.find(bank => bank.isDefault === true) || banks[0] || null;
  }, [banks]);

  // Get verified banks count
  const getVerifiedCount = useCallback(() => {
    return banks.filter(bank => bank.isVerified).length;
  }, [banks]);

  // Get unverified banks count
  const getUnverifiedCount = useCallback(() => {
    return banks.filter(bank => !bank.isVerified).length;
  }, [banks]);

  // Refresh banks data
  const refreshBanks = useCallback(async () => {
    return await fetchBanks(true);
  }, [fetchBanks]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load banks on hook initialization
  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  return {
    banks,
    totalBalance,
    loading,
    error,
    initialized,
    getBanks: fetchBanks,
    addBank,
    updateBank,
    deleteBank,
    setDefaultBank,
    verifyBank,
    getBankDetails,
    getBankTransactions,
    getDefaultBank,
    getVerifiedCount,
    getUnverifiedCount,
    calculateTotalBalance,
    refreshBanks,
    clearError,
  };
};