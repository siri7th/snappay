// src/main.tsx - FIXED (removed Sentry and web-vitals)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { HelmetProvider } from 'react-helmet-async';
import { store, persistor } from './store';
import App from './App';
import './index.css';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 max-w-md">
            <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-10 w-10 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              {import.meta.env.DEV && this.state.error ? this.state.error.message : 'Please refresh the page to continue'}
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-xs bg-gray-100 p-4 rounded-lg text-left overflow-auto mb-4">
                {this.state.error.stack}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Fallback Component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 bg-primary rounded-full animate-pulse"></div>
        </div>
      </div>
      <p className="text-gray-600 font-medium">Loading SnapPay...</p>
      <p className="text-sm text-gray-400 mt-2">Please wait</p>
    </div>
  </div>
);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);

// Log app startup in development
if (import.meta.env.DEV) {
  console.log(
    '%c🚀 SnapPay App Starting...',
    'background: #E31B23; color: white; font-size: 14px; padding: 4px; border-radius: 4px;'
  );
  console.log(`📱 Environment: ${import.meta.env.MODE}`);
  console.log(`🔧 API URL: ${import.meta.env.VITE_API_URL}`);
  console.log(`🔌 Socket URL: ${import.meta.env.VITE_SOCKET_URL}`);
}

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <PersistGate 
          loading={<LoadingFallback />} 
          persistor={persistor}
          onBeforeLift={() => {
            if (import.meta.env.DEV) {
              console.log('🔄 Restoring application state...');
            }
          }}
        >
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </PersistGate>
      </Provider>
    </HelmetProvider>
  </React.StrictMode>
);

// Enable Hot Module Replacement in development
if (import.meta.env.DEV && import.meta.hot) {
  import.meta.hot.accept();
}