// pages/primary/Recharge.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  PhoneIcon, 
  LightBulbIcon, 
  TruckIcon, 
  TvIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useRecharge } from '../../hooks/useRecharge';
import { useWallet } from '../../hooks/useWallet';
import { formatCurrency } from '../../utils/formatters';
import { RECHARGE_TYPES } from '../../utils/constants';

const rechargeSchema = z.object({
  type: z.enum(['mobile', 'electricity', 'fastag', 'dth']),
  accountNumber: z.string().min(1, 'Account number required'),
  amount: z.number()
    .min(1, 'Amount must be at least ₹1')
    .max(10000, 'Amount cannot exceed ₹10,000'),
  operator: z.string().optional(),
});

type RechargeFormData = z.infer<typeof rechargeSchema>;

const Recharge: React.FC = () => {
  const navigate = useNavigate();
  const { recharge, isLoading, getPlans } = useRecharge();
  const { balance } = useWallet();
  const [selectedType, setSelectedType] = useState<'mobile' | 'electricity' | 'fastag' | 'dth'>(
    'mobile',
  );
  const [plans, setPlans] = useState<any[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState<RechargeFormData | null>(null);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RechargeFormData>({
    resolver: zodResolver(rechargeSchema),
    defaultValues: { type: 'mobile' },
  });

  const accountNumber = watch('accountNumber');
  const amount = watch('amount');
  const operator = watch('operator');

  const loadPlans = async (operator?: string) => {
    try {
      const data = await getPlans({ type: selectedType, operator });
      setPlans(data?.data || data || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  };

  const types = [
    { id: 'mobile', label: 'Mobile', icon: PhoneIcon, placeholder: 'Mobile Number' },
    { id: 'electricity', label: 'Electricity', icon: LightBulbIcon, placeholder: 'Consumer Number' },
    { id: 'fastag', label: 'FASTag', icon: TruckIcon, placeholder: 'Vehicle Number' },
    { id: 'dth', label: 'DTH', icon: TvIcon, placeholder: 'Subscriber ID' },
  ];

  const operators = {
    mobile: ['Airtel', 'Jio', 'VI', 'BSNL'],
    electricity: ['Tata Power', 'Adani', 'BSES', 'Torrent'],
    fastag: ['ICICI', 'HDFC', 'SBI', 'Paytm'],
    dth: ['Tata Sky', 'Airtel', 'Dish TV', 'Sun Direct'],
  };

  const onSubmit = (data: RechargeFormData) => {
    // Validate against wallet balance
    if (data.amount > balance) {
      toast.error(`Insufficient wallet balance. You have ${formatCurrency(balance)}`);
      return;
    }
    
    setFormData(data);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!formData) return;
    
    try {
      await recharge(formData);
      toast.success('Recharge successful!');
      navigate('/primary/transactions');
    } catch (error: any) {
      toast.error(error.message || 'Recharge failed');
    } finally {
      setShowConfirm(false);
    }
  };

  const isValidAmount = amount > 0 && amount <= balance;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/primary/dashboard')}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Recharge & Bills</h1>
      </div>

      {/* Wallet Balance Info */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <InformationCircleIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-blue-700">Wallet Balance:</span>
          </div>
          <span className="font-bold text-blue-700">{formatCurrency(balance)}</span>
        </div>
      </Card>

      <Card>
        {/* Type Selector */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {types.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedType(type.id as any);
                  setValue('type', type.id as any);
                  setPlans([]);
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedType === type.id
                    ? 'border-primary bg-primary-soft ring-2 ring-primary/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon
                  className={`h-5 w-5 mx-auto mb-1 ${
                    selectedType === type.id ? 'text-primary' : 'text-gray-500'
                  }`}
                />
                <span
                  className={`text-xs ${
                    selectedType === type.id ? 'text-primary font-medium' : 'text-gray-600'
                  }`}
                >
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Operator Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Operator</label>
            <div className="flex flex-wrap gap-2">
              {operators[selectedType].map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => {
                    setValue('operator', op);
                    loadPlans(op);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    operator === op
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 hover:bg-primary-soft text-gray-700'
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          <Input
            label={types.find((t) => t.id === selectedType)?.placeholder || 'Account Number'}
            placeholder="Enter account number"
            {...register('accountNumber')}
            error={errors.accountNumber?.message}
          />

          {/* Plans */}
          {accountNumber && plans.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Plan</label>
              <div className="grid grid-cols-2 gap-2">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setValue('amount', plan.amount)}
                    className={`p-3 border rounded-lg hover:border-primary text-left transition-all ${
                      amount === plan.amount ? 'border-primary bg-primary-soft' : 'border-gray-200'
                    }`}
                  >
                    <p className="font-medium">₹{plan.amount}</p>
                    <p className="text-xs text-gray-500">{plan.validity}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Input
              label="Amount (₹)"
              type="number"
              placeholder="Enter amount"
              {...register('amount', { valueAsNumber: true })}
              error={errors.amount?.message}
              min={1}
              max={10000}
            />
            {amount > balance && (
              <p className="text-sm text-error mt-1 flex items-center gap-1">
                ⚠️ Insufficient balance. You have {formatCurrency(balance)}
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            fullWidth 
            size="lg" 
            loading={isLoading}
            disabled={!isValidAmount}
          >
            Proceed to Recharge
          </Button>
        </form>
      </Card>

      {/* Confirmation Modal */}
      {showConfirm && formData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Confirm Recharge</h2>
              <button
                onClick={() => setShowConfirm(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Type</span>
                <span className="font-medium capitalize">{formData.type}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Operator</span>
                <span className="font-medium">{formData.operator || 'Not specified'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Account</span>
                <span className="font-medium">{formData.accountNumber}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Amount</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(formData.amount)}</span>
              </div>
              <div className="flex justify-between text-sm py-2">
                <span className="text-gray-600">Balance after</span>
                <span className="font-medium">{formatCurrency(balance - formData.amount)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleConfirm} className="flex-1" loading={isLoading}>
                Confirm Recharge
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

export default Recharge;