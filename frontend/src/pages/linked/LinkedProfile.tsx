// pages/linked/LinkedProfile.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon,
  PencilIcon,
  QrCodeIcon,
  DocumentDuplicateIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ProgressBar from '../../components/common/ProgressBar';
import { useAuth } from '../../hooks/useAuth';
import { useFamily } from '../../hooks/useFamily';
import { formatDate, formatCurrency } from '../../utils/formatters'; // Fixed imports
import { copyToClipboard } from '../../utils/helpers';
import toast from 'react-hot-toast';

const LinkedProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { primaryDetails, limits, getPrimaryDetails, loading } = useFamily();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setRefreshing(true);
    try {
      await getPrimaryDetails();
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      navigate('/');
    }
  };

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const dailyPercent = ((limits?.dailySpent || 0) / (limits?.dailyLimit || 1)) * 100;
  const monthlyPercent = ((limits?.monthlySpent || 0) / (limits?.monthlyLimit || 1)) * 100;

  const memberSince = user?.createdAt ? formatDate(user.createdAt, 'long') : 'N/A';

  if (loading || refreshing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={refreshing}>
            <span className={refreshing ? 'animate-spin' : ''}>↻</span> Refresh
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-5 rounded-full -mr-10 -mt-10"></div>
        
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-3xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || user?.phone?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user?.name || 'User'}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <PhoneIcon className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-600">{user?.phone}</p>
                  <button 
                    onClick={() => handleCopy(user?.phone || '', 'Phone number')}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Copy phone number"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
                {user?.email && (
                  <div className="flex items-center gap-2 mt-1">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-600">{user.email}</p>
                    <button 
                      onClick={() => handleCopy(user.email || '', 'Email')}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Copy email"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                )}
              </div>
              
              <span className="px-3 py-1 bg-primary-soft text-primary rounded-full text-sm font-medium self-start flex items-center gap-1">
                <UserIcon className="h-3 w-3" />
                Linked Account
              </span>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Member Since</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3 text-gray-400" />
                  {memberSince}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Account Status</p>
                <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                  <CheckCircleIcon className="h-3 w-3" />
                  Active
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Connected Primary Account Card */}
      {primaryDetails ? (
        <Card>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-primary" />
            Connected Primary Account
          </h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-soft rounded-full flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Account Holder</p>
                <p className="font-semibold">{primaryDetails.primary.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{primaryDetails.primary.phone}</p>
              </div>
              <button 
                onClick={() => handleCopy(primaryDetails.primary.phone, 'Primary phone')}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Copy phone number"
              >
                <DocumentDuplicateIcon className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {primaryDetails.primary.email && (
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{primaryDetails.primary.email}</p>
                </div>
                <button 
                  onClick={() => handleCopy(primaryDetails.primary.email || '', 'Primary email')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Copy email"
                >
                  <DocumentDuplicateIcon className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Connected Since</p>
                <p className="font-medium">{formatDate(primaryDetails.joinedAt, 'long')}</p>
              </div>
            </div>

            {limits?.relationship && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Relationship: <span className="font-medium">{limits.relationship}</span>
                </p>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <UserPlusIcon className="h-4 w-4 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-yellow-700 font-medium">Not connected to any primary account</p>
              <p className="text-sm text-yellow-600 mt-1">
                Connect to a primary account to access family features and view limits.
              </p>
              <Button 
                size="sm" 
                className="mt-3"
                onClick={() => navigate('/linked/connect')}
              >
                Connect Now
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Limits Summary - Only show if connected */}
      {limits && (
        <Card>
          <h3 className="font-semibold mb-4">My Spending Limits</h3>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Daily Limit</span>
              <span className="font-medium">
                {formatCurrency(limits.dailySpent)} / {formatCurrency(limits.dailyLimit)}
              </span>
            </div>
            <ProgressBar 
              value={dailyPercent} 
              color={dailyPercent > 80 ? 'warning' : 'primary'} 
              size="md"
              animated
            />
            <p className="text-xs text-gray-500 mt-1">Resets at midnight</p>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Monthly Limit</span>
              <span className="font-medium">
                {formatCurrency(limits.monthlySpent)} / {formatCurrency(limits.monthlyLimit)}
              </span>
            </div>
            <ProgressBar 
              value={monthlyPercent} 
              color={monthlyPercent > 80 ? 'warning' : 'primary'} 
              size="md"
              animated
            />
            <p className="text-xs text-gray-500 mt-1">Resets on 1st of month</p>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              Per Transaction Limit:{' '}
              <span className="font-semibold">{formatCurrency(limits.perTransactionLimit)}</span>
            </p>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={() => navigate('/linked/request-increase')}
            className="w-full p-3 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors"
          >
            <CreditCardIcon className="h-5 w-5 text-primary" />
            <span>Request Limit Increase</span>
          </button>
          <button
            onClick={() => navigate('/linked/transactions')}
            className="w-full p-3 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors"
          >
            <CalendarIcon className="h-5 w-5 text-primary" />
            <span>View Transaction History</span>
          </button>
          <button
            onClick={() => navigate('/linked/receive')}
            className="w-full p-3 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors"
          >
            <QrCodeIcon className="h-5 w-5 text-primary" />
            <span>My QR Code</span>
          </button>
        </div>
      </Card>

      {/* Account Information */}
      <Card className="bg-gray-50">
        <h3 className="font-semibold mb-3">Account Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">User ID</span>
            <span className="font-mono">{user?.id?.substring(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Account Type</span>
            <span className="font-medium">Linked Account</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Device ID</span>
            <span className="font-mono">••••••••</span>
          </div>
        </div>
      </Card>

      {/* Danger Zone - Show disconnect option only if connected */}
      {primaryDetails && (
        <Card className="border-error/20">
          <div className="flex items-center gap-2 mb-4">
            <ExclamationTriangleIcon className="h-5 w-5 text-error" />
            <h3 className="font-semibold text-lg text-error">Danger Zone</h3>
          </div>

          <div className="bg-error-soft p-4 rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-medium text-error mb-1">Disconnect from Primary Account</h4>
                <p className="text-sm text-gray-600">
                  This will remove your connection to the primary account.
                  Your wallet balance will be transferred to the primary account.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/linked/disconnect')}
                className="flex-shrink-0 text-error border-error hover:bg-error-soft"
              >
                Disconnect
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Logout Button */}
      <Button
        variant="outline"
        fullWidth
        size="lg"
        onClick={handleLogout}
        className="border-error text-error hover:bg-error-soft"
      >
        <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
        Logout
      </Button>
    </div>
  );
};

export default LinkedProfile;