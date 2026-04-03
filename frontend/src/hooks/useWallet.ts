// src/hooks/useWallet.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { walletAPI } from '../services/api/wallet';
import { paymentAPI } from '../services/api/payments';
import { useAuth } from './useAuth';
import { Transaction } from '../types/payment.types';
import toast from 'react-hot-toast';

// Global request deduplication map
const pendingRequests = new Map<string, Promise<any>>();

export const useWallet = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  const { isAuthenticated } = useAuth();
  
  const balancePromiseRef = useRef<Promise<number> | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setBalance(0);
      setTransactions([]);
      setInitialized(false);
      setError(null);
      lastFetchTimeRef.current = 0;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !initialized) {
      loadWalletData().then(() => {
        if (mountedRef.current) {
          setInitialized(true);
        }
      });
    }
  }, [isAuthenticated, initialized]);

  // ========== BALANCE METHODS ==========

  const getBalance = useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated) return 0;

    const requestKey = 'wallet-balance';
    
    if (pendingRequests.has(requestKey) && !forceRefresh) {
      return pendingRequests.get(requestKey);
    }

    const now = Date.now();
    if (!forceRefresh && now - lastFetchTimeRef.current < 5000) {
      return balance;
    }

    const fetchPromise = (async () => {
      try {
        if (!forceRefresh) setLoading(true);
        setError(null);
        
        const response = await walletAPI.getBalance();
        
        if (!mountedRef.current) return balance;
        
        const newBalance = response.data?.balance || 
                          response.data?.data?.balance || 
                          0;
        
        setBalance(newBalance);
        lastFetchTimeRef.current = Date.now();
        return newBalance;
      } catch (err: any) {
        if (err.response?.status === 429) {
          return balance;
        }
        const errorMessage = err.response?.data?.message || 'Failed to fetch balance';
        setError(errorMessage);
        if (!forceRefresh) toast.error(errorMessage);
        return 0;
      } finally {
        if (!forceRefresh && mountedRef.current) setLoading(false);
        pendingRequests.delete(requestKey);
      }
    })();

    pendingRequests.set(requestKey, fetchPromise);
    return fetchPromise;
  }, [isAuthenticated, balance]);

  // ========== TRANSACTION METHODS ==========

  const getTransactions = useCallback(async (params?: { page?: number; limit?: number }) => {
    if (!isAuthenticated) return { transactions: [] };

    const requestKey = `transactions-${params?.page || 1}-${params?.limit || 10}`;
    
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }

    const fetchPromise = (async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await walletAPI.getTransactions(params);
        
        if (!mountedRef.current) return { transactions: [] };
        
        const transactionsData = response.data?.data?.transactions || 
                                response.data?.transactions || 
                                [];
        
        const formattedTransactions = transactionsData.map((txn: any) => ({
          ...txn,
          amount: Number(txn.amount) || 0,
          formattedAmount: new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
          }).format(Number(txn.amount) || 0)
        }));
        
        setTransactions(formattedTransactions);
        return {
          transactions: formattedTransactions,
          pagination: response.data?.data?.pagination || response.data?.pagination
        };
      } catch (err: any) {
        if (err.response?.status === 429) {
          return { transactions };
        }
        const errorMessage = err.response?.data?.message || 'Failed to fetch transactions';
        setError(errorMessage);
        toast.error(errorMessage);
        return { transactions: [] };
      } finally {
        if (mountedRef.current) setLoading(false);
        pendingRequests.delete(requestKey);
      }
    })();

    pendingRequests.set(requestKey, fetchPromise);
    return fetchPromise;
  }, [isAuthenticated, transactions]);

  const getTransactionById = useCallback(async (id: string) => {
    if (!isAuthenticated) return null;

    const requestKey = `transaction-${id}`;
    
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }

    const fetchPromise = (async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await paymentAPI.getTransactionById(id);
        
        if (!mountedRef.current) return null;
        
        const transaction = response.data?.data || response.data;
        
        if (transaction) {
          transaction.amount = Number(transaction.amount);
          transaction.formattedAmount = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
          }).format(transaction.amount);
        }
        
        return transaction;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Transaction not found';
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      } finally {
        if (mountedRef.current) setLoading(false);
        pendingRequests.delete(requestKey);
      }
    })();

    pendingRequests.set(requestKey, fetchPromise);
    return fetchPromise;
  }, [isAuthenticated]);

  const getTransactionStats = useCallback(async () => {
    if (!isAuthenticated) return { today: 0, week: 0, month: 0 };

    const requestKey = 'transaction-stats';
    
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }

    const fetchPromise = (async () => {
      try {
        const response = await walletAPI.getStats();
        
        if (!mountedRef.current) return { today: 0, week: 0, month: 0 };
        
        const stats = response.data?.data?.stats || response.data?.stats || {};
        
        return {
          today: Number(stats.today) || 0,
          week: Number(stats.week) || 0,
          month: Number(stats.month) || 0,
          totalIn: Number(stats.totalIn) || 0,
          totalOut: Number(stats.totalOut) || 0,
          transactionCount: stats.transactionCount || 0
        };
      } catch (err: any) {
        if (err.response?.status === 429) {
          return { today: 0, week: 0, month: 0, totalIn: 0, totalOut: 0, transactionCount: 0 };
        }
        return { today: 0, week: 0, month: 0, totalIn: 0, totalOut: 0, transactionCount: 0 };
      } finally {
        pendingRequests.delete(requestKey);
      }
    })();

    pendingRequests.set(requestKey, fetchPromise);
    return fetchPromise;
  }, [isAuthenticated]);

  // ========== MEMBER-RELATED METHODS ==========

  const getMemberTransactions = useCallback(async (memberId: string, params?: { page?: number; limit?: number }) => {
    if (!isAuthenticated) return { transactions: [] };

    const requestKey = `member-transactions-${memberId}-${params?.page || 1}-${params?.limit || 10}`;
    
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }

    const fetchPromise = (async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await walletAPI.getMemberTransactions(memberId, params);
        
        if (!mountedRef.current) return { transactions: [] };
        
        const transactionsData = response.data?.data?.transactions || 
                                response.data?.transactions || 
                                [];
        
        const formattedTransactions = transactionsData.map((txn: any) => ({
          ...txn,
          amount: Number(txn.amount) || 0,
          formattedAmount: new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
          }).format(Number(txn.amount) || 0)
        }));
        
        return {
          transactions: formattedTransactions,
          pagination: response.data?.data?.pagination || response.data?.pagination
        };
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch member transactions');
        return { transactions: [] };
      } finally {
        if (mountedRef.current) setLoading(false);
        pendingRequests.delete(requestKey);
      }
    })();

    pendingRequests.set(requestKey, fetchPromise);
    return fetchPromise;
  }, [isAuthenticated]);

  const getMemberWalletBalance = useCallback(async (memberId: string) => {
    if (!isAuthenticated) return 0;

    const requestKey = `member-balance-${memberId}`;
    
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }

    const fetchPromise = (async () => {
      try {
        const response = await walletAPI.getMemberWalletBalance(memberId);
        
        if (!mountedRef.current) return 0;
        
        const memberBalance = response.data?.balance || 
                             response.data?.data?.balance || 
                             0;
        
        return Number(memberBalance);
      } catch (error: any) {
        return 0;
      } finally {
        pendingRequests.delete(requestKey);
      }
    })();

    pendingRequests.set(requestKey, fetchPromise);
    return fetchPromise;
  }, [isAuthenticated]);

  const getAllMemberBalances = useCallback(async (memberIds: string[]) => {
    if (!isAuthenticated || !memberIds || memberIds.length === 0) {
      return {};
    }

    const requestKey = `all-member-balances-${memberIds.sort().join('-')}`;
    
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }

    const fetchPromise = (async () => {
      try {
        const response = await walletAPI.getAllMemberBalances(memberIds);
        
        if (!mountedRef.current) return {};
        
        const balances = response.data?.data || response.data || {};
        
        const formattedBalances: Record<string, number> = {};
        Object.keys(balances).forEach(key => {
          formattedBalances[key] = Number(balances[key]) || 0;
        });
        
        return formattedBalances;
      } catch (error: any) {
        return {};
      } finally {
        pendingRequests.delete(requestKey);
      }
    })();

    pendingRequests.set(requestKey, fetchPromise);
    return fetchPromise;
  }, [isAuthenticated]);

  // ========== ACTION METHODS ==========

  const addMoney = useCallback(async (data: { amount: number; bankId: string }) => {
    if (!isAuthenticated) {
      toast.error('Please login to add money');
      throw new Error('Not authenticated');
    }

    try {
      setLoading(true);
      setError(null);
      
      if (!data.amount || data.amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      if (!data.bankId) {
        throw new Error('Please select a bank account');
      }

      const response = await walletAPI.addMoney(data);
      
      if (!mountedRef.current) return;
      
      const responseData = response.data;
      const newBalance = responseData?.data?.newBalance || responseData?.newBalance || 0;
      
      if (responseData?.success) {
        await getBalance(true);
        await getTransactions({ limit: 10 });
        toast.success(`₹${data.amount.toLocaleString()} added to wallet successfully!`);
        return responseData;
      } else {
        throw new Error(responseData?.message || 'Failed to add money');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add money';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [isAuthenticated, getBalance, getTransactions]);

  // ========== UTILITY METHODS ==========

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadWalletData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      await Promise.all([
        getBalance(),
        getTransactions({ limit: 10 })
      ]);
    } catch (err) {
      console.error('Failed to load wallet data:', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [isAuthenticated, getBalance, getTransactions]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  return {
    balance,
    transactions,
    loading,
    isLoading: loading,
    error,
    getBalance,
    getTransactions,
    getTransactionById,
    getTransactionStats,
    getMemberTransactions,
    getMemberWalletBalance,
    getAllMemberBalances,
    addMoney,
    loadWalletData,
    clearError,
    formatCurrency,
  };
};