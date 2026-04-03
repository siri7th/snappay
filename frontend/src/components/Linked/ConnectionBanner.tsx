// src/components/Linked/ConnectionBanner.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserGroupIcon, 
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import Button from '../common/Button';
import { ROUTES } from '../../utils/constants';

export type ConnectionBannerVariant = 'info' | 'pending' | 'success' | 'warning';

interface ConnectionBannerProps {
  onDismiss?: () => void;
  showDismiss?: boolean;
  variant?: ConnectionBannerVariant;
  message?: string;
}

const ConnectionBanner: React.FC<ConnectionBannerProps> = ({ 
  onDismiss, 
  showDismiss = true,
  variant = 'info',
  message
}) => {
  const navigate = useNavigate();

  const getVariantStyles = () => {
    switch (variant) {
      case 'pending':
        return {
          bg: 'bg-gradient-to-r from-yellow-500 to-amber-600',
          icon: ClockIcon,
          iconColor: 'text-yellow-100',
          title: 'Connection Pending',
          defaultMessage: 'Your connection request is pending approval from the primary account holder.'
        };
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
          icon: CheckCircleIcon,
          iconColor: 'text-green-100',
          title: 'Connected Successfully',
          defaultMessage: 'You are now connected to a primary account. Start using all features!'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-orange-500 to-red-600',
          icon: ExclamationTriangleIcon,
          iconColor: 'text-orange-100',
          title: 'Connection Issue',
          defaultMessage: 'There was an issue with your connection. Please try reconnecting.'
        };
      case 'info':
      default:
        return {
          bg: 'bg-gradient-to-r from-primary to-primary-dark',
          icon: UserGroupIcon,
          iconColor: 'text-primary-100',
          title: 'Connect to Primary Account',
          defaultMessage: 'Link with a family member\'s primary account to start using all features'
        };
    }
  };

  const styles = getVariantStyles();
  const Icon = styles.icon;
  const displayMessage = message || styles.defaultMessage;

  const getButtonText = () => {
    switch (variant) {
      case 'pending':
        return 'Check Status';
      case 'success':
        return 'Go to Dashboard';
      case 'warning':
        return 'Reconnect';
      case 'info':
      default:
        return 'Connect Now';
    }
  };

  const handleButtonClick = () => {
    switch (variant) {
      case 'pending':
        navigate(ROUTES.LINKED_CONNECTION_STATUS);
        break;
      case 'success':
        navigate(ROUTES.LINKED_DASHBOARD);
        break;
      case 'warning':
      case 'info':
      default:
        navigate(ROUTES.LINKED_CONNECT);
        break;
    }
  };

  return (
    <div className={`${styles.bg} text-white rounded-lg p-4 relative shadow-lg`}>
      {showDismiss && onDismiss && (
        <button 
          onClick={onDismiss}
          className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
      
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0`}>
          <Icon className={`h-5 w-5 ${styles.iconColor}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{styles.title}</h3>
          <p className="text-sm text-white/80 mt-1">
            {displayMessage}
          </p>
        </div>
        <Button 
          variant="secondary" 
          size="sm"
          onClick={handleButtonClick}
          className="bg-white text-primary hover:bg-gray-100 whitespace-nowrap"
        >
          {getButtonText()}
        </Button>
      </div>
    </div>
  );
};

export default ConnectionBanner;