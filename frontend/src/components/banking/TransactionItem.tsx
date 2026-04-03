// src/components/banking/TransactionItem.tsx
import React, { useMemo } from 'react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  BanknotesIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline';
import { formatDate, formatCurrency, formatTransactionId } from '../../utils/formatters';
import { Transaction } from '../../types/payment.types';

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onClick }) => {
  const getIcon = () => {
    switch (transaction.type) {
      case 'SEND':
        return <ArrowUpIcon className="h-5 w-5 text-error" />;
      case 'RECEIVE':
        return <ArrowDownIcon className="h-5 w-5 text-success" />;
      case 'RECHARGE':
        return <ArrowPathIcon className="h-5 w-5 text-primary" />;
      case 'ADD_TO_WALLET':
        return <BanknotesIcon className="h-5 w-5 text-primary" />;
      case 'ADD_TO_LIMIT':
        return <BanknotesIcon className="h-5 w-5 text-warning" />;
      case 'PAYMENT':
      case 'QR_PAYMENT':
        return <QrCodeIcon className="h-5 w-5 text-primary" />;
      default:
        return <BanknotesIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'SUCCESS':
        return 'text-success bg-green-50';
      case 'PENDING':
        return 'text-warning bg-yellow-50';
      case 'FAILED':
        return 'text-error bg-red-50';
      case 'REFUNDED':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const title = useMemo(() => {
    if (transaction.description) return transaction.description;

    switch (transaction.type) {
      case 'SEND':
        return `To ${transaction.receiver?.name || transaction.receiver?.phone || 'Unknown'}`;
      case 'RECEIVE':
        return `From ${transaction.sender?.name || transaction.sender?.phone || 'Unknown'}`;
      case 'RECHARGE':
        return transaction.metadata?.mobileNumber
          ? `Recharge for ${transaction.metadata.mobileNumber}`
          : 'Mobile Recharge';
      case 'ADD_TO_WALLET':
        return 'Added to Wallet';
      case 'ADD_TO_LIMIT':
        return `Added to ${transaction.metadata?.memberName || 'Family'} limit`;
      case 'PAYMENT':
      case 'QR_PAYMENT':
        return `Payment to ${transaction.metadata?.merchantName || 'Merchant'}`;
      default:
        return 'Transaction';
    }
  }, [transaction]);

  const isOutgoing = transaction.type === 'SEND' || transaction.type === 'PAYMENT' || transaction.type === 'QR_PAYMENT';

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-white hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-100 mb-2"
    >
      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
        {getIcon()}
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-gray-900">{title}</h4>
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(transaction.createdAt, 'relative')}
            </p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor()}`}>
            {transaction.status}
          </span>
        </div>

        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500 font-mono">
            {formatTransactionId(transaction.transactionId)}
          </span>
          <span
            className={`font-bold ${isOutgoing ? 'text-error' : 'text-success'}`}
          >
            {isOutgoing ? '-' : '+'}{formatCurrency(transaction.amount)}
          </span>
        </div>

        {transaction.metadata?.bankName && (
          <p className="text-xs text-gray-400 mt-1">via {transaction.metadata.bankName}</p>
        )}
      </div>
    </div>
  );
};

export default TransactionItem;