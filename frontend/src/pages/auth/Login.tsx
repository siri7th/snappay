// src/pages/auth/Login.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PhoneIcon, EnvelopeIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';
import { isValidPhone, isValidEmail } from '../../utils/validators';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Phone or email is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('type') || 'primary';
  const mode = (searchParams.get('mode') as 'login' | 'signup') || 'login';
  const invite = searchParams.get('invite');
  const token = searchParams.get('token');
  const code = searchParams.get('code');
  
  const navigate = useNavigate();
  const { sendOTP, loading } = useAuth();
  
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const identifier = watch('identifier');

  // Auto-detect login method based on input
  useEffect(() => {
    if (identifier) {
      if (isValidPhone(identifier)) {
        setLoginMethod('phone');
      } else if (isValidEmail(identifier)) {
        setLoginMethod('email');
      }
    }
  }, [identifier]);

  // Check for invite parameters
  useEffect(() => {
    if (invite || token || code) {
      toast.success('Please login with your phone number to complete the invite');
    }
  }, [invite, token, code]);

// src/pages/auth/Login.tsx - Update onSubmit function

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    
    // Validate based on method
    if (loginMethod === 'phone' && !isValidPhone(data.identifier)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    
    if (loginMethod === 'email' && !isValidEmail(data.identifier)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      // Pass userType to sendOTP (primary or linked)
      await sendOTP(data.identifier, userType, mode);
      
      // Build query params for OTP verification
      const params = new URLSearchParams();
      params.append('identifier', data.identifier);
      params.append('type', userType);
      params.append('mode', mode);
      params.append('method', loginMethod);
      
      if (invite) params.append('invite', invite);
      if (token) params.append('token', token);
      if (code) params.append('code', code);
      
      navigate(`${ROUTES.VERIFY_OTP}?${params.toString()}`);
      toast.success(`OTP sent to your ${loginMethod}!`);
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.message || 'Failed to send OTP';
      setError(apiMsg);

      if (apiMsg.toLowerCase().includes('account not found')) {
        toast.error(apiMsg);
        navigate(ROUTES.SIGNUP);
        return;
      }
      if (apiMsg.toLowerCase().includes('already exists')) {
        toast.error(apiMsg);
        navigate(`${ROUTES.AUTH}?type=${userType}&mode=login`);
        return;
      }
    }
  };

  const handleQuickIdentifier = (value: string) => {
    setValue('identifier', value, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {mode === 'signup'
              ? userType === 'primary'
                ? 'Create Primary Account'
                : 'Join as Family Member'
              : 'Login to SnapPay'}
          </h1>
          <p className="text-gray-600">
            {mode === 'signup'
              ? 'Enter your mobile number or email to get started'
              : 'Enter your mobile number to receive OTP'}
          </p>
          {(invite || token || code) && (
            <p className="text-xs text-primary mt-2 bg-primary-soft p-2 rounded-lg">
              ✨ You have a pending invite! Complete login to accept.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Input
              label="Mobile Number or Email"
              type={loginMethod === 'phone' ? 'tel' : 'email'}
              placeholder={loginMethod === 'phone' ? '9876543210' : 'example@email.com'}
              icon={loginMethod === 'phone' ? 
                <PhoneIcon className="h-5 w-5" /> : 
                <EnvelopeIcon className="h-5 w-5" />
              }
              error={errors.identifier?.message || error}
              {...register('identifier')}
              autoFocus
            />
            
            {/* Quick test identifiers (development only) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => handleQuickIdentifier('9876543210')}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Test Phone
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickIdentifier('test@example.com')}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Test Email
                </button>
              </div>
            )}
          </div>

          <Button type="submit" fullWidth size="lg" loading={loading}>
            Send OTP
          </Button>
        </form>

        {userType === 'linked' && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600 mb-4">
              Already have an invite from a family member?
            </p>
            
            <Link to={ROUTES.JOIN_FAMILY}>
              <Button variant="outline" fullWidth size="md">
                <QrCodeIcon className="h-5 w-5 mr-2" />
                Connect via QR / Invite Code
              </Button>
            </Link>
            
            <p className="text-xs text-center text-gray-500 mt-4">
              Use QR code, SMS invite code, or manual entry to join an existing family
            </p>
          </div>
        )}

        {userType === 'primary' && (
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">Want to join an existing family instead?</p>
            <Link to={ROUTES.JOIN_FAMILY} className="text-primary hover:underline text-sm">
              Click here to connect as family member
            </Link>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          By proceeding, you agree to our{' '}
          <a href="/terms" className="text-primary hover:underline">
            Terms
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </div>
      </Card>
    </div>
  );
};

export default Login;