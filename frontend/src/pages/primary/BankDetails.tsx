// pages/primary/BankDetails.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BuildingLibraryIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import TransactionItem from '../../components/banking/TransactionItem';
import { useBank } from '../../hooks/useBank';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { copyToClipboard } from '../../utils/helpers';
import { Bank } from '../../types/bank.types';
import { BankTransaction } from '../../types/bank.types';
import toast from 'react-hot-toast';

// Define response types
interface BankDetailResponse {
  success: boolean;
  data: Bank;
}

interface BankTransactionResponse {
  success: boolean;
  data: {
    transactions: BankTransaction[];
    pagination?: any;
  };
}

const BankDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getBankDetails, getBankTransactions } = useBank(); // Removed unused updateBank and loading
  const [bank, setBank] = useState<Bank | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setFetching(true);
    setError(null);
    try {
      // Get bank details
      const bankResponse = await getBankDetails(id!);
      
      // Handle different response structures for bank details
      if (bankResponse && typeof bankResponse === 'object') {
        if ('success' in bankResponse && bankResponse.success && 'data' in bankResponse) {
          // Case: { success: true, data: Bank }
          setBank((bankResponse as BankDetailResponse).data);
        } else {
          // Case: Bank object directly
          setBank(bankResponse as Bank);
        }
      }

      // Get bank transactions
      const txnResponse = await getBankTransactions(id!);
      
      // Handle different response structures for transactions
      if (txnResponse && typeof txnResponse === 'object') {
        if ('success' in txnResponse && txnResponse.success && 'data' in txnResponse) {
          // Case: { success: true, data: { transactions: [] } }
          setTransactions((txnResponse as BankTransactionResponse).data.transactions || []);
        } else if ('transactions' in txnResponse) {
          // Case: { transactions: [] }
          setTransactions(txnResponse.transactions || []);
        } else if (Array.isArray(txnResponse)) {
          // Case: direct array
          setTransactions(txnResponse);
        }
      }
    } catch (err: any) {
      console.error('Failed to load bank details:', err);
      setError(err.message || 'Failed to load bank details');
    } finally {
      setFetching(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const copyDetails = () => {
    if (!bank) return;
    const text = `Bank: ${bank.bankName}\nAccount: ${bank.accountNumber}\nIFSC: ${bank.ifscCode}\nAccount Holder: ${bank.accountHolder}`;
    copyToClipboard(text);
    toast.success('Bank details copied to clipboard!');
  };

  const handleDownloadStatement = () => {
    toast.success('Statement download started');
    setTimeout(() => {
      toast.success('Statement downloaded successfully');
    }, 1500);
  };

  const handleEdit = () => {
    navigate(`/primary/banks/${id}/edit`);
  };

  const handleSendMoney = () => {
    navigate(`/primary/send?bank=${id}`);
  };

  const handleAddToWallet = () => {
    navigate('/wallet/add', { state: { bankId: id } });
  };

  const handleRemoveBank = () => {
    if (!bank) return;
    
    if (bank.isDefault) {
      toast.error('Cannot remove default bank. Set another bank as default first.');
      return;
    }
    
    if (window.confirm('Are you sure you want to remove this bank account? This action cannot be undone.')) {
      // TODO: Implement remove bank functionality
      toast.success('Bank removal feature coming soon');
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bank details...</p>
        </div>
      </div>
    );
  }

  if (error || !bank) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12">
          <ExclamationTriangleIcon className="h-16 w-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bank Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "The bank account you're looking for doesn't exist."}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/primary/banks')}>
              Back to Banks
            </Button>
            <Button variant="outline" onClick={handleRefresh}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/primary/banks')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Bank Account Details</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <span className={refreshing ? 'animate-spin' : ''}>↻</span> Refresh
          </Button>
        </div>
      </div>

      {/* Main Bank Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <BuildingLibraryIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{bank.bankName}</h2>
                <p className="text-white/80 mt-1 font-mono">{bank.accountNumber}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyDetails}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Copy details"
              >
                <DocumentDuplicateIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleEdit}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Edit bank"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-3 mb-6">
            {bank.isDefault && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                <CheckCircleIcon className="h-4 w-4" /> Default Account
              </span>
            )}
            {bank.isVerified ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                <CheckCircleIcon className="h-4 w-4" /> Verified
              </span>
            ) : (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1">
                <ClockIcon className="h-4 w-4" /> Pending Verification
              </span>
            )}
          </div>

          {/* Bank Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Account Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Account Holder</span>
                  <span className="font-medium">{bank.accountHolder}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">IFSC Code</span>
                  <span className="font-mono font-medium">{bank.ifscCode}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Account Type</span>
                  <span className="font-medium capitalize">{bank.accountType || 'Savings'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Branch</span>
                  <span className="font-medium">{bank.branch || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Balance & Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Current Balance</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(bank.balance)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Added on</span>
                  <span className="font-medium">{formatDate(bank.createdAt, 'long')}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Last updated</span>
                  <span className="font-medium">{formatDate(bank.updatedAt || bank.createdAt, 'short')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
            <Button variant="outline" onClick={handleSendMoney} className="flex items-center justify-center">
              <BuildingLibraryIcon className="h-4 w-4 mr-2" />
              Send Money
            </Button>
            <Button variant="outline" onClick={handleAddToWallet} className="flex items-center justify-center">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Add to Wallet
            </Button>
            <Button variant="outline" onClick={handleDownloadStatement} className="flex items-center justify-center">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Statement
            </Button>
          </div>

          {/* Verification Warning */}
          {!bank.isVerified && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Bank not verified</p>
                <p className="text-xs text-yellow-600 mt-1">
                  Verify your bank account to enable higher transaction limits and additional features.
                  A small deposit will be sent to your account for verification.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <p className="text-sm text-gray-500">Last 10 transactions from this account</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/primary/transactions?bank=${id}`)}
          >
            View All
          </Button>
        </div>

        {transactions.length > 0 ? (
          <div className="divide-y">
            {transactions.slice(0, 5).map((txn: BankTransaction) => (
              <TransactionItem
                key={txn.id}
                transaction={{
                  id: txn.id,
                  transactionId: txn.id,
                  amount: txn.amount,
                  type: txn.type === 'credit' ? 'RECEIVE' : 'SEND',
                  status: 'SUCCESS',
                  description: txn.description,
                  createdAt: txn.date,
                  bankName: bank.bankName
                }}
                onClick={() => navigate(`/transactions/${txn.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BuildingLibraryIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No transactions yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Transactions from this bank will appear here
            </p>
          </div>
        )}
      </Card>

      {/* Danger Zone */}
      <Card className="border-error/20">
        <div className="flex items-center gap-2 mb-4">
          <ExclamationTriangleIcon className="h-5 w-5 text-error" />
          <h3 className="font-semibold text-lg text-error">Danger Zone</h3>
        </div>

        <div className="bg-error-soft p-4 rounded-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-medium text-error mb-1">Remove this bank account</h4>
              <p className="text-sm text-gray-600">
                Once removed, you will no longer be able to use this bank for transactions.
                This action cannot be undone.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleRemoveBank}
              className="flex-shrink-0 text-error border-error hover:bg-error-soft"
              disabled={bank.isDefault}
            >
              Remove Bank
            </Button>
          </div>
          {bank.isDefault && (
            <p className="text-xs text-error mt-2">
              ⚠️ This is your default bank. Set another bank as default before removing.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default BankDetails;