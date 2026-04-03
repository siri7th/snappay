// pages/primary/Settings/PrimarySecurity.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  LockClosedIcon,
  KeyIcon,
  FingerPrintIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { useAuth } from '../../../hooks/useAuth';
import toast from 'react-hot-toast';
import { ROUTES } from '../../../utils/constants';

interface PINFormData {
  currentPIN: string;
  newPIN: string;
  confirmPIN: string;
}

interface SecurityActivity {
  id: string;
  action: string;
  device: string;
  location: string;
  time: string;
  status: 'success' | 'warning' | 'error';
}

const PrimarySecurity: React.FC = () => {
  const navigate = useNavigate();
  const { changePin, user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [showPINForm, setShowPINForm] = useState(false);
  const [showCurrentPIN, setShowCurrentPIN] = useState(false);
  const [showNewPIN, setShowNewPIN] = useState(false);
  const [showConfirmPIN, setShowConfirmPIN] = useState(false);
  const [pinError, setPinError] = useState('');
  
  const [formData, setFormData] = useState<PINFormData>({
    currentPIN: '',
    newPIN: '',
    confirmPIN: ''
  });

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Mock security activity data
  const [securityActivities] = useState<SecurityActivity[]>([
    {
      id: '1',
      action: 'Login',
      device: 'iPhone 13 - Mumbai',
      location: 'Mumbai, India',
      time: '2 hours ago',
      status: 'success'
    },
    {
      id: '2',
      action: 'PIN Changed',
      device: 'Web Browser - Chrome',
      location: 'Delhi, India',
      time: '3 days ago',
      status: 'success'
    },
    {
      id: '3',
      action: 'Failed Login Attempt',
      device: 'Unknown Device',
      location: 'Bangalore, India',
      time: '1 week ago',
      status: 'error'
    }
  ]);

  const validatePIN = (pin: string): boolean => {
    return /^\d{4}$/.test(pin);
  };

  const handlePINChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    
    // Validation
    if (!formData.currentPIN || !formData.newPIN || !formData.confirmPIN) {
      setPinError('Please fill in all PIN fields');
      return;
    }

    if (!validatePIN(formData.currentPIN) || !validatePIN(formData.newPIN)) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }

    if (formData.newPIN !== formData.confirmPIN) {
      setPinError('New PIN and confirm PIN do not match');
      return;
    }

    if (formData.newPIN === formData.currentPIN) {
      setPinError('New PIN must be different from current PIN');
      return;
    }

    setLoading(true);
    try {
      await changePin(formData.currentPIN, formData.newPIN);
      toast.success('PIN changed successfully');
      setShowPINForm(false);
      resetForm();
    } catch (error: any) {
      setPinError(error.message || 'Failed to change PIN. Please check your current PIN.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      currentPIN: '',
      newPIN: '',
      confirmPIN: ''
    });
    setShowCurrentPIN(false);
    setShowNewPIN(false);
    setShowConfirmPIN(false);
    setPinError('');
  };

  const handleCancel = () => {
    setShowPINForm(false);
    resetForm();
  };

  const toggleTwoFA = () => {
    setTwoFAEnabled(!twoFAEnabled);
    toast.success(`2FA ${!twoFAEnabled ? 'enabled' : 'disabled'} successfully`);
  };

  const toggleBiometric = () => {
    setBiometricEnabled(!biometricEnabled);
    toast.success(`Biometric login ${!biometricEnabled ? 'enabled' : 'disabled'} successfully`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/primary/settings')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors group"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
        Back to Settings
      </button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account security and authentication methods
        </p>
      </div>

      {/* Security Overview Card */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-soft rounded-full">
            <ShieldCheckIcon className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Security Status</h2>
            <p className="text-sm text-gray-600">
              {twoFAEnabled && biometricEnabled 
                ? 'Your account has maximum security protection'
                : 'Enhance your account security with additional measures'}
            </p>
          </div>
        </div>
      </Card>

      {/* PIN Management Section */}
      <Card className="mb-6">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KeyIcon className="h-5 w-5 text-gray-500" />
              <div>
                <h3 className="font-semibold text-gray-900">PIN Management</h3>
                <p className="text-xs text-gray-500">Change or update your transaction PIN</p>
              </div>
            </div>
            {!showPINForm && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPINForm(true)}
                >
                  Change PIN
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(ROUTES.FORGOT_PIN)}
                >
                  Forgot PIN
                </Button>
              </div>
            )}
          </div>
        </div>

        {showPINForm ? (
          <div className="p-4">
            <form onSubmit={handlePINChange} className="space-y-4">
              <Input
                label="Current PIN"
                type={showCurrentPIN ? 'text' : 'password'}
                maxLength={4}
                value={formData.currentPIN}
                onChange={(e) => setFormData({ ...formData, currentPIN: e.target.value.replace(/\D/g, '') })}
                required
                leftIcon={<LockClosedIcon className="h-4 w-4 text-gray-400" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowCurrentPIN(!showCurrentPIN)}
                    className="focus:outline-none"
                  >
                    {showCurrentPIN ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                }
                helpText="Enter your current 4-digit PIN"
              />
              
              <Input
                label="New PIN"
                type={showNewPIN ? 'text' : 'password'}
                maxLength={4}
                value={formData.newPIN}
                onChange={(e) => setFormData({ ...formData, newPIN: e.target.value.replace(/\D/g, '') })}
                required
                leftIcon={<LockClosedIcon className="h-4 w-4 text-gray-400" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowNewPIN(!showNewPIN)}
                    className="focus:outline-none"
                  >
                    {showNewPIN ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                }
                helpText="Enter new 4-digit PIN"
              />
              
              <Input
                label="Confirm New PIN"
                type={showConfirmPIN ? 'text' : 'password'}
                maxLength={4}
                value={formData.confirmPIN}
                onChange={(e) => setFormData({ ...formData, confirmPIN: e.target.value.replace(/\D/g, '') })}
                required
                leftIcon={<LockClosedIcon className="h-4 w-4 text-gray-400" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPIN(!showConfirmPIN)}
                    className="focus:outline-none"
                  >
                    {showConfirmPIN ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                }
                helpText="Re-enter your new PIN"
              />

              {pinError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={loading}>
                  Update PIN
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">PIN Last Changed</p>
                <p className="text-xs text-gray-500">March 15, 2024</p>
              </div>
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            </div>
          </div>
        )}
      </Card>

      {/* Additional Security Options */}
      <Card className="mb-6">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">Additional Security</h3>
        </div>
        
        <div className="divide-y">
          {/* Two-Factor Authentication */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <DevicePhoneMobileIcon className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs ${twoFAEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                {twoFAEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <Button
                variant={twoFAEnabled ? 'outline' : 'primary'}
                size="sm"
                onClick={toggleTwoFA}
              >
                {twoFAEnabled ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </div>

          {/* Biometric Login */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <FingerPrintIcon className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Biometric Login</p>
                <p className="text-xs text-gray-500">Use fingerprint or face recognition to login</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs ${biometricEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                {biometricEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <Button
                variant={biometricEnabled ? 'outline' : 'primary'}
                size="sm"
                onClick={toggleBiometric}
              >
                {biometricEnabled ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Security Activity */}
      <Card className="mb-6">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent Security Activity</h3>
          <Button variant="outline" size="sm">View All</Button>
        </div>
        
        <div className="divide-y">
          {securityActivities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getStatusIcon(activity.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{activity.device}</p>
                  <p className="text-xs text-gray-400">{activity.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-600">Danger Zone</h3>
              <p className="text-xs text-gray-500 mt-1">
                Once you deactivate your account, there is no going back. Please be certain.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => {
                  if (window.confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) {
                    toast.error('Account deactivation is not available in demo');
                  }
                }}
              >
                Deactivate Account
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PrimarySecurity;