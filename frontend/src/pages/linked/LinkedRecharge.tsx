// pages/linked/LinkedRecharge.tsx  not updating for now
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PhoneIcon, LightBulbIcon, TruckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useRecharge } from '../../hooks/useRecharge';
import { useFamily } from '../../hooks/useFamily';

const rechargeSchema = z.object({
  type: z.enum(['mobile', 'electricity', 'fastag']),
  accountNumber: z.string().min(1, 'Account number required'),
  amount: z.number().min(1, 'Amount required'),
  operator: z.string().optional(),
});

type RechargeFormData = z.infer<typeof rechargeSchema>;

const LinkedRecharge: React.FC = () => {
  const navigate = useNavigate();
  const { recharge, isLoading } = useRecharge();
  const { limits } = useFamily();
  const [selectedType, setSelectedType] = useState<'mobile' | 'electricity' | 'fastag'>('mobile');
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

  const amount = watch('amount');
  const remaining = limits?.dailyLimit - limits?.dailySpent || 0;
  const isValidAmount =
    amount && amount <= remaining && amount <= (limits?.perTransactionLimit || 0);

  const types = [
    { id: 'mobile', label: 'Mobile', icon: PhoneIcon, placeholder: 'Mobile Number' },
    {
      id: 'electricity',
      label: 'Electricity',
      icon: LightBulbIcon,
      placeholder: 'Consumer Number',
    },
    { id: 'fastag', label: 'FASTag', icon: TruckIcon, placeholder: 'Vehicle Number' },
  ];

  const operators = {
    mobile: ['Airtel', 'Jio', 'VI', 'BSNL'],
    electricity: ['Tata Power', 'Adani', 'BSES'],
    fastag: ['ICICI', 'HDFC', 'Paytm'],
  };

  const onSubmit = async (data: RechargeFormData) => {
    try {
      await recharge(data);
      toast.success('Recharge successful!');
      navigate('/linked/history');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Recharge</h1>

      {/* Limit Info */}
      <Card className="mb-6 bg-yellow-50 border-yellow-200">
        <p className="text-sm text-gray-600">Today's Remaining: ₹{remaining}</p>
      </Card>

      <Card>
        {/* Type Selector */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {types.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setSelectedType(type.id as any);
                setValue('type', type.id as any);
              }}
              className={`p-3 rounded-lg border-2 transition-colors ${
                selectedType === type.id
                  ? 'border-primary bg-primary-soft'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <type.icon
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
          ))}
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
                  onClick={() => setValue('operator', op)}
                  className="px-4 py-2 bg-gray-100 hover:bg-primary-soft rounded-lg text-sm"
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

          <div>
            <Input
              label="Amount (₹)"
              type="number"
              placeholder="Enter amount"
              {...register('amount', { valueAsNumber: true })}
              error={errors.amount?.message}
            />
            {amount > 0 && amount > remaining && (
              <p className="text-sm text-error mt-1">⚠️ Exceeds daily remaining limit</p>
            )}
          </div>

          <Button type="submit" fullWidth size="lg" loading={isLoading} disabled={!isValidAmount}>
            Proceed to Recharge
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default LinkedRecharge;
