// src/components/common/Input.tsx
import React, { forwardRef, InputHTMLAttributes, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helpText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    leftIcon, 
    rightIcon,
    helpText,
    className = '', 
    id, 
    ...props 
  }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-4 py-3 border-2 rounded-input transition-colors
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${
                error
                  ? 'border-error focus:border-error focus:ring-error'
                  : 'border-gray-200 focus:border-primary focus:ring-primary'
              }
              focus:outline-none focus:ring-2 focus:ring-opacity-20
              disabled:bg-gray-100 disabled:cursor-not-allowed
              placeholder:text-gray-400
              ${className}
            `}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="mt-2 text-sm text-error" role="alert">
            {error}
          </p>
        )}

        {helpText && !error && (
          <p id={`${inputId}-help`} className="mt-2 text-xs text-gray-500">
            {helpText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;