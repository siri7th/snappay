// src/pages/primary/FamilyMemberDetails.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useFamily } from '../../hooks/useFamily';
import { useWallet } from '../../hooks/useWallet';
import { MemberHeader } from './member-details/MemberHeader';
import { UsageCards } from './member-details/UsageCards';
import { PermissionsList } from './member-details/PermissionsList';
import { TransactionsList } from './member-details/TransactionsList';
import { EditLimitsModal } from './member-details/EditLimitsModal';
import RemoveMemberModal from '../../components/family/RemoveMemberModal';
import { formatCurrency } from '../../utils/formatters';
import { ROUTES } from '../../utils/constants';
import toast from 'react-hot-toast';

const FamilyMemberDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMemberDetails, updateLimits, addToLimit, pauseMember, resumeMember, removeMember } = useFamily();
  const { getMemberTransactions, getMemberWalletBalance } = useWallet();
  
  const [member, setMember] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [showEditLimits, setShowEditLimits] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMemberDetails(id!);
      const memberData = response?.data || response;
      setMember(memberData);
      
      if (memberData?.linkedId) {
        const balance = await getMemberWalletBalance(memberData.linkedId);
        setWalletBalance(balance);
      }
      
      const txnResponse = await getMemberTransactions(id!);
      const transactionsData = txnResponse?.data?.transactions || txnResponse?.transactions || [];
      setTransactions(transactionsData);
    } catch (error) {
      setError('Failed to load member details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await loadData();
    setRefreshing(false);
  };

  const handleAddLimitQuick = async () => {
    const amount = prompt('Enter amount to add to daily limit:');
    if (amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0) {
      try {
        await addToLimit(id!, parseFloat(amount));
        toast.success(`₹${amount} added to limit successfully!`);
        loadData();
      } catch (error) {
        toast.error('Failed to add to limit. Please try again.');
      }
    }
  };

  const handlePause = async () => {
    if (window.confirm('Pause this member? They will not be able to make payments.')) {
      try {
        await pauseMember(id!);
        toast.success('Member paused successfully');
        loadData();
      } catch (error) {
        toast.error('Failed to pause member. Please try again.');
      }
    }
  };

  const handleResume = async () => {
    try {
      await resumeMember(id!);
      toast.success('Member resumed successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to resume member. Please try again.');
    }
  };

  const handleRemoveMember = async (password: string, transferBalance: boolean) => {
    try {
      await removeMember(id!);
      toast.success('Member removed successfully');
      navigate(ROUTES.PRIMARY_FAMILY);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
      throw error;
    }
  };

  const handleEditLimits = async (data: any) => {
    try {
      await updateLimits(id!, data);
      setShowEditLimits(false);
      toast.success('Limits updated successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to update limits. Please try again.');
    }
  };

  const handleSendMoney = () => {
    if (member) {
      navigate(`${ROUTES.PRIMARY_SEND}?to=${member.phone}&name=${encodeURIComponent(member.name)}&type=family`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="text-center py-12 max-w-md">
          <UserIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error ? 'Error Loading Member' : 'Member Not Found'}
          </h2>
          <p className="text-gray-600 mb-6">{error || "The family member you're looking for doesn't exist."}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate(ROUTES.PRIMARY_FAMILY)}>Back to Family</Button>
            <Button variant="outline" onClick={handleRefresh}>
              <ArrowPathIcon className="h-4 w-4 mr-1" /> Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const memberName = member?.name || member?.linked?.name || 'Unknown Member';
  const memberPhone = member?.phone || member?.linked?.phone || 'No phone';
  const memberEmail = member?.email || member?.linked?.email;
  const memberStatus = member?.status || 'UNKNOWN';
  const memberRelationship = member?.relationship;
  const memberSince = member?.memberSince || member?.linked?.createdAt;

  const dailySpent = member?.dailySpent || 0;
  const dailyLimit = member?.dailyLimit || 100;
  const monthlySpent = member?.monthlySpent || 0;
  const monthlyLimit = member?.monthlyLimit || 1000;
  const perTransactionLimit = member?.perTransactionLimit || 0;

  const dailyPercent = Math.min((dailySpent / dailyLimit) * 100, 100);
  const monthlyPercent = Math.min((monthlySpent / monthlyLimit) * 100, 100);
  const dailyRemaining = Math.max(dailyLimit - dailySpent, 0);
  const monthlyRemaining = Math.max(monthlyLimit - monthlySpent, 0);
  
  const permissions = member?.permissions || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(ROUTES.PRIMARY_FAMILY)} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Member Details</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEditLimits(true)}>
            <PencilIcon className="h-4 w-4 mr-1" /> Edit Limits
          </Button>
          {memberStatus === 'ACTIVE' ? (
            <Button variant="outline" size="sm" onClick={handlePause}>Pause</Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleResume}>Resume</Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowRemoveModal(true)}
            className="text-error border-error hover:bg-error-soft"
          >
            <TrashIcon className="h-4 w-4 mr-1" /> Remove
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <MemberHeader
        memberName={memberName}
        memberPhone={memberPhone}
        memberEmail={memberEmail}
        memberStatus={memberStatus}
        memberRelationship={memberRelationship}
        memberSince={memberSince}
        walletBalance={walletBalance}
        onSendMoney={handleSendMoney}
      />

      <UsageCards
        dailySpent={dailySpent}
        dailyLimit={dailyLimit}
        dailyPercent={dailyPercent}
        dailyRemaining={dailyRemaining}
        monthlySpent={monthlySpent}
        monthlyLimit={monthlyLimit}
        monthlyPercent={monthlyPercent}
        monthlyRemaining={monthlyRemaining}
        perTransactionLimit={perTransactionLimit}
        walletBalance={walletBalance}
        onAddLimit={handleAddLimitQuick}
        onSendMoney={handleSendMoney}
        formatCurrency={formatCurrency}
      />

      <PermissionsList permissions={permissions} />

      <TransactionsList
        transactions={transactions}
        memberId={id}
        onNavigate={navigate}
      />

      {showEditLimits && (
        <EditLimitsModal
          isOpen={showEditLimits}
          onClose={() => setShowEditLimits(false)}
          memberName={memberName}
          initialValues={{
            dailyLimit,
            monthlyLimit,
            perTransactionLimit,
            ...permissions
          }}
          onSubmit={handleEditLimits}
        />
      )}

      {showRemoveModal && (
        <RemoveMemberModal
          isOpen={showRemoveModal}
          onClose={() => setShowRemoveModal(false)}
          memberName={memberName}
          memberBalance={walletBalance}
          onConfirm={handleRemoveMember}
        />
      )}

      {refreshing && (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-40">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-2">Refreshing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyMemberDetails;