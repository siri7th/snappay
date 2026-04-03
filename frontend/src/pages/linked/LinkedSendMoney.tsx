// pages/linked/LinkedSendMoney.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PhoneIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { usePayment } from '../../hooks/usePayment';
import { useFamily } from '../../hooks/useFamily';
import { useWallet } from '../../hooks/useWallet';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatters';
import { isValidPhone } from '../../utils/validators';
import { ROUTES } from '../../utils/constants';

const sendSchema = z.object({
  to: z.string().min(1, 'Recipient is required'),
  amount: z.number()
    .min(1, 'Amount must be at least ₹1')
    .max(100000, 'Amount cannot exceed ₹1,00,000'),
  note: z.string().max(50, 'Note cannot exceed 50 characters').optional(),
});

type SendFormData = z.infer<typeof sendSchema>;

const LinkedSendMoney: React.FC = () => {
  const navigate = useNavigate();
  const { sendMoney, isLoading } = usePayment();
  const { limits } = useFamily();
  const { balance } = useWallet();
  const { user } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState<SendFormData | null>(null);
  const [pin, setPin] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [isValidRecipient, setIsValidRecipient] = useState(true);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SendFormData>({
    resolver: zodResolver(sendSchema),
  });

  const amount = watch('amount');
  const to = watch('to');

  // Validate phone number as user types
  React.useEffect(() => {
    if (to && to.length === 10) {
      setIsValidRecipient(isValidPhone(to));
    } else {
      setIsValidRecipient(true);
    }
  }, [to]);

  const remaining = limits?.dailyLimit - limits?.dailySpent || 0;
  const perTransactionLimit = limits?.perTransactionLimit || 0;
  const walletBalance = balance || 0;

  const quickAmounts = [100, 200, 500, 1000, 2000];

  const onSubmit = (data: SendFormData) => {
    // Validate recipient if it's a phone number
    if (data.to.length === 10 && !isValidPhone(data.to)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setFormData(data);
    setPin('');
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!formData) return;
    
    try {
      if (!user?.hasPin) {
        toast.error('Please set your PIN to activate payments');
        sessionStorage.setItem('onboarding', 'true');
        navigate(ROUTES.SET_PIN, { replace: true });
        return;
      }
      if (pin.length !== 4) {
        toast.error('Please enter 4-digit PIN');
        return;
      }

      await sendMoney({ 
        toMobile: formData.to, 
        amount: formData.amount, 
        paymentMethod: 'wallet',
        pin,
        note: formData.note || '' 
      });
      toast.success('Money sent successfully!');
      navigate('/linked/transactions');
    } catch (error: any) {
      toast.error(error.message || 'Payment failed');
    }
  };

  const getAmountStatus = () => {
    if (!amount) return null;
    
    const amountNum = amount;
    
    if (amountNum > walletBalance) {
      return { 
        color: 'text-error', 
        message: `Insufficient wallet balance. You have ${formatCurrency(walletBalance)}` 
      };
    }
    if (amountNum > remaining) {
      return { 
        color: 'text-error', 
        message: `Exceeds daily remaining limit of ${formatCurrency(remaining)}` 
      };
    }
    if (amountNum > perTransactionLimit) {
      return { 
        color: 'text-error', 
        message: `Exceeds per transaction limit of ${formatCurrency(perTransactionLimit)}` 
      };
    }
    if (amountNum > 0) {
      return { 
        color: 'text-success', 
        message: `Available balance after: ${formatCurrency(walletBalance - amountNum)}` 
      };
    }
    return null;
  };

  const amountStatus = getAmountStatus();
  const isValidAmount = amount > 0 && 
                       amount <= walletBalance && 
                       amount <= remaining && 
                       amount <= perTransactionLimit;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/linked/dashboard')}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Send Money</h1>
      </div>

      {/* Wallet and Limit Info */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-primary-soft">
          <p className="text-xs text-gray-600">Wallet Balance</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(walletBalance)}</p>
        </Card>
        <Card className="bg-yellow-50">
          <p className="text-xs text-gray-600">Daily Remaining</p>
          <p className="text-lg font-bold text-yellow-600">{formatCurrency(remaining)}</p>
        </Card>
        <Card className="bg-blue-50">
          <p className="text-xs text-gray-600">Per Transaction</p>
          <p className="text-lg font-bold text-blue-600">{formatCurrency(perTransactionLimit)}</p>
        </Card>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              label="Recipient Mobile Number"
              type="tel"
              placeholder="9876543210"
              icon={<PhoneIcon className="h-5 w-5 text-gray-400" />}
              error={errors.to?.message}
              {...register('to')}
            />
            {to && to.length === 10 && !isValidPhone(to) && (
              <p className="text-sm text-error mt-1 flex items-center gap-1">
                <span>⚠️</span> Please enter a valid 10-digit mobile number
              </p>
            )}
          </div>

          <div>
            <Input
              label="Amount (₹)"
              type="number"
              placeholder="Enter amount"
              error={errors.amount?.message}
              {...register('amount', { valueAsNumber: true })}
            />
            
            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-2 mt-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setValue('amount', amt, { shouldValidate: true })}
                  disabled={amt > walletBalance || amt > remaining || amt > perTransactionLimit}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    amount === amt
                      ? 'bg-primary text-white'
                      : amt > walletBalance || amt > remaining || amt > perTransactionLimit
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 hover:bg-primary-soft text-gray-700'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            {/* Amount Status Message */}
            {amountStatus && (
              <p className={`text-sm mt-2 flex items-center gap-1 ${amountStatus.color}`}>
                {amountStatus.color === 'text-error' ? '⚠️' : '✓'} {amountStatus.message}
              </p>
            )}
          </div>

          <Input 
            label="Note (Optional)" 
            placeholder="What's this for? (e.g., Rent, Dinner, Gift)"
            maxLength={50}
            {...register('note')} 
          />

          {/* Submit Button */}
          <Button 
            type="submit" 
            fullWidth 
            size="lg" 
            loading={isLoading}
            disabled={!isValidAmount || !to || (to.length === 10 && !isValidPhone(to))}
          >
            Proceed to Pay
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
                  <span className="font-medium block">{formData.to}</span>
                  {recipientName && (
                    <span className="text-sm text-gray-500">{recipientName}</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Amount</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(formData.amount)}
                </span>
              </div>
              {formData.note && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Note</span>
                  <span className="text-gray-700 italic">"{formData.note}"</span>
                </div>
              )}
              <div className="flex justify-between text-sm py-2">
                <span className="text-gray-600">Wallet balance after</span>
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
                loading={isLoading}
                disabled={isLoading || pin.length !== 4}
              >
                Confirm & Send
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowConfirm(false)} 
                className="flex-1"
                disabled={isLoading}
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

export default LinkedSendMoney;