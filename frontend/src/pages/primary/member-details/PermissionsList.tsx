// src/pages/primary/member-details/PermissionsList.tsx
import React from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';

interface PermissionsListProps {
  permissions: Record<string, boolean>;
}

export const PermissionsList: React.FC<PermissionsListProps> = ({ permissions }) => {
  const permissionLabels: Record<string, string> = {
    sendMoney: 'Send Money',
    scanPay: 'Scan & Pay',
    recharge: 'Recharge',
    viewHistory: 'View History'
  };

  const enabledCount = Object.values(permissions).filter(v => v).length;

  return (
    <Card>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <span>Permissions</span>
        <span className="text-xs text-gray-500">({enabledCount} enabled)</span>
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(permissions).map(([key, value]) => (
          <div key={key} className={`flex items-center gap-2 p-2 rounded-lg ${value ? 'bg-green-50' : 'bg-gray-50'}`}>
            {value ? (
              <CheckCircleIcon className="h-4 w-4 text-success" />
            ) : (
              <XCircleIcon className="h-4 w-4 text-gray-400" />
            )}
            <span className={`text-sm capitalize ${value ? 'text-gray-900' : 'text-gray-500'}`}>
              {permissionLabels[key] || key.replace(/([A-Z])/g, ' $1').trim()}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};