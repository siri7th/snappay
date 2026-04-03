// src/hooks/useInvitations.ts
import { useState, useCallback } from 'react';
import { familyAPI } from '../services/api/family';
import { Invitation } from '../types/family.types';
import toast from 'react-hot-toast';

export const useInvitations = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get all pending invitations
  const getPendingInvitations = useCallback(async (showToast: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await familyAPI.getPendingInvitations();
      
      let invitationsData: Invitation[] = [];
      
      if (response.data?.data) {
        invitationsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        invitationsData = response.data;
      } else if (response.data?.invitations) {
        invitationsData = response.data.invitations;
      } else if (response.data?.success && response.data?.data === null) {
        invitationsData = [];
      } else {
        invitationsData = [];
      }
      
      if (!Array.isArray(invitationsData)) {
        invitationsData = [];
      }
      
      setInvitations(invitationsData);
      
      if (showToast && invitationsData.length > 0) {
        toast.success(`${invitationsData.length} pending invitation${invitationsData.length > 1 ? 's' : ''} found`);
      }
      
      return invitationsData;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to load invitations';
      setError(errorMessage);
      
      if (showToast) {
        toast.error(errorMessage);
      }
      
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Accept an invitation
  const acceptInvitation = useCallback(async (invitationId: string) => {
    setProcessingId(invitationId);
    setError(null);
    
    try {
      const response = await familyAPI.acceptInvitation(invitationId);
      
      if (response.data?.success) {
        toast.success('Invitation accepted successfully!');
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Failed to accept invitation');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to accept invitation';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setProcessingId(null);
    }
  }, []);

  // Reject an invitation
  const rejectInvitation = useCallback(async (invitationId: string) => {
    setProcessingId(invitationId);
    setError(null);
    
    try {
      const response = await familyAPI.rejectInvitation(invitationId);
      
      if (response.data?.success) {
        toast.success('Invitation rejected');
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Failed to reject invitation');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reject invitation';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setProcessingId(null);
    }
  }, []);

  // Cancel an invitation (primary only)
  const cancelInvitation = useCallback(async (invitationId: string) => {
    setProcessingId(invitationId);
    setError(null);
    
    try {
      const response = await familyAPI.cancelInvitation(invitationId);
      
      if (response.data?.success) {
        toast.success('Invitation cancelled');
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Failed to cancel invitation');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to cancel invitation';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setProcessingId(null);
    }
  }, []);

  // Get invitation by code
  const getInvitationByCode = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await familyAPI.getInvitationByCode(code);
      const invitationData = response.data?.data || response.data;
      return invitationData;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Invitation not found or expired';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Accept invitation by code
  const acceptInvitationByCode = useCallback(async (inviteCode: string) => {
    setProcessingId(inviteCode);
    setError(null);
    
    try {
      const response = await familyAPI.acceptInvitationByCode({ inviteCode });
      
      if (response.data?.success) {
        toast.success('Invitation accepted successfully!');
        await getPendingInvitations();
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Failed to accept invitation');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to accept invitation';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setProcessingId(null);
    }
  }, [getPendingInvitations]);

  // Refresh invitations
  const refreshInvitations = useCallback(async () => {
    return await getPendingInvitations(true);
  }, [getPendingInvitations]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    invitations,
    loading,
    processingId,
    error,
    hasInvitations: invitations.length > 0,
    pendingCount: invitations.length,
    getPendingInvitations,
    acceptInvitation,
    rejectInvitation,
    cancelInvitation,
    getInvitationByCode,
    acceptInvitationByCode,
    refreshInvitations,
    clearError,
  };
};