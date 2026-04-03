// src/store/slices/familySlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FamilyMember, LimitRequest } from '../../types/family.types';

export interface FamilyState {
  members: FamilyMember[];
  selectedMember: FamilyMember | null;
  requests: LimitRequest[];
  myLimits: {
    dailyLimit: number;
    dailySpent: number;
    monthlyLimit: number;
    monthlySpent: number;
    perTransactionLimit: number;
    primaryName?: string;
  } | null;
  stats: {
    total: number;
    active: number;
    totalSpent: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: FamilyState = {
  members: [],
  selectedMember: null,
  requests: [],
  myLimits: null,
  stats: {
    total: 0,
    active: 0,
    totalSpent: 0,
  },
  isLoading: false,
  error: null,
};

const familySlice = createSlice({
  name: 'family',
  initialState,
  reducers: {
    setFamilyMembers: (state, action: PayloadAction<FamilyMember[]>) => {
      state.members = action.payload;
      state.stats = {
        total: action.payload.length,
        active: action.payload.filter((m) => m.status === 'ACTIVE').length,
        totalSpent: action.payload.reduce((sum, m) => sum + m.dailySpent, 0),
      };
    },
    setSelectedMember: (state, action: PayloadAction<FamilyMember | null>) => {
      state.selectedMember = action.payload;
    },
    addFamilyMember: (state, action: PayloadAction<FamilyMember>) => {
      state.members.push(action.payload);
      state.stats.total++;
    },
    updateFamilyMember: (state, action: PayloadAction<FamilyMember>) => {
      const index = state.members.findIndex((m) => m.id === action.payload.id);
      if (index !== -1) {
        state.members[index] = action.payload;
        if (state.selectedMember?.id === action.payload.id) {
          state.selectedMember = action.payload;
        }
      }
    },
    removeFamilyMember: (state, action: PayloadAction<string>) => {
      state.members = state.members.filter((m) => m.id !== action.payload);
      if (state.selectedMember?.id === action.payload) {
        state.selectedMember = null;
      }
    },
    updateMemberStatus: (state, action: PayloadAction<{ id: string; status: string }>) => {
      const member = state.members.find((m) => m.id === action.payload.id);
      if (member) {
        member.status = action.payload.status as any;
      }
    },
    setRequests: (state, action: PayloadAction<LimitRequest[]>) => {
      state.requests = action.payload;
    },
    addRequest: (state, action: PayloadAction<LimitRequest>) => {
      state.requests.unshift(action.payload);
    },
    updateRequest: (state, action: PayloadAction<LimitRequest>) => {
      const index = state.requests.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.requests[index] = action.payload;
      }
    },
    setMyLimits: (state, action: PayloadAction<any>) => {
      state.myLimits = action.payload;
    },
    updateMyLimits: (state, action: PayloadAction<Partial<any>>) => {
      if (state.myLimits) {
        state.myLimits = { ...state.myLimits, ...action.payload };
      }
    },
    setFamilyLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setFamilyError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearFamilyState: (state) => {
      state.members = [];
      state.selectedMember = null;
      state.requests = [];
      state.myLimits = null;
    },
  },
});

export const {
  setFamilyMembers,
  setSelectedMember,
  addFamilyMember,
  updateFamilyMember,
  removeFamilyMember,
  updateMemberStatus,
  setRequests,
  addRequest,
  updateRequest,
  setMyLimits,
  updateMyLimits,
  setFamilyLoading,
  setFamilyError,
  clearFamilyState,
} = familySlice.actions;

export default familySlice.reducer;