// src/store/slices/uiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { generateId } from '../../utils/helpers';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  visible: boolean;
}

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  mobileNavOpen: boolean;
  notifications: Notification[];
  modals: {
    [key: string]: boolean;
  };
  loadingStates: {
    [key: string]: boolean;
  };
  breadcrumbs: {
    label: string;
    path: string;
  }[];
  lastUpdated: string | null;
}

const initialState: UIState = {
  theme: 'light',
  sidebarOpen: false,
  mobileNavOpen: false,
  notifications: [],
  modals: {},
  loadingStates: {},
  breadcrumbs: [],
  lastUpdated: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleMobileNav: (state) => {
      state.mobileNavOpen = !state.mobileNavOpen;
    },
    setMobileNavOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileNavOpen = action.payload;
    },
    addNotification: (
      state,
      action: PayloadAction<{
        type: 'success' | 'error' | 'info' | 'warning';
        message: string;
      }>,
    ) => {
      const id = generateId('notif-');
      state.notifications.push({
        id,
        ...action.payload,
        visible: true,
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = false;
    },
    toggleModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = !state.modals[action.payload];
    },
    setLoading: (state, action: PayloadAction<{ key: string; isLoading: boolean }>) => {
      state.loadingStates[action.payload.key] = action.payload.isLoading;
    },
    setBreadcrumbs: (state, action: PayloadAction<{ label: string; path: string }[]>) => {
      state.breadcrumbs = action.payload;
    },
    addBreadcrumb: (state, action: PayloadAction<{ label: string; path: string }>) => {
      state.breadcrumbs.push(action.payload);
    },
    updateLastUpdated: (state) => {
      state.lastUpdated = new Date().toISOString();
    },
    resetUI: (state) => {
      state.sidebarOpen = false;
      state.mobileNavOpen = false;
      state.notifications = [];
      state.modals = {};
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  toggleMobileNav,
  setMobileNavOpen,
  addNotification,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
  toggleModal,
  setLoading,
  setBreadcrumbs,
  addBreadcrumb,
  updateLastUpdated,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;