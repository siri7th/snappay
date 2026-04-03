// src/components/Linked/LinkedUserGuard.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useFamily } from '../../hooks/useFamily';
import { useAuth } from '../../hooks/useAuth';
import { GuardLoadingState } from './guard/GuardLoadingState';
import { DisconnectedScreen } from './guard/DisconnectedScreen';
import { ROUTES } from '../../utils/constants';

interface LinkedUserGuardProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

const LinkedUserGuard: React.FC<LinkedUserGuardProps> = ({ children, fallback }) => {
  const { 
    connectionStatus, 
    checkConnectionStatus, 
    loading, 
    isConnectedToPrimary,
    isCheckingConnection,
    error: familyError,
    primaryDetails
  } = useFamily();
  
  const { user, loading: authLoading } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  
  const isMounted = useRef(true);
  const redirectInProgress = useRef(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout>();
  const lastCheckTimeRef = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  // If user is primary, redirect them to primary dashboard
  useEffect(() => {
    if (!authLoading && user?.role === 'PRIMARY' && !redirectInProgress.current) {
      redirectInProgress.current = true;
      navigate(ROUTES.PRIMARY_DASHBOARD, { replace: true });
    }
  }, [user, authLoading, navigate]);

  const verifyConnection = useCallback(async () => {
    if (!user || user.role !== 'LINKED' || !isMounted.current) return;
    if (checking || initialCheckDone) return;
    
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 2000) {
      setInitialCheckDone(true);
      return;
    }
    
    setChecking(true);
    setError(null);
    lastCheckTimeRef.current = now;
    
    try {
      await checkConnectionStatus();
      
      if (isMounted.current) {
        setInitialCheckDone(true);
      }
    } catch (error: any) {
      if (isMounted.current) {
        setError(error.message || 'Failed to check connection status');
      }
    } finally {
      if (isMounted.current) {
        setChecking(false);
      }
    }
  }, [user, checkConnectionStatus, location.pathname, navigate, checking, initialCheckDone]);

  useEffect(() => {
    checkTimeoutRef.current = setTimeout(() => {
      verifyConnection();
    }, 100);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [verifyConnection]);

  const handleRefresh = useCallback(async () => {
    if (checking) return;
    
    setChecking(true);
    setError(null);
    lastCheckTimeRef.current = Date.now();
    
    try {
      await checkConnectionStatus(true);
    } catch (error: any) {
      setError(error.message || 'Failed to check connection status');
    } finally {
      setChecking(false);
    }
  }, [checkConnectionStatus, checking]);

  const handleConnect = useCallback((method?: 'qr' | 'code' | 'manual') => {
    navigate(ROUTES.LINKED_CONNECT, method ? { state: { method } } : undefined);
  }, [navigate]);

  // Show loading state while auth is loading
  if (authLoading) {
    return <GuardLoadingState message="Loading user data..." />;
  }

  // If user is not linked, don't render
  if (user?.role !== 'LINKED') {
    return null;
  }

  // Show loading state while checking connection
  if ((loading || checking || isCheckingConnection) && !initialCheckDone) {
    return <GuardLoadingState message="Checking connection status..." />;
  }

  // If connected, allow all guarded linked routes.
  if (isConnectedToPrimary && primaryDetails) {
    return children ? <>{children}</> : <Outlet />;
  }

  // Show disconnected UI
  if (!isConnectedToPrimary) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <DisconnectedScreen
        error={error || familyError}
        checking={checking}
        onConnect={handleConnect}
        onRefresh={handleRefresh}
        userRole={user?.role}
        connectionStatus={connectionStatus}
        hasPrimaryDetails={!!primaryDetails}
      />
    );
  }

  // User is connected, render children or outlet
  return children ? <>{children}</> : <Outlet />;
};

export default LinkedUserGuard;