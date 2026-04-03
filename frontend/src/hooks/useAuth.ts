// src/hooks/useAuth.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api/auth';
import type { UpdateProfileRequest } from '../services/api/auth';
import { ROUTES, STORAGE_KEYS } from '../utils/constants';
import toast from 'react-hot-toast';

const AUTH_CHANGED_EVENT = 'auth:changed';

// Types
export interface User {
  id: string;
  name: string | null;
  phone: string;
  email?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
  alternatePhone?: string | null;
  occupation?: string | null;
  role: 'PRIMARY' | 'LINKED' | 'ADMIN';
  isVerified: boolean;
  profilePicture?: string | null;
  createdAt?: string;
  walletBalance?: number;
  hasBank?: boolean;
  profileComplete?: boolean;
  hasPin?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null,
  });

  const navigate = useNavigate();
  const mountedRef = useRef(true);
  const initialLoadDone = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Check if token is expired
  const isTokenExpired = useCallback((): boolean => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) return true;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }, []);

  // Clear all auth data
  const clearAuthData = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(key => {
      if (typeof key === 'string') localStorage.removeItem(key);
    });
    sessionStorage.clear();
  }, []);

  const syncFromStorage = useCallback(() => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

      if (token && storedUser && !isTokenExpired()) {
        const parsedUser = JSON.parse(storedUser) as User;
        setState({
          user: parsedUser,
          isAuthenticated: true,
          loading: false,
          error: null,
        });
        return;
      }

      clearAuthData();
      setState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    } catch (error) {
      clearAuthData();
      setState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: 'Failed to load user data',
      });
    }
  }, [isTokenExpired, clearAuthData]);

  // Load user from localStorage on initial mount
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    syncFromStorage();
  }, [syncFromStorage]);

  // Sync across all components that call this hook.
  useEffect(() => {
    const handler = () => syncFromStorage();
    window.addEventListener(AUTH_CHANGED_EVENT, handler);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handler);
  }, [syncFromStorage]);

  // Send OTP
  // src/hooks/useAuth.ts - Update sendOTP function

// Send OTP with userType
  const sendOTP = useCallback(async (phone: string, userType?: string, mode: 'login' | 'signup' = 'login') => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Pass userType to the API
      const response = await authAPI.sendOTP({
        phone,
        userType: userType as 'primary' | 'linked' | undefined,
        mode,
      });
      toast.success('OTP sent successfully!');
      return { success: true, data: response.data };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to send OTP';
      if (mountedRef.current) {
        setState(prev => ({ ...prev, error: errorMsg }));
      }
      toast.error(errorMsg);
      throw err;
    } finally {
      if (mountedRef.current) {
        setState(prev => ({ ...prev, loading: false }));
      }
    }
  }, []);

  // Verify OTP
  const verifyOTP = useCallback(async (
    identifier: string,
    otp: string,
    userType?: 'primary' | 'linked',
    mode: 'login' | 'signup' = 'login',
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await authAPI.verifyOTP({ phone: identifier, otp, userType, mode });
      const { success, data } = response.data;

      if (success && data) {
        const { user, token, refreshToken } = data;

        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        
        if (refreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }

        setState({
          user,
          isAuthenticated: true,
          loading: false,
          error: null,
        });

        toast.success(`Welcome back, ${user.name || 'User'}!`);

        // Notify other hook instances (eg Header) to update immediately.
        window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));

        return data;
      }

      throw new Error('Invalid response from server');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Invalid OTP. Please try again.';

      if (mountedRef.current) {
        setState(prev => ({ ...prev, error: errorMsg, loading: false }));
      }
      toast.error(errorMsg);
      throw err;
    }
  }, [navigate]);

  // Change PIN (aligned with backend – expects oldPin and newPin)
  const changePin = useCallback(async (oldPin: string, newPin: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await authAPI.changePin({ oldPin, newPin });
      
      if (response.data?.success) {
        toast.success('PIN changed successfully');
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Failed to change PIN');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to change PIN';
      
      if (mountedRef.current) {
        setState(prev => ({ ...prev, error: errorMsg }));
      }
      toast.error(errorMsg);
      throw err;
    } finally {
      if (mountedRef.current) {
        setState(prev => ({ ...prev, loading: false }));
      }
    }
  }, []);

  // Set PIN (first time)
  const setPin = useCallback(async (pin: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await authAPI.setPin({ pin });

      if (response.data?.success) {
        const updatedUser = { ...(state.user as any), hasPin: true } as User;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

        if (mountedRef.current) {
          setState(prev => ({ ...prev, user: updatedUser, loading: false }));
        }

        window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
        return response.data;
      }

      throw new Error(response.data?.message || 'Failed to set PIN');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to set PIN';
      if (mountedRef.current) {
        setState(prev => ({ ...prev, error: errorMsg, loading: false }));
      }
      toast.error(errorMsg);
      throw err;
    }
  }, [state.user]);

  // Update profile
  const updateProfile = useCallback(async (data: UpdateProfileRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await authAPI.updateProfile(data);

      if (response.data?.success) {
        const updatedUser = { ...(state.user as any), ...data } as User;
        
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            user: updatedUser,
            loading: false,
          }));
        }

        toast.success('Profile updated successfully');
        return response.data;
      }

      throw new Error('Update failed');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update profile';
      if (mountedRef.current) {
        setState(prev => ({ ...prev, error: errorMsg, loading: false }));
      }
      toast.error(errorMsg);
      throw err;
    }
  }, [state.user]);

  // Logout
  const logout = useCallback(async (showToast: boolean = true) => {
    try {
      try {
        await authAPI.logout();
      } catch (err) {
        console.warn('API logout failed, continuing with local cleanup');
      }

      clearAuthData();

      if (mountedRef.current) {
        setState({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        });
      }

      if (showToast) {
        toast.success('Logged out successfully');
      }

      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
      navigate(ROUTES.HOME, { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      
      clearAuthData();
      if (mountedRef.current) {
        setState({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: 'Logout completed with some issues',
        });
      }

      if (showToast) {
        toast.error('Logout completed with some issues');
      }
      
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [navigate, clearAuthData]);

  // Get current user profile
  const getMe = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

    if (!token) {
      if (mountedRef.current) {
        setState(prev => ({ ...prev, user: null, isAuthenticated: false }));
      }
      return null;
    }

    if (isTokenExpired()) {
      await logout(false);
      return null;
    }

    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const response = await authAPI.getMe();

      if (response.data?.success && response.data?.data) {
        const userData = response.data.data as User;
        
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        
        if (mountedRef.current) {
          setState({
            user: userData,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        }

        return userData;
      }

      return null;
    } catch (err: any) {
      console.error('GetMe error:', err);

      if (err.response?.status === 401) {
        clearAuthData();
        if (mountedRef.current) {
          setState({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,
          });
        }
      }

      return null;
    } finally {
      if (mountedRef.current) {
        setState(prev => ({ ...prev, loading: false }));
      }
    }
  }, [isTokenExpired, logout, clearAuthData]);

  // Refresh token
  const refreshToken = useCallback(async () => {
    const refreshTokenStr = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    if (!refreshTokenStr) return false;

    try {
      const response = await authAPI.refreshToken(refreshTokenStr);
      
      if (response.data?.success && response.data?.data?.token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.data.token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, []);

  // Computed properties
  const isPrimary = state.user?.role === 'PRIMARY';
  const isLinked = state.user?.role === 'LINKED';
  const isAdmin = state.user?.role === 'ADMIN';

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    isPrimary,
    isLinked,
    isAdmin,
    sendOTP,
    verifyOTP,
    updateProfile,
    logout,
    getMe,
    changePin,
    setPin,
    refreshToken,
    isTokenExpired,
  };
};

export default useAuth;