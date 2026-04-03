// pages/wallet/AddMoney.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  WalletIcon, 
  BanknotesIcon, 
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';
import { useWallet } from '../../hooks/useWallet';
import { useBank } from '../../hooks/useBank';
import { formatCurrency } from '../../utils/formatters';

const AddMoney: React.FC = () => {
  const navigate = useNavigate();
  const { addMoney, getBalance, balance } = useWallet();
  const { banks, getBanks, loading: bankLoading } = useBank();
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('📡 Loading banks and balance...');
      await Promise.all([
        getBanks(),
        getBalance()
      ]);
      console.log('✅ Banks loaded:', banks.length);
      console.log('💰 Current balance:', balance);
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      toast.error('Failed to load bank accounts');
    }
  };

  const validateAmount = (value: string): string | null => {
    const amountNum = parseFloat(value);
    
    if (!value) {
      return 'Please enter an amount';
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      return 'Please enter a valid amount greater than 0';
    }
    if (amountNum > 100000) {
      return 'Maximum amount per transaction is ₹1,00,000';
    }
    return null;
  };

  const validateBank = (bankId: string): string | null => {
    if (!bankId) {
      return 'Please select a bank account';
    }
    
    const selectedBankData = banks.find(b => b.id === bankId);
    if (!selectedBankData) {
      return 'Selected bank not found';
    }
    
    const amountNum = parseFloat(amount);
    if (amountNum > selectedBankData.balance) {
      return `Insufficient balance in ${selectedBankData.bankName}. Available: ${formatCurrency(selectedBankData.balance)}`;
    }
    
    return null;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    if (selectedBank) {
      setError(validateBank(selectedBank) || '');
    } else {
      setError(validateAmount(value) || '');
    }
  };

  const handleBankSelect = (bankId: string) => {
    setSelectedBank(bankId);
    if (amount) {
      setError(validateBank(bankId) || '');
    }
  };

  const handleAddMoney = () => {
    // Validate amount
    const amountError = validateAmount(amount);
    if (amountError) {
      setError(amountError);
      toast.error(amountError);
      return;
    }

    // Validate bank
    const bankError = validateBank(selectedBank);
    if (bankError) {
      setError(bankError);
      toast.error(bankError);
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    const amountNum = parseFloat(amount);
    const selectedBankData = banks.find(b => b.id === selectedBank);

    setLoading(true);
    setError('');

    try {
      console.log('📤 Sending add money request:', {
        amount: amountNum,
        bankId: selectedBank,
        bankName: selectedBankData?.bankName,
        timestamp: new Date().toISOString()
      });

      const response = await addMoney({
        amount: amountNum,
        bankId: selectedBank
      });

      console.log('✅ Add money response:', response);
      
      setSuccess(true);
      toast.success(`${formatCurrency(amountNum)} added to wallet successfully!`);
      
      // Refresh bank balances
      await getBanks();
      
      setTimeout(() => {
        navigate('/primary/dashboard', { 
          state: { refreshBalance: true, timestamp: Date.now() } 
        });
      }, 1500);
      
    } catch (error: any) {
      console.error('❌ Failed to add money:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add money';
      setError(errorMessage);
      toast.error(errorMessage);
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  const amountNum = parseFloat(amount) || 0;
  const selectedBankData = banks.find(b => b.id === selectedBank);
  const isValidAmount = amount && !validateAmount(amount);
  const isValidBank = selectedBank && !validateBank(selectedBank);
  const isValid = isValidAmount && isValidBank;

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Money Added Successfully!</h2>
          <p className="text-gray-600 mb-4">
            {formatCurrency(amountNum)} has been added to your wallet
          </p>
          <div className="bg-primary-soft p-4 rounded-lg mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount added:</span>
                <span className="font-medium text-success">{formatCurrency(amountNum)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">From bank:</span>
                <span className="font-medium">{selectedBankData?.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">New wallet balance:</span>
                <span className="font-medium">{formatCurrency(balance + amountNum)}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/primary/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors group"
          >
            <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Add Money to Wallet</h1>
          <p className="text-gray-600 mt-1">Add funds from your bank account</p>
        </div>

        <Card>
          {/* Current Balance */}
          <div className="mb-6 p-4 bg-gradient-to-r from-primary-soft to-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Wallet Balance</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(balance || 0)}</p>
              </div>
              <WalletIcon className="h-12 w-12 text-primary opacity-50" />
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Amount (₹)
            </label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={handleAmountChange}
              min="1"
              step="100"
              className="text-lg"
              error={error && !selectedBank ? error : ''}
            />
            
            {/* Quick Amounts */}
            <div className="flex flex-wrap gap-2 mt-3">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setAmount(amt.toString());
                    setError(validateAmount(amt.toString()) || '');
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    amount === amt.toString()
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Bank Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Bank Account
            </label>
            
            {bankLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading your banks...</p>
              </div>
            ) : banks && banks.length > 0 ? (
              <div className="space-y-3">
                {banks.map((bank: any) => (
                  <label
                    key={bank.id}
                    className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedBank === bank.id
                        ? 'border-primary bg-primary-soft shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="bank"
                      value={bank.id}
                      checked={selectedBank === bank.id}
                      onChange={(e) => handleBankSelect(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedBank === bank.id ? 'bg-primary' : 'bg-gray-100'
                        }`}>
                          <BanknotesIcon className={`h-5 w-5 ${
                            selectedBank === bank.id ? 'text-white' : 'text-gray-500'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{bank.bankName}</p>
                          <p className="text-sm text-gray-500">
                            **** {bank.accountNumber.slice(-4)} 
                            {bank.isDefault && (
                              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(bank.balance)}</p>
                        <p className="text-xs text-gray-500">Available</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-3">No bank accounts linked</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/add-bank')}
                >
                  Add Bank Account
                </Button>
              </div>
            )}
          </div>

          {/* Bank-specific error */}
          {selectedBank && error && validateBank(selectedBank) && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg flex items-start gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Summary */}
          {isValid && (
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-green-700 mb-2 font-medium">Summary</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount to add:</span>
                  <span className="font-medium text-success">+{formatCurrency(amountNum)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">From:</span>
                  <span className="font-medium">{selectedBankData?.bankName}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-green-200 mt-1">
                  <span className="text-gray-600">New wallet balance:</span>
                  <span className="font-medium text-primary">{formatCurrency(balance + amountNum)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleAddMoney}
              fullWidth
              loading={loading}
              disabled={!isValid || loading || bankLoading}
              size="lg"
            >
              {loading ? 'Processing...' : 'Add to Wallet'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/primary/dashboard')}
              size="lg"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>

          {/* Info Note */}
          <p className="text-xs text-gray-500 text-center mt-4 flex items-center justify-center gap-1">
            <BanknotesIcon className="h-3 w-3" />
            Funds will be transferred instantly from your selected bank account
          </p>
        </Card>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Confirm Add Money</h2>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Amount</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(amountNum)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">From Bank</span>
                  <span className="font-medium">{selectedBankData?.bankName}</span>
                </div>
                <div className="flex justify-between text-sm py-2">
                  <span className="text-gray-600">Your balance after</span>
                  <span className="font-medium">{formatCurrency(balance + amountNum)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleConfirm} className="flex-1" loading={loading}>
                  Confirm
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfirm(false)} 
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Debug Info - Only in development */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mt-4 bg-gray-50">
            <details>
              <summary className="text-xs font-mono cursor-pointer">Debug Info</summary>
              <div className="mt-2 text-xs font-mono space-y-1">
                <p>Selected Bank: {selectedBank || 'None'}</p>
                <p>Amount: ₹{amount || '0'}</p>
                <p>Banks Available: {banks.length}</p>
                <p>Valid: {isValid ? 'Yes' : 'No'}</p>
              </div>
            </details>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AddMoney;