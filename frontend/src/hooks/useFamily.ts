// src/hooks/useFamily.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { familyAPI } from '../services/api/family';
import { useAuth } from './useAuth';
import { STORAGE_KEYS } from '../utils/constants';
import { FamilyMember, FamilyStats, PrimaryDetails, LimitRequest } from '../types/family.types';
import toast from 'react-hot-toast';

// Per-hook request deduplication map
const createRequestMap = () => new Map<string, Promise<any>>();

export const useFamily = () => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyStats, setFamilyStats] = useState<FamilyStats>({
    total: 0,
    active: 0,
    paused: 0,
    pending: 0,
    totalDailySpent: 0,
    totalMonthlySpent: 0,
    totalMembers: 0,
    activeMembers: 0
  });
  const [limits, setLimits] = useState<any>(null);
  const [requests, setRequests] = useState<LimitRequest[]>([]);
  const [primaryDetails, setPrimaryDetails] = useState<PrimaryDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [initialized, setInitialized] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const userRole = user?.role || null;

  const pendingRequests = useRef(createRequestMap()).current;
  const isCheckingRef = useRef(false);
  const lastCheckTimeRef = useRef(0);
  const checkTimeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);
  const initialCheckDoneRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
      pendingRequests.clear();
    };
  }, [pendingRequests]);

  // Reset state when auth changes
  useEffect(() => {
    if (!isAuthenticated) {
      setFamilyMembers([]);
      setFamilyStats({
        total: 0, active: 0, paused: 0, pending: 0,
        totalDailySpent: 0, totalMonthlySpent: 0,
        totalMembers: 0, activeMembers: 0
      });
      setPrimaryDetails(null);
      setLimits(null);
      setConnectionStatus('checking');
      setInitialized(false);
      initialCheckDoneRef.current = false;
      pendingRequests.clear();
    }
  }, [isAuthenticated, pendingRequests]);

  // Auto-fetch when authenticated
  useEffect(() => {
    if (!isAuthenticated || !userRole || initialized) return;

    const loadInitialData = async () => {
      setLoading(true);
      try {
        if (userRole === 'PRIMARY') {
          await getFamilyMembers();
        } else if (userRole === 'LINKED') {
          await checkConnectionStatus(true);
        }
      } catch (error) {
        console.error('Failed to load initial family data:', error);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };
    
    loadInitialData();
  }, [isAuthenticated, userRole, initialized]);

  // ========== CONNECTION STATUS MANAGEMENT ==========

  const checkConnectionStatus = useCallback(async (force: boolean = false): Promise<boolean> => {
    if (userRole === 'PRIMARY') {
      if (mountedRef.current) {
        setConnectionStatus('disconnected');
        setPrimaryDetails(null);
        setLimits(null);
      }
      return false;
    }

    if (isCheckingRef.current && !force) {
      return connectionStatus === 'connected' && !!primaryDetails;
    }

    const now = Date.now();
    if (!force && now - lastCheckTimeRef.current < 5000) {
      return connectionStatus === 'connected' && !!primaryDetails;
    }

    isCheckingRef.current = true;
    setConnectionStatus('checking');
    
    try {
      lastCheckTimeRef.current = now;
      
      const storedConnected = localStorage.getItem(STORAGE_KEYS.LINKED_PRIMARY) === 'true';
      const storedDetails = localStorage.getItem(STORAGE_KEYS.PRIMARY_DETAILS);
      
      let localPrimaryDetails = null;
      if (storedConnected && storedDetails) {
        try {
          localPrimaryDetails = JSON.parse(storedDetails);
          if (mountedRef.current) {
            setPrimaryDetails(localPrimaryDetails);
            setLimits(localPrimaryDetails.limits);
          }
        } catch (e) {
          // Ignore parse error
        }
      }

      const response = await familyAPI.getMyPrimaryDetails();
      
      if (!mountedRef.current) return false;
      
      const isConnected = !!(response.data?.data);
      
      if (isConnected) {
        setPrimaryDetails(response.data.data);
        setLimits(response.data.data.limits);
        localStorage.setItem(STORAGE_KEYS.LINKED_PRIMARY, 'true');
        localStorage.setItem(STORAGE_KEYS.PRIMARY_DETAILS, JSON.stringify(response.data.data));
        setConnectionStatus('connected');
      } else {
        setPrimaryDetails(null);
        setLimits(null);
        localStorage.removeItem(STORAGE_KEYS.LINKED_PRIMARY);
        localStorage.removeItem(STORAGE_KEYS.PRIMARY_DETAILS);
        setConnectionStatus('disconnected');
      }
      
      return isConnected;
    } catch (error: any) {
      if (!mountedRef.current) return false;
      
      if (error.response?.status === 404 || error.response?.status === 403) {
        setPrimaryDetails(null);
        setLimits(null);
        setConnectionStatus('disconnected');
        localStorage.removeItem(STORAGE_KEYS.LINKED_PRIMARY);
        localStorage.removeItem(STORAGE_KEYS.PRIMARY_DETAILS);
        return false;
      }
      
      setConnectionStatus('disconnected');
      return false;
    } finally {
      if (mountedRef.current) {
        isCheckingRef.current = false;
      }
    }
  }, [userRole, connectionStatus, primaryDetails]);

  // Initialize connection check on mount
  useEffect(() => {
    if (!isAuthenticated || !userRole || initialCheckDoneRef.current) return;
    
    if (userRole === 'LINKED') {
      checkTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          checkConnectionStatus(true);
          initialCheckDoneRef.current = true;
        }
      }, 100);
    }

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [isAuthenticated, userRole, checkConnectionStatus]);

  // ========== PRIMARY USER FUNCTIONS ==========

  const getFamilyMembers = useCallback(async () => {
    if (!isAuthenticated || userRole !== 'PRIMARY') return null;

    const requestKey = 'family-members';
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }

    const promise = (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await familyAPI.getFamilyMembers();
        
        if (!mountedRef.current) return null;
        
        if (response.data?.data) {
          const members = response.data.data.members || [];
          const stats = response.data.data.stats || {};
          
          setFamilyMembers(members);
          setFamilyStats({
            total: stats.total || members.length,
            active: stats.active || members.filter((m: any) => m.status === 'ACTIVE').length,
            paused: stats.paused || members.filter((m: any) => m.status === 'PAUSED').length,
            pending: stats.pending || members.filter((m: any) => m.status === 'PENDING').length,
            totalDailySpent: stats.totalDailySpent || members.reduce((sum: number, m: any) => sum + (m.dailySpent || 0), 0),
            totalMonthlySpent: stats.totalMonthlySpent || members.reduce((sum: number, m: any) => sum + (m.monthlySpent || 0), 0),
            totalMembers: members.length,
            activeMembers: members.filter((m: any) => m.status === 'ACTIVE').length
          });
          
          return response.data.data;
        }
        return null;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Could not load family members';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      } finally {
        setLoading(false);
        pendingRequests.delete(requestKey);
      }
    })();

    pendingRequests.set(requestKey, promise);
    return promise;
  }, [isAuthenticated, userRole, pendingRequests]);

  const getMemberDetails = useCallback(async (id: string) => {
    if (!isAuthenticated) return null;

    const requestKey = `member-details-${id}`;
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }

    const promise = (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await familyAPI.getMemberById(id);
        return response.data;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Member not found';
        setError(errorMsg);
        toast.error(errorMsg);
        throw err;
      } finally {
        setLoading(false);
        pendingRequests.delete(requestKey);
      }
    })();

    pendingRequests.set(requestKey, promise);
    return promise;
  }, [isAuthenticated, pendingRequests]);

  const getMemberById = getMemberDetails;

  const inviteMember = useCallback(async (data: any) => {
    if (!isAuthenticated || userRole !== 'PRIMARY') return null;

    try {
      setLoading(true);
      setError(null);
      const response = await familyAPI.inviteMember(data);
      toast.success('Invitation sent successfully');
      await getFamilyMembers();
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to send invite';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userRole, getFamilyMembers]);

  const generateQR = useCallback(async () => {
    if (!isAuthenticated) return null;

    const requestKey = 'generate-qr';
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }

    const promise = (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await familyAPI.generateQR();
        // Backend shape: { success: true, data: { qrData: string, expiresIn: number } }
        return response.data?.data;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Failed to generate QR';
        setError(errorMsg);
        toast.error(errorMsg);
        throw err;
      } finally {
        setLoading(false);
        pendingRequests.delete(requestKey);
      }
    })();

    pendingRequests.set(requestKey, promise);
    return promise;
  }, [isAuthenticated, pendingRequests]);

  const generateInviteCode = useCallback(async () => {
    if (!isAuthenticated || userRole !== 'PRIMARY') return null;

    const requestKey = 'generate-invite-code';
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }

    const promise = (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await familyAPI.generateInviteCode();
        
        if (response.data?.success) {
          toast.success('Invite code generated');
          return response.data.data;
        }
        return null;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Failed to generate code';
        setError(errorMsg);
        toast.error(errorMsg);
        throw err;
      } finally {
        setLoading(false);
        pendingRequests.delete(requestKey);
      }
    })();

    pendingRequests.set(requestKey, promise);
    return promise;
  }, [isAuthenticated, userRole, pendingRequests]);

  const updateLimits = useCallback(async (memberId: string, newLimits: any) => {
    if (!isAuthenticated || userRole !== 'PRIMARY') return null;

    try {
      setLoading(true);
      setError(null);
      const response = await familyAPI.updateLimits(memberId, newLimits);
      await getFamilyMembers();
      toast.success('Limits updated successfully');
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Update failed';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userRole, getFamilyMembers]);

  const addToLimit = useCallback(async (memberId: string, amount: number) => {
    if (!isAuthenticated || userRole !== 'PRIMARY') return null;

    try {
      setLoading(true);
      setError(null);
      const response = await familyAPI.addToLimit(memberId, { amount });
      await getFamilyMembers();
      toast.success(`₹${amount} added to limit successfully`);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to add';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userRole, getFamilyMembers]);

  const updateMemberStatus = useCallback(async (memberId: string, status: string) => {
    if (!isAuthenticated || userRole !== 'PRIMARY') return null;

    try {
      setLoading(true);
      setError(null);
      const response = await familyAPI.updateMemberStatus(memberId, status);
      await getFamilyMembers();
      toast.success(`Member ${status.toLowerCase()}`);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Status update failed';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userRole, getFamilyMembers]);

  const pauseMember = useCallback((memberId: string) => 
    updateMemberStatus(memberId, 'PAUSED'), [updateMemberStatus]);
  
  const resumeMember = useCallback((memberId: string) => 
    updateMemberStatus(memberId, 'ACTIVE'), [updateMemberStatus]);

  const removeMember = useCallback(async (memberId: string) => {
    if (!isAuthenticated || userRole !== 'PRIMARY') return;

    if (!window.confirm('Are you sure you want to remove this family member?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await familyAPI.removeMember(memberId);
      await getFamilyMembers();
      toast.success('Member removed successfully');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to remove';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userRole, getFamilyMembers]);

  const getMemberTransactions = useCallback(async (memberId: string, params?: any) => {
    if (!isAuthenticated) return { transactions: [] };

    const requestKey = `member-transactions-${memberId}-${JSON.stringify(params || {})}`;
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }

    const promise = (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await familyAPI.getMemberTransactions(memberId, params);
        return response.data;
      } catch (err: any) {
        return { transactions: [] };
      } finally {
        setLoading(false);
        pendingRequests.delete(requestKey);
      }
    })();

    pendingRequests.set(requestKey, promise);
    return promise;
  }, [isAuthenticated, pendingRequests]);

  // ========== REQUEST FUNCTIONS ==========

  const getRequests = useCallback(async () => {
    if (!isAuthenticated) return [];

    const requestKey = 'limit-requests';
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }

    const promise = (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await familyAPI.getRequests();
        
        if (response.data?.success) {
          setRequests(response.data.data || []);
          return response.data.data;
        }
        return [];
      } catch (err: any) {
        return [];
      } finally {
        setLoading(false);
        pendingRequests.delete(requestKey);
      }
    })();

    pendingRequests.set(requestKey, promise);
    return promise;
  }, [isAuthenticated, pendingRequests]);

  const approveRequest = useCallback(async (requestId: string) => {
    if (!isAuthenticated || userRole !== 'PRIMARY') return null;

    try {
      setLoading(true);
      setError(null);
      const response = await familyAPI.approveRequest(requestId);
      
      if (response.data?.success) {
        await getRequests();
        toast.success('Request approved');
        return response.data;
      }
      return null;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Approval failed';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userRole, getRequests]);

  const denyRequest = useCallback(async (requestId: string) => {
    if (!isAuthenticated || userRole !== 'PRIMARY') return null;

    try {
      setLoading(true);
      setError(null);
      const response = await familyAPI.denyRequest(requestId);
      
      if (response.data?.success) {
        await getRequests();
        toast.success('Request denied');
        return response.data;
      }
      return null;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to deny';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userRole, getRequests]);

  // ========== LINKED USER FUNCTIONS ==========

  const getPrimaryDetails = useCallback(async () => {
    if (userRole === 'PRIMARY') {
      return null;
    }

    const requestKey = 'primary-details';
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }

    const promise = (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await familyAPI.getMyPrimaryDetails();
        
        if (!mountedRef.current) return null;
        
        if (response.data?.data) {
          setPrimaryDetails(response.data.data);
          setLimits(response.data.data.limits);
          localStorage.setItem(STORAGE_KEYS.LINKED_PRIMARY, 'true');
          localStorage.setItem(STORAGE_KEYS.PRIMARY_DETAILS, JSON.stringify(response.data.data));
          setConnectionStatus('connected');
          return response.data.data;
        } else {
          setPrimaryDetails(null);
          setLimits(null);
          localStorage.removeItem(STORAGE_KEYS.LINKED_PRIMARY);
          localStorage.removeItem(STORAGE_KEYS.PRIMARY_DETAILS);
          setConnectionStatus('disconnected');
          return null;
        }
      } catch (err: any) {
        if (err.response?.status === 404 || err.response?.status === 403) {
          setPrimaryDetails(null);
          setLimits(null);
          localStorage.removeItem(STORAGE_KEYS.LINKED_PRIMARY);
          localStorage.removeItem(STORAGE_KEYS.PRIMARY_DETAILS);
          setConnectionStatus('disconnected');
          return null;
        }
        
        setPrimaryDetails(null);
        setLimits(null);
        return null;
      } finally {
        setLoading(false);
        pendingRequests.delete(requestKey);
      }
    })();

    pendingRequests.set(requestKey, promise);
    return promise;
  }, [userRole, pendingRequests]);

  const getMyLimits = useCallback(async () => {
    if (userRole === 'PRIMARY') {
      return null;
    }

    const requestKey = 'my-limits';
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }

    const promise = (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await familyAPI.getMyLimits();
        
        if (response.data?.success) {
          setLimits(response.data.data);
          return response.data.data;
        }
        return null;
      } catch (err: any) {
        return null;
      } finally {
        setLoading(false);
        pendingRequests.delete(requestKey);
      }
    })();

    pendingRequests.set(requestKey, promise);
    return promise;
  }, [userRole, pendingRequests]);

  const acceptInvite = useCallback(async (inviteCode: string, phone: string) => {
    if (!isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);
      const response = await familyAPI.acceptInvite({ inviteCode, phone });
      
      if (response.data?.success) {
        toast.success('Successfully joined family');
        await getPrimaryDetails();
        return response.data;
      }
      return null;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Invalid invite';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getPrimaryDetails]);

  const connectToPrimary = useCallback(async (data: { method: 'code' | 'qr' | 'manual'; code?: string; phone?: string }) => {
    if (!isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);
      const response = await familyAPI.connectToPrimary(data);
      
      if (response.data?.success) {
        toast.success('Successfully connected to primary account');
        await getPrimaryDetails();
        return response.data;
      }
      return null;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Connection failed';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getPrimaryDetails]);

  const disconnectFromPrimary = useCallback(async (password: string, otp: string, transferBalance: boolean) => {
    if (!isAuthenticated || userRole !== 'LINKED') return null;

    try {
      setLoading(true);
      setError(null);
      
      const response = await familyAPI.disconnectFromPrimary({ password, otp, transferBalance });
      
      if (response.data?.success) {
        setPrimaryDetails(null);
        setLimits(null);
        localStorage.removeItem(STORAGE_KEYS.LINKED_PRIMARY);
        localStorage.removeItem(STORAGE_KEYS.PRIMARY_DETAILS);
        setConnectionStatus('disconnected');
        toast.success('Disconnected from primary account');
        return response.data;
      }
      return null;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Disconnection failed';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userRole]);

  const createLimitRequest = useCallback(async (data: any) => {
    if (!isAuthenticated || userRole !== 'LINKED') return null;

    try {
      setLoading(true);
      setError(null);
      const response = await familyAPI.createLimitRequest(data);
      
      if (response.data?.success) {
        toast.success('Request sent to primary account');
        await getRequests();
        return response.data;
      }
      return null;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Request failed';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userRole, getRequests]);

  // ========== UTILITY FUNCTIONS ==========

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshAll = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      await Promise.allSettled([
        userRole === 'LINKED' ? checkConnectionStatus(true) : Promise.resolve(),
        userRole === 'PRIMARY' ? getFamilyMembers() : Promise.resolve(),
        getRequests()
      ]);
      toast.success('Data refreshed');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userRole, checkConnectionStatus, getFamilyMembers, getRequests]);

  // Computed properties
  const isConnectedToPrimary = connectionStatus === 'connected' && !!primaryDetails;
  const isCheckingConnection = connectionStatus === 'checking';
  const isDisconnected = connectionStatus === 'disconnected' || !primaryDetails;

  return {
    familyMembers,
    familyStats,
    limits,
    requests,
    primaryDetails,
    loading,
    error,
    connectionStatus,
    isConnectedToPrimary,
    isCheckingConnection,
    isDisconnected,
    checkConnectionStatus,
    connectToPrimary,
    disconnectFromPrimary,
    getFamilyMembers,
    getMemberDetails,
    getMemberById,
    inviteMember,
    generateQR,
    generateInviteCode,
    updateLimits,
    addToLimit,
    updateMemberStatus,
    pauseMember,
    resumeMember,
    removeMember,
    getMemberTransactions,
    getRequests,
    approveRequest,
    denyRequest,
    createLimitRequest,
    getPrimaryDetails,
    getMyLimits,
    acceptInvite,
    clearError,
    refreshAll
  };
};