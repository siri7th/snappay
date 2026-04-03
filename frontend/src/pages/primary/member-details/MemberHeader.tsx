// src/pages/primary/member-details/MemberHeader.tsx
import React from 'react';
import { UserIcon, PhoneIcon, EnvelopeIcon, CalendarIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { formatDate } from '../../../utils/formatters';

interface MemberHeaderProps {
  memberName: string;
  memberPhone: string;
  memberEmail?: string;
  memberStatus: string;
  memberRelationship?: string;
  memberSince?: string;
  walletBalance: number;
  onSendMoney: () => void;
}

export const MemberHeader: React.FC<MemberHeaderProps> = ({
  memberName,
  memberPhone,
  memberEmail,
  memberStatus,
  memberRelationship,
  memberSince,
  walletBalance,
  onSendMoney
}) => {
  const getStatusColor = () => {
    switch (memberStatus) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-700';
      case 'PENDING':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 right-0 px-4 py-1 text-sm font-medium ${getStatusColor()}`}>
        {memberStatus}
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-3xl font-bold">
              {memberName?.charAt(0).toUpperCase() || 'M'}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{memberName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <PhoneIcon className="h-4 w-4 text-gray-400" />
              <p className="text-gray-600">{memberPhone}</p>
            </div>
            {memberEmail && (
              <div className="flex items-center gap-2 mt-1">
                <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                <p className="text-gray-600">{memberEmail}</p>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              Member since {memberSince ? formatDate(memberSince, 'short') : 'N/A'}
            </p>
          </div>
        </div>
        
        {memberRelationship && (
          <div className="mt-4 md:mt-0">
            <span className="px-3 py-1 bg-primary-soft text-primary rounded-full text-sm">
              {memberRelationship}
            </span>
          </div>
        )}
      </div>

      {/* Quick Action Buttons for Mobile */}
      <div className="mt-4 pt-4 border-t border-gray-100 md:hidden">
        <Button
          variant="outline"
          size="sm"
          fullWidth
          onClick={onSendMoney}
          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
        >
          <ArrowUpIcon className="h-4 w-4 mr-1" />
          Send Money
        </Button>
      </div>
    </Card>
  );
};