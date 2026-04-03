// src/components/common/ProgressBar.tsx
import React from 'react';

export type ProgressColor = 'primary' | 'success' | 'warning' | 'error';
export type ProgressSize = 'sm' | 'md' | 'lg';
export type ProgressLabelPosition = 'top' | 'right' | 'bottom';

interface ProgressBarProps {
  value: number;
  max?: number;
  min?: number;
  size?: ProgressSize;
  color?: ProgressColor;
  showLabel?: boolean;
  labelPosition?: ProgressLabelPosition;
  animated?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  min = 0,
  size = 'md',
  color = 'primary',
  showLabel = false,
  labelPosition = 'top',
  animated = false,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const sizeStyles: Record<ProgressSize, string> = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorStyles: Record<ProgressColor, string> = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  };

  const animationStyles = animated ? 'transition-all duration-300 ease-in-out' : '';

  const Label = () => (
    <span className="text-xs font-medium text-gray-600">{Math.round(percentage)}%</span>
  );

  return (
    <div className={`w-full ${className}`}>
      {showLabel && labelPosition === 'top' && (
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium text-gray-600">Progress</span>
          <Label />
        </div>
      )}

      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeStyles[size]}`}>
        <div
          className={`
            ${colorStyles[color]} 
            ${sizeStyles[size]} 
            ${animationStyles}
            rounded-full
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {showLabel && labelPosition === 'bottom' && (
        <div className="flex justify-end mt-1">
          <Label />
        </div>
      )}

      {showLabel && labelPosition === 'right' && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeStyles[size]}`}>
              <div
                className={`
                  ${colorStyles[color]} 
                  ${sizeStyles[size]} 
                  ${animationStyles}
                  rounded-full
                `}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
          <Label />
        </div>
      )}
    </div>
  );
};

export default ProgressBar;