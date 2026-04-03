// src/components/banking/BankCard.tsx
import React from 'react';
import { 
  BuildingLibraryIcon, 
  CheckCircleIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Button from '../common/Button';
import { formatCurrency, maskAccountNumber } from '../../utils/formatters';

interface Bank {
  id: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
  balance: number;
  isDefault: boolean;
  isVerified: boolean;
}

interface BankCardProps {
  bank: Bank;
  onSend?: (bankId: string) => void;
  onSetDefault?: (bankId: string) => void;
  onRemove?: (bankId: string) => void;
  onVerify?: (bankId: string) => void;
  showActions?: boolean;
}

const BankCard: React.FC<BankCardProps> = ({
  bank,
  onSend,
  onSetDefault,
  onRemove,
  onVerify,
  showActions = true
}) => {
  const getBankIconColor = () => bank.isVerified ? 'text-green-600' : 'text-yellow-600';
  const getBankBgColor = () => bank.isVerified ? 'bg-green-50' : 'bg-yellow-50';

  return (
    <Card className={`hover:shadow-lg transition-all duration-300 border-l-4 ${
      bank.isDefault 
        ? 'border-l-green-500' 
        : bank.isVerified 
          ? 'border-l-primary' 
          : 'border-l-yellow-400'
    }`}>
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 ${getBankBgColor()} rounded-xl flex items-center justify-center transition-colors`}>
            <BuildingLibraryIcon className={`h-7 w-7 ${getBankIconColor()}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{bank.bankName}</h3>
            <p className="text-sm text-gray-600 font-mono tracking-wider">
              {maskAccountNumber(bank.accountNumber)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">IFSC: {bank.ifscCode}</p>
          </div>
        </div>
        
        {/* Status Badges */}
        <div className="flex flex-col gap-1 items-end">
          {bank.isDefault && (
            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
              <CheckCircleIcon className="h-3 w-3" /> Default
            </span>
          )}
          
          {bank.isVerified ? (
            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
              <ShieldCheckIcon className="h-3 w-3" /> Verified
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex items-center gap-1">
              <ShieldCheckIcon className="h-3 w-3" /> Pending
            </span>
          )}
        </div>
      </div>

      {/* Account Details Section */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Account Holder</p>
            <p className="font-medium text-gray-900">{bank.accountHolder}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Balance</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(bank.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Verification Warning */}
      {!bank.isVerified && (
        <div className="mt-3 p-3 bg-yellow-50 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
            <ShieldCheckIcon className="h-4 w-4 text-yellow-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-yellow-800">Bank not verified</p>
            <p className="text-xs text-yellow-600">Verify to enable higher transaction limits</p>
          </div>
          {onVerify && (
            <button
              onClick={() => onVerify(bank.id)}
              className="text-xs font-medium text-primary hover:text-primary-dark hover:underline flex items-center gap-1"
            >
              Verify now
              <ArrowRightIcon className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {onSend && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSend(bank.id)}
              className="col-span-1"
              disabled={!bank.isVerified}
              title={!bank.isVerified ? "Verify bank to send money" : "Send money from this account"}
            >
              <BanknotesIcon className="h-4 w-4 mr-1" /> Send
            </Button>
          )}
          
          {!bank.isDefault && onSetDefault && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSetDefault(bank.id)}
              className="col-span-1"
            >
              Set Default
            </Button>
          )}
          
          {onRemove && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemove(bank.id)}
              className={`col-span-1 ${
                bank.isDefault 
                  ? 'text-gray-400 border-gray-200 cursor-not-allowed' 
                  : 'text-error border-error hover:bg-error-soft'
              }`}
              disabled={bank.isDefault}
              title={bank.isDefault ? "Cannot remove default bank" : "Remove this bank account"}
            >
              Remove
            </Button>
          )}
        </div>
      )}

      {/* Quick Stats for Verified Banks */}
      {bank.isVerified && (
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <CheckCircleIcon className="h-3 w-3 text-green-500" />
            <span>Verified</span>
          </div>
          <div className="flex items-center gap-1">
            <BanknotesIcon className="h-3 w-3 text-primary" />
            <span>UPI enabled</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default BankCard;