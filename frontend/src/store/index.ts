// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import slice reducers
import authReducer from './slices/authSlice';
import walletReducer from './slices/walletSlice';
import bankReducer from './slices/bankSlice';
import familyReducer from './slices/familySlice';
import uiReducer from './slices/uiSlice';

// ===== COMBINE REDUCERS =====
const rootReducer = combineReducers({
  auth: authReducer,
  wallet: walletReducer,
  bank: bankReducer,
  family: familyReducer,
  ui: uiReducer,
});

// ===== PERSIST CONFIGURATION =====
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'ui'], // Only persist auth and ui state
  blacklist: [],
  version: 1,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// ===== STORE CREATION =====
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
          'persist/FLUSH',
        ],
        ignoredPaths: ['ui.modals', 'ui.notifications'],
      },
      immutableCheck: process.env.NODE_ENV !== 'production',
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// ===== PERSISTOR =====
export const persistor = persistStore(store);

// ===== TYPES =====
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ===== CUSTOM HOOKS =====
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// ===== APP THUNK TYPE =====
export type AppThunk<ReturnType = void> = (
  dispatch: AppDispatch,
  getState: () => RootState
) => ReturnType;