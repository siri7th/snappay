// src/components/family/RemoveMemberModal.tsx
import React, { useState } from 'react';
import { 
  ExclamationTriangleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

interface RemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  memberBalance: number;
  onConfirm: (password: string, transferBalance: boolean) => Promise<void>;
}

const RemoveMemberModal: React.FC<RemoveMemberModalProps> = ({
  isOpen,
  onClose,
  memberName,
  memberBalance,
  onConfirm
}) => {
  const [password, setPassword] = useState('');
  const [transferBalance, setTransferBalance] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await onConfirm(password, transferBalance);
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to remove member';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Remove Family Member"
      size="md"
      showCloseButton={true}
    >
      <div className="space-y-4">
        {/* Warning Banner */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-700 font-medium">Warning</p>
              <p className="text-xs text-yellow-600 mt-1">
                Removing {memberName} will permanently delete their access. 
                {memberBalance > 0 && ' Their wallet balance will be transferred to your account.'}
              </p>
            </div>
          </div>
        </div>

        {/* Balance Transfer Option */}
        {memberBalance > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Member's Wallet Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{memberBalance.toLocaleString()}
            </p>
            <label className="flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                checked={transferBalance}
                onChange={(e) => setTransferBalance(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
              />
              <span className="text-sm text-gray-600">
                Transfer balance to my wallet
              </span>
            </label>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your password to confirm
            </label>
            <Input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              fullWidth
              loading={loading}
              className="bg-error hover:bg-error-dark"
            >
              Remove Member
            </Button>
            <Button 
              type="button"
              variant="outline" 
              fullWidth 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default RemoveMemberModal;