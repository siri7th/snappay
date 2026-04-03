// src/pages/auth/JoinFamily.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCodeIcon, EnvelopeIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { ROUTES } from '../../utils/constants';
import { isValidPhone } from '../../utils/validators';
import toast from 'react-hot-toast';

const JoinFamily: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<'qr' | 'sms' | 'manual' | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMethodSelect = (method: 'qr' | 'sms' | 'manual') => {
    setSelectedMethod(method);
  };

  const handleQRScan = () => {
    navigate(ROUTES.SCAN, { 
      state: { 
        purpose: 'join-family',
        returnTo: ROUTES.JOIN_FAMILY
      } 
    });
  };

  const handleSMSInvite = () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter the invite code');
      return;
    }

    if (inviteCode.trim().length < 6) {
      toast.error('Invite code must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      navigate(`${ROUTES.ACCEPT_INVITE}?code=${inviteCode.trim().toUpperCase()}`);
    }, 500);
  };

  const handleManualAdd = () => {
    if (!phoneNumber) {
      toast.error('Please enter the primary account holder\'s phone number');
      return;
    }

    if (!isValidPhone(phoneNumber)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      navigate(`${ROUTES.AUTH}?type=linked&invite=manual&phone=${phoneNumber}`);
    }, 500);
  };

  const handleBack = () => {
    if (selectedMethod) {
      setSelectedMethod(null);
      setInviteCode('');
      setPhoneNumber('');
    } else {
      navigate(`${ROUTES.AUTH}?type=linked`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join a Family Account</h1>
          <p className="text-gray-600">Choose how you want to connect</p>
        </div>

        {!selectedMethod ? (
          // Method Selection Screen
          <div className="space-y-4">
            <button
              onClick={() => handleMethodSelect('qr')}
              className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary-soft transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-soft rounded-full flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                  <QrCodeIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Scan QR Code</h3>
                  <p className="text-sm text-gray-500">Ask primary account holder to show their QR code</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleMethodSelect('sms')}
              className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary-soft transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-soft rounded-full flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                  <EnvelopeIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Enter Invite Code</h3>
                  <p className="text-sm text-gray-500">Use the 6-8 digit code sent via SMS</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleMethodSelect('manual')}
              className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary-soft transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-soft rounded-full flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                  <UserPlusIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Enter Manually</h3>
                  <p className="text-sm text-gray-500">Enter primary account holder's phone number</p>
                </div>
              </div>
            </button>

            <div className="mt-6 text-center">
              <button
                onClick={handleBack}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← Back to login
              </button>
            </div>
          </div>
        ) : (
          // Method-specific forms
          <div className="space-y-6">
            <button
              onClick={handleBack}
              className="text-gray-500 hover:text-gray-700 text-sm mb-4 flex items-center gap-1"
            >
              ← Back to methods
            </button>

            {selectedMethod === 'qr' && (
              <div className="text-center">
                <div className="bg-gradient-to-r from-primary-50 to-blue-50 p-8 rounded-xl mb-6 border-2 border-dashed border-primary-200">
                  <div className="w-24 h-24 bg-white rounded-xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                    <QrCodeIcon className="h-14 w-14 text-primary" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Scan Primary's QR Code</h3>
                  <p className="text-gray-600 mb-6">
                    Ask the primary account holder to open their Family Management section 
                    and show you their QR code. Scan it to connect automatically.
                  </p>
                </div>
                <Button onClick={handleQRScan} fullWidth size="lg" loading={loading}>
                  <QrCodeIcon className="h-5 w-5 mr-2" />
                  Open QR Scanner
                </Button>
              </div>
            )}

            {selectedMethod === 'sms' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Invite Code
                  </label>
                  <Input
                    placeholder="e.g., FAMILY123"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="text-center text-2xl tracking-widest font-mono"
                    maxLength={10}
                    autoFocus
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                  <EnvelopeIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    The primary account holder can generate an invite code from their 
                    Family Management section. Codes are valid for 24 hours.
                  </p>
                </div>

                <Button 
                  onClick={handleSMSInvite} 
                  fullWidth 
                  loading={loading}
                  disabled={!inviteCode.trim() || inviteCode.trim().length < 6}
                  size="lg"
                >
                  Verify Code
                </Button>
              </div>
            )}

            {selectedMethod === 'manual' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Account Phone Number
                  </label>
                  <Input
                    placeholder="9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    type="tel"
                    maxLength={10}
                    autoFocus
                  />
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg flex items-start gap-3">
                  <UserPlusIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700">
                    Enter the 10-digit mobile number of the primary account holder who invited you. 
                    They will receive a notification to approve your connection request.
                  </p>
                </div>

                <Button 
                  onClick={handleManualAdd} 
                  fullWidth 
                  loading={loading}
                  disabled={!phoneNumber.trim() || phoneNumber.length !== 10}
                  size="lg"
                >
                  Continue
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Help Link */}
        <div className="mt-6 text-center text-xs text-gray-400">
          <p>
            Need help?{' '}
            <button 
              onClick={() => window.location.href = ROUTES.SUPPORT} 
              className="text-primary hover:underline"
            >
              Contact Support
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default JoinFamily;