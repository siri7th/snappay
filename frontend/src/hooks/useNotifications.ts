// src/hooks/useNotifications.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { notificationsAPI } from '../services/api/notifications';
import { useAuth } from './useAuth';
import { Notification } from '../types/notification.types';
import toast from 'react-hot-toast';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  const { isAuthenticated } = useAuth();
  
  const isMounted = useRef(true);
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();
  const initialFetchDone = useRef(false);
  const lastCountFetchRef = useRef<number>(0);
  const countPromiseRef = useRef<Promise<number> | null>(null);
  const lastFullFetchRef = useRef<number>(0);
  const fullFetchPromiseRef = useRef<Promise<Notification[]> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Reset state when auth changes
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setInitialized(false);
      setLoading(false);
      initialFetchDone.current = false;
      lastCountFetchRef.current = 0;
      lastFullFetchRef.current = 0;
    }
  }, [isAuthenticated]);

  // ========== INTERNAL FETCH FUNCTIONS ==========
  
  const fetchNotifications = useCallback(async (showToast: boolean = false): Promise<Notification[]> => {
    if (!isAuthenticated) return [];

    try {
      const response = await notificationsAPI.getNotifications();
      
      if (!isMounted.current) return [];
      
      if (response.data?.success) {
        const notificationsData = response.data.data || response.data || [];
        const notificationsArray = Array.isArray(notificationsData) ? notificationsData : [];
        
        const sortedNotifications = notificationsArray.sort((a: Notification, b: Notification) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setNotifications(sortedNotifications);
        
        const unread = sortedNotifications.filter((n: Notification) => !n.isRead).length;
        setUnreadCount(unread);
        
        if (showToast && sortedNotifications.length > 0) {
          toast.success(`You have ${unread} unread notification${unread !== 1 ? 's' : ''}`);
        }
        
        return sortedNotifications;
      }
      return [];
    } catch (err: any) {
      if (err.response?.status === 401) {
        return [];
      }
      console.error('Failed to fetch notifications:', err);
      if (showToast) {
        toast.error('Failed to load notifications');
      }
      return [];
    }
  }, [isAuthenticated]);

  const fetchNotificationCount = useCallback(async (): Promise<number> => {
    if (!isAuthenticated) return 0;

    try {
      const response = await notificationsAPI.getUnreadCount();
      
      if (!isMounted.current) return 0;
      
      if (response.data?.success) {
        const count = response.data.data?.count || 0;
        setUnreadCount(count);
        return count;
      }
      return 0;
    } catch (err: any) {
      if (err.response?.status === 401) {
        return 0;
      }
      console.error('Failed to fetch notification count:', err);
      return 0;
    }
  }, [isAuthenticated]);

  // ========== AUTO-INITIALIZATION ==========
  
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      initialFetchDone.current = false;
      setInitialized(false);
      return;
    }

    if (initialFetchDone.current || initialized) return;

    fetchTimeoutRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      
      setLoading(true);
      
      Promise.all([
        fetchNotifications(),
        fetchNotificationCount()
      ])
        .catch(error => {
          console.error('Auto-fetch failed:', error);
          setError('Failed to load notifications');
        })
        .finally(() => {
          if (isMounted.current) {
            setLoading(false);
            initialFetchDone.current = true;
            setInitialized(true);
          }
        });
    }, 500);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [isAuthenticated, fetchNotifications, fetchNotificationCount, initialized]);

  // ========== PUBLIC METHODS ==========

  const getNotifications = useCallback(async (showToast: boolean = false, force: boolean = false): Promise<Notification[]> => {
    if (!isAuthenticated) {
      setLoading(false);
      return [];
    }

    if (fullFetchPromiseRef.current && !force) {
      return fullFetchPromiseRef.current;
    }

    const now = Date.now();
    if (!force && now - lastFullFetchRef.current < 10000) {
      return notifications;
    }

    const fetchPromise = (async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await fetchNotifications(showToast);
        lastFullFetchRef.current = Date.now();
        return result;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch notifications';
        setError(errorMessage);
        console.error('Failed to fetch notifications:', err);
        return [];
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
        fullFetchPromiseRef.current = null;
      }
    })();

    fullFetchPromiseRef.current = fetchPromise;
    return fetchPromise;
  }, [isAuthenticated, notifications, fetchNotifications]);

  const getNotificationCount = useCallback(async (force: boolean = false): Promise<number> => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return 0;
    }

    if (countPromiseRef.current && !force) {
      return countPromiseRef.current;
    }

    const now = Date.now();
    if (!force && now - lastCountFetchRef.current < 10000) {
      return unreadCount;
    }

    const fetchPromise = (async () => {
      try {
        lastCountFetchRef.current = now;
        const count = await fetchNotificationCount();
        return count;
      } catch (err: any) {
        console.error('Failed to fetch notification count:', err);
        return unreadCount;
      } finally {
        countPromiseRef.current = null;
      }
    })();

    countPromiseRef.current = fetchPromise;
    return fetchPromise;
  }, [isAuthenticated, unreadCount, fetchNotificationCount]);

  const getNotificationById = useCallback(async (notificationId: string): Promise<Notification | null> => {
    if (!isAuthenticated) return null;

    try {
      const response = await notificationsAPI.getNotificationById(notificationId);
      
      if (!isMounted.current) return null;
      
      if (response.data?.success) {
        return response.data.data;
      }
      return null;
    } catch (err: any) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch notification:', err);
      }
      return null;
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const response = await notificationsAPI.markAsRead(notificationId);
      
      if (!isMounted.current) return false;
      
      if (response.data?.success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return true;
      }
      return false;
    } catch (err: any) {
      if (err.response?.status !== 401) {
        console.error('Failed to mark notification as read:', err);
        toast.error('Failed to mark as read');
      }
      return false;
    }
  }, [isAuthenticated]);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const response = await notificationsAPI.markAllAsRead();
      
      if (!isMounted.current) return false;
      
      if (response.data?.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
        return true;
      }
      return false;
    } catch (err: any) {
      if (err.response?.status !== 401) {
        console.error('Failed to mark all as read:', err);
        toast.error('Failed to mark all as read');
      }
      return false;
    }
  }, [isAuthenticated]);

  const deleteNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const response = await notificationsAPI.deleteNotification(notificationId);
      
      if (!isMounted.current) return false;
      
      if (response.data?.success) {
        const notification = notifications.find(n => n.id === notificationId);
        
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        toast.success('Notification deleted');
        return true;
      }
      return false;
    } catch (err: any) {
      if (err.response?.status !== 401) {
        console.error('Failed to delete notification:', err);
        toast.error('Failed to delete notification');
      }
      return false;
    }
  }, [isAuthenticated, notifications]);

  const deleteAllNotifications = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) return false;

    if (!confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      return false;
    }
    
    try {
      const response = await notificationsAPI.deleteAllNotifications();
      
      if (!isMounted.current) return false;
      
      if (response.data?.success) {
        setNotifications([]);
        setUnreadCount(0);
        toast.success('All notifications deleted');
        return true;
      }
      return false;
    } catch (err: any) {
      if (err.response?.status !== 401) {
        console.error('Failed to delete notifications:', err);
        toast.error('Failed to delete notifications');
      }
      return false;
    }
  }, [isAuthenticated]);

  const clearAll = deleteAllNotifications;

  const refreshNotifications = useCallback(async (showToast: boolean = false): Promise<Notification[]> => {
    lastFullFetchRef.current = 0;
    lastCountFetchRef.current = 0;
    return await getNotifications(showToast, true);
  }, [getNotifications]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    getNotifications,
    getNotificationById,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    clearAll,
    getNotificationCount,
    refreshNotifications,
    clearError,
  };
};