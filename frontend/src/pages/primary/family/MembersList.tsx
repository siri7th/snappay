// src/pages/primary/family/MembersList.tsx
import React from 'react';
import { UsersIcon, PlusIcon, BellIcon, ChartBarIcon, WalletIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FamilyMemberCard from '../../../components/family/FamilyMemberCard';
import { formatCurrency } from '../../../utils/formatters';

interface MembersListProps {
  members: any[];
  totalCount: number;
  search: string;
  filter: string;
  totalFamilyBalance: number;
  onClearFilters: () => void;
  onViewMember: (id: string) => void;
  onEditMember: (id: string) => void;
  onPauseMember: (id: string) => void;
  onResumeMember: (id: string) => void;
  onAddLimit: (id: string) => void;
  onSendMoney: (id: string, name: string, phone: string) => void;
  onRemoveMember: (id: string) => void;
  onAddMember: () => void;
  onViewRequests: () => void;
  totalPendingItems: number;
}

export const MembersList: React.FC<MembersListProps> = ({
  members,
  totalCount,
  search,
  filter,
  totalFamilyBalance,
  onClearFilters,
  onViewMember,
  onEditMember,
  onPauseMember,
  onResumeMember,
  onAddLimit,
  onSendMoney,
  onRemoveMember,
  onAddMember,
  onViewRequests,
  totalPendingItems
}) => {
  if (members.length === 0) {
    return (
      <Card className="text-center py-16">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <UsersIcon className="h-10 w-10 text-gray-400" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {search || filter !== 'all' 
            ? 'No matching members found' 
            : 'No family members yet'
          }
        </h3>
        
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          {search || filter !== 'all' 
            ? 'Try adjusting your search or filter to find what you\'re looking for'
            : 'Start by adding your first family member to manage their spending limits'
          }
        </p>
        
        {!search && filter === 'all' && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={onAddMember} size="lg">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Your First Member
            </Button>
            {totalPendingItems > 0 && (
              <Button 
                variant="outline" 
                size="lg" 
                onClick={onViewRequests}
              >
                <BellIcon className="h-5 w-5 mr-2" />
                View Requests ({totalPendingItems})
              </Button>
            )}
          </div>
        )}
        
        {(search || filter !== 'all') && (
          <Button 
            variant="outline" 
            onClick={onClearFilters}
          >
            Clear Filters
          </Button>
        )}
      </Card>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-2 gap-4">
        {members.map(member => (
          <FamilyMemberCard
            key={member.id}
            member={{
              ...member,
              walletBalance: member.walletBalance || 0
            }}
            onView={onViewMember}
            onEdit={onEditMember}
            onPause={member.status === 'ACTIVE' ? onPauseMember : undefined}
            onResume={member.status === 'PAUSED' ? onResumeMember : undefined}
            onAddLimit={onAddLimit}
            onSendMoney={onSendMoney}
            onRemove={onRemoveMember}
          />
        ))}
      </div>
      
      {/* Results Summary */}
      <Card className="bg-gray-50 border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <span className="text-gray-600">
            Showing <span className="font-semibold">{members.length}</span> of{' '}
            <span className="font-semibold">{totalCount}</span> members
          </span>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4 text-primary" />
              <span className="text-gray-600">
                Active: <span className="font-semibold text-green-600">
                  {members.filter(m => m.status === 'ACTIVE').length}
                </span>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <WalletIcon className="h-4 w-4 text-indigo-500" />
              <span className="text-gray-600">
                Balance: <span className="font-bold text-primary">{formatCurrency(totalFamilyBalance)}</span>
              </span>
            </div>
            
            {(search || filter !== 'all') && (
              <button
                onClick={onClearFilters}
                className="text-primary hover:text-primary-dark font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </Card>
    </>
  );
};