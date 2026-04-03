// src/components/Linked/DisconnectFromPrimaryModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon,
  PhoneIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { familyAPI } from '../../services/api/family';

interface DisconnectFromPrimaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryName: string;
  currentBalance: number;
  onConfirm: (password: string, otp: string, transferBalance: boolean) => Promise<void>;
}

const DisconnectFromPrimaryModal: React.FC<DisconnectFromPrimaryModalProps> = ({
  isOpen,
  onClose,
  primaryName,
  currentBalance,
  onConfirm
}) => {
  const [step, setStep] = useState<'password' | 'otp'>('password');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [transferBalance, setTransferBalance] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStep('password');
      setPassword('');
      setOtp('');
      setTransferBalance(true);
      setError('');
      setOtpSent(false);
      setCountdown(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleRequestOtp = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setSendingOtp(true);
    setError('');

    try {
      await familyAPI.requestDisconnectOTP();
      setOtpSent(true);
      setStep('otp');
      setCountdown(60);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to send OTP';
      setError(errorMsg);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 'password') {
      await handleRequestOtp();
    } else {
      setError('');
      setLoading(true);
      
      try {
        await onConfirm(password, otp, transferBalance);
        onClose();
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to disconnect';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Disconnect from Primary"
      size="md"
      showCloseButton={true}
    >
      <div className="space-y-4">
        {/* Warning Banner */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-700 font-medium">Important</p>
              <p className="text-xs text-yellow-600 mt-1">
                Disconnecting from {primaryName} will remove your access to family features.
                {currentBalance > 0 && ' Your wallet balance will be transferred to the primary account.'}
              </p>
            </div>
          </div>
        </div>

        {/* Balance Transfer Option */}
        {currentBalance > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Your Wallet Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{currentBalance.toLocaleString()}
            </p>
            <label className="flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                checked={transferBalance}
                onChange={(e) => setTransferBalance(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
              />
              <span className="text-sm text-gray-600">
                Transfer balance to primary account (₹{currentBalance.toLocaleString()})
              </span>
            </label>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'password' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your password
                </label>
                <Input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <p className="text-xs text-gray-500">
                After password verification, we'll send a one-time password (OTP) to your registered mobile number.
              </p>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP sent to your phone
                </label>
                <Input
                  type="text"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  autoFocus
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <PhoneIcon className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {countdown > 0 ? `Resend in ${countdown}s` : 'OTP expired'}
                    </span>
                  </div>
                  {countdown === 0 && (
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      className="text-xs text-primary hover:underline"
                      disabled={sendingOtp}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              fullWidth
              loading={step === 'password' ? sendingOtp : loading}
            >
              {step === 'password' ? 'Send OTP' : 'Disconnect'}
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={onClose}
              disabled={loading || sendingOtp}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default DisconnectFromPrimaryModal;