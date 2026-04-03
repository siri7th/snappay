// pages/linked/dashboard/DashboardHeader.tsx
import React from 'react';
import { NavigateFunction } from 'react-router-dom';
import { UserCircleIcon, BellIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Button from '../../../components/common/Button';

interface DashboardHeaderProps {
  user: any;
  unreadCount: number;
  refreshing: boolean;
  onRefresh: () => void;
  onNavigate: NavigateFunction;
  primaryDetails: any;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  unreadCount,
  refreshing,
  onRefresh,
  onNavigate,
  primaryDetails
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name || 'User'}! 
          {primaryDetails && <span className="ml-2 text-sm font-normal text-gray-500">👋</span>}
        </h1>
        <p className="text-sm text-gray-500">Linked Account</p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {/* Profile Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onNavigate('/linked/profile')}
        >
          <UserCircleIcon className="h-4 w-4 mr-1" />
          Profile
        </Button>
        
        {/* Notification Bell with Unread Badge */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onNavigate('/notifications')}
          className="relative"
        >
          <BellIcon className="h-4 w-4 mr-1" />
          Notifications
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center px-1 animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
        
        {primaryDetails ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onNavigate('/linked/request-increase')}
          >
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            Request Increase
          </Button>
        ) : null}
        
        {/* Refresh Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={refreshing}
        >
          <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
};