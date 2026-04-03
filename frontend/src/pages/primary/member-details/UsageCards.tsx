// src/pages/primary/member-details/UsageCards.tsx
import React from 'react';
import { ChartBarIcon, WalletIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ProgressBar from '../../../components/common/ProgressBar';

interface UsageCardsProps {
  dailySpent: number;
  dailyLimit: number;
  dailyPercent: number;
  dailyRemaining: number;
  monthlySpent: number;
  monthlyLimit: number;
  monthlyPercent: number;
  monthlyRemaining: number;
  perTransactionLimit: number;
  walletBalance: number;
  onAddLimit: () => void;
  onSendMoney: () => void;
  formatCurrency: (amount: number) => string;
}

export const UsageCards: React.FC<UsageCardsProps> = ({
  dailySpent,
  dailyLimit,
  dailyPercent,
  dailyRemaining,
  monthlySpent,
  monthlyLimit,
  monthlyPercent,
  monthlyRemaining,
  perTransactionLimit,
  walletBalance,
  onAddLimit,
  onSendMoney,
  formatCurrency
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Daily Usage */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Daily Usage</h3>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            dailyPercent > 80 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {dailyPercent.toFixed(0)}% used
          </span>
        </div>
        <p className="text-2xl font-bold mb-2">
          {formatCurrency(dailySpent)} / {formatCurrency(dailyLimit)}
        </p>
        <ProgressBar value={dailyPercent} color={dailyPercent > 80 ? 'warning' : 'primary'} />
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-500">Remaining</span>
          <span className="font-medium text-success">{formatCurrency(dailyRemaining)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">Resets at midnight</p>
      </Card>

      {/* Monthly Usage */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-success" />
            <h3 className="font-semibold">Monthly Usage</h3>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            monthlyPercent > 80 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {monthlyPercent.toFixed(0)}% used
          </span>
        </div>
        <p className="text-2xl font-bold mb-2">
          {formatCurrency(monthlySpent)} / {formatCurrency(monthlyLimit)}
        </p>
        <ProgressBar value={monthlyPercent} color={monthlyPercent > 80 ? 'warning' : 'success'} />
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-500">Remaining</span>
          <span className="font-medium text-success">{formatCurrency(monthlyRemaining)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">Resets on 1st of month</p>
      </Card>

      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100">
        <div className="flex items-center gap-2 mb-3">
          <WalletIcon className="h-5 w-5 text-indigo-500" />
          <h3 className="font-semibold text-indigo-700">Wallet Balance</h3>
        </div>
        <p className="text-3xl font-bold text-indigo-600 mb-2">
          {formatCurrency(walletBalance)}
        </p>
        <p className="text-xs text-gray-500">Available in member's wallet</p>
        
        <div className="mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            fullWidth
            onClick={onSendMoney}
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <ArrowUpIcon className="h-4 w-4 mr-1" />
            Send Money
          </Button>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <WalletIcon className="h-5 w-5 text-warning" />
          <h3 className="font-semibold">Quick Actions</h3>
        </div>
        <Button variant="primary" size="sm" fullWidth onClick={onAddLimit} className="mb-2">
          Add to Limit
        </Button>
        <Button variant="outline" size="sm" fullWidth onClick={onSendMoney} className="mb-2">
          Send Money
        </Button>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Per Transaction Limit</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(perTransactionLimit)}</p>
        </div>
      </Card>
    </div>
  );
};