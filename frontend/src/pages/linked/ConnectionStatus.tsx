// pages/linked/ConnectionStatus.tsx - Fixed toast methods
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useFamily } from '../../hooks/useFamily';
import { familyAPI } from '../../services/api/family';
import { useInvitations } from '../../hooks/useInvitations';
import { useConnectionRequests } from '../../hooks/useConnectionRequests';
import { PendingStatus } from './connection-status/PendingStatus';
import { ApprovedStatus } from './connection-status/ApprovedStatus';
import { RejectedStatus } from './connection-status/RejectedStatus';
import { ExpiredStatus } from './connection-status/ExpiredStatus';
import toast from 'react-hot-toast';

interface ConnectionRequestDetails {
  id: string;
  inviteCode: string;
  primary?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  relationship: string;
  dailyLimit: number;
  monthlyLimit: number;
  perTransactionLimit: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
  message?: string;
}

const ConnectionStatus: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getPrimaryDetails, primaryDetails, loading: familyLoading } = useFamily();
  const { getInvitationByCode, loading: invitationLoading } = useInvitations();
  const { getConnectionRequests, refreshRequests } = useConnectionRequests();
  
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'>('PENDING');
  const [connectionRequest, setConnectionRequest] = useState<ConnectionRequestDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [invitationId, setInvitationId] = useState<string | null>(null);

  const inviteCode = location.state?.inviteCode;
  const initialStatus = location.state?.status || 'PENDING';

  useEffect(() => {
    // Get invitationId from location state if available
    if (location.state?.invitationId) {
      setInvitationId(location.state.invitationId);
      localStorage.setItem('pending_invitation_id', location.state.invitationId);
    } else {
      const storedId = localStorage.getItem('pending_invitation_id');
      if (storedId) {
        setInvitationId(storedId);
      }
    }
    
    fetchConnectionStatus();
  }, [location.state]);

  useEffect(() => {
    if (connectionRequest?.expiresAt) {
      updateTimeRemaining();
      const timer = setInterval(updateTimeRemaining, 60000);
      return () => clearInterval(timer);
    }
  }, [connectionRequest]);

  const updateTimeRemaining = () => {
    if (!connectionRequest?.expiresAt) return;
    
    const now = new Date();
    const expiry = new Date(connectionRequest.expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      setTimeRemaining('Expired');
      setStatus('EXPIRED');
      return;
    }
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs > 24) {
      const days = Math.floor(diffHrs / 24);
      setTimeRemaining(`${days} day${days > 1 ? 's' : ''} remaining`);
    } else {
      setTimeRemaining(`${diffHrs}h ${diffMins}m remaining`);
    }
  };

  const fetchConnectionStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📡 Fetching connection status...');
      
      // First check if we're already connected
      const details = await getPrimaryDetails();
      
      if (details) {
        console.log('✅ Already connected to primary');
        setStatus('APPROVED');
        localStorage.removeItem('pending_invitation_id');
        setLoading(false);
        return;
      }

      // If not connected and we have an invitationId or inviteCode, fetch its status
      if (invitationId) {
        console.log('📡 Fetching invitation by ID:', invitationId);
        try {
          const response = await familyAPI.getInvitationById(invitationId);
          console.log('✅ Invitation response:', response.data);
          
          if (response.data?.data) {
            setConnectionRequest(response.data.data);
            setStatus(response.data.data.status);
          }
        } catch (error) {
          console.log('⚠️ Could not fetch invitation by ID, checking localStorage');
        }
      } else if (inviteCode) {
        console.log('📡 Fetching invitation by code:', inviteCode);
        try {
          const invitation = await getInvitationByCode(inviteCode);
          console.log('✅ Invitation by code:', invitation);
          
          if (invitation) {
            setConnectionRequest(invitation);
            setStatus(invitation.status);
            if (invitation.id) {
              localStorage.setItem('pending_invitation_id', invitation.id);
              setInvitationId(invitation.id);
            }
          }
        } catch (error) {
          console.log('⚠️ Could not fetch invitation by code');
        }
      }
      
      // If we still don't have a request, check localStorage
      if (!connectionRequest) {
        const pendingRequest = localStorage.getItem('pending_connection');
        if (pendingRequest) {
          try {
            const parsed = JSON.parse(pendingRequest);
            setConnectionRequest(parsed);
            setStatus(parsed.status || 'PENDING');
          } catch (e) {
            // Ignore parse error
          }
        } else {
          setStatus('PENDING');
        }
      }
    } catch (error: any) {
      console.error('❌ Error fetching connection status:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load connection status');
      toast.error('Failed to load connection status');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    try {
      const details = await getPrimaryDetails();
      
      if (details) {
        setStatus('APPROVED');
        toast.success('Your connection has been approved!');
        localStorage.removeItem('pending_invitation_id');
        return;
      }

      if (invitationId) {
        try {
          const response = await familyAPI.getInvitationById(invitationId);
          if (response.data?.data) {
            const newStatus = response.data.data.status;
            setStatus(newStatus);
            setConnectionRequest(response.data.data);
            
            if (newStatus === 'APPROVED') {
              toast.success('Your connection has been approved!');
              localStorage.removeItem('pending_invitation_id');
            } else if (newStatus === 'REJECTED') {
              toast.error('Your request was rejected');
            } else if (newStatus === 'EXPIRED') {
              toast.error('Your request has expired');
            } else {
              toast('Request still pending', { // Fixed: changed from toast.info to toast
                icon: '⏳',
                duration: 3000
              });
            }
          }
        } catch (error) {
          console.log('Could not fetch invitation status');
        }
      } else {
        const requests = await refreshRequests();
        const pendingRequest = requests.find(r => 
          (invitationId && r.invitationId === invitationId) ||
          (inviteCode && r.inviteCode === inviteCode)
        );

        if (pendingRequest) {
          toast('Request still pending', { // Fixed: changed from toast.info to toast
            icon: '⏳',
            duration: 3000
          });
        } else {
          toast('No updates yet', { // Fixed: changed from toast.info to toast
            icon: 'ℹ️',
            duration: 3000
          });
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
      toast.error('Failed to check status');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleRefresh = async () => {
    await fetchConnectionStatus();
  };

  const handleCancelRequest = async () => {
    if (!invitationId && !inviteCode) {
      toast.error('No active request to cancel');
      return;
    }

    if (confirm('Are you sure you want to cancel this connection request? This action cannot be undone.')) {
      try {
        if (invitationId) {
          await familyAPI.cancelInvitation(invitationId);
        } else if (inviteCode) {
          const invitation = await getInvitationByCode(inviteCode);
          if (invitation?.id) {
            await familyAPI.cancelInvitation(invitation.id);
          }
        }
        
        localStorage.removeItem('pending_connection');
        localStorage.removeItem('pending_invitation_id');
        toast.success('Request cancelled');
        navigate('/linked/connect');
      } catch (error: any) {
        console.error('❌ Error cancelling request:', error);
        toast.error(error.response?.data?.message || 'Failed to cancel request');
      }
    }
  };

  const handleCopyInviteCode = () => {
    if (connectionRequest?.inviteCode) {
      navigator.clipboard.writeText(connectionRequest.inviteCode);
      toast.success('Invite code copied to clipboard');
    }
  };

  const handleGoToDashboard = () => {
    navigate('/linked/dashboard');
  };

  const handleTryAgain = () => {
    navigate('/linked/connect');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || familyLoading || invitationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading connection status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/linked/connect')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Back to Connect"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Connection Status</h1>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-50 border-red-200">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </Card>
        )}

        {/* Status Cards */}
        {status === 'PENDING' && (
          <PendingStatus
            connectionRequest={connectionRequest}
            timeRemaining={timeRemaining}
            checkingStatus={checkingStatus}
            onCheckStatus={handleCheckStatus}
            onCancelRequest={handleCancelRequest}
            onCopyInviteCode={handleCopyInviteCode}
            formatDate={formatDate}
          />
        )}

        {status === 'APPROVED' && (
          <ApprovedStatus
            primaryDetails={primaryDetails}
            onGoToDashboard={handleGoToDashboard}
            formatDate={formatDate}
          />
        )}

        {status === 'REJECTED' && (
          <RejectedStatus
            connectionRequest={connectionRequest}
            onTryAgain={handleTryAgain}
          />
        )}

        {status === 'EXPIRED' && (
          <ExpiredStatus onTryAgain={handleTryAgain} />
        )}

        {/* Support Info */}
        <Card className="bg-gray-50 border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Need help?{' '}
            <button 
              onClick={() => navigate('/support')}
              className="text-primary hover:underline font-medium"
            >
              Contact Support
            </button>
          </p>
        </Card>

        {/* Debug Info - Only in development */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-gray-100">
            <details>
              <summary className="text-xs font-mono cursor-pointer text-gray-500">
                Debug Info
              </summary>
              <div className="mt-2 text-xs font-mono space-y-1 text-gray-600">
                <p>Status: {status}</p>
                <p>Invitation ID: {invitationId || 'none'}</p>
                <p>Invite Code: {inviteCode || 'none'}</p>
                <p>Has Request: {connectionRequest ? 'yes' : 'no'}</p>
                <p>Time Remaining: {timeRemaining || 'N/A'}</p>
                <p>Connected: {primaryDetails ? 'yes' : 'no'}</p>
              </div>
            </details>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;