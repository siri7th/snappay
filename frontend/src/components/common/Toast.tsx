// src/components/common/Toast.tsx
import React, { useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type?: ToastType;
  message: string;
  description?: string;
  duration?: number;
  onClose: () => void;
  isVisible: boolean;
}

const Toast: React.FC<ToastProps> = ({
  type = 'info',
  message,
  description,
  duration = 5000,
  onClose,
  isVisible,
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  // Icon and color configurations
  const config = {
    success: {
      icon: CheckCircleIcon,
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      iconColor: 'text-green-400',
      borderColor: 'border-green-200',
    },
    error: {
      icon: XCircleIcon,
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      iconColor: 'text-red-400',
      borderColor: 'border-red-200',
    },
    warning: {
      icon: ExclamationCircleIcon,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-400',
      borderColor: 'border-yellow-200',
    },
    info: {
      icon: InformationCircleIcon,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-200',
    },
  };

  const { icon: Icon, bgColor, textColor, iconColor, borderColor } = config[type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div
        className={`
          ${bgColor} ${borderColor} border rounded-lg shadow-lg p-4 max-w-md
          transform transition-all duration-300 ease-in-out
        `}
      >
        <div className="flex items-start">
          {/* Icon */}
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="ml-3 flex-1">
            <p className={`text-sm font-medium ${textColor}`}>{message}</p>
            {description && <p className={`mt-1 text-sm ${textColor} opacity-90`}>{description}</p>}
          </div>

          {/* Close button */}
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className={`rounded-md inline-flex ${textColor} hover:opacity-75 focus:outline-none`}
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast Container Component (for managing multiple toasts)
export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          description={toast.description}
          duration={toast.duration}
          isVisible={true}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </>
  );
};

// Toast Hook (for easy usage)
export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const showToast = (
    message: string,
    options?: {
      type?: ToastType;
      description?: string;
      duration?: number;
    },
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastItem = {
      id,
      message,
      type: options?.type || 'info',
      description: options?.description,
      duration: options?.duration,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    if (options?.duration !== 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, options?.duration || 5000);
    }
  };

  const closeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    closeToast,
    success: (message: string, options?: Omit<ToastItem, 'id' | 'type' | 'message'>) =>
      showToast(message, { ...options, type: 'success' }),
    error: (message: string, options?: Omit<ToastItem, 'id' | 'type' | 'message'>) =>
      showToast(message, { ...options, type: 'error' }),
    warning: (message: string, options?: Omit<ToastItem, 'id' | 'type' | 'message'>) =>
      showToast(message, { ...options, type: 'warning' }),
    info: (message: string, options?: Omit<ToastItem, 'id' | 'type' | 'message'>) =>
      showToast(message, { ...options, type: 'info' }),
  };
};

export default Toast;
