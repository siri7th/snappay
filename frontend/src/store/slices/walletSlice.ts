// src/store/slices/walletSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Transaction } from '../../types/payment.types';

export interface WalletState {
  balance: number;
  transactions: Transaction[];
  selectedTransaction: Transaction | null;
  stats: {
    today: number;
    week: number;
    month: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  balance: 0,
  transactions: [],
  selectedTransaction: null,
  stats: {
    today: 0,
    week: 0,
    month: 0,
  },
  isLoading: false,
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
    },
    setSelectedTransaction: (state, action: PayloadAction<Transaction | null>) => {
      state.selectedTransaction = action.payload;
    },
    setStats: (state, action: PayloadAction<{ today: number; week: number; month: number }>) => {
      state.stats = action.payload;
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions = [action.payload, ...state.transactions];
    },
    updateTransaction: (state, action: PayloadAction<Transaction>) => {
      const index = state.transactions.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.transactions[index] = action.payload;
      }
    },
    setWalletLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setWalletError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearWalletState: (state) => {
      state.balance = 0;
      state.transactions = [];
      state.selectedTransaction = null;
      state.error = null;
    },
  },
});

export const {
  setBalance,
  setTransactions,
  setSelectedTransaction,
  setStats,
  addTransaction,
  updateTransaction,
  setWalletLoading,
  setWalletError,
  clearWalletState,
} = walletSlice.actions;

export default walletSlice.reducer;