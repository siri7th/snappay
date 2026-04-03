// pages/primary/Settings/PrimaryNotificationSettings.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  InformationCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { notificationsAPI } from '../../../services/api/notifications';
import toast from 'react-hot-toast';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  email: boolean;
  sms: boolean;
  push: boolean;
}

const PrimaryNotificationSettings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

  const [notificationTypes, setNotificationTypes] = useState<NotificationSetting[]>([
    {
      id: 'payment_received',
      label: 'Payment Received',
      description: 'When you receive money from someone',
      email: true,
      sms: false,
      push: true
    },
    {
      id: 'payment_sent',
      label: 'Payment Sent',
      description: 'When you send money to someone',
      email: true,
      sms: false,
      push: true
    },
    {
      id: 'limit_alert',
      label: 'Limit Alerts',
      description: 'When you are approaching or exceed your limits',
      email: true,
      sms: true,
      push: true
    },
    {
      id: 'family_invitation',
      label: 'Family Invitations',
      description: 'When someone invites you to join their family',
      email: true,
      sms: true,
      push: true
    },
    {
      id: 'connection_request',
      label: 'Connection Requests',
      description: 'When someone requests to connect to your family',
      email: true,
      sms: false,
      push: true
    },
    {
      id: 'request_approved',
      label: 'Request Approved',
      description: 'When your limit increase request is approved',
      email: true,
      sms: false,
      push: true
    },
    {
      id: 'request_denied',
      label: 'Request Denied',
      description: 'When your limit increase request is denied',
      email: true,
      sms: false,
      push: true
    },
    {
      id: 'recharge_success',
      label: 'Recharge Success',
      description: 'When your recharge is successful',
      email: false,
      sms: false,
      push: true
    },
    {
      id: 'recharge_failed',
      label: 'Recharge Failed',
      description: 'When your recharge fails',
      email: false,
      sms: false,
      push: true
    }
  ]);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const response = await notificationsAPI.getPreferences();
      const prefs = response.data?.data || response.data;
      
      if (prefs) {
        setEmailEnabled(prefs.email ?? true);
        setSmsEnabled(prefs.sms ?? false);
        setPushEnabled(prefs.push ?? true);
        
        if (prefs.types) {
          setNotificationTypes(prev => 
            prev.map(type => ({
              ...type,
              email: prefs.types[type.id] ?? type.email,
              sms: prefs.types[type.id] ?? type.sms,
              push: prefs.types[type.id] ?? type.push
            }))
          );
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (id: string, channel: 'email' | 'sms' | 'push', value: boolean) => {
    setNotificationTypes(prev =>
      prev.map(type =>
        type.id === id
          ? { ...type, [channel]: value }
          : type
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build a simple object that matches what the API expects
      const preferences: any = {
        email: emailEnabled,
        sms: smsEnabled,
        push: pushEnabled,
        types: {}
      };
      
      // Add each notification type to the types object as simple booleans
      notificationTypes.forEach(type => {
        // The API might expect a single boolean per type, not per channel
        // This assumes the type is enabled if any channel is enabled
        preferences.types[type.id] = type.email || type.sms || type.push;
      });
      
      const response = await notificationsAPI.updatePreferences(preferences);
      
      if (response.data?.success) {
        toast.success('Notification settings saved');
      } else {
        throw new Error(response.data?.message || 'Failed to save settings');
      }
    } catch (error: any) {
      console.error('Failed to save preferences:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/primary/settings')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage how you receive notifications</p>
        </div>
      </div>

      {/* Rest of the component remains the same... */}
      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            Choose how you want to receive notifications. You can enable or disable different channels for each type of notification.
          </p>
        </div>
      </Card>

      {/* Global Settings */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Global Notification Channels</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-xs text-gray-500">Receive notifications via email</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
            />
          </label>

          <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <DevicePhoneMobileIcon className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-xs text-gray-500">Receive notifications via text message</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={smsEnabled}
              onChange={(e) => setSmsEnabled(e.target.checked)}
              className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
            />
          </label>

          <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <BellIcon className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-xs text-gray-500">Receive notifications in-app</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={pushEnabled}
              onChange={(e) => setPushEnabled(e.target.checked)}
              className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
            />
          </label>
        </div>
      </Card>

      {/* Notification Types */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Notification Types</h2>
        <div className="space-y-6">
          {notificationTypes.map((type) => (
            <div key={type.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
              <div className="mb-3">
                <h3 className="font-medium text-gray-900">{type.label}</h3>
                <p className="text-xs text-gray-500">{type.description}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={type.email && emailEnabled}
                    onChange={(e) => handleTypeChange(type.id, 'email', e.target.checked)}
                    disabled={!emailEnabled}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary disabled:opacity-50"
                  />
                  <span className={`text-sm ${!emailEnabled ? 'text-gray-400' : 'text-gray-600'}`}>
                    Email
                  </span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={type.sms && smsEnabled}
                    onChange={(e) => handleTypeChange(type.id, 'sms', e.target.checked)}
                    disabled={!smsEnabled}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary disabled:opacity-50"
                  />
                  <span className={`text-sm ${!smsEnabled ? 'text-gray-400' : 'text-gray-600'}`}>
                    SMS
                  </span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={type.push && pushEnabled}
                    onChange={(e) => handleTypeChange(type.id, 'push', e.target.checked)}
                    disabled={!pushEnabled}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary disabled:opacity-50"
                  />
                  <span className={`text-sm ${!pushEnabled ? 'text-gray-400' : 'text-gray-600'}`}>
                    Push
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          loading={saving}
          className="flex-1"
        >
          Save Changes
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/primary/settings')}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>

      {/* Security Note */}
      <Card className="bg-gray-50 border-gray-200">
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600">
            Your notification preferences are securely stored and encrypted. We never share your contact information with third parties.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default PrimaryNotificationSettings;