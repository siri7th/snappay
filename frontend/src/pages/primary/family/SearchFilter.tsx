// src/pages/primary/family/SearchFilter.tsx
import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';

interface SearchFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: 'all' | 'active' | 'paused' | 'pending';
  onFilterChange: (filter: 'all' | 'active' | 'paused' | 'pending') => void;
  totalCount: number;
  activeCount: number;
  pausedCount: number;
  pendingCount: number;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  totalCount,
  activeCount,
  pausedCount,
  pendingCount
}) => {
  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name or phone"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'paused', 'pending'] as const).map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`px-4 py-2 rounded-lg capitalize text-sm font-medium transition-colors ${
                filter === f 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f} {f === 'all' ? `(${totalCount})` : 
                    f === 'active' ? `(${activeCount})` : 
                    f === 'paused' ? `(${pausedCount})` :
                    `(${pendingCount})`}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};