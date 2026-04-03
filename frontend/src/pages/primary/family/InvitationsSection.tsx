// src/pages/primary/family/InvitationsSection.tsx
import React from 'react';
import { UserPlusIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface InvitationsSectionProps {
  invitations: any[];
  processingId: string | null;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onViewAll: () => void;
}

export const InvitationsSection: React.FC<InvitationsSectionProps> = ({
  invitations,
  processingId,
  onAccept,
  onReject,
  onViewAll
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <UserPlusIcon className="h-5 w-5 text-yellow-500" />
          Pending Invitations
          <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs">
            {invitations.length}
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
        {invitations.slice(0, 4).map((invitation) => (
          <Card key={invitation.id} className="border-l-4 border-l-yellow-400 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-bold text-lg">
                    {invitation.invitedPhone?.charAt(0) || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{invitation.invitedPhone}</h3>
                  <p className="text-sm text-gray-500">
                    Wants to join as <span className="font-medium text-primary">{invitation.relationship || 'Family Member'}</span>
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="flex items-center gap-1 text-gray-500">
                      <ClockIcon className="h-3 w-3" />
                      {formatDate(invitation.createdAt, 'short')}
                    </span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                      Daily: {formatCurrency(invitation.dailyLimit)}
                    </span>
                    {invitation.message && (
                      <span className="text-gray-400 truncate max-w-[100px]" title={invitation.message}>
                        💬
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-1">
                <button
                  onClick={() => onAccept(invitation.id)}
                  disabled={processingId === invitation.id}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Accept"
                >
                  {processingId === invitation.id ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                  ) : (
                    <CheckCircleIcon className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => onReject(invitation.id)}
                  disabled={processingId === invitation.id}
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
      
      {invitations.length > 4 && (
        <div className="text-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewAll}
          >
            View All {invitations.length} Invitations
          </Button>
        </div>
      )}
    </div>
  );
};