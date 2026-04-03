// src/hooks/useAppInitializer.ts
import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useWallet } from './useWallet';
import { useFamily } from './useFamily';
import { useNotifications } from './useNotifications';

let isLoading = false;
let loadPromise: Promise<void> | null = null;

export const useAppInitializer = () => {
  const { isAuthenticated, getMe } = useAuth();
  const { getBalance, getTransactions } = useWallet();
  const { getFamilyMembers, getPrimaryDetails } = useFamily();
  const { getNotificationCount } = useNotifications();
  
  const initialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (initialized.current) return;
    
    const loadData = async () => {
      if (isLoading && loadPromise) {
        return loadPromise;
      }
      
      isLoading = true;
      loadPromise = (async () => {
        try {
          // Load auth first
          await getMe();
          
          // Then load other data in parallel
          await Promise.allSettled([
            getBalance(),
            getTransactions({ limit: 10 }),
            getFamilyMembers(),
            getPrimaryDetails(),
            getNotificationCount()
          ]);
          
          initialized.current = true;
        } catch (error) {
          console.error('Failed to initialize app:', error);
        } finally {
          isLoading = false;
          loadPromise = null;
        }
      })();
      
      return loadPromise;
    };
    
    loadData();
  }, [isAuthenticated, getMe, getBalance, getTransactions, getFamilyMembers, getPrimaryDetails, getNotificationCount]);
};