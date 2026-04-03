// pages/linked/dashboard/WalletCard.tsx
import React from 'react';
import { NavigateFunction } from 'react-router-dom';
import { WalletIcon, ArrowDownIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';

interface WalletCardProps {
  balance: number;
  formatCurrency: (amount: number) => string;
  onNavigate: NavigateFunction;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  balance,
  formatCurrency,
  onNavigate
}) => {
  return (
    <Card className="bg-gradient-to-br from-primary to-primary-dark">
      <div className="flex items-center justify-between mb-4">
        <div>
          <WalletIcon className="h-8 w-8 text-white opacity-90" />
        </div>
        <span className="text-sm text-white opacity-80">Your Wallet</span>
      </div>
      
      <p className="text-3xl font-bold text-white mb-1">
        {formatCurrency(balance || 0)}
      </p>
      <p className="text-sm text-white opacity-80">Available Balance</p>
      
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onNavigate('/linked/receive')}
          className="bg-white/20 text-white hover:bg-white/30 border-0"
        >
          <ArrowDownIcon className="h-4 w-4 mr-1" />
          Receive
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onNavigate('/linked/send')}
          className="bg-white/20 text-white hover:bg-white/30 border-0"
        >
          <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
          Send
        </Button>
      </div>
    </Card>
  );
};