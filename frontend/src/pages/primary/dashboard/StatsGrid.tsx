// src/pages/primary/dashboard/StatsGrid.tsx
import React from 'react';
import { NavigateFunction } from 'react-router-dom';
import {
  WalletIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { ROUTES } from '../../../utils/constants';

interface StatsGridProps {
  balance: number;
  stats: {
    today: number;
    week: number;
    month: number;
  };
  familyMembersCount: number;
  familyStats: any;
  formatCurrency: (amount: number) => string;
  onNavigate: NavigateFunction;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  balance,
  stats,
  familyMembersCount,
  familyStats,
  formatCurrency,
  onNavigate
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-r from-primary to-primary-dark text-white">
        <div className="flex items-center justify-between mb-4">
          <WalletIcon className="h-8 w-8 text-white opacity-90" />
          <span className="text-sm text-white opacity-80">Primary Wallet</span>
        </div>
        <p className="text-3xl font-bold text-white mb-1">
          {formatCurrency(balance || 0)}
        </p>
        <p className="text-sm text-white opacity-80">Available Balance</p>
        <div className="mt-4 pt-4 border-t border-white border-opacity-20">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => onNavigate(ROUTES.WALLET_ADD)} 
            className="w-full bg-white/20 text-white hover:bg-white/30 border-0"
          >
            Add Money
          </Button>
        </div>
      </Card>
      
      <Card className="border-l-4 border-primary">
        <BanknotesIcon className="h-8 w-8 text-primary mb-2" />
        <p className="text-sm text-gray-600">Today's Spend</p>
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.today)}</p>
        <p className="text-xs text-gray-500 mt-1">Outgoing today</p>
      </Card>
      
      <Card className="border-l-4 border-green-500">
        <ArrowTrendingUpIcon className="h-8 w-8 text-green-500 mb-2" />
        <p className="text-sm text-gray-600">This Week</p>
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.week)}</p>
        <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
      </Card>
      
      <Card className="border-l-4 border-purple-500">
        <UsersIcon className="h-8 w-8 text-purple-500 mb-2" />
        <p className="text-sm text-gray-600">Family Members</p>
        <p className="text-2xl font-bold text-gray-900">{familyMembersCount || 0}</p>
        <p className="text-xs text-gray-500 mt-1">
          {familyStats?.active || 0} active • {familyStats?.paused || 0} paused
          {familyStats?.pending > 0 && (
            <span className="ml-1 text-yellow-600 font-medium">
              • {familyStats.pending} pending
            </span>
          )}
        </p>
      </Card>
    </div>
  );
};