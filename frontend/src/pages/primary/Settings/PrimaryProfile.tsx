// pages/primary/Settings/PrimaryProfile.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CameraIcon,
  PencilIcon,
  CalendarIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  UserIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
  XCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { useAuth } from '../../../hooks/useAuth';
import { formatDate } from '../../../utils/formatters';
import { isValidName, isValidEmail, isValidPhone } from '../../../utils/validators';
import toast from 'react-hot-toast';

interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: 'male' | 'female' | 'other' | '';
  address: Address;
  alternatePhone?: string;
  occupation?: string;
  profilePicture?: string;
  isVerified: boolean;
}

// Extended user type with profile fields
interface ExtendedUser {
  id: string;
  phone: string;
  name?: string | null;
  email?: string | null;
  role: 'PRIMARY' | 'LINKED';
  status: string;
  walletBalance?: number;
  avatar?: string | null;
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
  dob?: string;
  gender?: string;
  address?: Address;
  alternatePhone?: string;
  occupation?: string;
  isVerified?: boolean;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  pincode?: string;
}

const PrimaryProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  
  // Cast user to extended type with optional fields
  const extendedUser = user as ExtendedUser | null;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showExitWarning, setShowExitWarning] = useState(false);
  
  const [formData, setFormData] = useState<ProfileData>(() => ({
    name: extendedUser?.name || '',
    email: extendedUser?.email || '',
    phone: extendedUser?.phone || '',
    dob: extendedUser?.dob || '',
    gender: (extendedUser?.gender as any) || '',
    address: extendedUser?.address || {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    alternatePhone: extendedUser?.alternatePhone || '',
    occupation: extendedUser?.occupation || '',
    profilePicture: extendedUser?.profilePicture || '',
    isVerified: extendedUser?.isVerified || false
  }));

  const [originalData, setOriginalData] = useState<ProfileData>(formData);

  // Update form data when user changes
  useEffect(() => {
    if (extendedUser) {
      const newData = {
        name: extendedUser.name || '',
        email: extendedUser.email || '',
        phone: extendedUser.phone || '',
        dob: extendedUser.dob || '',
        gender: (extendedUser.gender as any) || '',
        address: extendedUser.address || {
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        },
        alternatePhone: extendedUser.alternatePhone || '',
        occupation: extendedUser.occupation || '',
        profilePicture: extendedUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(extendedUser.name || 'User')}&background=E31B23&color=fff&size=128`,
        isVerified: extendedUser.isVerified || false
      };
      setFormData(newData);
      setOriginalData(newData);
    }
  }, [extendedUser]);

  // Check if form has changes
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  // Warn user about unsaved changes when trying to leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges && isEditing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, isEditing]);

  // Validation functions
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) return 'Name is required';
    if (!isValidName(name)) return 'Name can only contain letters and spaces';
    if (name.length < 2) return 'Name must be at least 2 characters';
    if (name.length > 50) return 'Name must be less than 50 characters';
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email) return undefined;
    if (!isValidEmail(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const validatePhone = (phone: string, field: 'phone' | 'alternatePhone'): string | undefined => {
    if (!phone && field === 'phone') return 'Phone number is required';
    if (!phone) return undefined;
    if (!isValidPhone(phone)) return 'Please enter a valid 10-digit phone number';
    return undefined;
  };

  const validatePincode = (pincode: string): string | undefined => {
    if (!pincode) return undefined;
    if (!/^[0-9]{6}$/.test(pincode)) return 'Please enter a valid 6-digit pincode';
    return undefined;
  };

  // Validate form on data change
  useEffect(() => {
    if (!isEditing) return;
    
    const newErrors: ValidationErrors = {};
    
    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;
    
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;
    
    const phoneError = validatePhone(formData.phone, 'phone');
    if (phoneError) newErrors.phone = phoneError;
    
    if (formData.alternatePhone) {
      const alternatePhoneError = validatePhone(formData.alternatePhone, 'alternatePhone');
      if (alternatePhoneError) newErrors.alternatePhone = alternatePhoneError;
    }
    
    if (formData.address.pincode) {
      const pincodeError = validatePincode(formData.address.pincode);
      if (pincodeError) newErrors.pincode = pincodeError;
    }
    
    setErrors(newErrors);
  }, [formData, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested object (address fields)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof ProfileData] as Address),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      // In a real app, upload to server/cloud storage
      // For now, create a local URL
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, profilePicture: imageUrl }));
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Profile picture updated successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const phoneError = validatePhone(formData.phone, 'phone');
    const pincodeError = formData.address.pincode ? validatePincode(formData.address.pincode) : undefined;
    
    if (nameError || emailError || phoneError || pincodeError) {
      setErrors({ 
        name: nameError, 
        email: emailError, 
        phone: phoneError,
        pincode: pincodeError 
      });
      setTouched({ name: true, email: true, phone: true, pincode: true });
      toast.error('Please fix the errors before submitting');
      return;
    }
    
    setLoading(true);
    try {
      await updateProfile({
        name: formData.name,
        email: formData.email || undefined,
        dateOfBirth: formData.dob || undefined,
        gender: formData.gender ? String(formData.gender).toUpperCase() : undefined,
        address: formData.address.street || undefined,
        city: formData.address.city || undefined,
        state: formData.address.state || undefined,
        pincode: formData.address.pincode || undefined,
        country: formData.address.country === 'India' ? 'IN' : undefined,
        alternatePhone: formData.alternatePhone || undefined,
        occupation: formData.occupation || undefined,
      });
      setOriginalData(formData);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowExitWarning(true);
    } else {
      performCancel();
    }
  };

  const performCancel = () => {
    setFormData(originalData);
    setErrors({});
    setTouched({});
    setIsEditing(false);
  };

  const formatDateForInput = (date: string) => {
    if (!date) return '';
    return date.split('T')[0];
  };

  // Stats cards
  const statsCards = [
    {
      label: 'Member Since',
      value: extendedUser?.createdAt ? formatDate(extendedUser.createdAt, 'long') : 'N/A',
      icon: CalendarIcon
    },
    {
      label: 'KYC Status',
      value: formData.isVerified ? 'Verified' : 'Pending',
      valueClass: formData.isVerified ? 'text-green-600' : 'text-yellow-600',
      icon: formData.isVerified ? CheckCircleIcon : XCircleIcon
    }
  ];

  return (
    <div className="max-w-3xl mx-auto pb-8">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/primary/settings')}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Settings
        </button>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Information</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your personal details and preferences</p>
        </div>

        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2"
          >
            <PencilIcon className="h-4 w-4" />
            Edit Profile
          </Button>
        ) : null}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-soft rounded-full">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className={`text-sm font-semibold ${stat.valueClass || 'text-gray-900'}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Profile Picture Section */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
              {formData.profilePicture ? (
                <img
                  src={formData.profilePicture}
                  alt={formData.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `
                      <div class="w-full h-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
                        ${formData.name?.charAt(0) || 'U'}
                      </div>
                    `;
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-3xl font-bold">
                  {formData.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            
            {isEditing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingImage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <CameraIcon className="h-4 w-4" />
                  )}
                </button>
              </>
            )}
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-xl font-bold text-gray-900">{formData.name || 'User'}</h2>
              {formData.isVerified && (
                <CheckBadgeIcon className="h-5 w-5 text-primary" title="Verified Account" />
              )}
            </div>
            <p className="text-gray-500 flex items-center gap-1 justify-center sm:justify-start">
              <PhoneIcon className="h-4 w-4" />
              {formData.phone}
            </p>
            {formData.email && (
              <p className="text-sm text-gray-400 flex items-center gap-1 justify-center sm:justify-start mt-1">
                <EnvelopeIcon className="h-3 w-3" />
                {formData.email}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Profile Form */}
      <form onSubmit={handleSubmit}>
        {/* Personal Information */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            Personal Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={() => handleBlur('name')}
              error={touched.name ? errors.name : undefined}
              disabled={!isEditing || loading}
              required
              leftIcon={<UserIcon className="h-4 w-4 text-gray-400" />}
            />
            
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              error={touched.email ? errors.email : undefined}
              disabled={!isEditing || loading}
              leftIcon={<EnvelopeIcon className="h-4 w-4 text-gray-400" />}
              helpText="Used for account recovery and notifications"
            />
            
            <Input
              label="Date of Birth"
              name="dob"
              type="date"
              value={formatDateForInput(formData.dob)}
              onChange={handleChange}
              disabled={!isEditing || loading}
              leftIcon={<CalendarIcon className="h-4 w-4 text-gray-400" />}
              max={new Date().toISOString().split('T')[0]}
            />
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={!isEditing || loading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none disabled:bg-gray-100"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PhoneIcon className="h-5 w-5 text-primary" />
            Contact Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={() => handleBlur('phone')}
              error={touched.phone ? errors.phone : undefined}
              disabled // Phone number cannot be changed
              leftIcon={<PhoneIcon className="h-4 w-4 text-gray-400" />}
              helpText="Phone number cannot be changed"
            />
            
            <Input
              label="Alternate Phone (Optional)"
              name="alternatePhone"
              value={formData.alternatePhone || ''}
              onChange={handleChange}
              onBlur={() => handleBlur('alternatePhone')}
              error={touched.alternatePhone ? errors.alternatePhone : undefined}
              disabled={!isEditing || loading}
              leftIcon={<PhoneIcon className="h-4 w-4 text-gray-400" />}
              placeholder="10-digit mobile number"
            />
            
            <Input
              label="Occupation (Optional)"
              name="occupation"
              value={formData.occupation || ''}
              onChange={handleChange}
              disabled={!isEditing || loading}
              leftIcon={<IdentificationIcon className="h-4 w-4 text-gray-400" />}
              className="md:col-span-2"
            />
          </div>
        </Card>

        {/* Address Information */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPinIcon className="h-5 w-5 text-primary" />
            Address Information
          </h2>
          
          <div className="space-y-4">
            <Input
              label="Street Address"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
              disabled={!isEditing || loading}
              leftIcon={<MapPinIcon className="h-4 w-4 text-gray-400" />}
              placeholder="House number, street name"
            />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label="City"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                disabled={!isEditing || loading}
                className="col-span-2 md:col-span-1"
              />
              
              <Input
                label="State"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                disabled={!isEditing || loading}
                className="col-span-2 md:col-span-1"
              />
              
              <Input
                label="Pincode"
                name="address.pincode"
                value={formData.address.pincode}
                onChange={handleChange}
                onBlur={() => handleBlur('pincode')}
                error={touched.pincode ? errors.pincode : undefined}
                disabled={!isEditing || loading}
                className="col-span-2 md:col-span-1"
                placeholder="6-digit pincode"
              />
              
              <Input
                label="Country"
                name="address.country"
                value={formData.address.country}
                onChange={handleChange}
                disabled={!isEditing || loading}
                className="col-span-2 md:col-span-1"
              />
            </div>
          </div>
        </Card>

        {/* KYC Status */}
        <Card className={`p-6 mb-6 bg-gradient-to-r ${
          formData.isVerified 
            ? 'from-green-50 to-emerald-50 border-green-200' 
            : 'from-yellow-50 to-amber-50 border-yellow-200'
        } border`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 ${
              formData.isVerified ? 'bg-green-100' : 'bg-yellow-100'
            } rounded-full`}>
              {formData.isVerified ? (
                <CheckBadgeIcon className="h-6 w-6 text-green-600" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-yellow-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${
                formData.isVerified ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {formData.isVerified ? 'KYC Verified' : 'KYC Pending'}
              </h3>
              <p className={`text-sm ${
                formData.isVerified ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {formData.isVerified 
                  ? 'Your account is fully verified' 
                  : 'Complete your KYC to unlock all features'}
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              formData.isVerified 
                ? 'bg-green-200 text-green-800' 
                : 'bg-yellow-200 text-yellow-800'
            }`}>
              {formData.isVerified ? 'Completed' : 'Pending'}
            </span>
          </div>
        </Card>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3">
            <Button
              type="submit"
              loading={loading}
              disabled={loading || uploadingImage || Object.keys(errors).length > 0}
              size="lg"
              className="flex-1"
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        )}
      </form>

      {/* Security Note */}
      <Card className="p-4 bg-gray-50 border-gray-200 mt-4">
        <p className="text-sm text-gray-600 flex items-center gap-2">
          <ShieldCheckIcon className="h-4 w-4 text-primary" />
          Your information is secure and encrypted. We never share your personal details.
        </p>
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
              You have unsaved changes in your profile. Are you sure you want to cancel?
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
                  performCancel();
                }}
                className="flex-1"
              >
                Discard Changes
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PrimaryProfile;