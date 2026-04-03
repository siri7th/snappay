// src/components/family/RequestCard.tsx
import React from 'react';
import { ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Button from '../common/Button';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';

// Shared types
export interface BaseRequest {
  id: string;
  amount: number;
  reason?: string;
  duration: 'today' | 'week' | 'permanent' | 'month';
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  createdAt: string;
}

export interface PrimaryRequest extends BaseRequest {
  memberName: string;
  memberPhone: string;
  currentLimit?: number;
  currentSpent?: number;
}

export interface LinkedRequest extends BaseRequest {
  // No additional fields needed for linked view
}

// Props for primary view
interface PrimaryRequestCardProps {
  request: PrimaryRequest;
  onApprove?: (id: string) => void;
  onDeny?: (id: string) => void;
  onView?: (id: string) => void;
}

// Props for linked view
interface LinkedRequestCardProps {
  request: LinkedRequest;
  onView?: (id: string) => void;
}

// Primary View Component
const PrimaryRequestCard: React.FC<PrimaryRequestCardProps> = ({
  request,
  onApprove,
  onDeny,
  onView,
}) => {
  const getDurationText = () => {
    switch (request.duration) {
      case 'today':
        return 'Just today';
      case 'week':
        return 'This week only';
      case 'month':
        return 'This month only';
      case 'permanent':
        return 'Permanent increase';
    }
  };

  const getStatusBadge = () => {
    switch (request.status) {
      case 'PENDING':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
            <ClockIcon className="h-3 w-3" /> Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
            <CheckCircleIcon className="h-3 w-3" /> Approved
          </span>
        );
      case 'DENIED':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
            <XCircleIcon className="h-3 w-3" /> Denied
          </span>
        );
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{request.memberName}</h3>
          <p className="text-sm text-gray-600">{request.memberPhone}</p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="bg-primary-soft p-3 rounded-lg mb-3">
        <p className="text-sm text-gray-600">Requesting increase of</p>
        <p className="text-2xl font-bold text-primary">+{formatCurrency(request.amount)}</p>
        <p className="text-xs text-gray-500 mt-1">{getDurationText()}</p>
      </div>

      {request.reason && (
        <div className="mb-3 p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-500">Reason:</p>
          <p className="text-sm text-gray-700">"{request.reason}"</p>
        </div>
      )}

      {request.currentLimit !== undefined && (
        <div className="mb-3 text-sm">
          <span className="text-gray-600">Current daily: </span>
          <span className="font-medium">{formatCurrency(request.currentLimit)}</span>
          {request.currentSpent !== undefined && (
            <span className="text-gray-500 ml-2">(Spent: {formatCurrency(request.currentSpent)})</span>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 mb-3">Requested {formatRelativeTime(request.createdAt)}</p>

      {request.status === 'PENDING' && (
        <div className="flex gap-2">
          {onApprove && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onApprove(request.id)}
              className="flex-1"
            >
              Approve
            </Button>
          )}
          {onDeny && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDeny(request.id)}
              className="flex-1 border-error text-error hover:bg-error-soft"
            >
              Deny
            </Button>
          )}
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(request.id)}>
              View
            </Button>
          )}
        </div>
      )}

      {request.status !== 'PENDING' && onView && (
        <Button variant="outline" size="sm" onClick={() => onView(request.id)} fullWidth>
          View Details
        </Button>
      )}
    </Card>
  );
};

// Linked View Component
const LinkedRequestCard: React.FC<LinkedRequestCardProps> = ({
  request,
  onView,
}) => {
  const getDurationText = () => {
    switch (request.duration) {
      case 'today':
        return 'Just today';
      case 'week':
        return 'This week only';
      case 'month':
        return 'This month only';
      case 'permanent':
        return 'Permanent increase';
    }
  };

  const getStatusBadge = () => {
    switch (request.status) {
      case 'PENDING':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
            <ClockIcon className="h-3 w-3" /> Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
            <CheckCircleIcon className="h-3 w-3" /> Approved
          </span>
        );
      case 'DENIED':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
            <XCircleIcon className="h-3 w-3" /> Denied
          </span>
        );
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">Limit Increase Request</h3>
          <p className="text-sm text-gray-600">To: Primary Account</p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="bg-primary-soft p-3 rounded-lg mb-3">
        <p className="text-2xl font-bold text-primary">+{formatCurrency(request.amount)}</p>
        <p className="text-xs text-gray-500 mt-1">{getDurationText()}</p>
      </div>

      {request.reason && (
        <div className="mb-3 p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-500">Your reason:</p>
          <p className="text-sm text-gray-700">"{request.reason}"</p>
        </div>
      )}

      <p className="text-xs text-gray-400">Sent {formatRelativeTime(request.createdAt)}</p>

      {request.status === 'PENDING' && (
        <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
          <ClockIcon className="h-3 w-3" />
          Waiting for primary account to respond
        </p>
      )}

      {onView && request.status !== 'PENDING' && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onView(request.id)} 
          fullWidth 
          className="mt-3"
        >
          View Details
        </Button>
      )}
    </Card>
  );
};

// Main component that renders the appropriate view
interface RequestCardProps {
  request: PrimaryRequest | LinkedRequest;
  onApprove?: (id: string) => void;
  onDeny?: (id: string) => void;
  onView?: (id: string) => void;
  isPrimary?: boolean;
}

const RequestCard: React.FC<RequestCardProps> = (props) => {
  const { isPrimary = true, ...rest } = props;
  
  if (isPrimary) {
    return <PrimaryRequestCard {...rest as PrimaryRequestCardProps} />;
  }
  
  return <LinkedRequestCard {...rest as LinkedRequestCardProps} />;
};

export default RequestCard;