import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { authAPI } from '../../services/api/auth';
import { ROUTES } from '../../utils/constants';

const isValidPhone = (phone: string) => /^[0-9]{10}$/.test(phone);
const isValidPin = (pin: string) => /^\d{4}$/.test(pin);
const isValidOtp = (otp: string) => /^\d{6}$/.test(otp);

const ForgotPin: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!isValidPhone(phone)) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPinSendOtp({ phone });
      toast.success('OTP sent');
      setStep('verify');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndReset = async () => {
    if (!isValidOtp(otp)) {
      toast.error('OTP must be 6 digits');
      return;
    }
    if (!isValidPin(newPin)) {
      toast.error('New PIN must be 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('PIN and Confirm PIN do not match');
      return;
    }

    setLoading(true);
    try {
      await authAPI.forgotPinVerify({ phone, otp, newPin });
      toast.success('PIN reset successful. Please login again.');
      navigate(ROUTES.AUTH, { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to reset PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Forgot PIN</h1>
        <p className="text-sm text-gray-600 mb-6">Reset your PIN using OTP on your phone number.</p>

        {step === 'phone' ? (
          <div className="space-y-4">
            <Input
              label="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              required
            />
            <Button onClick={sendOtp} disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </Button>
            <Button variant="outline" onClick={() => navigate(ROUTES.AUTH)}>
              Back to Login
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\\D/g, '').slice(0, 6))}
              placeholder="6-digit OTP"
              required
            />
            <Input
              label="New PIN"
              type="password"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\\D/g, '').slice(0, 4))}
              required
            />
            <Input
              label="Confirm PIN"
              type="password"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\\D/g, '').slice(0, 4))}
              required
            />
            <Button onClick={verifyAndReset} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset PIN'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ForgotPin;

