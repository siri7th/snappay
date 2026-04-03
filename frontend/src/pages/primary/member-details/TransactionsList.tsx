// src/pages/primary/member-details/TransactionsList.tsx
import React from 'react';
import { NavigateFunction } from 'react-router-dom';
import { ClockIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import TransactionItem from '../../../components/banking/TransactionItem';
import { ROUTES } from '../../../utils/constants';

interface TransactionsListProps {
  transactions: any[];
  memberId?: string;
  onNavigate: NavigateFunction;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  memberId,
  onNavigate
}) => {
  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Recent Transactions</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onNavigate(`${ROUTES.PRIMARY_TRANSACTIONS}?member=${memberId}`)}
        >
          View All ({transactions.length})
        </Button>
      </div>
      {transactions.length > 0 ? (
        <div className="divide-y">
          {transactions.slice(0, 5).map((txn: any) => (
            <TransactionItem 
              key={txn.id} 
              transaction={txn} 
              onClick={() => onNavigate(ROUTES.TRANSACTION_DETAILS.replace(':id', txn.id))}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No transactions yet</p>
        </div>
      )}
    </Card>
  );
};