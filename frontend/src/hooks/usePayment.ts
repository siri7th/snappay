// src/hooks/usePayment.ts
import { useState, useCallback } from 'react';
import { paymentAPI } from '../services/api/payments';
import { SendMoneyRequest, QRPaymentRequest, Transaction } from '../types/payment.types';
import type { SendToMobileRequest } from '../services/api/payments';
import toast from 'react-hot-toast';

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Send money to a mobile number
   */
  const sendMoney = useCallback(async (data: SendMoneyRequest) => {
    try {
      setLoading(true);
      setError(null);

      if (!data.toMobile) {
        throw new Error('Recipient mobile number is required');
      }
      if (!data.pin) {
        throw new Error('PIN is required');
      }

      const payload: SendToMobileRequest = {
        toMobile: data.toMobile,
        amount: data.amount,
        pin: data.pin,
        note: data.note,
        paymentMethod: data.paymentMethod,
        bankId: data.bankId,
      };

      const response = await paymentAPI.sendToMobile(payload);
      
      if (response.data?.success) {
        toast.success('Payment sent successfully');
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Payment failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Payment failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Process QR code payment
   */
  const processQRPayment = useCallback(async (data: QRPaymentRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await paymentAPI.processQR(data);
      
      if (response.data?.success) {
        toast.success('Payment successful');
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Payment failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Payment failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Request money from someone
   */
  const requestMoney = useCallback(async (data: { fromPhone: string; amount: number; note?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await paymentAPI.requestMoney(data);
      
      if (response.data?.success) {
        toast.success('Money request sent');
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Request failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Request failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get transaction by ID
   */
  const getTransactionById = useCallback(async (id: string): Promise<Transaction | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await paymentAPI.getTransactionById(id);
      
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return null;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Transaction not found';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    isLoading: loading,
    error,
    sendMoney,
    processQRPayment,
    requestMoney,
    getTransactionById,
  };
};