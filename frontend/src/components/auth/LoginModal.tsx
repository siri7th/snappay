// src/components/auth/LoginModal.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import { validatePhone } from '../../utils/validators';
import toast from 'react-hot-toast';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupClick: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSignupClick }) => {
  const navigate = useNavigate();
  const { sendOTP, loading } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePhone(phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      await sendOTP(phone);
      toast.success('OTP sent successfully!');
      navigate(`/verify-otp?identifier=${phone}&method=phone`);
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to send OTP';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <Card className="max-w-md w-full p-6 relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-sm text-gray-500 mt-1">Login to your SnapPay account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Mobile Number"
            type="tel"
            placeholder="Enter 10-digit mobile number"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            maxLength={10}
            icon={<PhoneIcon className="h-5 w-5 text-gray-400" />}
            error={error}
            autoFocus
          />

          <Button 
            type="submit" 
            fullWidth 
            size="lg" 
            loading={loading}
            disabled={phone.length !== 10}
          >
            Send OTP
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <button
              onClick={() => {
                onClose();
                onSignupClick();
              }}
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>

        <div className="mt-4 text-center text-xs text-gray-400">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-primary hover:underline">Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
        </div>
      </Card>
    </div>
  );
};

export default LoginModal;