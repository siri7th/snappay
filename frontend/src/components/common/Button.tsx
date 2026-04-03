// src/components/common/Button.tsx
import React from 'react';
import { Link } from 'react-router-dom';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  href,
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'font-semibold rounded-button transition-all duration-200 inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary-light disabled:bg-primary-light',
    secondary: 'bg-white text-primary border-2 border-primary hover:bg-primary-soft focus:ring-primary-light',
    outline: 'bg-transparent text-gray-700 border-2 border-gray-300 hover:border-primary hover:text-primary focus:ring-gray-400',
    danger: 'bg-error text-white hover:bg-error-dark focus:ring-error-light',
    success: 'bg-success text-white hover:bg-success-dark focus:ring-success-light',
    warning: 'bg-warning text-white hover:bg-warning-dark focus:ring-warning-light',
  };

  const sizes: Record<ButtonSize, string> = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const width = fullWidth ? 'w-full' : '';
  const isDisabled = disabled || loading;
  const disabledStyles = isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';
  const iconSpacing = icon ? (iconPosition === 'left' ? 'mr-2' : 'ml-2') : '';

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${disabledStyles} ${className}`;

  const spinner = (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <>
          {spinner}
          {icon && iconPosition === 'left' && <span className="ml-2">{icon}</span>}
          <span className={iconPosition === 'left' ? 'ml-2' : 'ml-0'}>{children}</span>
        </>
      );
    }

    return (
      <>
        {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
        {children}
        {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
      </>
    );
  };

  if (href) {
    return (
      <Link to={href} className={classes}>
        {renderContent()}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={isDisabled} {...props}>
      {renderContent()}
    </button>
  );
};

export default Button;