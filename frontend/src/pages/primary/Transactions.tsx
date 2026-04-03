// src/pages/primary/Transactions.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FunnelIcon, 
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import TransactionItem from '../../components/banking/TransactionItem';
import { useWallet } from '../../hooks/useWallet';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { TRANSACTION_TYPES, PAGINATION, ROUTES } from '../../utils/constants';
import { Transaction } from '../../types/payment.types';
import toast from 'react-hot-toast';

interface TransactionStats {
  total: number;
  sent: number;
  received: number;
  recharge: number;
  addToWallet: number;
  totalAmount: number;
}

const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { transactions, loading, getTransactions } = useWallet();
  
  const [stats, setStats] = useState<TransactionStats>({ 
    total: 0, 
    sent: 0, 
    received: 0, 
    recharge: 0,
    addToWallet: 0,
    totalAmount: 0 
  });
  
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    search: searchParams.get('search') || '',
    minAmount: searchParams.get('minAmount') || '',
    maxAmount: searchParams.get('maxAmount') || '',
  });

  const [pagination, setPagination] = useState({
    page: Number(searchParams.get('page')) || PAGINATION.DEFAULT_PAGE,
    limit: PAGINATION.DEFAULT_LIMIT,
    total: 0,
    pages: 0
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, [pagination.page, filters]);

  const loadData = async () => {
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        type: filters.type || undefined,
        search: filters.search || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      };

      if (filters.minAmount) params.minAmount = parseFloat(filters.minAmount);
      if (filters.maxAmount) params.maxAmount = parseFloat(filters.maxAmount);

      const result = await getTransactions(params);

      const txns: Transaction[] = (result as any)?.transactions || transactions || [];
      const totalAmount = txns.reduce((sum, t) => sum + Number((t as any).amount || 0), 0);
      const sent = txns.filter((t) => t.type === 'SEND').length;
      const received = txns.filter((t) => t.type === 'RECEIVE').length;
      const recharge = txns.filter((t) => t.type === 'RECHARGE').length;
      const addToWallet = txns.filter((t) => t.type === 'ADD_TO_WALLET').length;

      setStats({
        total: txns.length,
        sent,
        received,
        recharge,
        addToWallet,
        totalAmount,
      });

      // Update URL params
      const newParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) newParams.set(key, value);
      });
      newParams.set('page', pagination.page.toString());
      setSearchParams(newParams);

    } catch (error) {
      toast.error('Failed to load transactions');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = async () => {
    await loadData();
    toast.success('Transactions refreshed');
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      startDate: '',
      endDate: '',
      search: '',
      minAmount: '',
      maxAmount: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleExport = () => {
    if (!transactions || transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const headers = ['Date', 'Transaction ID', 'Type', 'Description', 'Amount', 'Status'];
    const csvContent = [
      headers.join(','),
      ...transactions.map((t: Transaction) => [
        formatDate(t.createdAt, 'short'),
        t.transactionId,
        t.type,
        `"${t.description || ''}"`,
        t.amount,
        t.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Transactions exported successfully');
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');
  const filteredTotalAmount = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">View and filter your transaction history</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-primary-soft' : ''}
          >
            <FunnelIcon className="h-4 w-4 mr-1" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 w-2 h-2 bg-primary rounded-full"></span>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!transactions?.length}>
            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <ArrowPathIcon className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
        <Card className="text-center p-4">
          <p className="text-sm text-gray-600">Add to Wallet</p>
          <p className="text-xl font-bold text-purple-600">{stats.addToWallet}</p>
        </Card>
        <Card className="text-center p-4 bg-primary-soft">
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="text-xl font-bold text-primary">
            ₹{Number(stats.totalAmount ?? 0).toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Filter Transactions</h2>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-primary hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Transaction Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">All Types</option>
                {Object.entries(TRANSACTION_TYPES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {key.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Min Amount (₹)</label>
              <Input
                type="number"
                placeholder="Min amount"
                value={filters.minAmount}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                className="text-sm"
                min="0"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Max Amount (₹)</label>
              <Input
                type="number"
                placeholder="Max amount"
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                className="text-sm"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Search</label>
              <Input
                placeholder="Search by ID, description..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Active filters:</p>
              <div className="flex flex-wrap gap-2">
                {filters.type && (
                  <span className="px-2 py-1 bg-primary-soft text-primary text-xs rounded-full">
                    Type: {filters.type}
                  </span>
                )}
                {filters.startDate && (
                  <span className="px-2 py-1 bg-primary-soft text-primary text-xs rounded-full">
                    From: {filters.startDate}
                  </span>
                )}
                {filters.endDate && (
                  <span className="px-2 py-1 bg-primary-soft text-primary text-xs rounded-full">
                    To: {filters.endDate}
                  </span>
                )}
                {filters.minAmount && (
                  <span className="px-2 py-1 bg-primary-soft text-primary text-xs rounded-full">
                    Min: ₹{filters.minAmount}
                  </span>
                )}
                {filters.maxAmount && (
                  <span className="px-2 py-1 bg-primary-soft text-primary text-xs rounded-full">
                    Max: ₹{filters.maxAmount}
                  </span>
                )}
                {filters.search && (
                  <span className="px-2 py-1 bg-primary-soft text-primary text-xs rounded-full">
                    Search: "{filters.search}"
                  </span>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Results Summary */}
      {transactions && transactions.length > 0 && (
        <div className="flex justify-between items-center text-sm text-gray-500">
          <p>
            Showing {transactions.length} of {stats.total} transactions
            {filteredTotalAmount !== stats.totalAmount && (
              <span className="ml-1">
                (Total: {formatCurrency(filteredTotalAmount)})
              </span>
            )}
          </p>
          <p className="text-xs">
            Page {pagination.page} of {pagination.pages || 1}
          </p>
        </div>
      )}

      {/* Transactions List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-500 mt-3">Loading transactions...</p>
          </div>
        ) : transactions?.length === 0 ? (
          <div className="text-center py-16">
            <FunnelIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg mb-2">No transactions found</p>
            <p className="text-sm text-gray-400 mb-6">
              {hasActiveFilters 
                ? 'Try adjusting your filters to see more results'
                : 'Start sending or receiving money to see transactions'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions?.map((txn: Transaction) => (
              <TransactionItem
                key={txn.id}
                transaction={txn}
                onClick={() => navigate(ROUTES.TRANSACTION_DETAILS.replace(':id', txn.id))}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
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
    </div>
  );
};

export default Transactions;