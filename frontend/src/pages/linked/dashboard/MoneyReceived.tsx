// pages/linked/dashboard/MoneyReceived.tsx
import React from 'react';
import { NavigateFunction } from 'react-router-dom';
import { ArrowDownIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';

interface MoneyReceivedProps {
  recentReceived: any[];
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  onNavigate: NavigateFunction;
}

export const MoneyReceived: React.FC<MoneyReceivedProps> = ({
  recentReceived,
  formatCurrency,
  formatDate,
  onNavigate
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-success">Money Received</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onNavigate('/linked/transactions?type=received')}
        >
          View All
        </Button>
      </div>
      
      <Card>
        {recentReceived.length > 0 ? (
          recentReceived.map(txn => (
            <div key={txn.id} className="flex items-center gap-3 p-3 border-b last:border-0 hover:bg-gray-50">
              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                <ArrowDownIcon className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="font-medium">From: {txn.senderName || txn.senderPhone || 'Unknown'}</p>
                <p className="text-xs text-gray-500">{formatDate(txn.createdAt)}</p>
              </div>
              <span className="font-bold text-success">+{formatCurrency(txn.amount)}</span>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-4">No money received yet</p>
        )}
      </Card>
    </div>
  );
};