// src/pages/primary/PrimaryDashboard.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  WalletIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  PlusIcon,
  BuildingLibraryIcon,
  ArrowPathIcon,
  BellIcon,
  CheckCircleIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useWallet } from '../../hooks/useWallet';
import { useFamily } from '../../hooks/useFamily';
import { useNotifications } from '../../hooks/useNotifications';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { StatsGrid } from './dashboard/StatsGrid';
import { QuickActions } from './dashboard/QuickActions';
import { FamilySection } from './dashboard/FamilySection';
import { TransactionsSection } from './dashboard/TransactionsSection';
import { LoadingOverlay } from './dashboard/LoadingOverlay';
import { formatCurrency } from '../../utils/formatters';
import { ROUTES } from '../../utils/constants';

const PrimaryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { 
    balance, 
    transactions, 
    getBalance, 
    getTransactions, 
    getTransactionStats,
    loading: walletLoading 
  } = useWallet();
  const { 
    familyMembers, 
    familyStats,
    getFamilyMembers, 
    loading: familyLoading 
  } = useFamily();
  const { unreadCount } = useNotifications();
  
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const initialLoadDone = useRef(false);
  const isMounted = useRef(true);
  const loadTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  const loadDashboardData = useCallback(async (skipBalance: boolean = false) => {
    setRefreshing(true);
    try {
      const promises = [];
      
      if (!skipBalance) {
        promises.push(getBalance(true));
      }
      
      promises.push(
        getTransactionStats().then(data => {
          if (isMounted.current) setStats(data);
        }),
        getTransactions({ limit: 10 }),
        getFamilyMembers()
      );
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      if (isMounted.current) {
        setRefreshing(false);
      }
    }
  }, [getBalance, getTransactionStats, getTransactions, getFamilyMembers]);

  useEffect(() => {
    if (location.state?.refreshBalance) {
      loadDashboardData();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.refreshBalance, navigate, loadDashboardData]);

  useEffect(() => {
    if (initialLoadDone.current) return;
    
    loadTimeoutRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      
      setRefreshing(true);
      
      Promise.all([
        getBalance(),
        getTransactionStats().then(data => {
          if (isMounted.current) setStats(data);
        }),
        getTransactions({ limit: 10 }),
        getFamilyMembers()
      ])
        .then(() => {
          if (isMounted.current) {
            setDataLoaded(true);
          }
        })
        .catch((error) => {
          console.error('Error loading dashboard:', error);
        })
        .finally(() => {
          if (isMounted.current) {
            setRefreshing(false);
            initialLoadDone.current = true;
          }
        });
    }, 100);
    
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [getBalance, getTransactionStats, getTransactions, getFamilyMembers]);

  const handleRefresh = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const hasPendingRequests = familyStats?.pending > 0;

  return (
    <div className="space-y-6">
      <DashboardHeader
        user={user}
        unreadCount={unreadCount}
        hasPendingRequests={hasPendingRequests}
        familyMembersCount={familyMembers?.length || 0}
        pendingRequestsCount={familyStats?.pending || 0}
        dataLoaded={dataLoaded}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onNavigate={navigate}
      />

      <StatsGrid
        balance={balance}
        stats={stats}
        familyMembersCount={familyMembers?.length || 0}
        familyStats={familyStats}
        formatCurrency={formatCurrency}
        onNavigate={navigate}
      />

      <QuickActions onNavigate={navigate} />

      <FamilySection
        familyMembers={familyMembers}
        recentFamilyMembers={familyMembers?.slice(0, 2) || []}
        onNavigate={navigate}
      />

      <TransactionsSection
        transactions={transactions}
        onNavigate={navigate}
      />

      {dataLoaded && (
        <div className="flex items-center justify-end text-xs text-gray-400">
          <ClockIcon className="h-3 w-3 mr-1" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      )}

      {(familyLoading || walletLoading || refreshing) && !dataLoaded && (
        <LoadingOverlay message="Loading your dashboard..." />
      )}
    </div>
  );
};

export default PrimaryDashboard;