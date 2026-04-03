// src/components/Linked/guard/AlreadyConnectedScreen.tsx
import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import Card from '../../common/Card';

interface AlreadyConnectedScreenProps {
  primaryDetails: any; // TODO: Replace with proper PrimaryDetails type from types
  userRole?: string;
}

export const AlreadyConnectedScreen: React.FC<AlreadyConnectedScreenProps> = ({ 
  primaryDetails, 
  userRole 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center py-8 px-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircleIcon className="h-10 w-10 text-green-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Already Connected</h2>
        
        <p className="text-gray-600 mb-6">
          You are already connected to a primary account. Redirecting to dashboard...
        </p>

        <div className="animate-pulse text-primary">Redirecting...</div>

        {/* Debug info (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-left text-xs text-gray-400 font-mono">
            <p>Connected to: {primaryDetails?.primary?.name}</p>
            <p>Role: {userRole}</p>
          </div>
        )}
      </Card>
    </div>
  );
};