// pages/linked/RequestIncrease.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowTrendingUpIcon, 
  CheckCircleIcon, 
  XMarkIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useFamily } from '../../hooks/useFamily';
import { formatCurrency } from '../../utils/formatters';

const requestSchema = z.object({
  amount: z.number()
    .min(1, 'Amount is required')
    .max(10000, 'Maximum request amount is ₹10,000'),
  reason: z.string()
    .max(200, 'Reason cannot exceed 200 characters')
    .optional(),
  duration: z.enum(['today', 'week', 'permanent']),
});

type RequestFormData = z.infer<typeof requestSchema>;

const RequestIncrease: React.FC = () => {
  const navigate = useNavigate();
  const { createLimitRequest, limits } = useFamily();
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState<RequestFormData | null>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: { duration: 'today' },
  });

  const amount = watch('amount');
  const duration = watch('duration');
  const reason = watch('reason');

  const getDurationLabel = (dur: string) => {
    switch (dur) {
      case 'today': return 'Just Today';
      case 'week': return 'This Week';
      case 'permanent': return 'Permanent';
      default: return dur;
    }
  };

  const getDurationDescription = (dur: string) => {
    switch (dur) {
      case 'today':
        return 'Limit will reset to original at midnight';
      case 'week':
        return 'Limit will reset after 7 days';
      case 'permanent':
        return 'Limit will be permanently increased (subject to primary approval)';
      default:
        return '';
    }
  };

  const onSubmit = (data: RequestFormData) => {
    setFormData(data);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!formData) return;
    
    try {
      await createLimitRequest(formData);
      setSubmitted(true);
      toast.success('Request sent to primary account');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send request');
    } finally {
      setShowConfirm(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Sent!</h2>
          <p className="text-gray-600 mb-4">
            Your request for {formatCurrency(formData?.amount || 0)} has been sent to the primary account holder.
          </p>
          <div className="bg-primary-soft p-4 rounded-lg mb-6 text-left">
            <h3 className="font-semibold mb-2">Request Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">{formatCurrency(formData?.amount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{getDurationLabel(formData?.duration || 'today')}</span>
              </div>
              {formData?.reason && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Reason:</span>
                  <span className="font-medium italic">"{formData.reason}"</span>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <Button onClick={() => navigate('/linked/dashboard')} fullWidth>
              Back to Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/linked/transactions')} 
              fullWidth
            >
              View Transaction History
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/linked/dashboard')}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Request Limit Increase</h1>
      </div>

      {/* Current Limits */}
      <Card className="mb-6 bg-gray-50">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <InformationCircleIcon className="h-5 w-5 text-primary" />
          Current Limits
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Daily</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(limits?.dailySpent || 0)} / {formatCurrency(limits?.dailyLimit || 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {Math.round(((limits?.dailySpent || 0) / (limits?.dailyLimit || 1)) * 100)}% used
            </p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Monthly</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(limits?.monthlySpent || 0)} / {formatCurrency(limits?.monthlyLimit || 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {Math.round(((limits?.monthlySpent || 0) / (limits?.monthlyLimit || 1)) * 100)}% used
            </p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg col-span-2">
            <p className="text-xs text-gray-500 mb-1">Per Transaction</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(limits?.perTransactionLimit || 0)}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Input
              label="Additional Amount Needed (₹)"
              type="number"
              placeholder="Enter amount (max ₹10,000)"
              {...register('amount', { valueAsNumber: true })}
              error={errors.amount?.message}
              min={1}
              max={10000}
            />
            <p className="text-xs text-gray-500 mt-1">Maximum ₹10,000 per request</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Duration
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: 'today', label: 'Just Today', desc: 'Resets at midnight' },
                { value: 'week', label: 'This Week', desc: 'Valid for 7 days' },
                { value: 'permanent', label: 'Permanent', desc: 'Until changed' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setValue('duration', option.value as any)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    duration === option.value
                      ? 'border-primary bg-primary-soft ring-2 ring-primary/20'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`block font-medium ${
                      duration === option.value ? 'text-primary' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="text-xs text-gray-500 mt-1 block">
                    {option.desc}
                  </span>
                </button>
              ))}
            </div>
            {duration && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <InformationCircleIcon className="h-3 w-3" />
                {getDurationDescription(duration)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <textarea
              {...register('reason')}
              placeholder="Tell your primary account why you need this increase..."
              rows={4}
              maxLength={200}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors resize-none"
            />
            <p className="text-xs text-gray-500 text-right mt-1">
              {reason?.length || 0}/200 characters
            </p>
          </div>

          {/* Summary Preview */}
          {amount > 0 && (
            <div className="bg-primary-soft p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Request Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">New daily limit:</span>
                  <span className="font-medium">
                    {formatCurrency((limits?.dailyLimit || 0) + amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium capitalize">{getDurationLabel(duration)}</span>
                </div>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            fullWidth 
            size="lg" 
            loading={isSubmitting}
            disabled={!amount || amount <= 0}
          >
            Send Request
          </Button>
        </form>
      </Card>

      {/* Info Card */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800 mb-1">About Limit Requests</h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc pl-4">
              <li>Requests are sent to your primary account holder for approval</li>
              <li>You'll be notified when your request is approved or denied</li>
              <li>Temporary requests (Today/Week) automatically reset</li>
              <li>You can track your request status in transaction history</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Confirmation Modal */}
      {showConfirm && formData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Confirm Request</h2>
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
                <span className="font-bold text-primary">{formatCurrency(formData.amount)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">{getDurationLabel(formData.duration)}</span>
              </div>
              {formData.reason && (
                <div className="py-2 border-b">
                  <span className="text-gray-600 block mb-1">Reason</span>
                  <p className="text-gray-700 italic">"{formData.reason}"</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={handleConfirm} className="flex-1">
                Confirm & Send
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowConfirm(false)} 
                className="flex-1"
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

export default RequestIncrease;