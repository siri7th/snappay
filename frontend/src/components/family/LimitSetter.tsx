// src/components/family/LimitSetter.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AdjustmentsHorizontalIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';
import { LIMITS } from '../../utils/constants';

export interface LimitFormData {
  dailyLimit: number;
  monthlyLimit: number;
  perTransactionLimit: number;
  sendMoney: boolean;
  scanPay: boolean;
  recharge: boolean;
  viewHistory: boolean;
}

const limitSchema = z.object({
  dailyLimit: z.number()
    .min(LIMITS.MIN_AMOUNT, `Daily limit must be at least ₹${LIMITS.MIN_AMOUNT}`)
    .max(LIMITS.MAX_DAILY, `Max daily limit is ₹${LIMITS.MAX_DAILY}`),
  monthlyLimit: z.number()
    .min(LIMITS.MIN_AMOUNT, `Monthly limit must be at least ₹${LIMITS.MIN_AMOUNT}`)
    .max(LIMITS.MAX_MONTHLY, `Max monthly limit is ₹${LIMITS.MAX_MONTHLY}`),
  perTransactionLimit: z.number()
    .min(LIMITS.MIN_AMOUNT, `Per transaction limit must be at least ₹${LIMITS.MIN_AMOUNT}`)
    .max(LIMITS.MAX_PER_TXN, `Max per transaction limit is ₹${LIMITS.MAX_PER_TXN}`),
  sendMoney: z.boolean().default(true),
  scanPay: z.boolean().default(true),
  recharge: z.boolean().default(true),
  viewHistory: z.boolean().default(true),
});

type LimitFormDataZod = z.infer<typeof limitSchema>;

interface LimitSetterProps {
  memberName?: string;
  initialValues?: Partial<LimitFormDataZod>;
  onSubmit: (data: LimitFormDataZod) => Promise<void>;
  onCancel?: () => void;
}

const LimitSetter: React.FC<LimitSetterProps> = ({
  memberName,
  initialValues,
  onSubmit,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dailyVsMonthlyError, setDailyVsMonthlyError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<LimitFormDataZod>({
    resolver: zodResolver(limitSchema),
    defaultValues: {
      dailyLimit: LIMITS.DEFAULT_DAILY,
      monthlyLimit: LIMITS.DEFAULT_MONTHLY,
      perTransactionLimit: LIMITS.DEFAULT_PER_TXN,
      sendMoney: true,
      scanPay: true,
      recharge: true,
      viewHistory: true,
      ...initialValues,
    },
  });

  const dailyLimit = watch('dailyLimit');
  const monthlyLimit = watch('monthlyLimit');

  useEffect(() => {
    if (dailyLimit && monthlyLimit && dailyLimit > monthlyLimit) {
      setDailyVsMonthlyError('Daily limit cannot exceed monthly limit');
    } else {
      setDailyVsMonthlyError(null);
    }
  }, [dailyLimit, monthlyLimit]);

  const quickAmounts = {
    daily: [100, 200, 500, 1000, 2000],
    monthly: [1000, 2000, 5000, 10000, 20000],
    perTxn: [50, 100, 200, 500, 1000],
  };

  const handleQuickAmount = (amount: number, field: keyof typeof quickAmounts) => {
    const fieldMap = {
      daily: 'dailyLimit',
      monthly: 'monthlyLimit',
      perTxn: 'perTransactionLimit',
    };
    setValue(fieldMap[field] as any, amount, { 
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true 
    });
  };

  const handleFormSubmit = async (data: LimitFormDataZod) => {
    if (dailyVsMonthlyError) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-6">
        <AdjustmentsHorizontalIcon className="h-8 w-8 text-primary" />
        <h2 className="text-2xl font-bold text-gray-900">
          {memberName ? `Set Limits for ${memberName}` : 'Set Spending Limits'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Daily Limit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Daily Limit (₹)
          </label>
          <Input
            type="number"
            placeholder={`Enter daily limit (max ₹${LIMITS.MAX_DAILY})`}
            error={errors.dailyLimit?.message}
            {...register('dailyLimit', { valueAsNumber: true })}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {quickAmounts.daily.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleQuickAmount(amount, 'daily')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  dailyLimit === amount
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 hover:bg-primary-soft text-gray-700'
                }`}
              >
                ₹{amount}
              </button>
            ))}
          </div>
        </div>

        {/* Monthly Limit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Limit (₹)
          </label>
          <Input
            type="number"
            placeholder={`Enter monthly limit (max ₹${LIMITS.MAX_MONTHLY})`}
            error={errors.monthlyLimit?.message}
            {...register('monthlyLimit', { valueAsNumber: true })}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {quickAmounts.monthly.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleQuickAmount(amount, 'monthly')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  monthlyLimit === amount
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 hover:bg-primary-soft text-gray-700'
                }`}
              >
                ₹{amount}
              </button>
            ))}
          </div>
        </div>

        {/* Per Transaction Limit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Per Transaction Limit (₹)
          </label>
          <Input
            type="number"
            placeholder={`Enter per transaction limit (max ₹${LIMITS.MAX_PER_TXN})`}
            error={errors.perTransactionLimit?.message}
            {...register('perTransactionLimit', { valueAsNumber: true })}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {quickAmounts.perTxn.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleQuickAmount(amount, 'perTxn')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  watch('perTransactionLimit') === amount
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 hover:bg-primary-soft text-gray-700'
                }`}
              >
                ₹{amount}
              </button>
            ))}
          </div>
        </div>

        {/* Validation Warning */}
        {dailyVsMonthlyError && (
          <div className="p-3 bg-yellow-50 rounded-lg flex items-center gap-2">
            <InformationCircleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-700">{dailyVsMonthlyError}</p>
          </div>
        )}

        {/* Permissions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'sendMoney', label: 'Send Money' },
              { id: 'scanPay', label: 'Scan & Pay' },
              { id: 'recharge', label: 'Recharge' },
              { id: 'viewHistory', label: 'View History' },
            ].map((perm) => (
              <label key={perm.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  {...register(perm.id as keyof LimitFormDataZod)}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{perm.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Info Note */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700 flex items-center gap-1">
            <InformationCircleIcon className="h-4 w-4" />
            Daily limits reset at midnight. Monthly limits reset on the 1st of each month.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            type="submit" 
            loading={isSubmitting} 
            className="flex-1"
            disabled={!!dailyVsMonthlyError}
          >
            Save Limits
          </Button>
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
};

export default LimitSetter;