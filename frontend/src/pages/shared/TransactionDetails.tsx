// pages/shared/TransactionDetails.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  DocumentDuplicateIcon,
  PrinterIcon,
  ShareIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useWallet } from '../../hooks/useWallet';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {  copyToClipboard } from '../../utils/helpers';
import toast from 'react-hot-toast';

const TransactionDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getTransactionById } = useWallet();
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransaction();
  }, [id]);

  const loadTransaction = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactionById(id!);
      if (!data) {
        setError('Transaction not found');
      } else {
        setTransaction(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load transaction');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (transaction?.status) {
      case 'SUCCESS':
        return <CheckCircleIcon className="h-12 w-12 text-success" />;
      case 'PENDING':
        return <ClockIcon className="h-12 w-12 text-warning" />;
      case 'FAILED':
        return <XCircleIcon className="h-12 w-12 text-error" />;
      case 'REFUNDED':
        return <ArrowUpIcon className="h-12 w-12 text-gray-500" />;
      default:
        return <ClockIcon className="h-12 w-12 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (transaction?.status) {
      case 'SUCCESS':
        return 'bg-success/10 border-success';
      case 'PENDING':
        return 'bg-warning/10 border-warning';
      case 'FAILED':
        return 'bg-error/10 border-error';
      case 'REFUNDED':
        return 'bg-gray-100 border-gray-400';
      default:
        return 'bg-gray-100 border-gray-400';
    }
  };

  const getTypeIcon = () => {
    if (transaction?.type === 'SEND' || transaction?.type === 'PAYMENT')
      return <ArrowUpIcon className="h-5 w-5 text-error" />;
    if (transaction?.type === 'RECEIVE') return <ArrowDownIcon className="h-5 w-5 text-success" />;
    if (transaction?.type === 'RECHARGE') return <BanknotesIcon className="h-5 w-5 text-primary" />;
    return null;
  };

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Transaction Receipt',
          text: `Transaction of ${formatCurrency(transaction?.amount)} on ${formatDate(transaction?.createdAt, 'long')}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      handleCopy(window.location.href, 'Transaction link');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>
        <Card className="text-center py-12">
          <XCircleIcon className="h-16 w-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Transaction Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "The transaction you're looking for doesn't exist."}</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </Card>
      </div>
    );
  }

  const isSent = transaction.senderId === user?.id;
  const isReceived = transaction.receiverId === user?.id;
  const isRecharge = transaction.type === 'RECHARGE';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back
      </button>

      {/* Status Banner */}
      <Card className={`mb-6 border-l-4 ${getStatusColor()}`}>
        <div className="flex items-center gap-4">
          {getStatusIcon()}
          <div>
            <h1 className="text-2xl font-bold capitalize mb-1">
              {transaction.status.toLowerCase()}
            </h1>
            <p className="text-gray-600">{formatDate(transaction.createdAt, 'long')}</p>
          </div>
        </div>
      </Card>

      {/* Transaction Details */}
      <Card className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Transaction Details</h2>
          <span className={`text-3xl font-bold ${isSent ? 'text-error' : 'text-success'}`}>
            {isSent ? '-' : '+'} {formatCurrency(transaction.amount)}
          </span>
        </div>

        <div className="space-y-4">
          {/* Transaction ID */}
          <div className="flex justify-between py-3 border-b">
            <span className="text-gray-600">Transaction ID</span>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                {transaction.transactionId}
              </code>
              <button
                onClick={() => handleCopy(transaction.transactionId, 'Transaction ID')}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Copy transaction ID"
              >
                <DocumentDuplicateIcon className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Type */}
          <div className="flex justify-between py-3 border-b">
            <span className="text-gray-600">Type</span>
            <div className="flex items-center gap-2">
              {getTypeIcon()}
              <span className="font-medium capitalize">{transaction.type}</span>
            </div>
          </div>

          {/* Status */}
          <div className="flex justify-between py-3 border-b">
            <span className="text-gray-600">Status</span>
            <span className={`font-medium ${
              transaction.status === 'SUCCESS' ? 'text-success' :
              transaction.status === 'PENDING' ? 'text-warning' :
              transaction.status === 'FAILED' ? 'text-error' :
              'text-gray-500'
            }`}>
              {transaction.status}
            </span>
          </div>

          {/* Date */}
          <div className="flex justify-between py-3 border-b">
            <span className="text-gray-600">Date & Time</span>
            <span className="font-medium">{formatDate(transaction.createdAt, 'long')}</span>
          </div>

          {/* Sender/Receiver Info */}
          {isSent && transaction.receiver && (
            <>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">Sent To</span>
                <div className="text-right">
                  <p className="font-medium">{transaction.receiver.name || 'User'}</p>
                  <p className="text-sm text-gray-500">{transaction.receiver.phone}</p>
                </div>
              </div>
              {transaction.receiver.email && (
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Receiver Email</span>
                  <span className="font-medium">{transaction.receiver.email}</span>
                </div>
              )}
            </>
          )}

          {isReceived && transaction.sender && (
            <>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">Received From</span>
                <div className="text-right">
                  <p className="font-medium">{transaction.sender.name || 'User'}</p>
                  <p className="text-sm text-gray-500">{transaction.sender.phone}</p>
                </div>
              </div>
              {transaction.sender.email && (
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Sender Email</span>
                  <span className="font-medium">{transaction.sender.email}</span>
                </div>
              )}
            </>
          )}

          {/* Description */}
          {transaction.description && (
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-600">Description</span>
              <span className="font-medium">{transaction.description}</span>
            </div>
          )}

          {/* Payment Method */}
          {transaction.paymentMethod && (
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium capitalize">{transaction.paymentMethod}</span>
            </div>
          )}

          {/* Bank Info */}
          {transaction.bank && (
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-600">Bank Account</span>
              <div className="text-right">
                <p className="font-medium">{transaction.bank.bankName}</p>
                <p className="text-sm text-gray-500">****{transaction.bank.accountNumber?.slice(-4)}</p>
              </div>
            </div>
          )}

          {/* Recharge Info */}
          {isRecharge && transaction.metadata && (
            <>
              {transaction.metadata.operator && (
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Operator</span>
                  <span className="font-medium">{transaction.metadata.operator}</span>
                </div>
              )}
              {transaction.metadata.mobileNumber && (
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Mobile Number</span>
                  <span className="font-medium">{transaction.metadata.mobileNumber}</span>
                </div>
              )}
            </>
          )}

          {/* QR Payment Info */}
          {transaction.type === 'QR_PAYMENT' && transaction.metadata?.merchantName && (
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-600">Merchant</span>
              <span className="font-medium">{transaction.metadata.merchantName}</span>
            </div>
          )}

          {/* Additional Metadata */}
          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <div className="py-3">
              <details className="text-sm">
                <summary className="text-gray-500 cursor-pointer hover:text-gray-700">
                  Additional Details
                </summary>
                <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg">
                  {Object.entries(transaction.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="font-medium text-gray-900">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button variant="outline" onClick={handlePrint} className="flex items-center justify-center">
          <PrinterIcon className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button
          variant="outline"
          onClick={handleShare}
          className="flex items-center justify-center"
        >
          <ShareIcon className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center justify-center">
          Back
        </Button>
      </div>

      {/* Support Link for Failed Transactions */}
      {transaction.status === 'FAILED' && (
        <Card className="mt-6 bg-error/5 border-error/20">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-error" />
            <p className="text-sm text-gray-600">
              Having issues?{' '}
              <button 
                onClick={() => navigate('/support')} 
                className="text-primary hover:underline font-medium"
              >
                Contact Support
              </button>
            </p>
          </div>
        </Card>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-gray-50">
          <details>
            <summary className="text-xs font-mono cursor-pointer text-gray-500">
              Debug Info
            </summary>
            <pre className="mt-2 text-xs font-mono overflow-auto">
              {JSON.stringify(transaction, null, 2)}
            </pre>
          </details>
        </Card>
      )}
    </div>
  );
};

export default TransactionDetails;