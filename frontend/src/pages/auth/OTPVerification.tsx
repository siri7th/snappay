// src/pages/auth/OTPVerification.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, ClockIcon, ShieldCheckIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { OTP_CONFIG, ROUTES } from '../../utils/constants';

const OTP_LENGTH = OTP_CONFIG.LENGTH || 6;
const RESEND_TIMER = 60;
const OTP_REGEX = /^\d*$/;

const OTPVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const identifier = searchParams.get('identifier') || '';
  const method = searchParams.get('method') || 'phone';
  const userType = searchParams.get('type') || 'primary';
  const mode = (searchParams.get('mode') as 'login' | 'signup') || 'login';
  const invite = searchParams.get('invite');
  const token = searchParams.get('token');
  const code = searchParams.get('code');
  
  const navigate = useNavigate();
  const { verifyOTP, sendOTP, loading: authLoading } = useAuth();
  
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timeLeft, setTimeLeft] = useState(RESEND_TIMER);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasMounted = useRef(false);
  const submitInProgress = useRef(false);
  const autoSubmitDone = useRef(false);

  // Validate identifier on mount
  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;
    
    if (!identifier) {
      toast.error('Identifier is required');
      navigate(ROUTES.AUTH, { replace: true });
    }
  }, [identifier, navigate]);

  // Timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timeLeft]);

  // Auto-submit when all digits are entered
  useEffect(() => {
    if (autoSubmitDone.current || hasVerified || isVerifying || submitInProgress.current) return;
    
    const isComplete = otp.every(digit => digit !== '');
    if (isComplete && !isVerifying && !authLoading && !submitInProgress.current) {
      autoSubmitDone.current = true;
      handleSubmit(otp.join(''));
    }
  }, [otp, isVerifying, authLoading, hasVerified]);

  const resetOTP = useCallback(() => {
    setOtp(Array(OTP_LENGTH).fill(''));
    autoSubmitDone.current = false;
    submitInProgress.current = false;
    setHasVerified(false);
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = useCallback((index: number, value: string) => {
    if (!OTP_REGEX.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);
    
    autoSubmitDone.current = false;
    
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    if (e.key === 'Enter' && otp.every(d => d !== '') && !submitInProgress.current && !hasVerified) {
      e.preventDefault();
      handleSubmit(otp.join(''));
    }
  }, [otp]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\s/g, '').slice(0, OTP_LENGTH);
    
    if (!OTP_REGEX.test(pastedData)) {
      toast.error('Please paste a valid numeric code');
      return;
    }
    
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    
    autoSubmitDone.current = false;
    
    const nextIndex = Math.min(pastedData.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  }, [otp]);

  const handleSubmit = useCallback(async (otpValue: string) => {
    if (submitInProgress.current || hasVerified) return;
    
    if (!identifier) {
      toast.error('Identifier is missing');
      navigate(ROUTES.AUTH, { replace: true });
      return;
    }

    if (otpValue.length !== OTP_LENGTH) {
      toast.error(`Please enter ${OTP_LENGTH}-digit OTP`);
      return;
    }

    submitInProgress.current = true;
    setIsVerifying(true);
    
    try {
      const result = await verifyOTP(identifier, otpValue, userType as any, mode);
      
      if (result?.user) {
        setHasVerified(true);
        toast.success('Login successful!');

        const role = result.user.role;
        const hasName = Boolean(result.user.name && result.user.name.trim().length > 0);
        const hasBank = Boolean((result.user as any).hasBank);
        const hasPin = Boolean((result.user as any).hasPin);

        // Treat "incomplete profile/bank" as onboarding too (common in demo/testing where user may already exist).
        if (!hasName) {
          sessionStorage.setItem('onboarding', 'true');
          navigate(ROUTES.PROFILE_SETUP, { replace: true });
          return;
        }

        if (role === 'PRIMARY' && !hasBank) {
          sessionStorage.setItem('onboarding', 'true');
          navigate(ROUTES.ADD_BANK, { replace: true });
          return;
        }

        if (!hasPin) {
          sessionStorage.setItem('onboarding', 'true');
          navigate(ROUTES.SET_PIN, { replace: true });
          return;
        }

        const redirectPath = role === 'PRIMARY' ? ROUTES.PRIMARY_DASHBOARD : ROUTES.LINKED_DASHBOARD;
        navigate(redirectPath, { replace: true });
      } else {
        throw new Error(result?.message || 'Verification failed');
      }
    } catch (error: any) {
      submitInProgress.current = false;
      autoSubmitDone.current = false;
      
      if (error.response?.status === 400) {
        toast.error('Invalid OTP. Please try again.');
      } else if (error.response?.status === 429) {
        toast.error('Too many attempts. Please try again later.');
      } else if (error.response?.status === 410) {
        toast.error('OTP expired. Please request a new one.');
        setTimeLeft(0);
        setCanResend(true);
      } else {
        toast.error(error?.response?.data?.message || error?.message || 'Verification failed');
      }
      
      resetOTP();
    } finally {
      setIsVerifying(false);
    }
  }, [identifier, userType, verifyOTP, navigate, resetOTP, hasVerified]);

  const handleResend = useCallback(async () => {
    if (isResending || !canResend || submitInProgress.current || hasVerified) return;
    
    setIsResending(true);
    
    try {
      await sendOTP(identifier);
      setTimeLeft(RESEND_TIMER);
      setCanResend(false);
      resetOTP();
      toast.success('OTP resent successfully!');
    } catch (error: any) {
      if (error.response?.status === 429) {
        toast.error('Too many requests. Please try again later.');
      } else {
        toast.error(error.message || 'Failed to resend OTP');
      }
    } finally {
      setIsResending(false);
    }
  }, [identifier, sendOTP, canResend, isResending, resetOTP, hasVerified]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const isOTPComplete = useMemo(() => otp.every(d => d !== ''), [otp]);
  const isLoading = authLoading || isVerifying || isResending;

  // Build back link params
  const backLinkParams = new URLSearchParams();
  backLinkParams.append('type', userType);
  if (invite) backLinkParams.append('invite', invite);
  if (token) backLinkParams.append('token', token);
  if (code) backLinkParams.append('code', code);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate(`${ROUTES.AUTH}?${backLinkParams.toString()}`)}
          disabled={isLoading}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </button>
        
        {/* Main Card */}
        <Card className="px-6 py-8 sm:px-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary-soft rounded-full">
                <ShieldCheckIcon className="h-8 w-8 text-primary" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900">Verify Your Identity</h2>
            <p className="text-sm text-gray-600 mt-2">
              Enter the 6-digit code sent to your
            </p>
            <p className="text-lg font-semibold text-primary mt-1 flex items-center justify-center gap-2">
              {method === 'phone' ? (
                <PhoneIcon className="h-5 w-5" />
              ) : (
                <EnvelopeIcon className="h-5 w-5" />
              )}
              {identifier}
            </p>
            
            {/* Change Identifier Link */}
            <Link
              to={`${ROUTES.AUTH}?${backLinkParams.toString()}`}
              className="text-sm text-primary hover:text-primary-dark mt-1 inline-block transition-colors"
            >
              Change {method === 'phone' ? 'Number' : 'Email'}
            </Link>
            
            {/* Invite Badge */}
            {(invite || token || code) && (
              <div className="mt-3 flex justify-center">
                <span className="inline-flex items-center gap-1.5 bg-primary-soft text-primary text-xs px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  You have a pending invite
                </span>
              </div>
            )}
          </div>

          {/* OTP Input Boxes */}
          <div className="flex justify-center gap-2 sm:gap-3 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={isLoading || hasVerified}
                className={`w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 rounded-xl outline-none transition-all bg-white shadow-sm
                  ${digit ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300'}
                  ${isLoading || hasVerified ? 'bg-gray-50 cursor-not-allowed opacity-50' : 'focus:border-primary focus:ring-2 focus:ring-primary/20'}
                  disabled:opacity-50`}
                aria-label={`OTP digit ${index + 1}`}
              />
            ))}
          </div>

          {/* Timer and Resend */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{formatTime(timeLeft)}</span>
            </div>
            
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || !canResend || hasVerified}
                className="text-sm text-primary hover:text-primary-dark font-medium disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                {isResending ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary border-t-transparent"></div>
                    Sending...
                  </>
                ) : (
                  'Resend OTP'
                )}
              </button>
            ) : (
              <span className="text-sm text-gray-400">
                Resend in {formatTime(timeLeft)}
              </span>
            )}
          </div>

          {/* Verify Button */}
          <Button
            onClick={() => handleSubmit(otp.join(''))}
            fullWidth
            size="lg"
            loading={isLoading}
            disabled={!isOTPComplete || isLoading || hasVerified}
          >
            {hasVerified ? 'Verified!' : isVerifying ? 'Verifying...' : isResending ? 'Please wait...' : 'Verify & Continue'}
          </Button>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Didn't receive the code? Check your {method === 'phone' ? 'SMS' : 'email'} or{' '}
              <button
                onClick={handleResend}
                disabled={!canResend || isResending || hasVerified}
                className="text-primary hover:text-primary-dark font-medium disabled:opacity-50 transition-colors"
              >
                try resending
              </button>
            </p>
          </div>
        </Card>

        {/* Security Note */}
        <p className="mt-4 text-xs text-center text-gray-400 flex items-center justify-center gap-1">
          <ShieldCheckIcon className="h-3 w-3" />
          Your code is secure and encrypted
        </p>
      </div>

      {/* Debug Info - Only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
          <details className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <summary className="cursor-pointer font-mono">Debug Info</summary>
            <div className="mt-2 space-y-1 font-mono">
              <p>Identifier: {identifier}</p>
              <p>Method: {method}</p>
              <p>User Type: {userType}</p>
              <p>Has Invite: {invite ? 'Yes' : 'No'}</p>
              <p>Has Token: {token ? 'Yes' : 'No'}</p>
              <p>Has Code: {code ? 'Yes' : 'No'}</p>
              <p>OTP: {otp.join('') || '(empty)'}</p>
              <p>Time Left: {timeLeft}s</p>
              <p>Can Resend: {canResend ? 'Yes' : 'No'}</p>
              <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
              <p>Has Verified: {hasVerified ? 'Yes' : 'No'}</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default OTPVerification;