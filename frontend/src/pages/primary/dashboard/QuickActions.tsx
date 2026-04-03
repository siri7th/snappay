// src/pages/primary/dashboard/QuickActions.tsx
import React from 'react';
import { NavigateFunction } from 'react-router-dom';
import {
  PlusIcon,
  WalletIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';
import { ROUTES } from '../../../utils/constants';

interface QuickActionsProps {
  onNavigate: NavigateFunction;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate }) => {
  const quickActions = [
    { label: 'Add Money', icon: PlusIcon, path: ROUTES.WALLET_ADD, color: 'text-green-600' },
    { label: 'Send', icon: WalletIcon, path: ROUTES.PRIMARY_SEND, color: 'text-primary' },
    { label: 'Recharge', icon: ArrowTrendingUpIcon, path: ROUTES.PRIMARY_RECHARGE, color: 'text-blue-600' },
    { label: 'Family', icon: UsersIcon, path: ROUTES.PRIMARY_FAMILY, color: 'text-purple-600' },
    { label: 'Banks', icon: BuildingLibraryIcon, path: ROUTES.PRIMARY_BANKS, color: 'text-orange-600' },
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {quickActions.map((action, i) => {
        const Icon = action.icon;
        return (
          <button
            key={i}
            onClick={() => onNavigate(action.path)}
            className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-105 text-center group"
          >
            <Icon className={`h-6 w-6 ${action.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
            <span className="text-sm font-medium text-gray-700">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
};