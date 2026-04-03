// pages/linked/dashboard/PrimaryInfoCard.tsx
import React from 'react';
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';

interface PrimaryInfoCardProps {
  primaryDetails: any;
  limits: any;
  formatDate: (date: string) => string;
}

export const PrimaryInfoCard: React.FC<PrimaryInfoCardProps> = ({
  primaryDetails,
  limits,
  formatDate
}) => {
  return (
    <Card className="bg-gradient-to-r from-primary-soft to-white border border-primary/20">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center">
          <UserIcon className="h-7 w-7 text-white" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm text-gray-600">Linked to Primary Account</p>
            {limits?.status === 'ACTIVE' && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                <CheckCircleIcon className="h-3 w-3" /> Active
              </span>
            )}
          </div>
          <p className="font-semibold text-lg">{primaryDetails.primary?.name || 'Family Account'}</p>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1">
              <PhoneIcon className="h-3 w-3 text-gray-400" />
              <p className="text-sm text-gray-600">{primaryDetails.primary?.phone}</p>
            </div>
            {primaryDetails.primary?.email && (
              <div className="flex items-center gap-1">
                <EnvelopeIcon className="h-3 w-3 text-gray-400" />
                <p className="text-sm text-gray-600">{primaryDetails.primary.email}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-left sm:text-right">
          <p className="text-xs text-gray-500">Member since</p>
          <p className="text-sm font-medium flex items-center gap-1 sm:justify-end">
            <CalendarIcon className="h-3 w-3 text-gray-400" />
            {primaryDetails.primary?.memberSince ? formatDate(primaryDetails.primary.memberSince) : 'N/A'}
          </p>
          {limits?.relationship && (
            <p className="text-xs text-gray-500 mt-1">Relationship: {limits.relationship}</p>
          )}
        </div>
      </div>
    </Card>
  );
};