// src/components/common/NotificationBell.tsx
import React, { useEffect, useCallback } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';

interface NotificationBellProps {
  userRole?: 'PRIMARY' | 'LINKED';
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userRole }) => {
  const navigate = useNavigate();
  const { unreadCount, getNotificationCount } = useNotifications();

  const fetchCount = useCallback(async () => {
    await getNotificationCount();
  }, [getNotificationCount]);

  useEffect(() => {
    fetchCount();
    
    const interval = setInterval(() => {
      fetchCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchCount]);

  const handleClick = () => {
    navigate('/notifications');
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      aria-label="Notifications"
    >
      <BellIcon className="h-5 w-5 text-gray-600" />
      {unreadCount > 0 && (
        <>
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-ping"></span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </>
      )}
    </button>
  );
};

export default NotificationBell;