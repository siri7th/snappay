// pages/primary/AddLimit.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  UserIcon,
  WalletIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';
import { useFamily } from '../../hooks/useFamily';
import { useWallet } from '../../hooks/useWallet';
import { formatCurrency } from '../../utils/formatters';

const AddLimit: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMemberDetails, addToLimit } = useFamily();
  const { balance, getBalance } = useWallet();
  const [member, setMember] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setFetching(true);
    setError('');
    try {
      console.log('📡 Loading member details and balance...');
      await Promise.all([
        loadMember(),
        getBalance()
      ]);
      console.log('✅ Data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      setError('Failed to load member details');
    } finally {
      setFetching(false);
    }
  };

  const loadMember = async () => {
    try {
      console.log('📡 Fetching member with ID:', id);
      const data = await getMemberDetails(id!);
      setMember(data);
    } catch (error) {
      console.error('Failed to load member:', error);
      setError('Could not load member details');
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
    if (amountNum > balance) {
      return `Amount exceeds your wallet balance of ${formatCurrency(balance)}`;
    }
    if (amountNum > 100000) {
      return 'Maximum amount per transaction is ₹1,00,000';
    }
    return null;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    setError(validateAmount(value) || '');
  };

  const handleAddLimit = () => {
    const validationError = validateAmount(amount);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    const amountNum = parseFloat(amount);
    
    setLoading(true);
    setError('');
    try {
      console.log('📤 Adding ₹', amountNum, 'to limit for member:', id);
      await addToLimit(id!, amountNum);
      
      setSuccess(true);
      toast.success(`₹${amountNum.toLocaleString()} added to ${member?.name || 'member'}'s limit`);
      
      setTimeout(() => {
        navigate(`/primary/family/${id}`);
      }, 1500);
    } catch (error: any) {
      console.error('❌ Failed to add limit:', error);
      const errorMsg = error.message || 'Failed to add limit';
      setError(errorMsg);
      toast.error(errorMsg);
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  const amountNum = parseFloat(amount) || 0;
  const isValidAmount = amount && !validateAmount(amount);
  const newBalance = balance - amountNum;

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading member details...</p>
        </div>
      </div>
    );
  }

  if (error && !member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12">
          <ExclamationTriangleIcon className="h-16 w-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/primary/family')}>
            Back to Family
          </Button>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Limit Updated Successfully!</h2>
          <p className="text-gray-600 mb-4">
            {formatCurrency(amountNum)} has been added to {member?.name || 'member'}'s limit.
          </p>
          <div className="bg-primary-soft p-4 rounded-lg mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount added:</span>
                <span className="font-medium text-success">{formatCurrency(amountNum)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">New daily limit:</span>
                <span className="font-medium">{formatCurrency((member?.dailyLimit || 0) + amountNum)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Your remaining wallet:</span>
                <span className="font-medium">{formatCurrency(newBalance)}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500">Redirecting to member details...</p>
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
            onClick={() => navigate(`/primary/family/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors group"
          >
            <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Member Details
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Add to Spending Limit</h1>
          <p className="text-gray-600 mt-1">Increase the spending limit for your family member</p>
        </div>

        <Card>
          {/* Member Info */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-2xl font-bold">
                {member?.name?.charAt(0).toUpperCase() || 'M'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{member?.name}</h2>
              <p className="text-gray-600">{member?.phone}</p>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                {member?.relationship}
              </p>
            </div>
          </div>

          {/* Current Limits */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-primary" />
              Current Limits
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Daily</p>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(member?.dailySpent || 0)} / {formatCurrency(member?.dailyLimit || 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {Math.round(((member?.dailySpent || 0) / (member?.dailyLimit || 1)) * 100)}% used
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Monthly</p>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(member?.monthlySpent || 0)} / {formatCurrency(member?.monthlyLimit || 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {Math.round(((member?.monthlySpent || 0) / (member?.monthlyLimit || 1)) * 100)}% used
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Per Transaction</p>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(member?.perTransactionLimit || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="mb-6">
            <div className={`p-4 rounded-lg ${amountNum > balance ? 'bg-red-50 border border-red-200' : 'bg-blue-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <WalletIcon className={`h-5 w-5 ${amountNum > balance ? 'text-red-600' : 'text-blue-600'}`} />
                  <span className={`text-sm font-medium ${amountNum > balance ? 'text-red-700' : 'text-blue-700'}`}>
                    Your Wallet Balance
                  </span>
                </div>
                <span className="text-xs text-gray-500">Available to add</span>
              </div>
              <p className={`text-2xl font-bold ${amountNum > balance ? 'text-red-700' : 'text-blue-700'}`}>
                {formatCurrency(balance || 0)}
              </p>
            </div>
          </div>

          {/* Add Limit Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Add (₹)
              </label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={handleAmountChange}
                min="1"
                step="100"
                className="text-lg"
                error={error}
              />
            </div>

            {/* Quick Amounts */}
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setAmount(amt.toString());
                    setError(validateAmount(amt.toString()) || '');
                  }}
                  disabled={amt > balance}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    amount === amt.toString()
                      ? 'bg-primary text-white shadow-md'
                      : amt > balance
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            {/* Summary */}
            {isValidAmount && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700 mb-2 font-medium">Summary</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Will be deducted:</span>
                    <span className="font-medium text-gray-900">-{formatCurrency(amountNum)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">New wallet balance:</span>
                    <span className="font-medium text-success">{formatCurrency(newBalance)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-green-200 mt-1">
                    <span className="text-gray-600">New daily limit:</span>
                    <span className="font-medium text-primary">
                      {formatCurrency((member?.dailyLimit || 0) + amountNum)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleAddLimit}
                fullWidth
                loading={loading}
                disabled={!isValidAmount}
                size="lg"
              >
                {loading ? 'Processing...' : 'Add to Limit'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/primary/family/${id}`)}
                size="lg"
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Confirm Add to Limit</h2>
              <button
                onClick={() => setShowConfirm(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Member</span>
                <span className="font-medium">{member?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Amount to add</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(amountNum)}</span>
              </div>
              <div className="flex justify-between text-sm py-2">
                <span className="text-gray-600">Your balance after</span>
                <span className="font-medium">{formatCurrency(newBalance)}</span>
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
    </div>
  );
};

export default AddLimit;