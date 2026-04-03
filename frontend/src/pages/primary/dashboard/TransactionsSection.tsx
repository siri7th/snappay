// src/pages/primary/dashboard/TransactionsSection.tsx
import React from 'react';
import { NavigateFunction } from 'react-router-dom';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import TransactionItem from '../../../components/banking/TransactionItem';
import { ROUTES } from '../../../utils/constants';

interface TransactionsSectionProps {
  transactions: any[];
  onNavigate: NavigateFunction;
}

export const TransactionsSection: React.FC<TransactionsSectionProps> = ({
  transactions,
  onNavigate
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
          <p className="text-sm text-gray-500">Your latest activity</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onNavigate(ROUTES.PRIMARY_TRANSACTIONS)}>
          View All ({transactions?.length || 0})
        </Button>
      </div>
      
      <Card>
        {transactions?.length ? (
          <div className="divide-y">
            {transactions.slice(0, 5).map((txn) => (
              <TransactionItem 
                key={txn.id} 
                transaction={txn} 
                onClick={() => onNavigate(ROUTES.TRANSACTION_DETAILS.replace(':id', txn.id))}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BanknotesIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No transactions yet</p>
            <p className="text-sm text-gray-400 mb-6">
              Send money or add funds to get started
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => onNavigate(ROUTES.PRIMARY_SEND)}
              >
                Send Money
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onNavigate(ROUTES.WALLET_ADD)}
              >
                Add Money
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};