// pages/linked/dashboard/NotConnectedScreen.tsx
import React from 'react';
import { ShieldExclamationIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';

interface NotConnectedScreenProps {
  onConnect: () => void;
}

export const NotConnectedScreen: React.FC<NotConnectedScreenProps> = ({ onConnect }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center py-12">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldExclamationIcon className="h-10 w-10 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Not Connected to Primary Account</h2>
        <p className="text-gray-600 mb-8">
          You need to connect with a primary account to access wallet features, send/receive money, and view your dashboard.
        </p>
        <div className="space-y-3">
          <Button 
            onClick={onConnect}
            fullWidth
            size="lg"
            className="animate-pulse"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Connect Now
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/linked/join'}
            fullWidth
          >
            Have an Invite Code?
          </Button>
        </div>
      </Card>
    </div>
  );
};