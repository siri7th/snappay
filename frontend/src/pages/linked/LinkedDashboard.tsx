// pages/linked/LinkedDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  WalletIcon,
  ArrowTrendingUpIcon,
  QrCodeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  UserPlusIcon,
  ArrowDownIcon,
  BellIcon,
  CheckCircleIcon,
  ShieldExclamationIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useWallet } from '../../hooks/useWallet';
import { useFamily } from '../../hooks/useFamily';
import { useNotifications } from '../../hooks/useNotifications';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { PrimaryInfoCard } from './dashboard/PrimaryInfoCard';
import { WalletCard } from './dashboard/WalletCard';
import { LimitsCard } from './dashboard/LimitsCard';
import { QuickActions } from './dashboard/QuickActions';
import { RecentTransactions } from './dashboard/RecentTransactions';
import { MoneyReceived } from './dashboard/MoneyReceived';
import { NotConnectedScreen } from './dashboard/NotConnectedScreen';

const LinkedDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { balance, transactions, getBalance, getTransactions, loading: walletLoading } = useWallet();
  const { primaryDetails, limits, getPrimaryDetails, loading: familyLoading } = useFamily();
  const { unreadCount, getNotificationCount } = useNotifications();
  
  const [dailyPercent, setDailyPercent] = useState(0);
  const [monthlyPercent, setMonthlyPercent] = useState(0);
  const [recentReceived, setRecentReceived] = useState<any[]>([]);
  const [recentSent, setRecentSent] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Check connection status
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await getPrimaryDetails();
      setIsConnected(!!connected);
    };
    checkConnection();
  }, [getPrimaryDetails]);

  // Fetch unread notification count
  useEffect(() => {
    if (isConnected) {
      getNotificationCount();
      
      // Refresh notification count every 30 seconds
      const interval = setInterval(() => {
        getNotificationCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isConnected, getNotificationCount]);

  // Load data on mount and when returning from connect page
  useEffect(() => {
    console.log('Loading linked dashboard data...');
    if (isConnected) {
      loadData();
    }
  }, [location.state?.refresh, isConnected]);

  useEffect(() => {
    if (limits) {
      setDailyPercent((limits.dailySpent / limits.dailyLimit) * 100);
      setMonthlyPercent((limits.monthlySpent / limits.monthlyLimit) * 100);
    }
  }, [limits]);

  useEffect(() => {
    // Filter transactions
    if (transactions && transactions.length > 0) {
      const received = transactions.filter(t => 
        t.type === 'RECEIVE' || t.type === 'PAYMENT_RECEIVED' || t.receiverId === user?.id
      );
      const sent = transactions.filter(t => 
        t.type === 'SEND' || t.type === 'PAYMENT_SENT' || t.senderId === user?.id
      );
      setRecentReceived(received.slice(0, 3));
      setRecentSent(sent.slice(0, 3));
    }
  }, [transactions, user?.id]);

  const loadData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        getBalance(),
        getTransactions({ limit: 10 }),
      ]);
      console.log('✅ Dashboard data loaded');
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await loadData();
    await getNotificationCount();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Calculate limit percentages safely
  const dailyPercentage = limits?.dailyLimit > 0 
    ? Math.min((limits.dailySpent / limits.dailyLimit) * 100, 100) 
    : 0;
  
  const monthlyPercentage = limits?.monthlyLimit > 0 
    ? Math.min((limits.monthlySpent / limits.monthlyLimit) * 100, 100) 
    : 0;

  // If not connected, show connection required UI
  if (!isConnected && !familyLoading) {
    return <NotConnectedScreen onConnect={() => navigate('/linked/connect')} />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <DashboardHeader
        user={user}
        unreadCount={unreadCount}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onNavigate={navigate}
        primaryDetails={primaryDetails}
      />

      {/* Primary Account Info Card */}
      {primaryDetails ? (
        <PrimaryInfoCard
          primaryDetails={primaryDetails}
          limits={limits}
          formatDate={formatDate}
        />
      ) : (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <UserPlusIcon className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-700">
              Not linked to any primary account yet.{' '}
              <button 
                onClick={() => navigate('/linked/connect')}
                className="font-medium underline hover:text-yellow-800"
              >
                Connect now
              </button>
            </p>
          </div>
        </Card>
      )}

      {/* Wallet and Limits Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <WalletCard
          balance={balance}
          formatCurrency={formatCurrency}
          onNavigate={navigate}
        />
        
        {limits ? (
          <LimitsCard
            limits={limits}
            dailyPercentage={dailyPercentage}
            monthlyPercentage={monthlyPercentage}
            formatCurrency={formatCurrency}
          />
        ) : (
          <Card className="bg-gray-50 flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <WalletIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Connect to a primary account to view limits</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => navigate('/linked/connect')}
              >
                Connect Now
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Quick Actions Grid */}
      <QuickActions onNavigate={navigate} />

      {/* Recent Transactions Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <RecentTransactions
          transactions={transactions}
          formatCurrency={formatCurrency}
          onNavigate={navigate}
        />
        
        <MoneyReceived
          recentReceived={recentReceived}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          onNavigate={navigate}
        />
      </div>

      {/* Loading State */}
      {(familyLoading || refreshing || walletLoading) && (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-3">Loading dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkedDashboard;