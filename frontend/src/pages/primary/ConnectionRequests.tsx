// pages/primary/ConnectionRequests.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { familyAPI } from '../../services/api/family';
import { formatDate, formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

interface ConnectionRequest {
  id: string;
  inviteCode: string;
  invitedPhone: string;
  relationship: string;
  dailyLimit: number;
  monthlyLimit: number;
  perTransactionLimit: number;
  message?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
  primaryName?: string;
  primaryPhone?: string;
}

const ConnectionRequests: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'expired'>('pending');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await familyAPI.getPendingInvitations();
      console.log('📡 Connection requests response:', response.data);
      
      // Handle different response structures
      const data = response.data?.data || response.data || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('❌ Error loading requests:', error);
      setError(error.response?.data?.message || 'Failed to load connection requests');
      toast.error('Failed to load connection requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (invitationId: string) => {
    setProcessingId(invitationId);
    setError(null);
    
    try {
      const response = await familyAPI.approveRequest(invitationId);
      console.log('✅ Approve response:', response.data);
      
      if (response.data?.success) {
        toast.success('Request approved! The user can now connect.');
        // Update local state
        setRequests(prev => prev.filter(req => req.id !== invitationId));
      } else {
        throw new Error(response.data?.message || 'Failed to approve request');
      }
    } catch (error: any) {
      console.error('❌ Approve error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to approve request';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (invitationId: string) => {
    if (!window.confirm('Reject this connection request? This action cannot be undone.')) {
      return;
    }

    setProcessingId(invitationId);
    setError(null);
    
    try {
      const response = await familyAPI.rejectInvitation(invitationId);
      console.log('✅ Reject response:', response.data);
      
      if (response.data?.success) {
        toast.success('Request rejected');
        setRequests(prev => prev.filter(req => req.id !== invitationId));
      } else {
        throw new Error(response.data?.message || 'Failed to reject request');
      }
    } catch (error: any) {
      console.error('❌ Reject error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reject request';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs > 24) {
      const days = Math.floor(diffHrs / 24);
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    }
    return `${diffHrs}h ${diffMins}m remaining`;
  };

  const getFilteredRequests = () => {
    if (filter === 'all') return requests;
    if (filter === 'pending') return requests.filter(r => r.status === 'PENDING' && !isExpired(r.expiresAt));
    if (filter === 'expired') return requests.filter(r => r.status === 'EXPIRED' || isExpired(r.expiresAt));
    return requests.filter(r => r.status === filter.toUpperCase());
  };

  const filteredRequests = getFilteredRequests();
  const pendingCount = requests.filter(r => r.status === 'PENDING' && !isExpired(r.expiresAt)).length;
  const expiredCount = requests.filter(r => r.status === 'EXPIRED' || isExpired(r.expiresAt)).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading connection requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/primary/family')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Back to Family Management"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Connection Requests</h1>
            <p className="text-sm text-gray-500 mt-1">Review and manage family connection requests</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadRequests}
          disabled={loading}
        >
          <ArrowPathIcon className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </Card>
      )}

      {/* Info Banner */}
      <Card className="bg-gradient-to-r from-primary-soft to-blue-50 border border-primary/20">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <ShieldCheckIcon className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              <span className="font-medium text-gray-900">Review connection requests</span> from family members. 
              Approving will allow them to connect to your family account with the specified limits. 
              Requests expire after 7 days.
            </p>
          </div>
        </div>
      </Card>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
            filter === 'pending'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending
          {pendingCount > 0 && filter !== 'pending' && (
            <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center px-1">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'approved'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'rejected'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Rejected
        </button>
        <button
          onClick={() => setFilter('expired')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'expired'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Expired
          {expiredCount > 0 && filter !== 'expired' && (
            <span className="ml-2 text-xs bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded-full">
              {expiredCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({requests.length})
        </button>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserPlusIcon className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">No {filter} requests</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            {filter === 'pending' 
              ? "You don't have any pending connection requests at the moment."
              : `No ${filter} requests found.`}
          </p>
          {filter !== 'pending' && (
            <Button 
              variant="outline"
              onClick={() => setFilter('pending')}
            >
              View Pending Requests
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing {filteredRequests.length} {filter} {filteredRequests.length === 1 ? 'request' : 'requests'}
            </p>
          </div>

          {filteredRequests.map((request) => {
            const expired = request.status === 'EXPIRED' || isExpired(request.expiresAt);
            const timeRemaining = getTimeRemaining(request.expiresAt);
            
            return (
              <Card 
                key={request.id} 
                className={`border-l-4 transition-all ${
                  expired 
                    ? 'border-l-gray-400 opacity-70 bg-gray-50' 
                    : request.status === 'PENDING'
                      ? 'border-l-yellow-400 hover:shadow-lg'
                      : request.status === 'APPROVED'
                        ? 'border-l-green-400'
                        : request.status === 'REJECTED'
                          ? 'border-l-red-400'
                          : 'border-l-gray-400'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-white text-xl font-bold">
                        {request.invitedPhone?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {request.invitedPhone}
                        </h3>
                        {expired && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-full">
                            Expired
                          </span>
                        )}
                        {request.status === 'APPROVED' && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Approved
                          </span>
                        )}
                        {request.status === 'REJECTED' && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            Rejected
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        Wants to connect as{' '}
                        <span className="font-medium text-primary">
                          {request.relationship || 'Family Member'}
                        </span>
                      </p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                        <div className="bg-gray-50 p-2 rounded text-center">
                          <p className="text-xs text-gray-500">Daily Limit</p>
                          <p className="font-semibold text-gray-900">{formatCurrency(request.dailyLimit)}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded text-center">
                          <p className="text-xs text-gray-500">Monthly</p>
                          <p className="font-semibold text-gray-900">{formatCurrency(request.monthlyLimit)}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded text-center">
                          <p className="text-xs text-gray-500">Per Transaction</p>
                          <p className="font-semibold text-gray-900">{formatCurrency(request.perTransactionLimit)}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded text-center">
                          <p className="text-xs text-gray-500">Expires</p>
                          <p className="font-semibold text-gray-900 text-xs">
                            {formatDate(request.expiresAt, 'short')}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          Requested: {formatDate(request.createdAt, 'short')}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className={`flex items-center gap-1 ${
                          expired ? 'text-gray-400' : 'text-yellow-600'
                        }`}>
                          <ClockIcon className="h-3 w-3" />
                          {expired ? 'Expired' : timeRemaining}
                        </span>
                      </div>

                      {request.message && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                          <EnvelopeIcon className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-700">
                            <span className="font-medium text-blue-700">Message:</span> {request.message}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!expired && request.status === 'PENDING' && (
                    <div className="flex flex-row sm:flex-col gap-2 sm:min-w-[120px]">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        disabled={processingId === request.id}
                        className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                      >
                        {processingId === request.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(request.id)}
                        disabled={processingId === request.id}
                        className="border-red-300 text-red-600 hover:bg-red-50 flex-1 sm:flex-none"
                      >
                        {processingId === request.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mx-auto"></div>
                        ) : (
                          <>
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConnectionRequests;