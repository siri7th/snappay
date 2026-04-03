// pages/linked/ConnectToPrimary.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  QrCodeIcon, 
  EnvelopeIcon, 
  UserPlusIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { familyAPI } from '../../services/api/family';
import { isValidPhone } from '../../utils/validators';

const ConnectToPrimary: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<'qr' | 'code' | 'manual' | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadyConnected, setAlreadyConnected] = useState(false);
  const [error, setError] = useState('');

  const handleMethodSelect = (method: 'qr' | 'code' | 'manual') => {
    setSelectedMethod(method);
    setError('');
  };

  const handleQRScan = () => {
    navigate('/scan', { 
      state: { 
        purpose: 'connect-primary',
        returnTo: '/linked/connect' 
      } 
    });
  };

  const handleConnectViaCode = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter the invite code');
      return;
    }

    if (inviteCode.trim().length < 6) {
      setError('Invite code must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await familyAPI.connectToPrimary({ 
        method: 'code', 
        code: inviteCode.trim().toUpperCase() 
      });
      
      if (response.data.success) {
        // Check if already linked (from response message)
        if (response.data.message === 'You are already linked to a primary account') {
          setAlreadyConnected(true);
          toast.success('You are already connected!');
          setTimeout(() => {
            navigate('/linked/dashboard', { 
              replace: true,
              state: { refresh: Date.now() }
            });
          }, 1500);
          return;
        }

        // Check if it's a manual request that needs approval
        if (response.data.data?.status === 'PENDING') {
          toast.success('Connection request sent! Waiting for approval.');
          navigate('/linked/connection-status', { 
            state: { 
              invitationId: response.data.data.invitationId,
              status: 'PENDING'
            }
          });
        } else {
          // Direct connection successful
          setSuccess(true);
          
          // Store connection status
          localStorage.setItem('linked_primary_connected', 'true');
          if (response.data.data?.primaryAccount) {
            localStorage.setItem('primary_details', JSON.stringify(response.data.data.primaryAccount));
          }
          
          setTimeout(() => {
            navigate('/linked/dashboard', { 
              replace: true,
              state: { refresh: Date.now() }
            });
          }, 1500);
        }
      }
    } catch (error: any) {
      // Handle already linked error from error response
      if (error.response?.data?.message === 'You are already linked to a primary account') {
        setAlreadyConnected(true);
        toast.success('You are already connected!');
        setTimeout(() => {
          navigate('/linked/dashboard', { 
            replace: true,
            state: { refresh: Date.now() }
          });
        }, 1500);
      } else {
        const errorMsg = error.response?.data?.message || 'Failed to connect';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnectViaManual = async () => {
    if (!primaryPhone.trim()) {
      setError('Please enter the primary account phone number');
      return;
    }

    if (!isValidPhone(primaryPhone.trim())) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (primaryPhone.trim() === user?.phone) {
      setError('You cannot connect to your own account');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await familyAPI.connectToPrimary({ 
        method: 'manual', 
        phone: primaryPhone.trim() 
      });
      
      if (response.data.success) {
        // Check if already connected or request pending
        if (response.data.message === 'You are already linked to a primary account') {
          toast.success('You are already connected!');
          navigate('/linked/dashboard');
        } else if (response.data.data?.status === 'PENDING') {
          toast.success('Connection request already pending!');
          navigate('/linked/connection-status', { 
            state: { 
              invitationId: response.data.data.invitationId,
              status: 'PENDING'
            }
          });
        } else {
          // For manual connection, it usually requires approval
          toast.success('Connection request sent! Waiting for approval.');
          navigate('/linked/connection-status', { 
            state: { 
              invitationId: response.data.data?.invitationId,
              status: 'PENDING'
            }
          });
        }
      }
    } catch (error: any) {
      // Handle already linked error
      if (error.response?.data?.message === 'You are already linked to a primary account') {
        toast.success('You are already connected!');
        navigate('/linked/dashboard');
      } else if (error.response?.data?.message?.includes('already')) {
        toast.success('Request already pending!');
        navigate('/linked/connection-status', { 
          state: { status: 'PENDING' }
        });
      } else {
        const errorMsg = error.response?.data?.message || 'Failed to send request';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (selectedMethod) {
      setSelectedMethod(null);
      setInviteCode('');
      setPrimaryPhone('');
      setError('');
    } else {
      navigate('/linked/dashboard');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connected Successfully!</h2>
          <p className="text-gray-600 mb-6">
            {selectedMethod === 'manual' 
              ? 'Your request has been sent. You will be connected once the primary account approves.'
              : 'You are now linked to a primary account. Redirecting to dashboard...'}
          </p>
          <div className="animate-pulse text-primary">Redirecting...</div>
        </Card>
      </div>
    );
  }

  if (alreadyConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheckIcon className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Already Connected</h2>
          <p className="text-gray-600 mb-6">
            You are already connected to a primary account. Redirecting to dashboard...
          </p>
          <div className="animate-pulse text-primary">Redirecting...</div>
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
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            {selectedMethod ? 'Back to methods' : 'Back to Dashboard'}
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Connect to a Primary Account</h1>
          <p className="text-gray-600 mt-1">
            Link your account to a family primary account to start managing money together.
          </p>
        </div>

        {!selectedMethod ? (
          // Method Selection
          <div className="space-y-4">
            <Card>
              <div className="space-y-4">
                <button
                  onClick={() => handleMethodSelect('qr')}
                  className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                      <QrCodeIcon className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">Scan QR Code</h3>
                      <p className="text-sm text-gray-500">Ask primary account holder to show their QR code</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleMethodSelect('code')}
                  className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                      <EnvelopeIcon className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">Enter Invite Code</h3>
                      <p className="text-sm text-gray-500">Use the 6-8 digit code shared by primary account</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleMethodSelect('manual')}
                  className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                      <UserPlusIcon className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">Enter Primary's Phone Number</h3>
                      <p className="text-sm text-gray-500">Send a connection request to a primary account</p>
                    </div>
                  </div>
                </button>
              </div>
            </Card>
          </div>
        ) : (
          // Method-specific forms
          <Card className="p-6">
            {selectedMethod === 'qr' && (
              <div className="text-center py-4">
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

            {selectedMethod === 'code' && (
              <div className="space-y-6 py-2">
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
                    error={error}
                    autoFocus
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    The primary account holder can generate an invite code from their 
                    Family Management section. Codes are valid for 24 hours.
                  </p>
                </div>

                <Button 
                  onClick={handleConnectViaCode} 
                  fullWidth 
                  loading={loading}
                  disabled={!inviteCode.trim() || inviteCode.trim().length < 6}
                  size="lg"
                >
                  Connect to Primary
                </Button>
              </div>
            )}

            {selectedMethod === 'manual' && (
              <div className="space-y-6 py-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Account Phone Number
                  </label>
                  <Input
                    placeholder="9876543210"
                    value={primaryPhone}
                    onChange={(e) => setPrimaryPhone(e.target.value.replace(/\D/g, ''))}
                    type="tel"
                    maxLength={10}
                    error={error}
                    autoFocus
                  />
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg flex items-start gap-3">
                  <InformationCircleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700">
                    Enter the 10-digit mobile number of the primary account holder. 
                    They will receive a notification to approve your connection request.
                  </p>
                </div>

                <Button 
                  onClick={handleConnectViaManual} 
                  fullWidth 
                  loading={loading}
                  disabled={!primaryPhone.trim() || primaryPhone.length !== 10}
                  size="lg"
                >
                  Send Connection Request
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Info Card */}
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Why connect to a primary account?</h3>
              <ul className="text-sm text-blue-700 space-y-2 list-disc pl-5">
                <li>Receive money from family members securely</li>
                <li>Get spending limits set by primary account</li>
                <li>Request limit increases when needed</li>
                <li>Track all your spending with family oversight</li>
                <li>Make payments using the family wallet balance</li>
                <li>View your transaction history in real-time</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Security Note */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>🔒 Your connection is secure and encrypted. Only share invite codes with trusted family members.</p>
        </div>
      </div>
    </div>
  );
};

export default ConnectToPrimary;