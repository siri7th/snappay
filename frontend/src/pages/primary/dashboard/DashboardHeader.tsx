// src/pages/primary/dashboard/DashboardHeader.tsx
import React from 'react';
import { NavigateFunction } from 'react-router-dom';
import { 
  BellIcon, 
  UserPlusIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import Button from '../../../components/common/Button';
import { ROUTES } from '../../../utils/constants';

interface DashboardHeaderProps {
  user: any;
  unreadCount: number;
  hasPendingRequests: boolean;
  familyMembersCount: number;
  pendingRequestsCount: number;
  dataLoaded: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onNavigate: NavigateFunction;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  unreadCount,
  hasPendingRequests,
  familyMembersCount,
  pendingRequestsCount,
  dataLoaded,
  refreshing,
  onRefresh,
  onNavigate
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name || 'User'}!
          </h1>
          {dataLoaded && (
            <CheckCircleIcon className="h-5 w-5 text-success" />
          )}
        </div>
        <p className="text-sm text-gray-500">Primary Account</p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onNavigate(ROUTES.NOTIFICATIONS)}
          className="relative"
        >
          <BellIcon className="h-4 w-4 mr-1" />
          Notifications
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
        
        {familyMembersCount === 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onNavigate(ROUTES.PRIMARY_FAMILY_ADD)}
          >
            <UserPlusIcon className="h-4 w-4 mr-1" />
            Add Member
          </Button>
        )}
        
        {hasPendingRequests && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onNavigate(ROUTES.PRIMARY_FAMILY_REQUESTS)}
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          >
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            {pendingRequestsCount} Pending
          </Button>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={refreshing}
        >
          <ArrowPathIcon className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
        
        <Button onClick={() => onNavigate(ROUTES.PRIMARY_SEND)} size="sm">
          Send Money
        </Button>
      </div>
    </div>
  );
};