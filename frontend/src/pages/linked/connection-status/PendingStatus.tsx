// pages/linked/connection-status/PendingStatus.tsx
import React from 'react';
import {
  ClockIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';

interface PendingStatusProps {
  connectionRequest: any;
  timeRemaining: string;
  checkingStatus: boolean;
  onCheckStatus: () => void;
  onCancelRequest: () => void;
  onCopyInviteCode: () => void;
  formatDate: (date: string) => string;
}

export const PendingStatus: React.FC<PendingStatusProps> = ({
  connectionRequest,
  timeRemaining,
  checkingStatus,
  onCheckStatus,
  onCancelRequest,
  onCopyInviteCode,
  formatDate
}) => {
  return (
    <Card className="text-center py-8 px-6">
      <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
        <ClockIcon className="h-10 w-10 text-yellow-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Pending</h2>
      <p className="text-gray-600 mb-4">
        Your connection request has been sent to the primary account holder.
      </p>
      
      {connectionRequest?.expiresAt && (
        <div className="bg-yellow-50 p-3 rounded-lg mb-4 text-sm">
          <span className="font-medium text-yellow-700">⏰ {timeRemaining}</span>
        </div>
      )}

      <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-left">
        <div className="flex items-start gap-2">
          <InformationCircleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-700">
            <span className="font-semibold">Next steps:</span> The primary account holder will receive a notification. 
            Once they approve, you'll be able to access all family features. This request will expire in 7 days.
          </p>
        </div>
      </div>

      {connectionRequest && (
        <div className="text-left bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <ShieldCheckIcon className="h-4 w-4 text-primary" />
            Request Details
          </h3>
          <div className="space-y-2 text-sm">
            {connectionRequest.primary && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Primary Account:</span>
                  <span className="font-medium">{connectionRequest.primary.name || 'Pending'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-medium">{connectionRequest.primary.phone}</span>
                </div>
                {connectionRequest.primary.email && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium">{connectionRequest.primary.email}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Relationship:</span>
              <span className="font-medium capitalize">{connectionRequest.relationship || 'Family Member'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Daily Limit:</span>
              <span className="font-medium">₹{connectionRequest.dailyLimit}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Monthly Limit:</span>
              <span className="font-medium">₹{connectionRequest.monthlyLimit}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Requested on:</span>
              <span className="font-medium">{formatDate(connectionRequest.createdAt)}</span>
            </div>
            {connectionRequest.expiresAt && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Expires on:</span>
                <span className="font-medium">{formatDate(connectionRequest.expiresAt)}</span>
              </div>
            )}
            {connectionRequest.inviteCode && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Invite Code:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-medium text-primary bg-primary-soft px-2 py-1 rounded">
                    {connectionRequest.inviteCode}
                  </span>
                  <button
                    onClick={onCopyInviteCode}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Copy invite code"
                  >
                    <DocumentDuplicateIcon className="h-3 w-3 text-gray-500" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
        <Button 
          variant="outline" 
          onClick={onCheckStatus} 
          className="flex-1"
          disabled={checkingStatus}
        >
          <ArrowPathIcon className={`h-4 w-4 mr-1 ${checkingStatus ? 'animate-spin' : ''}`} />
          {checkingStatus ? 'Checking...' : 'Check Status'}
        </Button>
        <Button 
          variant="outline" 
          onClick={onCancelRequest}
          className="flex-1 text-error border-error hover:bg-error-soft"
        >
          Cancel Request
        </Button>
      </div>
    </Card>
  );
};