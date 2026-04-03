// pages/linked/connection-status/RejectedStatus.tsx
import React from 'react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';

interface RejectedStatusProps {
  connectionRequest: any;
  onTryAgain: () => void;
}

export const RejectedStatus: React.FC<RejectedStatusProps> = ({
  connectionRequest,
  onTryAgain
}) => {
  return (
    <Card className="text-center py-8 px-6">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <XCircleIcon className="h-10 w-10 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Rejected</h2>
      <p className="text-gray-600 mb-6">
        Your connection request was not approved by the primary account holder.
      </p>
      {connectionRequest?.message && (
        <div className="bg-red-50 p-3 rounded-lg mb-4 text-left">
          <p className="text-sm text-red-700">
            <span className="font-semibold">Message:</span> {connectionRequest.message}
          </p>
        </div>
      )}
      <Button onClick={onTryAgain} className="flex-1">
        Try Again
      </Button>
    </Card>
  );
};