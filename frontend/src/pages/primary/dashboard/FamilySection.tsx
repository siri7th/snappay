// src/pages/primary/dashboard/FamilySection.tsx
import React from 'react';
import { NavigateFunction } from 'react-router-dom';
import { UsersIcon, PlusIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import FamilyMemberCard from '../../../components/family/FamilyMemberCard';
import { ROUTES } from '../../../utils/constants';

interface FamilySectionProps {
  familyMembers: any[];
  recentFamilyMembers: any[];
  onNavigate: NavigateFunction;
}

export const FamilySection: React.FC<FamilySectionProps> = ({
  familyMembers,
  recentFamilyMembers,
  onNavigate
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Family Members</h2>
          <p className="text-sm text-gray-500">Manage your linked accounts</p>
        </div>
        <div className="flex gap-2">
          {familyMembers?.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onNavigate(ROUTES.PRIMARY_FAMILY_ADD)}
            >
              <UserPlusIcon className="h-4 w-4 mr-1" />
              Add Member
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onNavigate(ROUTES.PRIMARY_FAMILY)}>
            View All ({familyMembers?.length || 0})
          </Button>
        </div>
      </div>
      
      {recentFamilyMembers.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {recentFamilyMembers.map((member) => (
            <FamilyMemberCard
              key={member.id}
              member={member}
              onView={(id) => onNavigate(ROUTES.PRIMARY_FAMILY_DETAILS.replace(':id', id))}
              onAddLimit={(id) => onNavigate(ROUTES.PRIMARY_FAMILY_ADD_LIMIT.replace(':id', id))}
            />
          ))}
        </div>
      ) : (
        <Card className="bg-gray-50 text-center py-12">
          <UsersIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No family members yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Add family members to manage their spending limits and track their transactions
          </p>
          <Button 
            size="lg" 
            onClick={() => onNavigate(ROUTES.PRIMARY_FAMILY_ADD)}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Your First Member
          </Button>
        </Card>
      )}
    </div>
  );
};