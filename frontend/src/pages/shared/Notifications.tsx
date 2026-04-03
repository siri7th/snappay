// pages/shared/Notifications.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserPlusIcon,
  WalletIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  TrashIcon,
  FunnelIcon,
  UsersIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useNotifications } from '../../hooks/useNotifications';
import type { Notification } from '../../types/notification.types';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    getNotifications, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    clearAll
  } = useNotifications();
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setRefreshing(true);
    await getNotifications();
    setRefreshing(false);
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Parse data if it's a string
    let notificationData = notification.data;
    if (typeof notificationData === 'string') {
      try {
        notificationData = JSON.parse(notificationData);
      } catch (e) {
        // Ignore parse error
      }
    }

    console.log('🔔 Notification clicked:', {
      type: notification.type,
      data: notificationData,
      userRole: user?.role
    });

    // Navigate based on notification type and user role
    switch (notification.type) {
      // ===== FAMILY & CONNECTION NOTIFICATIONS =====
      case 'FAMILY_INVITATION':
      case 'CONNECTION_REQUEST':
        if (user?.role === 'PRIMARY') {
          navigate('/primary/family/requests');
        } else {
          navigate('/linked/invitations');
        }
        break;

      case 'INVITATION_ACCEPTED':
      case 'CONNECTION_APPROVED':
        if (user?.role === 'PRIMARY') {
          navigate('/primary/family');
        } else {
          navigate('/linked/dashboard');
        }
        break;

      case 'INVITATION_REJECTED':
      case 'CONNECTION_DENIED':
        navigate('/primary/family');
        break;

      case 'FAMILY_JOINED':
      case 'FAMILY_REMOVED':
        navigate('/primary/family');
        break;

      case 'LINKED_DISCONNECTED':
        navigate('/primary/family');
        break;

      // ===== LIMIT REQUEST NOTIFICATIONS =====
      case 'LIMIT_REQUEST':
        if (user?.role === 'PRIMARY') {
          navigate(ROUTES.PRIMARY_FAMILY_REQUESTS);
        } else {
          navigate(ROUTES.LINKED_TRANSACTIONS);
        }
        break;

      case 'REQUEST_APPROVED':
      case 'REQUEST_DENIED':
        if (user?.role === 'LINKED') {
          navigate(ROUTES.LINKED_TRANSACTIONS);
        } else {
          navigate(ROUTES.PRIMARY_FAMILY_REQUESTS);
        }
        break;

      // ===== PAYMENT NOTIFICATIONS =====
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_SENT':
      case 'BANK_TRANSFER':
      case 'QR_PAYMENT':
        if (notificationData?.transactionId) {
          navigate(`/transactions/${notificationData.transactionId}`);
        } else {
          navigate(user?.role === 'PRIMARY' ? ROUTES.PRIMARY_TRANSACTIONS : ROUTES.LINKED_TRANSACTIONS);
        }
        break;

      // ===== WALLET NOTIFICATIONS =====
      case 'WALLET_CREDIT':
      case 'WALLET_DEBIT':
        if (user?.role === 'PRIMARY') {
          navigate(ROUTES.WALLET_ADD);
        } else {
          navigate(ROUTES.LINKED_TRANSACTIONS);
        }
        break;

      case 'LIMIT_INCREASED':
      case 'LIMIT_UPDATED':
      case 'LIMIT_ALERT':
        if (user?.role === 'LINKED') {
          navigate('/linked/dashboard');
        } else {
          navigate('/primary/family');
        }
        break;

      // ===== RECHARGE NOTIFICATIONS =====
      case 'RECHARGE_SUCCESS':
      case 'RECHARGE_FAILED':
        navigate(user?.role === 'PRIMARY' ? ROUTES.PRIMARY_TRANSACTIONS : ROUTES.LINKED_TRANSACTIONS);
        break;

      // ===== ACCOUNT NOTIFICATIONS =====
      case 'ACCOUNT_PAUSED':
      case 'ACCOUNT_RESUMED':
        if (user?.role === 'LINKED') {
          navigate('/linked/profile');
        } else {
          navigate('/primary/family');
        }
        break;

      // ===== DEFAULT =====
      default:
        console.log('Unhandled notification type:', notification.type);
        break;
    }
  };

  const handleDeleteAll = async () => {
    if (notifications.length === 0) return;
    
    if (window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      await clearAll();
      toast.success('All notifications deleted');
    }
  };

  const handleDeleteSelected = async () => {
    // This would need to be implemented in the hook
    toast.success('Delete selected coming soon');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      // Family & Connection
      case 'FAMILY_INVITATION':
      case 'CONNECTION_REQUEST':
        return <UserPlusIcon className="h-5 w-5 text-blue-500" />;
      case 'INVITATION_ACCEPTED':
      case 'CONNECTION_APPROVED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'INVITATION_REJECTED':
      case 'CONNECTION_DENIED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'FAMILY_JOINED':
        return <UsersIcon className="h-5 w-5 text-green-500" />;
      case 'FAMILY_REMOVED':
      case 'LINKED_DISCONNECTED':
        return <UserGroupIcon className="h-5 w-5 text-red-500" />;
      
      // Limit Requests
      case 'LIMIT_REQUEST':
        return <WalletIcon className="h-5 w-5 text-yellow-500" />;
      case 'REQUEST_APPROVED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'REQUEST_DENIED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      
      // Payments
      case 'PAYMENT_RECEIVED':
        return <WalletIcon className="h-5 w-5 text-purple-500" />;
      case 'PAYMENT_SENT':
        return <ArrowPathIcon className="h-5 w-5 text-orange-500" />;
      case 'BANK_TRANSFER':
        return <CreditCardIcon className="h-5 w-5 text-blue-500" />;
      case 'QR_PAYMENT':
        return <CreditCardIcon className="h-5 w-5 text-indigo-500" />;
      
      // Wallet
      case 'WALLET_CREDIT':
        return <WalletIcon className="h-5 w-5 text-green-500" />;
      case 'WALLET_DEBIT':
        return <WalletIcon className="h-5 w-5 text-red-500" />;
      case 'LIMIT_INCREASED':
      case 'LIMIT_UPDATED':
        return <ShieldCheckIcon className="h-5 w-5 text-green-500" />;
      case 'LIMIT_ALERT':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      
      // Recharge
      case 'RECHARGE_SUCCESS':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'RECHARGE_FAILED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      
      // Account
      case 'ACCOUNT_PAUSED':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'ACCOUNT_RESUMED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationBgColor = (notification: Notification) => {
    if (!notification.isRead) {
      return 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500';
    }
    return 'hover:bg-gray-50 border-l-4 border-transparent';
  };

  const timeRanges = [
    { value: 'all', label: 'All time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' },
  ];

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.isRead) return false;
    if (selectedType !== 'all' && notification.type !== selectedType) return false;
    
    if (selectedTimeRange !== 'all') {
      const date = new Date(notification.createdAt);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      
      if (selectedTimeRange === 'today' && days > 1) return false;
      if (selectedTimeRange === 'week' && days > 7) return false;
      if (selectedTimeRange === 'month' && days > 30) return false;
    }
    
    return true;
  });

  // Get unique notification types
  const notificationTypes = ['all', ...new Set(notifications.map(n => n.type))];

  // Parse notification data if it's a string
  const parseNotificationData = (data: any) => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }
    return data;
  };

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-primary text-white text-xs rounded-full animate-pulse">
              {unreadCount} new
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-primary-soft' : ''}
          >
            <FunnelIcon className="h-4 w-4" />
          </Button>
          
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckIcon className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadNotifications}
            disabled={refreshing}
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex gap-2">
                {['all', 'unread'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-4 py-2 rounded-lg capitalize text-sm font-medium transition-colors flex-1 ${
                      filter === f 
                        ? 'bg-primary text-white shadow-md' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {f} {f === 'unread' && unreadCount > 0 && `(${unreadCount})`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Range
              </label>
              <div className="flex flex-wrap gap-2">
                {timeRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setSelectedTimeRange(range.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedTimeRange === range.value
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {notificationTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.replace(/_/g, ' ').toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            {notifications.length > 0 && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleDeleteAll}
                  className="text-sm text-error hover:text-error-dark flex items-center gap-1"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete all
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleDeleteSelected}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete selected
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Notifications List */}
      <Card className="divide-y overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BellIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">
              {filter === 'unread' 
                ? "You don't have any unread notifications." 
                : "You're all caught up!"}
            </p>
            {filter !== 'all' && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setFilter('all')}
              >
                Show all notifications
              </Button>
            )}
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const notificationData = parseNotificationData(notification.data);
            
            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${getNotificationBgColor(notification)}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        
                        {/* Show additional data if available */}
                        {notificationData && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {notificationData.amount && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                Amount: ₹{notificationData.amount}
                              </span>
                            )}
                            {notificationData.status && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                notificationData.status === 'SUCCESS' 
                                  ? 'bg-green-100 text-green-700'
                                  : notificationData.status === 'FAILED'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {notificationData.status}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Debug data in development */}
                        {process.env.NODE_ENV === 'development' && notificationData && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-400 cursor-pointer">Debug data</summary>
                            <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-auto">
                              {JSON.stringify(notificationData, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 animate-pulse"></span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                      
                      <span className="text-xs text-gray-300">•</span>
                      
                      <span className="text-xs text-gray-400">
                        {notification.type.replace(/_/g, ' ').toLowerCase()}
                      </span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="text-xs text-gray-400 hover:text-error transition-colors ml-auto"
                        aria-label="Delete notification"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <p>
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-primary hover:underline text-xs"
          >
            Back to top
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;