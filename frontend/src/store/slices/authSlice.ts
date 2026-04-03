// src/store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types/user.types';

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isNewUser: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  isNewUser: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: User | null; token?: string | null }>) => {
      state.user = action.payload.user;
      if (action.payload.token !== undefined) {
        state.token = action.payload.token;
      }
      state.isAuthenticated = !!action.payload.user;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    
    setNewUser: (state, action: PayloadAction<boolean>) => {
      state.isNewUser = action.payload;
    },
    
    updateWalletBalance: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.walletBalance = action.payload;
      }
    },
    
    updateProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    
    logout: () => initialState,
    
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setUser,
  setLoading,
  setError,
  setAuthenticated,
  setNewUser,
  updateWalletBalance,
  updateProfile,
  logout,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;