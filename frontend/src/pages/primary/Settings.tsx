// src/pages/primary/Settings.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserIcon,
  LockClosedIcon,
  LanguageIcon,
  SunIcon,
  MoonIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  DevicePhoneMobileIcon,
  CreditCardIcon,
  FingerPrintIcon,
  QuestionMarkCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  BellIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { ROUTES, APP_CONFIG } from '../../utils/constants';
import toast from 'react-hot-toast';

// Types
interface SettingsItemProps {
  icon: React.ElementType;
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  badge?: number;
}

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

// Settings Item Component
const SettingsItem: React.FC<SettingsItemProps> = ({ 
  icon: Icon, 
  label, 
  value, 
  onClick, 
  danger = false,
  disabled = false,
  badge
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
      danger ? 'text-red-600' : 'text-gray-700'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <div className="flex items-center gap-3">
      <Icon className={`h-5 w-5 ${danger ? 'text-red-500' : 'text-gray-500'}`} />
      <span className="font-medium">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {value && <span className="text-sm text-gray-500">{value}</span>}
      {badge && badge > 0 && (
        <span className="min-w-[1.25rem] h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center px-1">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
    </div>
  </button>
);

// Settings Section Component
const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <div className="mb-6">
    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">
      {title}
    </h2>
    <Card className="divide-y divide-gray-100 overflow-hidden">
      {children}
    </Card>
  </div>
);

// Main Settings Component
const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('English');

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logout();
        toast.success('Logged out successfully');
        navigate(ROUTES.HOME);
      } catch (error) {
        toast.error('Failed to logout');
      }
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    toast.success(`${!darkMode ? 'Dark' : 'Light'} mode ${!darkMode ? 'enabled' : 'disabled'}`);
    
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const changeLanguage = () => {
    const languages = ['English', 'हिन्दी', 'தமிழ்', 'తెలుగు', 'മലയാളം'];
    const currentIndex = languages.indexOf(language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex]);
    toast.success(`Language changed to ${languages[nextIndex]}`);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleExternalLink = (url: string, type: 'link' | 'tel' | 'mailto' = 'link') => {
    if (type === 'tel') {
      window.location.href = `tel:${url}`;
    } else if (type === 'mailto') {
      window.location.href = `mailto:${url}`;
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account preferences</p>
      </div>

      {/* Profile Summary Card */}
      <Card className="mb-6 p-4 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">{user?.name || 'User'}</h2>
            <p className="text-sm text-gray-500">{user?.phone || 'No phone'}</p>
            <p className="text-xs text-primary mt-1 font-medium capitalize flex items-center gap-1">
              <ShieldCheckIcon className="h-3 w-3" />
              {user?.role || 'PRIMARY'} Account
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigation(ROUTES.PRIMARY_SETTINGS_PROFILE)}
          >
            Edit
          </Button>
        </div>
      </Card>

      {/* Account Settings Section */}
      <SettingsSection title="Account">
        <SettingsItem
          icon={UserIcon}
          label="Profile Information"
          onClick={() => handleNavigation(ROUTES.PRIMARY_SETTINGS_PROFILE)}
        />
        <SettingsItem
          icon={LockClosedIcon}
          label="Security"
          value="PIN, 2FA"
          onClick={() => handleNavigation(ROUTES.PRIMARY_SETTINGS_SECURITY)}
        />
        <SettingsItem
          icon={BellIcon}
          label="Notifications"
          badge={unreadCount}
          onClick={() => handleNavigation(ROUTES.NOTIFICATIONS)}
        />
        <SettingsItem
          icon={DevicePhoneMobileIcon}
          label="Linked Devices"
          value="2 devices"
          onClick={() => toast.success('Linked devices feature coming soon')}
        />
        <SettingsItem
          icon={CreditCardIcon}
          label="Payment Methods"
          onClick={() => handleNavigation(ROUTES.PRIMARY_BANKS)}
        />
        <SettingsItem
          icon={FingerPrintIcon}
          label="Biometric Login"
          onClick={() => toast.success('Biometric settings coming soon')}
        />
      </SettingsSection>

      {/* Preferences Section */}
      <SettingsSection title="Preferences">
        <SettingsItem
          icon={LanguageIcon}
          label="Language"
          value={language}
          onClick={changeLanguage}
        />
        <SettingsItem
          icon={darkMode ? SunIcon : MoonIcon}
          label="Dark Mode"
          value={darkMode ? 'On' : 'Off'}
          onClick={toggleDarkMode}
        />
        <SettingsItem
          icon={PaintBrushIcon}
          label="Theme"
          value="Default"
          onClick={() => toast.success('Theme settings coming soon')}
        />
        <SettingsItem
          icon={GlobeAltIcon}
          label="Region"
          value="India"
          onClick={() => toast.success('Region settings coming soon')}
        />
      </SettingsSection>

      {/* Support Section */}
      <SettingsSection title="Support">
        <SettingsItem
          icon={InformationCircleIcon}
          label="About"
          value={`Version ${APP_CONFIG.VERSION}`}
          onClick={() => handleNavigation(ROUTES.ABOUT || '/about')}
        />
        <SettingsItem
          icon={DocumentTextIcon}
          label="Terms of Service"
          onClick={() => handleExternalLink(ROUTES.TERMS)}
        />
        <SettingsItem
          icon={ShieldCheckIcon}
          label="Privacy Policy"
          onClick={() => handleExternalLink(ROUTES.PRIVACY)}
        />
        <SettingsItem
          icon={QuestionMarkCircleIcon}
          label="Help & Support"
          onClick={() => handleNavigation(ROUTES.PRIMARY_SUPPORT)}
        />
        <SettingsItem
          icon={PhoneIcon}
          label="Contact Us"
          value={APP_CONFIG.SUPPORT_PHONE}
          onClick={() => handleExternalLink(APP_CONFIG.SUPPORT_PHONE.replace(/\D/g, ''), 'tel')}
        />
        <SettingsItem
          icon={EnvelopeIcon}
          label="Email Support"
          value={APP_CONFIG.SUPPORT_EMAIL}
          onClick={() => handleExternalLink(APP_CONFIG.SUPPORT_EMAIL, 'mailto')}
        />
      </SettingsSection>

      {/* Danger Zone */}
      <SettingsSection title="Danger Zone">
        <SettingsItem
          icon={ArrowRightOnRectangleIcon}
          label="Logout"
          danger
          onClick={handleLogout}
        />
      </SettingsSection>

      {/* App Version */}
      <div className="text-center text-xs text-gray-400 mt-8">
        <p>SnapPay v{APP_CONFIG.VERSION}</p>
        <p className="mt-1">© {new Date().getFullYear()} {APP_CONFIG.NAME}. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Settings;