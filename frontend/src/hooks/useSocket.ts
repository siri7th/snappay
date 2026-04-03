// src/hooks/useSocket.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { SOCKET_EVENTS } from '../utils/constants';
import toast from 'react-hot-toast';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  read: boolean;
}

interface UseSocketOptions {
  autoConnect?: boolean;
  enableNotifications?: boolean;
  enableToast?: boolean;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const {
    autoConnect = true,
    enableNotifications = true,
    enableToast = true,
  } = options;

  const { user, isAuthenticated } = useAuth();
  
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const getNotificationIcon = useCallback((type: string): string => {
    switch (type) {
      case 'PAYMENT_SUCCESS': return '💰';
      case 'PAYMENT_FAILED': return '❌';
      case 'LIMIT_REQUEST': return '📊';
      case 'LIMIT_APPROVED': return '✅';
      case 'LIMIT_DENIED': return '⛔';
      case 'FAMILY_INVITATION': return '👨‍👩‍👧‍👦';
      case 'FAMILY_JOINED': return '🎉';
      case 'RECHARGE_SUCCESS': return '📱';
      case 'RECHARGE_FAILED': return '⚠️';
      case 'BANK_LINKED': return '🏦';
      case 'BANK_REMOVED': return '🗑️';
      default: return '🔔';
    }
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const filtered = prev.filter(n => n.id !== notificationId);
      const wasUnread = prev.find(n => n.id === notificationId)?.read === false;
      if (wasUnread) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return filtered;
    });
  }, []);

  const emit = useCallback(<T = any>(event: string, data?: T) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }, []);

  const joinFamilyRoom = useCallback((familyId: string) => {
    if (familyId && socketRef.current?.connected) {
      emit(SOCKET_EVENTS.JOIN_FAMILY, familyId);
    }
  }, [emit]);

  const sendTyping = useCallback((to: string, isTyping: boolean) => {
    emit(SOCKET_EVENTS.TYPING, { to, isTyping });
  }, [emit]);

  const requestUserData = useCallback(() => {
    emit('request:user-data');
  }, [emit]);

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) return;
    
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    const token = localStorage.getItem('token');
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
                     import.meta.env.VITE_API_URL?.replace('/api', '') || 
                     'https://snappay-backend.onrender.com';

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on(SOCKET_EVENTS.CONNECT, () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
      
      emit(SOCKET_EVENTS.JOIN_USER, user.id);
      
      if (user.role === 'PRIMARY') {
        emit(SOCKET_EVENTS.JOIN_PRIMARY, user.id);
      }
      
      requestUserData();
    });

    newSocket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        setTimeout(() => {
          if (socketRef.current) {
            socketRef.current.connect();
          }
        }, 1000);
      }
    });

    newSocket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      
      reconnectAttempts.current += 1;
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        toast.error('Unable to connect to real-time server');
      }
    });

    newSocket.on(SOCKET_EVENTS.ERROR, (error) => {
      console.error('Socket error:', error);
      
      if (error.message === 'Invalid token') {
        newSocket.disconnect();
        toast.error('Authentication failed. Please login again.');
      }
    });

    if (enableNotifications) {
      newSocket.on(SOCKET_EVENTS.NOTIFICATION, (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);

        if (enableToast) {
          toast(notification.message, {
            icon: getNotificationIcon(notification.type),
            duration: 5000,
          });
        }
      });
    }

    newSocket.on(SOCKET_EVENTS.PAYMENT_RECEIVED, (data: { amount: number; from: string; transactionId: string }) => {
      if (enableToast) {
        toast.success(`💰 Received ₹${data.amount} from ${data.from}`);
      }
      
      const notification: Notification = {
        id: `payment-${Date.now()}`,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Received',
        message: `Received ₹${data.amount} from ${data.from}`,
        data,
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    newSocket.on(SOCKET_EVENTS.PAYMENT_FAILED, (data: { amount: number; reason: string }) => {
      if (enableToast) {
        toast.error(`Payment failed: ${data.reason}`);
      }
      
      const notification: Notification = {
        id: `payment-failed-${Date.now()}`,
        type: 'PAYMENT_FAILED',
        title: 'Payment Failed',
        message: `Failed to send ₹${data.amount}: ${data.reason}`,
        data,
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    newSocket.on(SOCKET_EVENTS.LIMIT_UPDATED, (data: { message: string }) => {
      if (enableToast) {
        toast.success(`Limit updated: ${data.message}`);
      }
    });

    newSocket.on(SOCKET_EVENTS.REQUEST_APPROVED, () => {
      if (enableToast) {
        toast.success('Your limit request was approved!');
      }
      
      const notification: Notification = {
        id: `request-approved-${Date.now()}`,
        type: 'LIMIT_APPROVED',
        title: 'Request Approved',
        message: 'Your limit increase request has been approved',
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    newSocket.on(SOCKET_EVENTS.REQUEST_DENIED, () => {
      if (enableToast) {
        toast.error('Your limit request was denied');
      }
      
      const notification: Notification = {
        id: `request-denied-${Date.now()}`,
        type: 'LIMIT_DENIED',
        title: 'Request Denied',
        message: 'Your limit increase request was denied',
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    newSocket.on(SOCKET_EVENTS.FAMILY_MEMBER_ADDED, (data: { name: string }) => {
      if (enableToast) {
        toast.success(`${data.name} joined the family!`);
      }
      
      const notification: Notification = {
        id: `family-added-${Date.now()}`,
        type: 'FAMILY_JOINED',
        title: 'Family Member Added',
        message: `${data.name} has joined your family`,
        data,
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [
    isAuthenticated, 
    user, 
    autoConnect, 
    enableNotifications, 
    enableToast,
    emit,
    getNotificationIcon,
    requestUserData
  ]);

  return {
    socket,
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    removeNotification,
    emit,
    joinFamilyRoom,
    sendTyping,
    requestUserData,
    SOCKET_EVENTS,
  };
};

export default useSocket;