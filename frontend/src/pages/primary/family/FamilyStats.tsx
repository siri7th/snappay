// pages/primary/family/FamilyStats.tsx
import React from 'react';
import { UsersIcon, WalletIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';

interface FamilyStatsProps {
  displayStats: {
    total: number;
    active: number;
    paused: number;
    pending: number;
    totalDailySpent: number;
    totalMonthlySpent: number;
  };
  totalPendingItems: number;
  totalFamilyBalance: number;
  onViewAllRequests: () => void;
}

export const FamilyStats: React.FC<FamilyStatsProps> = ({
  displayStats,
  totalPendingItems,
  totalFamilyBalance,
  onViewAllRequests
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      <Card className="bg-gradient-to-br from-primary to-primary-dark text-white">
        <UsersIcon className="h-6 w-6 text-white opacity-80 mb-2" />
        <p className="text-2xl font-bold">{displayStats.total}</p>
        <p className="text-xs opacity-80">Total Members</p>
      </Card>
      
      <Card className="border-l-4 border-green-500">
        <p className="text-sm text-gray-600">Active</p>
        <p className="text-2xl font-bold text-gray-900">{displayStats.active}</p>
        <p className="text-xs text-gray-500 mt-1">
          {displayStats.total > 0 ? ((displayStats.active/displayStats.total)*100).toFixed(0) : 0}%
        </p>
      </Card>
      
      <Card className="border-l-4 border-yellow-500">
        <p className="text-sm text-gray-600">Paused</p>
        <p className="text-2xl font-bold text-gray-900">{displayStats.paused}</p>
      </Card>
      
      <Card 
        className={`border-l-4 cursor-pointer transition-all hover:shadow-md ${
          totalPendingItems > 0 
            ? 'border-l-blue-500 bg-blue-50 hover:bg-blue-100' 
            : 'border-l-blue-500'
        }`}
        onClick={totalPendingItems > 0 ? onViewAllRequests : undefined}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">Pending</p>
          {totalPendingItems > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full animate-pulse">
              {totalPendingItems}
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900">{totalPendingItems}</p>
        <p className="text-xs text-blue-600 mt-1">
          {totalPendingItems === 1 
            ? '1 request waiting' 
            : totalPendingItems > 1 
              ? `${totalPendingItems} requests waiting`
              : 'No pending requests'}
        </p>
      </Card>
      
      <Card className="border-l-4 border-purple-500">
        <p className="text-sm text-gray-600">Today's Spend</p>
        <p className="text-2xl font-bold text-gray-900">₹{displayStats.totalDailySpent.toLocaleString()}</p>
      </Card>

      <Card className="border-l-4 border-indigo-500">
        <div className="flex items-center gap-2 mb-1">
          <WalletIcon className="h-4 w-4 text-indigo-500" />
          <p className="text-sm text-gray-600">Family Balance</p>
        </div>
        <p className="text-2xl font-bold text-indigo-600">₹{totalFamilyBalance.toLocaleString()}</p>
      </Card>
    </div>
  );
};