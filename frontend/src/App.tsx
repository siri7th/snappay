// src/App.tsx - COMPLETE FIXED VERSION
import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Provider } from 'react-redux';
import { store , persistor } from './store';
import toast from 'react-hot-toast';
import { PersistGate } from 'redux-persist/integration/react';

// Layout Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';

// Auth Pages
import Landing from './pages/auth/Landing';
import Login from './pages/auth/Login';
import OTPVerification from './pages/auth/OTPVerification';
import AddBank from './pages/auth/AddBank';
import ProfileSetup from './pages/auth/ProfileSetup';
import SetPin from './pages/auth/SetPin';
import ForgotPin from './pages/auth/ForgotPin';
import JoinFamily from './pages/auth/JoinFamily';
import SignupOptions from './pages/auth/SignupOptions';
import AcceptInvite from './pages/auth/AcceptInvite';

// Primary Pages
import PrimaryDashboard from './pages/primary/PrimaryDashboard';
import SendMoney from './pages/primary/SendMoney';
import ReceiveMoney from './pages/primary/ReceiveMoney';
import Recharge from './pages/primary/Recharge';
import Transactions from './pages/primary/Transactions';
import FamilyManagement from './pages/primary/FamilyManagement';
import AddFamilyMember from './pages/primary/AddFamilyMember';
import FamilyMemberDetails from './pages/primary/FamilyMemberDetails';
import BankAccounts from './pages/primary/BankAccounts';
import BankDetails from './pages/primary/BankDetails';
import ScanPage from './pages/primary/ScanPage';
import ConnectionRequests from './pages/primary/ConnectionRequests';
import AddLimit from './pages/primary/AddLimit';
import EditMember from './pages/primary/EditMember';

// Settings Pages
import Settings from './pages/primary/Settings';
import PrimaryProfile from './pages/primary/Settings/PrimaryProfile';
import PrimarySecurity from './pages/primary/Settings/PrimarySecurity';
import PrimaryNotificationSettings from './pages/primary/Settings/PrimaryNotificationSettings';

// Support Page
import Support from './pages/primary/Support';

// Linked Pages
import LinkedDashboard from './pages/linked/LinkedDashboard';
import LinkedSendMoney from './pages/linked/LinkedSendMoney';
import LinkedScanPay from './pages/linked/LinkedScanPay';
import LinkedRecharge from './pages/linked/LinkedRecharge';
import LinkedHistory from './pages/linked/LinkedHistory';
import RequestIncrease from './pages/linked/RequestIncrease';
import LinkedProfile from './pages/linked/LinkedProfile';
import ConnectionStatus from './pages/linked/ConnectionStatus';
import ConnectToPrimary from './pages/linked/ConnectToPrimary';
import LinkedReceive from './pages/linked/LinkedReceive';

// Shared Pages
import TransactionDetails from './pages/shared/TransactionDetails';
import QRScanner from './pages/shared/QRScanner';
import ErrorPage from './pages/shared/ErrorPage';
import Notifications from './pages/shared/Notifications';
import ReceiveMoneyShared from './pages/shared/ReceiveMoney';
import InfoPage from './pages/public/InfoPage';

// Wallet Pages
import AddMoney from './pages/primary/AddMoney';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';
import { useAppInitializer } from './hooks/useAppInitializer';

// Guards
import LinkedUserGuard from './components/Linked/LinkedUserGuard';

// Token expiration check function
const checkTokenExpiration = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (token && user) {
    try {
      // Decode token and check expiration
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      const isExpired = payload.exp * 1000 < Date.now();
      
      if (isExpired) {
        console.log('🔐 Token expired, logging out');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('linked_primary_connected');
        localStorage.removeItem('primary_details');
        localStorage.removeItem('pending_connection');
        localStorage.removeItem('pending_invitation_id');
        sessionStorage.clear();
        
        // Force page reload to reset all state
        window.location.href = '/';
        return true;
      }
    } catch (e) {
      console.error('❌ Invalid token, clearing storage', e);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
      return true;
    }
  }
  return false;
};

// Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: ('PRIMARY' | 'LINKED')[];
}> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Check token expiration on every protected route access
  useEffect(() => {
    checkTokenExpiration();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role as 'PRIMARY' | 'LINKED')) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'PRIMARY') {
      return <Navigate to="/primary/dashboard" replace />;
    }
    if (user.role === 'LINKED') {
      return <Navigate to="/linked/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Public Route with skipAuth option for OTP
const PublicRoute: React.FC<{ children: React.ReactNode; skipAuth?: boolean }> = ({ 
  children, 
  skipAuth = false 
}) => {
  const { isAuthenticated, loading, user } = useAuth();

  // Check token expiration on public routes too
  useEffect(() => {
    checkTokenExpiration();
  }, []);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If skipAuth is true, show the page even if authenticated
  if (skipAuth) {
    return <>{children}</>;
  }

  // Only redirect if definitely authenticated and has role
  if (isAuthenticated && user?.role) {
    if (user.role === 'PRIMARY') {
      return <Navigate to="/primary/dashboard" replace />;
    }
    if (user.role === 'LINKED') {
      return <Navigate to="/linked/dashboard" replace />;
    }
  }

  // Otherwise show the public content
  return <>{children}</>;
};

// Dashboard Redirect based on role
const DashboardRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  console.log('DashboardRedirect:', { user, isAuthenticated, loading });

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, go to home
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If authenticated but no user role yet, stay on loading
  if (!user?.role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect based on role
  if (user.role === 'PRIMARY') {
    return <Navigate to="/primary/dashboard" replace />;
  }

  if (user.role === 'LINKED') {
    return <Navigate to="/linked/dashboard" replace />;
  }

  // Fallback
  return <Navigate to="/" replace />;
};

// Profile Redirect based on role
const ProfileRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.role) {
    return <Navigate to="/" replace />;
  }

  // Redirect based on role
  if (user.role === 'PRIMARY') {
    return <Navigate to="/primary/settings" replace />;
  }

  if (user.role === 'LINKED') {
    return <Navigate to="/linked/profile" replace />;
  }

  return <Navigate to="/" replace />;
};

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const { isConnected } = useSocket();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const navigate = useNavigate();
  
  const mountedRef = useRef(true);

  // Initialize app data when authenticated
  useAppInitializer();

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Check token expiration on app load and periodically
  useEffect(() => {
    // Initial check
    if (mountedRef.current) {
      checkTokenExpiration();
    }
    
    // Check token every minute
    const interval = setInterval(() => {
      if (mountedRef.current) {
        checkTokenExpiration();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex flex-1">
        {isAuthenticated && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

        <main className={`flex-1 ${isAuthenticated ? 'lg:ml-64' : ''} pb-16 lg:pb-0`}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              {/* ========== PUBLIC ROUTES ========== */}
              <Route
                path="/"
                element={
                  <PublicRoute>
                    <Landing />
                  </PublicRoute>
                }
              />

              <Route
                path="/auth"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />

              <Route
                path="/signup"
                element={
                  <PublicRoute>
                    <SignupOptions />
                  </PublicRoute>
                }
              />

              <Route
                path="/verify-otp"
                element={
                  <PublicRoute skipAuth={true}>
                    <OTPVerification />
                  </PublicRoute>
                }
              />

              <Route
                path="/forgot-pin"
                element={
                  <PublicRoute skipAuth={true}>
                    <ForgotPin />
                  </PublicRoute>
                }
              />
              
              <Route
                path="/accept-invite"
                element={
                  <PublicRoute>
                    <AcceptInvite />
                  </PublicRoute>
                }
              />
              
              <Route
                path="/join-family"
                element={
                  <PublicRoute>
                    <JoinFamily />
                  </PublicRoute>
                }
              />
              
              <Route
                path="/scan"
                element={
                  <PublicRoute>
                    <QRScanner
                      onScan={(data) => {
                        console.log('Family QR Scanned:', data);
                        try {
                          const qrData = JSON.parse(data);
                          if (qrData.type === 'family_link' || qrData.token) {
                            navigate(`/accept-invite?token=${qrData.token || data}`);
                          } else {
                            toast.error('Invalid family QR code');
                          }
                        } catch (e) {
                          if (data.length === 8 || data.includes('FAMILY')) {
                            navigate(`/accept-invite?code=${data}`);
                          } else {
                            toast.error('Invalid QR code format');
                          }
                        }
                      }}
                    />
                  </PublicRoute>
                }
              />

              {/* ========== PUBLIC INFO PAGES ========== */}
              <Route
                path="/features"
                element={<InfoPage title="Features" description="Explore what SnapPay offers for families." />}
              />
              <Route
                path="/how-it-works"
                element={<InfoPage title="How It Works" description="Understand how onboarding, linking, and payments work." />}
              />
              <Route
                path="/pricing"
                element={<InfoPage title="Pricing" description="View current plan and pricing details." />}
              />
              <Route
                path="/faq"
                element={<InfoPage title="FAQ" description="Find answers to common questions." />}
              />
              <Route
                path="/support"
                element={<InfoPage title="Support" description="Get support for account, payments, and technical issues." />}
              />
              <Route
                path="/contact"
                element={<InfoPage title="Contact Us" description="Reach out to the SnapPay team." />}
              />
              <Route
                path="/help"
                element={<InfoPage title="Help Center" description="Browse help topics and troubleshooting guides." />}
              />
              <Route
                path="/privacy"
                element={<InfoPage title="Privacy Policy" description="Learn how your data is collected and protected." />}
              />
              <Route
                path="/terms"
                element={<InfoPage title="Terms of Service" description="Review the terms and conditions for using SnapPay." />}
              />

              {/* ========== PROTECTED ROUTES (Both Roles) ========== */}
              <Route
                path="/profile-setup"
                element={
                  <ProtectedRoute>
                    <ProfileSetup />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/set-pin"
                element={
                  <ProtectedRoute>
                    <SetPin />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/transactions/:id"
                element={
                  <ProtectedRoute>
                    <TransactionDetails />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/receive"
                element={
                  <ProtectedRoute>
                    <ReceiveMoneyShared />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />

              {/* ========== PRIMARY USER ROUTES ========== */}
              <Route
                path="/add-bank"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <AddBank />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/wallet/add"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <AddMoney />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/primary/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <PrimaryDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/primary/scan"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <ScanPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/primary/send"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <SendMoney />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/primary/receive"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <ReceiveMoney />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/primary/recharge"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <Recharge />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/primary/transactions"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <Transactions />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/primary/family"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <FamilyManagement />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/primary/family/add"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <AddFamilyMember />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/primary/family/:id"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <FamilyMemberDetails />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/primary/family/:id/add-limit"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <AddLimit />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/primary/family/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <EditMember />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/primary/family/requests"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <ConnectionRequests />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/primary/banks"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <BankAccounts />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/primary/banks/:id"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <BankDetails />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/primary/support"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <Support />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/primary/settings"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/primary/settings/profile"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <PrimaryProfile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/primary/settings/security"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <PrimarySecurity />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/primary/settings/notifications"
                element={
                  <ProtectedRoute allowedRoles={['PRIMARY']}>
                    <PrimaryNotificationSettings />
                  </ProtectedRoute>
                }
              />

              {/* ========== LINKED USER ROUTES ========== */}
              {/* Routes accessible without connection to primary */}
              <Route
                path="/linked/connect"
                element={
                  <ProtectedRoute allowedRoles={['LINKED']}>
                    <ConnectToPrimary />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/linked/receive"
                element={
                  <ProtectedRoute allowedRoles={['LINKED']}>
                    <LinkedReceive />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/linked/profile"
                element={
                  <ProtectedRoute allowedRoles={['LINKED']}>
                    <LinkedProfile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/linked/connection-status"
                element={
                  <ProtectedRoute allowedRoles={['LINKED']}>
                    <ConnectionStatus />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/linked/join"
                element={
                  <ProtectedRoute allowedRoles={['LINKED']}>
                    <JoinFamily />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/linked/invitations"
                element={
                  <ProtectedRoute allowedRoles={['LINKED']}>
                    <AcceptInvite />
                  </ProtectedRoute>
                }
              />

              {/* Routes that require connection to primary account */}
              <Route element={<LinkedUserGuard />}>
                <Route
                  path="/linked/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['LINKED']}>
                      <LinkedDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/linked/send"
                  element={
                    <ProtectedRoute allowedRoles={['LINKED']}>
                      <LinkedSendMoney />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/linked/scan"
                  element={
                    <ProtectedRoute allowedRoles={['LINKED']}>
                      <LinkedScanPay />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/linked/recharge"
                  element={
                    <ProtectedRoute allowedRoles={['LINKED']}>
                      <LinkedRecharge />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/linked/transactions"
                  element={
                    <ProtectedRoute allowedRoles={['LINKED']}>
                      <LinkedHistory />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/linked/request-increase"
                  element={
                    <ProtectedRoute allowedRoles={['LINKED']}>
                      <RequestIncrease />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* ========== REDIRECT ROUTES ========== */}
              <Route path="/dashboard" element={<DashboardRedirect />} />
              <Route path="/profile" element={<ProfileRedirect />} />

              {/* ========== ERROR ROUTES ========== */}
              <Route path="/404" element={<ErrorPage code={404} message="Page not found" />} />
              <Route path="/403" element={<ErrorPage code={403} message="Access denied" />} />
              <Route path="/500" element={<ErrorPage code={500} message="Server error" />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      {!isAuthenticated && <Footer />}
      {isAuthenticated && <MobileNav />}

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            borderRadius: '0.75rem',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#10B981', secondary: '#fff' },
            style: { borderLeft: '4px solid #10B981' },
          },
          error: {
            iconTheme: { primary: '#DC2626', secondary: '#fff' },
            style: { borderLeft: '4px solid #DC2626' },
          },
          loading: {
            iconTheme: { primary: '#E31B23', secondary: '#fff' },
          },
        }}
      />

      {/* Socket Connection Status (Development Only) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-20 right-4 z-50">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
              isConnected ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-error'}`} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppContent />
      </BrowserRouter>
    </Provider>
  );
}

export default App;