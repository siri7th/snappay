// pages/linked/connection-status/ExpiredStatus.tsx
import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';

interface ExpiredStatusProps {
  onTryAgain: () => void;
}

export const ExpiredStatus: React.FC<ExpiredStatusProps> = ({ onTryAgain }) => {
  return (
    <Card className="text-center py-8 px-6">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <ClockIcon className="h-10 w-10 text-gray-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Expired</h2>
      <p className="text-gray-600 mb-6">
        This connection request has expired. Please submit a new request.
      </p>
      <Button onClick={onTryAgain} className="flex-1">
        Try Again
      </Button>
    </Card>
  );
};