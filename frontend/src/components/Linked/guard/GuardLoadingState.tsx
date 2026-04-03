// src/components/Linked/guard/GuardLoadingState.tsx
import React from 'react';

interface GuardLoadingStateProps {
  message?: string;
}

export const GuardLoadingState: React.FC<GuardLoadingStateProps> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};