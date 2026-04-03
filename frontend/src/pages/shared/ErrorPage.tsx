// pages/shared/ErrorPage.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  HomeIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  ShieldExclamationIcon,
  LockClosedIcon,
  ServerIcon,
  WifiIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

interface ErrorPageProps {
  code?: number;
  title?: string;
  message?: string;
  showHome?: boolean;
  showRetry?: boolean;
  showBack?: boolean;
  onRetry?: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  code = 404,
  title,
  message,
  showHome = true,
  showRetry = true,
  showBack = true,
  onRetry,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const errorMessages: Record<number, { title: string; message: string; icon: React.ElementType }> = {
    400: {
      title: 'Bad Request',
      message: 'The request could not be understood by the server. Please check your input and try again.',
      icon: ExclamationTriangleIcon,
    },
    401: {
      title: 'Unauthorized',
      message: 'Please log in to access this page. Your session may have expired.',
      icon: LockClosedIcon,
    },
    403: {
      title: 'Forbidden',
      message: "You don't have permission to access this page. If you believe this is an error, please contact support.",
      icon: ShieldExclamationIcon,
    },
    404: {
      title: 'Page Not Found',
      message: "The page you're looking for doesn't exist or has been moved.",
      icon: ExclamationTriangleIcon,
    },
    408: {
      title: 'Request Timeout',
      message: 'The request took too long to complete. Please check your internet connection and try again.',
      icon: WifiIcon,
    },
    429: {
      title: 'Too Many Requests',
      message: 'You have made too many requests. Please wait a moment and try again.',
      icon: ExclamationTriangleIcon,
    },
    500: {
      title: 'Server Error',
      message: 'Something went wrong on our end. Please try again later.',
      icon: ServerIcon,
    },
    502: {
      title: 'Bad Gateway',
      message: 'The server received an invalid response. Please try again later.',
      icon: ServerIcon,
    },
    503: {
      title: 'Service Unavailable',
      message: 'The service is temporarily unavailable. Please try again later.',
      icon: ServerIcon,
    },
    504: {
      title: 'Gateway Timeout',
      message: 'The server took too long to respond. Please check your connection and try again.',
      icon: WifiIcon,
    },
  };

  const errorInfo = errorMessages[code] || {
    title: 'Error',
    message: 'An unexpected error occurred.',
    icon: ExclamationTriangleIcon,
  };

  const displayTitle = title || errorInfo.title;
  const displayMessage = message || errorInfo.message;
  const Icon = errorInfo.icon;

  const getGradient = () => {
    switch (code) {
      case 401:
      case 403:
        return 'from-orange-500 to-red-500';
      case 404:
        return 'from-blue-500 to-indigo-500';
      case 408:
      case 429:
        return 'from-yellow-500 to-orange-500';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'from-red-500 to-pink-500';
      default:
        return 'from-primary to-primary-dark';
    }
  };

  const getIconColor = () => {
    switch (code) {
      case 401:
      case 403:
        return 'text-orange-100';
      case 404:
        return 'text-blue-100';
      case 408:
      case 429:
        return 'text-yellow-100';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'text-red-100';
      default:
        return 'text-primary-100';
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full overflow-hidden">
        {/* Gradient Header */}
        <div className={`bg-gradient-to-r ${getGradient()} p-8 text-center`}>
          <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Icon className={`h-12 w-12 ${getIconColor()}`} />
          </div>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Error Code */}
          <div className="inline-block px-4 py-1 bg-primary-soft text-primary rounded-full text-sm font-medium mb-4">
            Error {code}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{displayTitle}</h1>

          {/* Message */}
          <p className="text-gray-600 mb-8">{displayMessage}</p>

          {/* Path Info (for debugging) */}
          {process.env.NODE_ENV === 'development' && location.pathname !== '/404' && (
            <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
              <p className="text-xs text-gray-500 mb-2 font-medium">Debug Information</p>
              <code className="text-xs bg-white p-2 rounded block font-mono">
                {location.pathname}
              </code>
            </div>
          )}

          {/* Quick Tips */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg text-left">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Quick Tips:</h3>
            <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
              {code === 404 && (
                <>
                  <li>Check if the URL is typed correctly</li>
                  <li>Go back to the previous page</li>
                  <li>Return to the homepage</li>
                </>
              )}
              {code === 401 && (
                <>
                  <li>Your session may have expired</li>
                  <li>Try logging in again</li>
                  <li>Clear your browser cache</li>
                </>
              )}
              {code === 403 && (
                <>
                  <li>You don't have permission to view this page</li>
                  <li>Contact your family administrator</li>
                  <li>Request access from primary account holder</li>
                </>
              )}
              {(code === 500 || code === 502 || code === 503 || code === 504) && (
                <>
                  <li>Refresh the page and try again</li>
                  <li>Check our status page for updates</li>
                  <li>Try again in a few minutes</li>
                </>
              )}
              {(code === 408 || code === 429) && (
                <>
                  <li>Check your internet connection</li>
                  <li>Wait a moment and try again</li>
                  <li>Reduce the number of requests</li>
                </>
              )}
              {![401, 403, 404, 408, 429, 500, 502, 503, 504].includes(code) && (
                <>
                  <li>Refresh the page and try again</li>
                  <li>Clear your browser cache</li>
                  <li>Contact support if the issue persists</li>
                </>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {showRetry && onRetry && (
              <Button onClick={onRetry} fullWidth>
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Try Again
              </Button>
            )}

            {showBack && (
              <Button variant="outline" onClick={() => navigate(-1)} fullWidth>
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Go Back
              </Button>
            )}

            {showHome && (
              <Button variant="outline" onClick={() => navigate('/')} fullWidth>
                <HomeIcon className="h-5 w-5 mr-2" />
                Go to Home
              </Button>
            )}
          </div>

          {/* Support Link */}
          <p className="mt-6 text-sm text-gray-500">
            Need help?{' '}
            <button 
              onClick={() => navigate('/support')} 
              className="text-primary hover:underline font-medium"
            >
              Contact Support
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ErrorPage;