// src/pages/primary/dashboard/LoadingOverlay.tsx
import React from 'react';

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = 'Loading your dashboard...' 
}) => {
  return (
    <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="text-gray-600 mt-4 font-medium">{message}</p>
        <p className="text-sm text-gray-400 mt-2">Please wait</p>
      </div>
    </div>
  );
};