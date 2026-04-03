// src/components/family/FamilyMemberCard.tsx
import React from 'react';
import { 
  UserIcon, 
  PencilIcon, 
  PauseIcon, 
  PlayIcon, 
  PlusIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Button from '../common/Button';
import ProgressBar from '../common/ProgressBar';
import { formatCurrency } from '../../utils/formatters';
import { FamilyMember } from '../../types/family.types';

interface FamilyMemberCardProps {
  member: FamilyMember;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onAddLimit: (id: string) => void;
  onRemove?: (id: string) => void;
  onSendMoney?: (id: string, name: string, phone: string) => void;
}

const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({
  member,
  onView,
  onEdit,
  onPause,
  onResume,
  onAddLimit,
  onRemove,
  onSendMoney,
}) => {
  const dailyPercent = (member.dailySpent / member.dailyLimit) * 100;
  const monthlyPercent = (member.monthlySpent / member.monthlyLimit) * 100;

  const getStatusBadge = () => {
    switch (member.status) {
      case 'ACTIVE':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
        );
      case 'PAUSED':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Paused</span>
        );
      case 'PENDING':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
            Pending
          </span>
        );
      case 'REMOVED':
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Removed</span>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={`${member.status === 'PAUSED' ? 'opacity-75' : ''} hover:shadow-lg transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-soft rounded-full flex items-center justify-center">
            <span className="text-primary font-bold text-lg">
              {member.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{member.name}</h3>
            <p className="text-sm text-gray-600">{member.phone}</p>
            {member.relationship && (
              <p className="text-xs text-gray-500">{member.relationship}</p>
            )}
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Daily Limit</span>
            <span className="font-medium">
              {formatCurrency(member.dailySpent)} / {formatCurrency(member.dailyLimit)}
            </span>
          </div>
          <ProgressBar 
            value={dailyPercent} 
            color={dailyPercent > 80 ? 'warning' : 'primary'} 
            size="md"
            animated
          />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Monthly Limit</span>
            <span className="font-medium">
              {formatCurrency(member.monthlySpent)} / {formatCurrency(member.monthlyLimit)}
            </span>
          </div>
          <ProgressBar 
            value={monthlyPercent} 
            color={monthlyPercent > 80 ? 'warning' : 'primary'} 
            size="md"
            animated
          />
        </div>
      </div>

      {member.lastActive && (
        <p className="text-xs text-gray-400 mb-3">
          Last active: {new Date(member.lastActive).toLocaleDateString()}
        </p>
      )}

      {member.walletBalance !== undefined && member.walletBalance > 0 && (
        <p className="text-xs text-primary mb-3">
          Wallet: {formatCurrency(member.walletBalance)}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onView(member.id)} className="flex-1">
          <EyeIcon className="h-4 w-4 mr-1" /> View
        </Button>
        <Button variant="outline" size="sm" onClick={() => onAddLimit(member.id)} className="flex-1">
          <PlusIcon className="h-4 w-4 mr-1" /> Add Limit
        </Button>
      </div>

      <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
        {onEdit && (
          <button
            onClick={() => onEdit(member.id)}
            className="flex-1 py-1 text-xs text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1"
          >
            <PencilIcon className="h-3 w-3" /> Edit
          </button>
        )}
        {member.status === 'ACTIVE' && onPause && (
          <button
            onClick={() => onPause(member.id)}
            className="flex-1 py-1 text-xs text-yellow-600 hover:text-yellow-700 flex items-center justify-center gap-1"
          >
            <PauseIcon className="h-3 w-3" /> Pause
          </button>
        )}
        {member.status === 'PAUSED' && onResume && (
          <button
            onClick={() => onResume(member.id)}
            className="flex-1 py-1 text-xs text-green-600 hover:text-green-700 flex items-center justify-center gap-1"
          >
            <PlayIcon className="h-3 w-3" /> Resume
          </button>
        )}
        {onSendMoney && (
          <button
            onClick={() => onSendMoney(member.id, member.name, member.phone)}
            className="flex-1 py-1 text-xs text-primary hover:text-primary-dark flex items-center justify-center gap-1"
          >
            <PlusIcon className="h-3 w-3" /> Send
          </button>
        )}
        {onRemove && member.status !== 'REMOVED' && (
          <button
            onClick={() => onRemove(member.id)}
            className="flex-1 py-1 text-xs text-error hover:text-error-dark flex items-center justify-center gap-1"
          >
            <TrashIcon className="h-3 w-3" /> Remove
          </button>
        )}
      </div>
    </Card>
  );
};

export default FamilyMemberCard;