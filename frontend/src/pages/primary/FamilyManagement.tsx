// src/pages/primary/FamilyManagement.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  ArrowPathIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/common/Button';
import { useFamily } from '../../hooks/useFamily';
import { useInvitations } from '../../hooks/useInvitations';
import { useConnectionRequests } from '../../hooks/useConnectionRequests';
import { FamilyStats } from './family/FamilyStats';
import { SearchFilter } from './family/SearchFilter';
import { ConnectionRequestsSection } from './family/ConnectionRequestsSection';
import { InvitationsSection } from './family/InvitationsSection';
import { MembersList } from './family/MembersList';
import { DebugSection } from './family/DebugSection';
import { ROUTES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const FamilyManagement: React.FC = () => {
  const navigate = useNavigate();
  const { 
    familyMembers, 
    familyStats, 
    getFamilyMembers, 
    updateMemberStatus,
    removeMember,
    loading 
  } = useFamily();
  
  const { 
    invitations: pendingInvitations, 
    getPendingInvitations, 
    acceptInvitation, 
    rejectInvitation,
    loading: invitationsLoading 
  } = useInvitations();
  
  const { 
    requests: connectionRequests, 
    getConnectionRequests, 
    acceptRequest, 
    rejectRequest,
    processingId: connectionProcessingId 
  } = useConnectionRequests();
  
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'pending'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [membersWithBalance, setMembersWithBalance] = useState<any[]>([]);
  const [totalFamilyBalance, setTotalFamilyBalance] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setMembersWithBalance(familyMembers);
    calculateTotalBalance(familyMembers);
  }, [familyMembers]);

  const loadData = async () => {
    setRefreshing(true);
    setProcessingId(null);
    try {
      await getFamilyMembers();
      await getPendingInvitations();
      await getConnectionRequests();
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await loadData();
  };

  const calculateTotalBalance = (members: any[]) => {
    const total = members.reduce((sum, member) => sum + (member.walletBalance || 0), 0);
    setTotalFamilyBalance(total);
  };

  const handlePause = async (id: string) => {
    try {
      await updateMemberStatus(id, 'PAUSED');
      toast.success('Member paused successfully');
      await loadData();
    } catch (error) {
      toast.error('Failed to pause member');
    }
  };

  const handleResume = async (id: string) => {
    try {
      await updateMemberStatus(id, 'ACTIVE');
      toast.success('Member resumed successfully');
      await loadData();
    } catch (error) {
      toast.error('Failed to resume member');
    }
  };

  const handleRemove = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this member? This action cannot be undone.')) {
      try {
        await removeMember(id);
        toast.success('Member removed successfully');
        await loadData();
      } catch (error) {
        toast.error('Failed to remove member');
      }
    }
  };

  const handleSendMoney = (memberId: string, memberName: string, memberPhone: string) => {
    navigate(`${ROUTES.PRIMARY_SEND}?to=${memberPhone}&name=${encodeURIComponent(memberName)}&type=family`);
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    setProcessingId(invitationId);
    try {
      await acceptInvitation(invitationId);
      toast.success('Invitation accepted!');
      await loadData();
    } catch (error) {
      toast.error('Failed to accept invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    if (window.confirm('Reject this invitation?')) {
      setProcessingId(invitationId);
      try {
        await rejectInvitation(invitationId);
        toast.success('Invitation rejected');
        await loadData();
      } catch (error) {
        toast.error('Failed to reject invitation');
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleAcceptConnection = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const success = await acceptRequest(requestId);
      if (success) {
        toast.success('Connection request accepted!');
        await loadData();
      }
    } catch (error) {
      toast.error('Failed to accept connection request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConnection = async (requestId: string) => {
    if (window.confirm('Reject this connection request?')) {
      setProcessingId(requestId);
      try {
        await rejectRequest(requestId);
        toast.success('Connection request rejected');
        await loadData();
      } catch (error) {
        toast.error('Failed to reject connection request');
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleViewAllRequests = () => {
    navigate(ROUTES.PRIMARY_FAMILY_REQUESTS);
  };

  // Filter members based on search and filter
  const filteredMembers = membersWithBalance.filter(member => {
    if (filter !== 'all' && member.status?.toLowerCase() !== filter) return false;
    if (search) {
      return (
        member.name?.toLowerCase().includes(search.toLowerCase()) ||
        member.phone?.includes(search)
      );
    }
    return true;
  });

  // Calculate stats
  const displayStats = {
    total: familyStats?.total || familyMembers.length || 0,
    active: familyStats?.active || familyMembers.filter(m => m.status === 'ACTIVE').length || 0,
    paused: familyStats?.paused || familyMembers.filter(m => m.status === 'PAUSED').length || 0,
    pending: familyStats?.pending || familyMembers.filter(m => m.status === 'PENDING').length || 0,
    totalDailySpent: familyStats?.totalDailySpent || 
      familyMembers.reduce((sum, m) => sum + (m.dailySpent || 0), 0) || 0,
    totalMonthlySpent: familyStats?.totalMonthlySpent || 
      familyMembers.reduce((sum, m) => sum + (m.monthlySpent || 0), 0) || 0
  };

  const totalPendingItems = pendingInvitations.length + connectionRequests.length;

  if (loading && !refreshing && !invitationsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Family Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your linked family accounts</p>
        </div>
        
        <div className="flex gap-2">
          {(pendingInvitations.length > 0 || connectionRequests.length > 0) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleViewAllRequests}
              className="relative border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            >
              <BellIcon className="h-4 w-4 mr-1" />
              Requests
              <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center px-1 animate-pulse">
                {totalPendingItems}
              </span>
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button onClick={() => navigate(ROUTES.PRIMARY_FAMILY_ADD)}>
            <PlusIcon className="h-4 w-4 mr-1" /> Add Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <FamilyStats 
        displayStats={displayStats}
        totalPendingItems={totalPendingItems}
        totalFamilyBalance={totalFamilyBalance}
        onViewAllRequests={handleViewAllRequests}
      />

      {/* Search and Filter */}
      <SearchFilter
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
        totalCount={displayStats.total}
        activeCount={displayStats.active}
        pausedCount={displayStats.paused}
        pendingCount={totalPendingItems}
      />

      {/* Connection Requests Section */}
      {connectionRequests.length > 0 && (
        <ConnectionRequestsSection
          requests={connectionRequests}
          processingId={processingId}
          onAccept={handleAcceptConnection}
          onReject={handleRejectConnection}
          onViewAll={handleViewAllRequests}
        />
      )}

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <InvitationsSection
          invitations={pendingInvitations}
          processingId={processingId}
          onAccept={handleAcceptInvitation}
          onReject={handleRejectInvitation}
          onViewAll={handleViewAllRequests}
        />
      )}

      {/* Members List */}
      <MembersList
        members={filteredMembers}
        totalCount={displayStats.total}
        search={search}
        filter={filter}
        totalFamilyBalance={totalFamilyBalance}
        onClearFilters={() => {
          setSearch('');
          setFilter('all');
        }}
        onViewMember={(id) => navigate(ROUTES.PRIMARY_FAMILY_DETAILS.replace(':id', id))}
        onEditMember={(id) => navigate(ROUTES.PRIMARY_FAMILY_EDIT.replace(':id', id))}
        onPauseMember={handlePause}
        onResumeMember={handleResume}
        onAddLimit={(id) => navigate(ROUTES.PRIMARY_FAMILY_ADD_LIMIT.replace(':id', id))}
        onSendMoney={handleSendMoney}
        onRemoveMember={handleRemove}
        onAddMember={() => navigate(ROUTES.PRIMARY_FAMILY_ADD)}
        onViewRequests={handleViewAllRequests}
        totalPendingItems={totalPendingItems}
      />

      {/* Debug Section */}
      {process.env.NODE_ENV === 'development' && (
        <DebugSection
          pendingInvitations={pendingInvitations}
          connectionRequests={connectionRequests}
          onTestInvitations={getPendingInvitations}
          onTestConnectionRequests={getConnectionRequests}
        />
      )}
    </div>
  );
};

export default FamilyManagement;