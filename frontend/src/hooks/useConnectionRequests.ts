// src/hooks/useConnectionRequests.ts
import { useState, useCallback } from 'react';
import { familyAPI } from '../services/api/family';
import { notificationsAPI } from '../services/api/notifications';
import { useAuth } from './useAuth';
import { ConnectionRequest } from '../types/family.types';
import toast from 'react-hot-toast';

export const useConnectionRequests = () => {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Parse notification data
  const parseNotificationData = (data: any): any => {
    if (!data) return null;
    try {
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
      return data;
    }
  };

  // Fetch connection requests from notifications
  const getConnectionRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const notifResponse = await notificationsAPI.getNotifications();
      
      const notifications = notifResponse.data?.data || notifResponse.data || [];
      const notificationsArray = Array.isArray(notifications) ? notifications : [];
      
      const connectionNotifs = notificationsArray.filter((n: any) => {
        const type = n.type?.toLowerCase() || '';
        return (
          type.includes('connection') ||
          type.includes('invitation') ||
          type === 'family_invitation' ||
          type === 'connection_request' ||
          type === 'invitation_received'
        );
      });
      
      const processedRequests: ConnectionRequest[] = await Promise.all(
        connectionNotifs.map(async (notif: any): Promise<ConnectionRequest> => {
          const parsedData = parseNotificationData(notif.data);
          const isForPrimary = user?.role === 'PRIMARY';
          
          const phone = parsedData?.phone || 
                       parsedData?.invitedPhone ||
                       parsedData?.linkedPhone ||
                       'Unknown';
          
          const inviteCode = parsedData?.inviteCode || 
                            parsedData?.code ||
                            null;
          
          let invitationId = parsedData?.invitationId || 
                            parsedData?.id || 
                            notif.invitationId || 
                            null;
          
          if (!invitationId && inviteCode) {
            try {
              const inviteResponse = await familyAPI.getInvitationByCode(inviteCode);
              if (inviteResponse.data?.data) {
                const invite = inviteResponse.data.data;
                invitationId = invite.id;
              }
            } catch (e) {
              // Ignore fetch error
            }
          }
          
          return {
            id: notif.id,
            userId: parsedData?.userId || parsedData?.primaryId || parsedData?.linkedId || '',
            phone: phone,
            name: parsedData?.name || parsedData?.primaryName || parsedData?.linkedName || phone,
            status: 'PENDING',
            createdAt: notif.createdAt || new Date().toISOString(),
            message: notif.message,
            notificationId: notif.id,
            invitationId: invitationId,
            inviteCode: inviteCode,
            relationship: parsedData?.relationship || 'Family Member',
            dailyLimit: parsedData?.dailyLimit || 500,
            monthlyLimit: parsedData?.monthlyLimit || 5000,
            perTransactionLimit: parsedData?.perTransactionLimit || 200,
            isForPrimary: isForPrimary,
            primaryInfo: parsedData?.primaryInfo || (parsedData?.primaryId ? {
              id: parsedData.primaryId,
              name: parsedData.primaryName || '',
              phone: parsedData.primaryPhone || '',
              email: parsedData.primaryEmail
            } : undefined),
            linkedInfo: parsedData?.linkedInfo || (parsedData?.linkedId ? {
              id: parsedData.linkedId,
              name: parsedData.linkedName || '',
              phone: parsedData.linkedPhone || ''
            } : undefined)
          };
        })
      );
      
      setRequests(processedRequests);
      return processedRequests;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch connection requests';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  // Accept a connection request
  const acceptRequest = useCallback(async (requestId: string) => {
    setProcessingId(requestId);
    setError(null);
    try {
      const request = requests.find(r => r.id === requestId);
      
      if (!request) {
        throw new Error('Request not found');
      }
      
      if (user?.role === 'PRIMARY') {
        if (request.invitationId) {
          const response = await familyAPI.acceptConnectionRequest(request.invitationId);
          
          if (!response.data?.success) {
            throw new Error(response.data?.message || 'Failed to accept request');
          }
          toast.success('Connection request accepted!');
        } else if (request.inviteCode) {
          try {
            const inviteResponse = await familyAPI.getInvitationByCode(request.inviteCode);
            if (inviteResponse.data?.data?.id) {
              const invitationId = inviteResponse.data.data.id;
              const response = await familyAPI.acceptConnectionRequest(invitationId);
              
              if (!response.data?.success) {
                throw new Error('Failed to accept request');
              }
              toast.success('Connection request accepted!');
            } else {
              throw new Error('Invalid invitation code');
            }
          } catch (error) {
            toast.error('Could not accept request. Please try the phone number method.');
            return false;
          }
        } else if (request.phone && request.phone !== 'Unknown') {
          const response = await familyAPI.connectToPrimary({ 
            method: 'manual', 
            phone: request.phone 
          });
          
          if (!response.data?.success) {
            throw new Error(response.data?.message || 'Failed to accept request');
          }
          toast.success('Connection request accepted!');
        } else {
          throw new Error('No valid acceptance method found');
        }
      } else if (user?.role === 'LINKED') {
        if (request.invitationId) {
          const response = await familyAPI.acceptInvitation(request.invitationId);
          
          if (!response.data?.success) {
            throw new Error(response.data?.message || 'Failed to accept invitation');
          }
          toast.success('Invitation accepted!');
        } else if (request.inviteCode) {
          const response = await familyAPI.acceptInvitationByCode({ inviteCode: request.inviteCode });
          
          if (!response.data?.success) {
            throw new Error(response.data?.message || 'Failed to accept invitation');
          }
          toast.success('Invitation accepted!');
        } else {
          toast.error('No valid invitation found');
          return false;
        }
      } else {
        toast.error('Unable to process request');
        return false;
      }
      
      await notificationsAPI.markAsRead(requestId);
      setRequests(prev => prev.filter(r => r.id !== requestId));
      
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to accept request';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setProcessingId(null);
    }
  }, [requests, user?.role]);

  // Reject a connection request
  const rejectRequest = useCallback(async (requestId: string) => {
    setProcessingId(requestId);
    setError(null);
    try {
      const request = requests.find(r => r.id === requestId);
      
      if (!request) {
        throw new Error('Request not found');
      }
      
      if (user?.role === 'PRIMARY' && request.invitationId) {
        try {
          await familyAPI.rejectInvitation(request.invitationId);
        } catch (e) {
          // Ignore rejection error
        }
      }
      
      await notificationsAPI.markAsRead(requestId);
      toast.success('Connection request rejected');
      setRequests(prev => prev.filter(r => r.id !== requestId));
      
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reject request';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setProcessingId(null);
    }
  }, [requests, user?.role]);

  // Clear all processed requests
  const clearRequests = useCallback(() => {
    setRequests([]);
    setError(null);
  }, []);

  // Refresh requests
  const refreshRequests = useCallback(async () => {
    return await getConnectionRequests();
  }, [getConnectionRequests]);

  // Get a specific request by ID
  const getRequestById = useCallback((requestId: string) => {
    return requests.find(r => r.id === requestId);
  }, [requests]);

  // Get pending count for primary users
  const getPrimaryPendingCount = useCallback(() => {
    return requests.filter(r => r.isForPrimary).length;
  }, [requests]);

  // Get pending count for linked users
  const getLinkedPendingCount = useCallback(() => {
    return requests.filter(r => !r.isForPrimary).length;
  }, [requests]);

  return {
    requests,
    loading,
    processingId,
    error,
    pendingCount: requests.length,
    primaryPendingCount: getPrimaryPendingCount(),
    linkedPendingCount: getLinkedPendingCount(),
    hasRequests: requests.length > 0,
    getConnectionRequests,
    acceptRequest,
    rejectRequest,
    getRequestById,
    clearRequests,
    refreshRequests
  };
};