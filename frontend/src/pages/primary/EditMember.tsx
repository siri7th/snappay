// pages/primary/EditMember.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';
import { useFamily } from '../../hooks/useFamily';
import { formatCurrency } from '../../utils/formatters';

interface MemberFormData {
  name: string;
  relationship: string;
  dailyLimit: string;
  monthlyLimit: string;
  perTransactionLimit: string;
  sendMoney: boolean;
  scanPay: boolean;
  recharge: boolean;
  viewHistory: boolean;
}

const EditMember: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMemberDetails, updateLimits } = useFamily();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof MemberFormData, string>>>({});
  const [formData, setFormData] = useState<MemberFormData>({
    name: '',
    relationship: '',
    dailyLimit: '',
    monthlyLimit: '',
    perTransactionLimit: '',
    sendMoney: true,
    scanPay: true,
    recharge: true,
    viewHistory: true
  });

  useEffect(() => {
    loadMember();
  }, [id]);

  const loadMember = async () => {
    setFetching(true);
    try {
      const data = await getMemberDetails(id!);
      const memberData = data?.data || data;
      setMember(memberData);
      
      setFormData({
        name: memberData.name || '',
        relationship: memberData.relationship || '',
        dailyLimit: memberData.dailyLimit?.toString() || '',
        monthlyLimit: memberData.monthlyLimit?.toString() || '',
        perTransactionLimit: memberData.perTransactionLimit?.toString() || '',
        sendMoney: memberData.permissions?.sendMoney ?? true,
        scanPay: memberData.permissions?.scanPay ?? true,
        recharge: memberData.permissions?.recharge ?? true,
        viewHistory: memberData.permissions?.viewHistory ?? true
      });
    } catch (error) {
      console.error('Failed to load member:', error);
      toast.error('Could not load member details');
    } finally {
      setFetching(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof MemberFormData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name must not exceed 50 characters';
    }

    const daily = parseFloat(formData.dailyLimit);
    if (!formData.dailyLimit) {
      newErrors.dailyLimit = 'Daily limit is required';
    } else if (isNaN(daily) || daily <= 0) {
      newErrors.dailyLimit = 'Please enter a valid amount';
    } else if (daily > 10000) {
      newErrors.dailyLimit = 'Daily limit cannot exceed ₹10,000';
    }

    const monthly = parseFloat(formData.monthlyLimit);
    if (!formData.monthlyLimit) {
      newErrors.monthlyLimit = 'Monthly limit is required';
    } else if (isNaN(monthly) || monthly <= 0) {
      newErrors.monthlyLimit = 'Please enter a valid amount';
    } else if (monthly > 50000) {
      newErrors.monthlyLimit = 'Monthly limit cannot exceed ₹50,000';
    }

    const perTxn = parseFloat(formData.perTransactionLimit);
    if (!formData.perTransactionLimit) {
      newErrors.perTransactionLimit = 'Per transaction limit is required';
    } else if (isNaN(perTxn) || perTxn <= 0) {
      newErrors.perTransactionLimit = 'Please enter a valid amount';
    } else if (perTxn > 1000) {
      newErrors.perTransactionLimit = 'Per transaction limit cannot exceed ₹1,000';
    }

    // Validate that daily limit doesn't exceed monthly limit
    if (daily && monthly && daily > monthly) {
      newErrors.dailyLimit = 'Daily limit cannot exceed monthly limit';
    }

    // Validate that per transaction limit doesn't exceed daily limit
    if (perTxn && daily && perTxn > daily) {
      newErrors.perTransactionLimit = 'Per transaction limit cannot exceed daily limit';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      await updateLimits(id!, {
        dailyLimit: parseFloat(formData.dailyLimit),
        monthlyLimit: parseFloat(formData.monthlyLimit),
        perTransactionLimit: parseFloat(formData.perTransactionLimit),
        permissions: {
          sendMoney: formData.sendMoney,
          scanPay: formData.scanPay,
          recharge: formData.recharge,
          viewHistory: formData.viewHistory
        }
      });
      toast.success('Member updated successfully');
      navigate(`/primary/family/${id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update member');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name as keyof MemberFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

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

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12">
          <ExclamationTriangleIcon className="h-16 w-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Member Not Found</h2>
          <p className="text-gray-600 mb-6">The family member you're trying to edit doesn't exist.</p>
          <Button onClick={() => navigate('/primary/family')}>
            Back to Family
          </Button>
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
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            Back to Member Details
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Family Member</h1>
          <p className="text-gray-600 mt-1">Update details and limits for {member.name}</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                Basic Information
              </h2>
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  icon={<UserIcon className="h-5 w-5 text-gray-400" />}
                  error={errors.name}
                  required
                />
                <Input
                  label="Relationship"
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleChange}
                  placeholder="e.g., Daughter, Son, Mother"
                  icon={<UserIcon className="h-5 w-5 text-gray-400" />}
                />
              </div>
            </div>

            {/* Spending Limits */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Spending Limits</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Daily (₹)"
                  name="dailyLimit"
                  type="number"
                  value={formData.dailyLimit}
                  onChange={handleChange}
                  min="1"
                  max="10000"
                  step="100"
                  error={errors.dailyLimit}
                  required
                />
                <Input
                  label="Monthly (₹)"
                  name="monthlyLimit"
                  type="number"
                  value={formData.monthlyLimit}
                  onChange={handleChange}
                  min="1"
                  max="50000"
                  step="500"
                  error={errors.monthlyLimit}
                  required
                />
                <Input
                  label="Per Transaction (₹)"
                  name="perTransactionLimit"
                  type="number"
                  value={formData.perTransactionLimit}
                  onChange={handleChange}
                  min="1"
                  max="1000"
                  step="50"
                  error={errors.perTransactionLimit}
                  required
                />
              </div>

              {/* Limit Summary */}
              {formData.dailyLimit && formData.monthlyLimit && formData.perTransactionLimit && (
                <div className="mt-4 p-3 bg-primary-soft rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Limit Summary</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Daily:</span>
                      <span className="ml-1 font-medium">{formatCurrency(parseFloat(formData.dailyLimit))}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Monthly:</span>
                      <span className="ml-1 font-medium">{formatCurrency(parseFloat(formData.monthlyLimit))}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Per TXN:</span>
                      <span className="ml-1 font-medium">{formatCurrency(parseFloat(formData.perTransactionLimit))}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Permissions */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Permissions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="sendMoney"
                    checked={formData.sendMoney}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Send Money to Mobile</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="scanPay"
                    checked={formData.scanPay}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Scan & Pay at Shops</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="recharge"
                    checked={formData.recharge}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Recharge (Mobile/Electricity)</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="viewHistory"
                    checked={formData.viewHistory}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">View Transaction History</span>
                </label>
              </div>
            </div>

            {/* Validation Summary */}
            {Object.keys(errors).length > 0 && (
              <div className="p-3 bg-red-50 rounded-lg flex items-start gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Please fix the following errors:</p>
                  <ul className="text-xs text-red-600 mt-1 list-disc pl-4">
                    {Object.values(errors).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                fullWidth 
                loading={loading}
                disabled={Object.keys(errors).length > 0}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/primary/family/${id}`)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default EditMember;