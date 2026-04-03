// src/components/common/Card.tsx
import React from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: CardPadding;
  bordered?: boolean;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  padding = 'md',
  bordered = true,
  hoverable = false,
}) => {
  const paddingStyles: Record<CardPadding, string> = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const borderStyles = bordered ? 'border border-gray-200' : '';
  const hoverStyles = hoverable
    ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer'
    : '';
  const clickableStyles = onClick ? 'cursor-pointer' : '';

  const classes = `
    bg-white rounded-card shadow-card
    ${paddingStyles[padding]}
    ${borderStyles}
    ${hoverStyles}
    ${clickableStyles}
    ${className}
  `;

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;