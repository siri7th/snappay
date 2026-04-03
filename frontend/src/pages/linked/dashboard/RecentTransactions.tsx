// pages/linked/dashboard/RecentTransactions.tsx
import React from 'react';
import { NavigateFunction } from 'react-router-dom';
import { ClockIcon, WalletIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import TransactionItem from '../../../components/banking/TransactionItem';

interface RecentTransactionsProps {
  transactions: any[];
  formatCurrency: (amount: number) => string;
  onNavigate: NavigateFunction;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  onNavigate
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Recent Transactions</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onNavigate('/linked/transactions')}
        >
          <ClockIcon className="h-4 w-4 mr-1" />
          View All ({transactions?.length || 0})
        </Button>
      </div>
      
      <Card>
        {transactions && transactions.length > 0 ? (
          transactions.slice(0, 5).map(txn => (
            <TransactionItem 
              key={txn.id} 
              transaction={{
                ...txn,
                amount: Number(txn.amount)
              }} 
            />
          ))
        ) : (
          <div className="text-center py-8">
            <WalletIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No transactions yet</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => onNavigate('/linked/receive')}
            >
              Receive Money
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};