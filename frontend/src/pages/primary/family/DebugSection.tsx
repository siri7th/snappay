// src/pages/primary/family/DebugSection.tsx
import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';

interface DebugSectionProps {
  pendingInvitations: any[];
  connectionRequests: any[];
  onTestInvitations: () => Promise<any>;
  onTestConnectionRequests: () => Promise<any>;
}

export const DebugSection: React.FC<DebugSectionProps> = ({
  pendingInvitations,
  connectionRequests,
  onTestInvitations,
  onTestConnectionRequests
}) => {
  return (
    <Card className="p-4 bg-gray-100 border border-gray-300">
      <div className="flex items-start gap-2">
        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-700 mb-2">Debug Info</h3>
          <p className="text-xs text-gray-600 mb-2">
            Pending Invitations (API): {pendingInvitations.length}<br />
            Connection Requests (from Notifications): {connectionRequests.length}
          </p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={async () => {
                const invites = await onTestInvitations();
                console.log('📦 Invitations result:', invites);
              }}
            >
              Test Invitations API
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={async () => {
                const requests = await onTestConnectionRequests();
                console.log('📦 Connection requests:', requests);
              }}
            >
              Test Connection Requests
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};