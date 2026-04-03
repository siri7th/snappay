// src/pages/auth/ProfileSetup.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserIcon, EnvelopeIcon, ExclamationTriangleIcon, CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';
import { isValidName, isValidEmail } from '../../utils/validators';

const profileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  pincode: z.string().optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfileSetup: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: { name: '', email: '', dateOfBirth: '', address: '', city: '', state: '', pincode: '' },
  });

  const formValues = watch();

  // Pre-fill form if user already has data
  useEffect(() => {
    if (user?.name) {
      setValue('name', user.name);
    }
    if (user?.email) {
      setValue('email', user.email);
    }
  }, [user, setValue]);

  // Warn user about unsaved changes when trying to leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      await updateProfile(data);
      toast.success('Profile updated successfully!');

      const fromOnboarding = sessionStorage.getItem('onboarding') === 'true';

      setTimeout(() => {
        if (fromOnboarding) {
          if (user?.role === 'PRIMARY') {
            navigate(ROUTES.ADD_BANK, { replace: true });
            return;
          }
          navigate(ROUTES.SET_PIN, { replace: true });
          return;
        }

        if (user?.role === 'PRIMARY') navigate(ROUTES.PRIMARY_DASHBOARD, { replace: true });
        else if (user?.role === 'LINKED') navigate(ROUTES.LINKED_DASHBOARD, { replace: true });
        else navigate(ROUTES.DASHBOARD, { replace: true });
      }, 100);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (isDirty) {
      setShowExitWarning(true);
    } else {
      performSkip();
    }
  };

  const performSkip = () => {
    toast.success('You can update your profile later from settings');

    const fromOnboarding = sessionStorage.getItem('onboarding') === 'true';
    
    setTimeout(() => {
      if (fromOnboarding) {
        if (user?.role === 'PRIMARY') {
          navigate(ROUTES.ADD_BANK, { replace: true });
          return;
        }
        navigate(ROUTES.SET_PIN, { replace: true });
        return;
      }

      if (user?.role === 'PRIMARY') navigate(ROUTES.PRIMARY_DASHBOARD, { replace: true });
      else if (user?.role === 'LINKED') navigate(ROUTES.LINKED_DASHBOARD, { replace: true });
      else navigate(ROUTES.DASHBOARD, { replace: true });
    }, 100);
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-soft rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">
            {user?.role === 'PRIMARY' 
              ? 'Set up your profile to start managing your family' 
              : 'Tell us a bit about yourself to get started'}
          </p>
          {user?.role && (
            <p className="text-xs text-gray-400 mt-2">
              Account type: {user.role === 'PRIMARY' ? '👑 Primary Account' : '👤 Linked Account'}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            icon={<UserIcon className="h-5 w-5 text-gray-400" />}
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Email (Optional)"
            type="email"
            placeholder="Enter your email"
            icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Date of Birth (Optional)"
            type="date"
            icon={<CalendarIcon className="h-5 w-5 text-gray-400" />}
            error={errors.dateOfBirth?.message}
            {...register('dateOfBirth')}
          />

          <Input
            label="Address (Optional)"
            placeholder="House no, street, area"
            icon={<MapPinIcon className="h-5 w-5 text-gray-400" />}
            error={errors.address?.message}
            {...register('address')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City (Optional)"
              placeholder="City"
              error={errors.city?.message}
              {...register('city')}
            />
            <Input
              label="State (Optional)"
              placeholder="State"
              error={errors.state?.message}
              {...register('state')}
            />
          </div>

          <Input
            label="Pincode (Optional)"
            placeholder="6-digit pincode"
            error={errors.pincode?.message}
            {...register('pincode')}
          />

          {/* Live preview */}
          {formValues.name && (
            <div className="p-3 bg-primary-soft rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Preview:</p>
              <p className="font-medium text-gray-900">{formValues.name}</p>
              {formValues.email && (
                <p className="text-sm text-gray-600">{formValues.email}</p>
              )}
            </div>
          )}

          <Button 
            type="submit" 
            fullWidth 
            size="lg" 
            loading={isSubmitting}
            disabled={!isValid || isSubmitting}
          >
            Save & Continue
          </Button>

          <button
            type="button"
            onClick={handleSkip}
            className="w-full text-center text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors"
            disabled={isSubmitting}
          >
            Skip for now
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          <p>You can always update your profile later in Settings</p>
        </div>
      </Card>

      {/* Exit Warning Modal */}
      {showExitWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Unsaved Changes</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              You have unsaved changes in your profile. Are you sure you want to skip?
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowExitWarning(false)}
                className="flex-1"
              >
                Continue Editing
              </Button>
              <Button
                onClick={() => {
                  setShowExitWarning(false);
                  performSkip();
                }}
                className="flex-1"
              >
                Skip Anyway
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProfileSetup;