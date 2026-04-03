// pages/linked/connection-status/ApprovedStatus.tsx
import React from 'react';
import {
  CheckCircleIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';

interface ApprovedStatusProps {
  primaryDetails: any;
  onGoToDashboard: () => void;
  formatDate: (date: string) => string;
}

export const ApprovedStatus: React.FC<ApprovedStatusProps> = ({
  primaryDetails,
  onGoToDashboard,
  formatDate
}) => {
  return (
    <Card className="text-center py-8 px-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircleIcon className="h-10 w-10 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Connected Successfully!</h2>
      <p className="text-gray-600 mb-4">
        Your connection has been approved. You can now access all family features.
      </p>
      {primaryDetails && (
        <div className="bg-green-50 p-4 rounded-lg mb-6 text-left">
          <h3 className="font-semibold mb-3 text-green-800 flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Primary Account Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-green-600" />
              <span className="font-medium">{primaryDetails.primary.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <PhoneIcon className="h-4 w-4 text-green-600" />
              <span>{primaryDetails.primary.phone}</span>
            </div>
            {primaryDetails.primary.email && (
              <div className="flex items-center gap-2">
                <EnvelopeIcon className="h-4 w-4 text-green-600" />
                <span>{primaryDetails.primary.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-green-600" />
              <span>Connected since {formatDate(primaryDetails.joinedAt)}</span>
            </div>
          </div>
        </div>
      )}
      <Button onClick={onGoToDashboard} className="flex-1">
        Go to Dashboard
      </Button>
    </Card>
  );
};