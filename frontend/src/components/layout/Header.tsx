// src/components/layout/Header.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BellIcon, 
  UserCircleIcon,
  Bars3Icon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  HomeIcon,
  WalletIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { ROUTES } from '../../utils/constants';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadCount, getNotificationCount } = useNotifications();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const initialFetchDone = useRef(false);

  const fetchNotificationCount = useCallback(async () => {
    if (isAuthenticated && user) {
      await getNotificationCount();
    }
  }, [isAuthenticated, user, getNotificationCount]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (!initialFetchDone.current) {
        fetchNotificationCount();
        initialFetchDone.current = true;
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        fetchNotificationCount();
      }, 60000);
      
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      initialFetchDone.current = false;
    }
  }, [isAuthenticated, user, fetchNotificationCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      setShowProfileMenu(false);
      await logout();
    }
  };

  const handleNotificationsClick = () => {
    navigate(ROUTES.NOTIFICATIONS);
  };

  const getDashboardPath = () => {
    if (!isAuthenticated) return ROUTES.HOME;
    return user?.role === 'PRIMARY' ? ROUTES.PRIMARY_DASHBOARD : ROUTES.LINKED_DASHBOARD;
  };

  const getHistoryPath = () => {
    return user?.role === 'PRIMARY' ? ROUTES.PRIMARY_TRANSACTIONS : ROUTES.LINKED_TRANSACTIONS;
  };

  const getSettingsPath = () => {
    return user?.role === 'PRIMARY' ? ROUTES.PRIMARY_SETTINGS : ROUTES.LINKED_PROFILE;
  };

  const getInitials = () => {
    if (!user) return 'U';
    if (user.name) return user.name.charAt(0).toUpperCase();
    if (user.phone) return user.phone.slice(-2);
    return 'U';
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* LEFT */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:bg-gray-100"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* 🔥 CUSTOM LOGO WITH TAGLINE */}
            <div className="ml-4 lg:ml-0 flex items-center gap-3">
              <div>
                <h1
                  onClick={() => navigate(getDashboardPath())}
                  className="text-2xl font-extrabold cursor-pointer select-none"
                >
                  <span className="text-white stroke-text">Snap</span>
                  <span className="text-red-600 ml-1">Pay</span>
                </h1>
              </div>
              <div className="hidden md:block border-l border-gray-300 pl-3">
                <p className="text-xs text-gray-500 leading-tight">
                  Smart payments for modern families
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2">

            {/* ✅ SHOW ONLY WHEN LOGGED IN */}
            {isAuthenticated && (
              <>
                <button
                  onClick={() => navigate(getDashboardPath())}
                  className="hidden sm:flex p-2 hover:bg-gray-100 rounded-full"
                >
                  <HomeIcon className="h-5 w-5 text-gray-600" />
                </button>

                <button
                  onClick={() => navigate(user?.role === 'PRIMARY' ? ROUTES.WALLET_ADD : ROUTES.LINKED_RECEIVE)}
                  className="hidden sm:flex p-2 hover:bg-gray-100 rounded-full"
                >
                  <WalletIcon className="h-5 w-5 text-gray-600" />
                </button>

                <button
                  onClick={() => navigate(getHistoryPath())}
                  className="hidden sm:flex p-2 hover:bg-gray-100 rounded-full"
                >
                  <ClockIcon className="h-5 w-5 text-gray-600" />
                </button>

                {/* 🔥 FIXED BELL */}
                <button
                  onClick={handleNotificationsClick}
                  className="relative p-2 hover:bg-gray-100 rounded-full"
                >
                  <BellIcon className="h-5 w-5 text-gray-600" />

                  {unreadCount > 0 && (
                    <>
                      <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-ping"></span>
                      <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
                      <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </>
                  )}
                </button>
              </>
            )}

            {/* PROFILE / LOGIN */}
            {isAuthenticated ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-gray-100"
                >
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm">
                    {getInitials()}
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border py-2">
                    <button
                      onClick={() => navigate(ROUTES.PROFILE)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <UserCircleIcon className="h-5 w-5" />
                      Profile
                    </button>

                    <button
                      onClick={() => navigate(getSettingsPath())}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Cog6ToothIcon className="h-5 w-5" />
                      Settings
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(ROUTES.AUTH)}
                  className="px-4 py-2 text-sm text-primary hover:bg-primary-soft rounded-lg"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate(ROUTES.SIGNUP)}
                  className="px-4 py-2 text-sm bg-primary text-white rounded-lg"
                >
                  Sign Up
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 🔥 LOGO STYLE */}
      <style>{`
        .stroke-text {
          -webkit-text-stroke: 1px red;
          color: white;
        }
      `}</style>

    </header>
  );
};

export default Header;