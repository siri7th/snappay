// src/components/banking/AddBankForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BuildingLibraryIcon } from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';

const bankSchema = z
  .object({
    bankName: z.string().min(2, 'Bank name is required'),
    accountNumber: z.string().min(9, 'Valid account number required').max(18),
    confirmAccountNumber: z.string().min(9, 'Confirm account number'),
    ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
    accountHolder: z.string().min(2, 'Account holder name required'),
    // Demo-only: allow setting an initial dummy balance
    initialBalance: z
      .union([z.number(), z.string()])
      .optional()
      .transform((v) => {
        if (v === undefined || v === null || v === '') return undefined;
        const n = typeof v === 'string' ? Number(v) : v;
        return Number.isFinite(n) ? n : undefined;
      })
      .refine((v) => v === undefined || (v >= 0 && v <= 1_000_000), {
        message: 'Initial balance must be between 0 and 10,00,000',
      }),
  })
  .refine((data) => data.accountNumber === data.confirmAccountNumber, {
    message: "Account numbers don't match",
    path: ['confirmAccountNumber'],
  });

type BankFormData = z.infer<typeof bankSchema>;

interface AddBankFormProps {
  onSubmit: (data: Omit<BankFormData, 'confirmAccountNumber'>) => Promise<void>;
  onCancel?: () => void;
  isOpen?: boolean;
}

const AddBankForm: React.FC<AddBankFormProps> = ({ onSubmit, onCancel, isOpen = true }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<BankFormData>({
    resolver: zodResolver(bankSchema),
  });

  if (!isOpen) return null;

  const handleFormSubmit = async (data: BankFormData) => {
    setIsSubmitting(true);
    try {
      const { confirmAccountNumber, ...bankData } = data;
      await onSubmit(bankData);
      reset();
    } catch (error) {
      console.error('Failed to add bank:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const popularBanks = [
    'Dummy Bank of India',
    'Dummy National Bank',
    'Dummy Co-operative Bank',
    'Dummy Rural Bank',
  ];

  const demoBalances = [
    { label: '₹10,000', value: 10000 },
    { label: '₹50,000', value: 50000 },
    { label: '₹1,00,000', value: 100000 },
  ];

  const handlePopularBankSelect = (bankName: string) => {
    setValue('bankName', bankName, { 
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true 
    });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BuildingLibraryIcon className="h-8 w-8 text-primary" />
        <h2 className="text-2xl font-bold text-gray-900">Add Bank Account</h2>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Popular Bank
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {popularBanks.map((bank) => (
              <button
                key={bank}
                type="button"
                onClick={() => handlePopularBankSelect(bank)}
                className="px-3 py-1 bg-gray-100 hover:bg-primary-soft text-gray-700 hover:text-primary rounded-full text-sm transition-colors"
              >
                {bank}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Bank Name"
          placeholder="Enter bank name"
          error={errors.bankName?.message}
          {...register('bankName')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Account Number"
            type="text"
            placeholder="Enter account number"
            error={errors.accountNumber?.message}
            {...register('accountNumber')}
          />
          <Input
            label="Confirm Account Number"
            type="text"
            placeholder="Re-enter account number"
            error={errors.confirmAccountNumber?.message}
            {...register('confirmAccountNumber')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="IFSC Code"
            placeholder="e.g., DBIN0001234"
            error={errors.ifscCode?.message}
            {...register('ifscCode')}
          />
          <Input
            label="Account Holder Name"
            placeholder="As per bank records"
            error={errors.accountHolder?.message}
            {...register('accountHolder')}
          />
        </div>

        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Demo Initial Balance (Optional)
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {demoBalances.map((b) => (
              <button
                key={b.value}
                type="button"
                onClick={() =>
                  setValue('initialBalance', b.value as any, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  })
                }
                className="px-3 py-1 bg-gray-100 hover:bg-primary-soft text-gray-700 hover:text-primary rounded-full text-sm transition-colors"
              >
                {b.label}
              </button>
            ))}
          </div>
          <Input
            label="Or enter custom amount"
            type="number"
            placeholder="0"
            error={(errors as any).initialBalance?.message}
            {...register('initialBalance' as any)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Demo only (for college project). Not a real bank integration.
          </p>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            ℹ️ Your account will be verified with a small deposit. This may take 1-2 business days.
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" loading={isSubmitting} className="flex-1">
            Add Bank Account
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
};

export default AddBankForm;