// src/pages/primary/SendMoney.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  PhoneIcon, 
  BuildingLibraryIcon, 
  UserIcon,
  WalletIcon,
  ChevronDownIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { usePayment } from '../../hooks/usePayment';
import { useWallet } from '../../hooks/useWallet';
import { useBank } from '../../hooks/useBank';
import { useFamily } from '../../hooks/useFamily';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import { isValidPhone } from '../../utils/validators';

const sendSchema = z.object({
  type: z.enum(['mobile', 'bank', 'family']),
  recipient: z.string().min(1, 'Recipient required'),
  amount: z.number()
    .min(1, 'Amount must be at least ₹1')
    .max(100000, 'Amount cannot exceed ₹1,00,000'),
  note: z.string().max(50, 'Note cannot exceed 50 characters').optional()
});

type SendFormData = z.infer<typeof sendSchema>;

const SendMoney: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sendMoney, isLoading: paymentLoading } = usePayment();
  const { balance, getBalance, loading: walletLoading } = useWallet();
  const { banks, getBanks, loading: bankLoading } = useBank();
  const { familyMembers, getFamilyMembers, loading: familyLoading } = useFamily();
  const { user } = useAuth();
  
  const [selectedType, setSelectedType] = useState<'mobile' | 'bank' | 'family'>('mobile');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'bank'>('wallet');
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<any>(null);
  const [bankBalance, setBankBalance] = useState(0);
  const [showFamilyDropdown, setShowFamilyDropdown] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState<SendFormData | null>(null);
  const [pin, setPin] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [isValidRecipient, setIsValidRecipient] = useState(true);
  
  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<SendFormData>({
    resolver: zodResolver(sendSchema),
    defaultValues: { type: 'mobile', amount: undefined }
  });

  // Check for pre-filled data from QR scan
  useEffect(() => {
    if (location.state?.to) {
      setValue('recipient', location.state.to);
      if (location.state.to.length === 10) {
        setIsValidRecipient(isValidPhone(location.state.to));
      }
    }
    if (location.state?.amount) {
      setValue('amount', location.state.amount);
    }
  }, [location.state, setValue]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        getBalance(),
        getBanks(),
        getFamilyMembers()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    if (selectedBank && banks.length > 0) {
      const bank = banks.find(b => b.id === selectedBank);
      setBankBalance(bank?.balance || 0);
    }
  }, [selectedBank, banks]);

  // Set recipient when family member is selected
  useEffect(() => {
    if (selectedType === 'family' && selectedFamilyMember) {
      setValue('recipient', selectedFamilyMember.phone);
      setRecipientName(selectedFamilyMember.name);
    }
  }, [selectedType, selectedFamilyMember, setValue]);

  // Reset form when type changes
  useEffect(() => {
    if (selectedType !== 'family') {
      setSelectedFamilyMember(null);
      setRecipientName('');
    }
    if (selectedType !== 'bank') {
      setValue('recipient', '');
    }
  }, [selectedType, setValue]);

  // Validate recipient for phone numbers
  useEffect(() => {
    const recipient = watch('recipient');
    if (recipient && recipient.length === 10) {
      setIsValidRecipient(isValidPhone(recipient));
    } else {
      setIsValidRecipient(true);
    }
  }, [watch('recipient')]);

  const quickAmounts = [100, 200, 500, 1000, 2000];
  const amount = watch('amount');
  const recipient = watch('recipient');

  const onSubmit = (data: SendFormData) => {
    // Validate based on type
    if (data.type === 'mobile' && data.recipient.length === 10 && !isValidPhone(data.recipient)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    // Validate based on payment method
    if (paymentMethod === 'wallet' && balance < data.amount) {
      toast.error(`Insufficient wallet balance. You have ${formatCurrency(balance)}`);
      return;
    }

    if (paymentMethod === 'bank') {
      if (!selectedBank) {
        toast.error('Please select a bank account');
        return;
      }
      if (bankBalance < data.amount) {
        toast.error(`Insufficient balance in selected bank. Available: ${formatCurrency(bankBalance)}`);
        return;
      }
    }

    if (!user?.hasPin) {
      toast.error('Please set your PIN to activate payments');
      sessionStorage.setItem('onboarding', 'true');
      navigate(ROUTES.SET_PIN, { replace: true });
      return;
    }

    setPin('');
    setFormData(data);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!formData) return;
    
    try {
      const paymentData: any = {
        toMobile: formData.recipient,
        amount: formData.amount,
        pin,
        note: formData.note || '',
        paymentMethod
      };

      if (paymentMethod === 'bank') {
        paymentData.bankId = selectedBank;
      }

      if (selectedType === 'family' && selectedFamilyMember) {
        paymentData.familyMemberId = selectedFamilyMember.id;
      }

      await sendMoney(paymentData);
      toast.success('Money sent successfully!');
      navigate(ROUTES.PRIMARY_TRANSACTIONS);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Payment failed');
    } finally {
      setShowConfirm(false);
    }
  };

  const getSelectedFamilyMemberName = () => {
    if (!selectedFamilyMember) return 'Choose a family member';
    return `${selectedFamilyMember.name} (${selectedFamilyMember.phone})`;
  };

  const walletBalance = balance || 0;
  const remaining = walletBalance - (amount || 0);
  const isValidAmount = amount > 0 && amount <= walletBalance;

  const isLoading = paymentLoading || walletLoading || bankLoading || familyLoading;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate(ROUTES.PRIMARY_DASHBOARD)}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Send Money</h1>
      </div>

      {/* Wallet Balance Info */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-blue-700">Wallet Balance:</span>
          </div>
          <span className="font-bold text-blue-700">{formatCurrency(walletBalance)}</span>
        </div>
      </Card>

      <Card>
        {/* Payment Method Selector */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Pay From
          </label>
          <div className="flex gap-4">
            <label 
              className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer flex-1 transition-all ${
                paymentMethod === 'wallet' 
                  ? 'border-primary bg-primary-soft ring-2 ring-primary/20' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="wallet"
                checked={paymentMethod === 'wallet'}
                onChange={(e) => setPaymentMethod(e.target.value as 'wallet')}
                className="sr-only"
              />
              <WalletIcon className={`h-5 w-5 ${paymentMethod === 'wallet' ? 'text-primary' : 'text-gray-400'}`} />
              <div>
                <p className={`font-medium ${paymentMethod === 'wallet' ? 'text-primary' : 'text-gray-700'}`}>
                  Wallet
                </p>
                <p className="text-xs text-gray-500">Balance: {formatCurrency(walletBalance)}</p>
              </div>
            </label>
            
            <label 
              className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer flex-1 transition-all ${
                paymentMethod === 'bank' 
                  ? 'border-primary bg-primary-soft ring-2 ring-primary/20' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="bank"
                checked={paymentMethod === 'bank'}
                onChange={(e) => setPaymentMethod(e.target.value as 'bank')}
                className="sr-only"
              />
              <BuildingLibraryIcon className={`h-5 w-5 ${paymentMethod === 'bank' ? 'text-primary' : 'text-gray-400'}`} />
              <div>
                <p className={`font-medium ${paymentMethod === 'bank' ? 'text-primary' : 'text-gray-700'}`}>
                  Bank Account
                </p>
                <p className="text-xs text-gray-500">Use linked bank</p>
              </div>
            </label>
          </div>
        </div>

        {/* Bank Selection */}
        {paymentMethod === 'bank' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Bank Account
            </label>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none bg-white"
            >
              <option value="">Choose a bank account</option>
              {banks.map((bank: any) => (
                <option key={bank.id} value={bank.id}>
                  {bank.bankName} - ****{bank.accountNumber?.slice(-4)} - {formatCurrency(bank.balance || 0)}
                </option>
              ))}
            </select>
            {banks.length === 0 && !bankLoading && (
              <p className="text-sm text-warning mt-2">
                No bank accounts linked.{' '}
                <button 
                  onClick={() => navigate(ROUTES.ADD_BANK)}
                  className="text-primary underline"
                >
                  Add a bank account
                </button>
              </p>
            )}
          </div>
        )}

        {/* Type Selector */}
        <div className="flex gap-3 mb-6">
          {[
            { id: 'mobile', label: 'To Mobile', icon: PhoneIcon },
            { id: 'bank', label: 'To Bank', icon: BuildingLibraryIcon },
            { id: 'family', label: 'Family Member', icon: UserIcon }
          ].map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => { 
                  setSelectedType(type.id as any); 
                  setValue('type', type.id as any);
                }}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  selectedType === type.id 
                    ? 'border-primary bg-primary-soft ring-2 ring-primary/20' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className={`h-5 w-5 mx-auto mb-1 ${
                  selectedType === type.id ? 'text-primary' : 'text-gray-500'
                }`} />
                <span className={`text-sm ${
                  selectedType === type.id ? 'text-primary font-medium' : 'text-gray-600'
                }`}>{type.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Recipient Input */}
          {selectedType === 'family' ? (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Family Member
              </label>
              
              {familyLoading ? (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-xs text-gray-500 mt-2">Loading family members...</p>
                </div>
              ) : familyMembers.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <UserIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-3">No family members found</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate(ROUTES.PRIMARY_FAMILY_ADD)}
                  >
                    Add Family Member
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowFamilyDropdown(!showFamilyDropdown)}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg text-left flex items-center justify-between focus:border-primary focus:outline-none bg-white hover:border-gray-300 transition-colors"
                  >
                    <span className={selectedFamilyMember ? 'text-gray-900' : 'text-gray-400'}>
                      {getSelectedFamilyMemberName()}
                    </span>
                    <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${showFamilyDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showFamilyDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowFamilyDropdown(false)}
                      />
                      <div className="absolute z-20 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                        <div className="sticky top-0 bg-gray-50 p-2 border-b flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-500">Select a family member</span>
                          <button
                            type="button"
                            onClick={() => setShowFamilyDropdown(false)}
                            className="p-1 hover:bg-gray-200 rounded-full"
                          >
                            <XMarkIcon className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                        {familyMembers.map((member: any) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => {
                              setSelectedFamilyMember(member);
                              setValue('recipient', member.phone);
                              setShowFamilyDropdown(false);
                            }}
                            className={`w-full p-3 text-left hover:bg-primary-soft flex items-center gap-3 border-b last:border-0 ${
                              selectedFamilyMember?.id === member.id ? 'bg-primary-soft' : ''
                            }`}
                          >
                            <div className="w-10 h-10 bg-primary-soft rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-primary font-medium">
                                {member.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.phone}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{member.relationship}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-gray-500">Daily left</p>
                              <p className="text-sm font-medium text-primary">
                                {formatCurrency(member.dailyRemaining || 0)}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              
              <input
                type="hidden"
                {...register('recipient')}
              />
              {errors.recipient && (
                <p className="text-sm text-error mt-1">{errors.recipient.message}</p>
              )}
            </div>
          ) : (
            <div>
              <Input
                label={selectedType === 'mobile' ? 'Mobile Number' : 
                       selectedType === 'bank' ? 'Account Number' : 'Recipient'}
                placeholder={
                  selectedType === 'mobile' ? 'Enter 10-digit mobile number' : 
                  selectedType === 'bank' ? 'Enter account number' : 'Enter recipient'
                }
                {...register('recipient')}
                error={errors.recipient?.message}
                disabled={isLoading}
              />
              {selectedType === 'mobile' && recipient && recipient.length === 10 && !isValidPhone(recipient) && (
                <p className="text-sm text-error mt-1 flex items-center gap-1">
                  ⚠️ Please enter a valid 10-digit mobile number
                </p>
              )}
            </div>
          )}

          {/* Amount Input */}
          <div>
            <Input
              label="Amount (₹)"
              type="number"
              placeholder="Enter amount"
              {...register('amount', { valueAsNumber: true })}
              error={errors.amount?.message}
              disabled={isLoading}
              min={1}
            />
            <div className="flex gap-2 mt-2 flex-wrap">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setValue('amount', amt, { shouldValidate: true })}
                  disabled={amt > walletBalance}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    amount === amt
                      ? 'bg-primary text-white'
                      : amt > walletBalance
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 hover:bg-primary-soft text-gray-700'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
            {amount > walletBalance && (
              <p className="text-sm text-error mt-1 flex items-center gap-1">
                ⚠️ Insufficient balance. You have {formatCurrency(walletBalance)}
              </p>
            )}
          </div>

          <Input
            label="Note (Optional)"
            placeholder="What's this for? (e.g., Rent, Dinner, Gift)"
            {...register('note')}
            disabled={isLoading}
            maxLength={50}
          />

          {/* Summary */}
          {amount > 0 && amount <= walletBalance && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700 mb-2 font-medium">Summary</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount to send:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Wallet balance after:</span>
                  <span className="font-medium text-success">{formatCurrency(remaining)}</span>
                </div>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            fullWidth 
            size="lg" 
            loading={isLoading}
            disabled={
              !amount || 
              amount <= 0 || 
              !recipient ||
              (selectedType === 'mobile' && recipient.length === 10 && !isValidPhone(recipient)) ||
              (selectedType === 'family' && !selectedFamilyMember) ||
              (paymentMethod === 'bank' && !selectedBank) ||
              amount > walletBalance ||
              isLoading
            }
          >
            {isLoading ? 'Processing...' : 'Proceed to Pay'}
          </Button>
        </form>
      </Card>

      {/* Confirmation Modal */}
      {showConfirm && formData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Confirm Payment</h2>
              <button
                onClick={() => setShowConfirm(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">To</span>
                <div className="text-right">
                  <span className="font-medium block">{formData.recipient}</span>
                  {recipientName && (
                    <span className="text-sm text-gray-500">{recipientName}</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Amount</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(formData.amount)}</span>
              </div>
              {formData.note && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Note</span>
                  <span className="text-gray-700 italic">"{formData.note}"</span>
                </div>
              )}
              <div className="flex justify-between text-sm py-2">
                <span className="text-gray-600">Payment method</span>
                <span className="font-medium capitalize">{paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm py-2">
                <span className="text-gray-600">Balance after</span>
                <span className="font-medium">{formatCurrency(walletBalance - formData.amount)}</span>
              </div>
            </div>

            <div className="mb-6">
              <Input
                label="Enter UPI PIN"
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\\D/g, '').slice(0, 4))}
                helpText="4-digit PIN required to send money"
                required
              />
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.FORGOT_PIN)}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot PIN?
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleConfirm}
                className="flex-1"
                loading={paymentLoading}
                disabled={paymentLoading || pin.length !== 4}
              >
                Confirm & Send
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowConfirm(false)} 
                className="flex-1"
                disabled={paymentLoading}
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

export default SendMoney;