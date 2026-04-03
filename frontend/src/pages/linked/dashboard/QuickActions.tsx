// pages/linked/dashboard/QuickActions.tsx
import React from 'react';
import { NavigateFunction } from 'react-router-dom';
import {
  ArrowTrendingUpIcon,
  ArrowDownIcon,
  QrCodeIcon,
  WalletIcon
} from '@heroicons/react/24/outline';

interface QuickActionsProps {
  onNavigate: NavigateFunction;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate }) => {
  const actions = [
    {
      label: 'Send',
      icon: ArrowTrendingUpIcon,
      path: '/linked/send',
      color: 'text-primary'
    },
    {
      label: 'Receive',
      icon: ArrowDownIcon,
      path: '/linked/receive',
      color: 'text-success'
    },
    {
      label: 'Scan',
      icon: QrCodeIcon,
      path: '/linked/scan',
      color: 'text-purple-600'
    },
    {
      label: 'Recharge',
      icon: WalletIcon,
      path: '/linked/recharge',
      color: 'text-blue-600'
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={() => onNavigate(action.path)}
            className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md text-center transition-all hover:scale-105 group"
          >
            <Icon className={`h-6 w-6 ${action.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
            <span className="text-sm text-gray-600">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
};