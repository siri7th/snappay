// src/pages/primary/family/ConnectionRequestsSection.tsx
import React from 'react';
import { BellIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { formatDate } from '../../../utils/formatters';

interface ConnectionRequestsSectionProps {
  requests: any[];
  processingId: string | null;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onViewAll: () => void;
}

export const ConnectionRequestsSection: React.FC<ConnectionRequestsSectionProps> = ({
  requests,
  processingId,
  onAccept,
  onReject,
  onViewAll
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BellIcon className="h-5 w-5 text-blue-500" />
          New Connection Requests
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
            {requests.length}
          </span>
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onViewAll}
        >
          View All
        </Button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {requests.slice(0, 4).map((request) => (
          <Card key={request.id} className="border-l-4 border-l-blue-400 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">
                    {request.phone?.charAt(0) || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{request.phone}</h3>
                  <p className="text-sm text-gray-500">
                    {request.message || 'Wants to connect to your family'}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="flex items-center gap-1 text-gray-500">
                      <ClockIcon className="h-3 w-3" />
                      {formatDate(request.createdAt, 'short')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-1">
                <button
                  onClick={() => onAccept(request.id)}
                  disabled={processingId === request.id}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Accept"
                >
                  {processingId === request.id ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                  ) : (
                    <CheckCircleIcon className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => onReject(request.id)}
                  disabled={processingId === request.id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Reject"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {requests.length > 4 && (
        <div className="text-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewAll}
          >
            View All {requests.length} Requests
          </Button>
        </div>
      )}
    </div>
  );
};