// src/store/slices/bankSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Bank } from '../../types/bank.types';

export interface BankState {
  banks: Bank[];
  selectedBank: Bank | null;
  totalBalance: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: BankState = {
  banks: [],
  selectedBank: null,
  totalBalance: 0,
  isLoading: false,
  error: null,
};

const bankSlice = createSlice({
  name: 'bank',
  initialState,
  reducers: {
    setBanks: (state, action: PayloadAction<Bank[]>) => {
      state.banks = action.payload;
      state.totalBalance = action.payload.reduce((sum, bank) => sum + bank.balance, 0);
    },
    setSelectedBank: (state, action: PayloadAction<Bank | null>) => {
      state.selectedBank = action.payload;
    },
    addBank: (state, action: PayloadAction<Bank>) => {
      state.banks.push(action.payload);
      state.totalBalance += action.payload.balance;
    },
    updateBank: (state, action: PayloadAction<Bank>) => {
      const index = state.banks.findIndex((b) => b.id === action.payload.id);
      if (index !== -1) {
        const oldBalance = state.banks[index].balance;
        state.banks[index] = action.payload;
        state.totalBalance = state.totalBalance - oldBalance + action.payload.balance;
      }
    },
    removeBank: (state, action: PayloadAction<string>) => {
      const bank = state.banks.find((b) => b.id === action.payload);
      if (bank) {
        state.banks = state.banks.filter((b) => b.id !== action.payload);
        state.totalBalance -= bank.balance;
      }
    },
    setDefaultBank: (state, action: PayloadAction<string>) => {
      state.banks.forEach((bank) => {
        bank.isDefault = bank.id === action.payload;
      });
    },
    setBankLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setBankError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearBanks: (state) => {
      state.banks = [];
      state.selectedBank = null;
      state.totalBalance = 0;
    },
  },
});

export const {
  setBanks,
  setSelectedBank,
  addBank,
  updateBank,
  removeBank,
  setDefaultBank,
  setBankLoading,
  setBankError,
  clearBanks,
} = bankSlice.actions;

export default bankSlice.reducer;