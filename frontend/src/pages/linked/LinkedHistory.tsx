// pages/linked/LinkedHistory.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FunnelIcon, 
  ClockIcon, 
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon 
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import TransactionItem from '../../components/banking/TransactionItem';
import { useWallet } from '../../hooks/useWallet';
import { TRANSACTION_TYPES, PAGINATION } from '../../utils/constants';

const LinkedHistory: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { transactions, loading, getTransactions } = useWallet();
  
  const [filter, setFilter] = useState({
    type: searchParams.get('type') || '',
    search: searchParams.get('search') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
  });
  
  const [pagination, setPagination] = useState({
    page: Number(searchParams.get('page')) || PAGINATION.DEFAULT_PAGE,
    limit: PAGINATION.DEFAULT_LIMIT,
    total: 0,
    pages: 0
  });

  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    received: 0,
    recharge: 0,
    totalAmount: 0
  });

  useEffect(() => {
    loadTransactions();
  }, [pagination.page, filter]);

  const loadTransactions = async () => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      type: filter.type || undefined,
      search: filter.search || undefined,
      startDate: filter.startDate || undefined,
      endDate: filter.endDate || undefined,
    };
    
    const response = await getTransactions(params);
    
    if (response?.pagination) {
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages
      }));
    }
    
    // Calculate stats
    if (transactions) {
      const sent = transactions.filter(t => t.type === 'SEND' || t.type === 'PAYMENT').length;
      const received = transactions.filter(t => t.type === 'RECEIVE').length;
      const recharge = transactions.filter(t => t.type === 'RECHARGE').length;
      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      
      setStats({
        total: transactions.length,
        sent,
        received,
        recharge,
        totalAmount
      });
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilter(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
    
    // Update URL params
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    setSearchParams(searchParams);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    searchParams.set('page', newPage.toString());
    setSearchParams(searchParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = async () => {
    await loadTransactions();
  };

  const handleClearFilters = () => {
    setFilter({ type: '', search: '', startDate: '', endDate: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
    setSearchParams({});
  };

  const filteredTransactions = transactions?.filter((txn) => {
    if (filter.type && txn.type !== filter.type) return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return (
        txn.description?.toLowerCase().includes(searchLower) ||
        txn.transactionId.toLowerCase().includes(searchLower) ||
        txn.senderName?.toLowerCase().includes(searchLower) ||
        txn.receiverName?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-sm text-gray-500 mt-1">View and filter your transactions</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <ArrowPathIcon className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="text-center p-4">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-xl font-bold text-gray-900">{stats.total}</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-sm text-gray-600">Sent</p>
          <p className="text-xl font-bold text-error">{stats.sent}</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-sm text-gray-600">Received</p>
          <p className="text-xl font-bold text-success">{stats.received}</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-sm text-gray-600">Recharge</p>
          <p className="text-xl font-bold text-primary">{stats.recharge}</p>
        </Card>
        <Card className="text-center p-4 bg-primary-soft">
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="text-xl font-bold text-primary">₹{stats.totalAmount.toLocaleString()}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <h2 className="font-semibold">Filters</h2>
          {(filter.type || filter.search || filter.startDate || filter.endDate) && (
            <button
              onClick={handleClearFilters}
              className="ml-auto text-sm text-primary hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Transaction Type</label>
            <select
              value={filter.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">All Types</option>
              {Object.entries(TRANSACTION_TYPES).map(([key, value]) => (
                <option key={key} value={value}>
                  {key.charAt(0) + key.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start Date</label>
            <Input
              type="date"
              placeholder="Start Date"
              value={filter.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1">End Date</label>
            <Input
              type="date"
              placeholder="End Date"
              value={filter.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1">Search</label>
            <Input
              placeholder="Search by ID, description, name..."
              value={filter.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Transactions List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-500 mt-3">Loading transactions...</p>
          </div>
        ) : filteredTransactions?.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg mb-2">No transactions found</p>
            <p className="text-sm text-gray-400 mb-6">
              {filter.type || filter.search || filter.startDate || filter.endDate
                ? 'Try adjusting your filters'
                : 'Start sending or receiving money to see transactions'}
            </p>
            {(filter.type || filter.search || filter.startDate || filter.endDate) && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTransactions?.map((txn) => (
              <TransactionItem
                key={txn.id}
                transaction={txn}
                onClick={() => navigate(`/transactions/${txn.id}`)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                Page <span className="font-medium">{pagination.page}</span> of{' '}
                <span className="font-medium">{pagination.pages}</span>
              </span>
              <span className="text-sm text-gray-500">
                ({(pagination.page - 1) * pagination.limit + 1} -{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total})
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Export Option */}
      {filteredTransactions && filteredTransactions.length > 0 && (
        <div className="mt-4 text-right">
          <Button variant="outline" size="sm">
            Export to CSV
          </Button>
        </div>
      )}
    </div>
  );
};

export default LinkedHistory;