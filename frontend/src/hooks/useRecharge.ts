// src/hooks/useRecharge.ts
import { useState, useCallback } from 'react';
import { rechargeAPI } from '../services/api/recharge';
import { RechargeRequest } from '../types/payment.types';
import toast from 'react-hot-toast';

export const useRecharge = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Perform a recharge (mobile, electricity, fastag)
   */
  const recharge = useCallback(async (data: RechargeRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (data.type === 'mobile') {
        response = await rechargeAPI.mobileRecharge(data);
      } else if (data.type === 'electricity') {
        response = await rechargeAPI.electricityBill(data);
      } else if (data.type === 'fastag') {
        response = await rechargeAPI.fastagRecharge(data);
      } else {
        throw new Error('Invalid recharge type');
      }
      
      if (response.data?.success) {
        toast.success('Recharge successful');
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Recharge failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Recharge failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get recharge plans
   */
  const getPlans = useCallback(async (params?: any) => {
    try {
      const response = await rechargeAPI.getPlans(params);
      return response.data;
    } catch (err) {
      return [];
    }
  }, []);

  /**
   * Get recharge history
   */
  const getHistory = useCallback(async (params?: any) => {
    try {
      const response = await rechargeAPI.getHistory(params);
      return response.data;
    } catch (err) {
      return { recharges: [] };
    }
  }, []);

  return {
    loading,
    isLoading: loading,
    error,
    recharge,
    getPlans,
    getHistory,
  };
};