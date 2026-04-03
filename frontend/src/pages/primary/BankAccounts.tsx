// src/pages/primary/BankAccounts.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  BuildingLibraryIcon,
  ArrowPathIcon,
  BanknotesIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import BankCard from '../../components/banking/BankCard';
import { useBank } from '../../hooks/useBank';
import { formatCurrency } from '../../utils/formatters';
import { ROUTES } from '../../utils/constants';
import { Bank } from '../../types/bank.types';

const BankAccounts: React.FC = () => {
  const navigate = useNavigate();
  const { 
    banks, 
    totalBalance, 
    loading, 
    getBanks, 
    setDefaultBank, 
    deleteBank,
    verifyBank 
  } = useBank();
  
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      setError(null);
      const result = await getBanks();
      if (!result?.banks?.length && !result?.data?.banks?.length) {
        setError('No bank accounts found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load banks');
    } finally {
      setInitialLoad(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await loadBanks();
    setRefreshing(false);
  };

  const handleSetDefault = async (bankId: string) => {
    try {
      await setDefaultBank(bankId);
    } catch (err: any) {
      // Error handled in hook
    }
  };

  const handleRemove = async (bankId: string) => {
    if (window.confirm('Are you sure you want to remove this bank account? This action cannot be undone.')) {
      try {
        await deleteBank(bankId);
      } catch (err: any) {
        // Error handled in hook
      }
    }
  };

  const handleVerify = async (bankId: string) => {
    try {
      await verifyBank(bankId);
    } catch (err: any) {
      // Error handled in hook
    }
  };

  const verifiedBanksCount = banks.filter((bank: Bank) => bank.isVerified).length;
  const defaultBank = banks.find((bank: Bank) => bank.isDefault);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your linked bank accounts</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Button onClick={() => navigate(ROUTES.ADD_BANK)} size="sm">
            <PlusIcon className="h-4 w-4 mr-1" /> Add Bank
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary to-primary-dark text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white text-opacity-80 text-sm">Total Balance</p>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(totalBalance)}
              </p>
              <p className="text-white text-opacity-60 text-xs mt-2">
                Across {banks.length} {banks.length === 1 ? 'account' : 'accounts'}
              </p>
            </div>
            <BuildingLibraryIcon className="h-12 w-12 text-white opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white text-opacity-80 text-sm">Verified Accounts</p>
              <p className="text-3xl font-bold text-white">{verifiedBanksCount}</p>
              <p className="text-white text-opacity-60 text-xs mt-2">
                {banks.length - verifiedBanksCount} pending verification
              </p>
            </div>
            <ShieldCheckIcon className="h-12 w-12 text-white opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white text-opacity-80 text-sm">Default Account</p>
              <p className="text-lg font-bold text-white truncate max-w-[150px]">
                {defaultBank ? defaultBank.bankName : 'Not set'}
              </p>
              <p className="text-white text-opacity-60 text-xs mt-2">
                {defaultBank ? `**** ${defaultBank.accountNumber.slice(-4)}` : 'No default bank'}
              </p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-white opacity-50" />
          </div>
        </Card>
      </div>

      {/* Bank List */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Bank Accounts</h2>
        
        <div className="space-y-4">
          {loading && initialLoad ? (
            <Card className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading your banks...</p>
            </Card>
          ) : banks.length === 0 ? (
            <Card className="text-center py-16">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <BuildingLibraryIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No banks linked yet</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Add your first bank account to start making payments and managing your money
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate(ROUTES.ADD_BANK)} size="lg">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Bank Account
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => navigate(ROUTES.PRIMARY_DASHBOARD)}
                >
                  Go to Dashboard
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {banks.map((bank: Bank) => (
                <BankCard
                  key={bank.id}
                  bank={bank}
                  onSend={(id) => navigate(`${ROUTES.PRIMARY_SEND}?bank=${id}`)}
                  onSetDefault={handleSetDefault}
                  onRemove={handleRemove}
                  onVerify={handleVerify}
                  showActions={true}
                />
              ))}
              
              <Card className="bg-gray-50 border border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <BuildingLibraryIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Total:</span>
                      <span className="font-semibold">{banks.length}</span>
                    </div>
                    <div className="w-px h-4 bg-gray-300"></div>
                    <div className="flex items-center gap-1">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      <span className="text-gray-600">Verified:</span>
                      <span className="font-semibold text-green-600">{verifiedBanksCount}</span>
                    </div>
                    <div className="w-px h-4 bg-gray-300"></div>
                    <div className="flex items-center gap-1">
                      <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                      <span className="text-gray-600">Pending:</span>
                      <span className="font-semibold text-yellow-600">{banks.length - verifiedBanksCount}</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate(ROUTES.ADD_BANK)}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" /> Add Another
                  </Button>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Help Section */}
      {banks.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <BuildingLibraryIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">Bank Account Tips</h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
                <li>Set a default bank for faster transactions</li>
                <li>Verify your banks to enable higher transaction limits</li>
                <li>You can add multiple bank accounts from different banks</li>
                <li>Bank balances update automatically with each transaction</li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Back to Dashboard Link */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => navigate(ROUTES.PRIMARY_DASHBOARD)}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default BankAccounts;