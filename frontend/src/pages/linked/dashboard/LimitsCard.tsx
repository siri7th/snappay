// pages/linked/dashboard/LimitsCard.tsx
import React from 'react';
import Card from '../../../components/common/Card';
import ProgressBar from '../../../components/common/ProgressBar';

interface LimitsCardProps {
  limits: any;
  dailyPercentage: number;
  monthlyPercentage: number;
  formatCurrency: (amount: number) => string;
}

export const LimitsCard: React.FC<LimitsCardProps> = ({
  limits,
  dailyPercentage,
  monthlyPercentage,
  formatCurrency
}) => {
  return (
    <Card>
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        <span>Your Spending Limits</span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          limits.status === 'ACTIVE' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-700'
        }`}>
          {limits.status}
        </span>
      </h2>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Daily Limit</span>
          <span className="font-medium">
            {formatCurrency(limits.dailySpent)} / {formatCurrency(limits.dailyLimit)}
          </span>
        </div>
        <ProgressBar 
          value={dailyPercentage} 
          color={dailyPercentage > 80 ? 'warning' : 'primary'} 
        />
        <p className="text-xs text-gray-500 mt-1">Resets at midnight</p>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Monthly Limit</span>
          <span className="font-medium">
            {formatCurrency(limits.monthlySpent)} / {formatCurrency(limits.monthlyLimit)}
          </span>
        </div>
        <ProgressBar 
          value={monthlyPercentage} 
          color={monthlyPercentage > 80 ? 'warning' : 'primary'} 
        />
        <p className="text-xs text-gray-500 mt-1">Resets on 1st of month</p>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-sm text-gray-600">
          Per Transaction Limit:{' '}
          <span className="font-semibold">{formatCurrency(limits.perTransactionLimit)}</span>
        </p>
      </div>
    </Card>
  );
};