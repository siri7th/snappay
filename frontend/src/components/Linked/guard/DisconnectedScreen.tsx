// src/components/Linked/guard/DisconnectedScreen.tsx
import React from 'react';
import { 
  ShieldExclamationIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  QrCodeIcon,
  PhoneIcon,
  UserGroupIcon 
} from '@heroicons/react/24/outline';
import Card from '../../common/Card';
import Button from '../../common/Button';

interface DisconnectedScreenProps {
  error?: string | null;
  checking: boolean;
  onConnect: (method?: 'qr' | 'code' | 'manual') => void;
  onRefresh: () => void;
  userRole?: string;
  connectionStatus: string;
  hasPrimaryDetails: boolean;
}

export const DisconnectedScreen: React.FC<DisconnectedScreenProps> = ({
  error,
  checking,
  onConnect,
  onRefresh,
  userRole,
  connectionStatus,
  hasPrimaryDetails
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center py-8 px-6">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldExclamationIcon className="h-10 w-10 text-yellow-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect to Primary Account</h2>
        
        <p className="text-gray-600 mb-6">
          You're not connected to any primary account yet. Connect with a family member's 
          primary account to start using all features.
        </p>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-start gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            fullWidth 
            onClick={() => onConnect()}
            size="lg"
            className="animate-pulse"
          >
            Connect Now
          </Button>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Quick Connect</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => onConnect('qr')}
              className="flex items-center justify-center gap-2"
            >
              <QrCodeIcon className="h-4 w-4" /> Scan QR
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => onConnect('manual')}
              className="flex items-center justify-center gap-2"
            >
              <PhoneIcon className="h-4 w-4" /> Enter Phone
            </Button>
          </div>

          <Button 
            variant="outline" 
            onClick={() => onConnect('code')}
            fullWidth
            className="mt-2"
          >
            <UserGroupIcon className="h-4 w-4 mr-2" /> Have an Invite Code?
          </Button>

          <button
            onClick={onRefresh}
            className="text-sm text-primary hover:text-primary-dark mt-4 flex items-center justify-center gap-1 mx-auto"
            disabled={checking}
          >
            <ArrowPathIcon className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
            Refresh Connection Status
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <button onClick={() => window.location.href = '/support'} className="text-primary hover:underline">
              Contact Support
            </button>
          </p>
        </div>

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-left">
            <p className="text-xs text-gray-400 font-mono">
              Status: {connectionStatus}<br />
              Role: {userRole}<br />
              Has PrimaryDetails: {hasPrimaryDetails ? 'yes' : 'no'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};