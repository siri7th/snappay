// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  PaperAirplaneIcon,
  QrCodeIcon,
  ArrowPathIcon,
  ClockIcon,
  UsersIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  WalletIcon,
  BellIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { ROUTES } from '../../utils/constants';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const primaryNavItems = [
    { name: 'Dashboard', href: ROUTES.PRIMARY_DASHBOARD, icon: HomeIcon },
    { name: 'Send Money', href: ROUTES.PRIMARY_SEND, icon: PaperAirplaneIcon },
    { name: 'Receive Money', href: ROUTES.PRIMARY_RECEIVE, icon: QrCodeIcon },
    { name: 'Recharge', href: ROUTES.PRIMARY_RECHARGE, icon: ArrowPathIcon },
    { name: 'Transactions', href: ROUTES.PRIMARY_TRANSACTIONS, icon: ClockIcon },
    { name: 'Family', href: ROUTES.PRIMARY_FAMILY, icon: UsersIcon },
    { name: 'Bank Accounts', href: ROUTES.PRIMARY_BANKS, icon: BanknotesIcon },
    { name: 'Wallet', href: ROUTES.WALLET_ADD, icon: WalletIcon },
  ];

  const linkedNavItems = [
    { name: 'Dashboard', href: ROUTES.LINKED_DASHBOARD, icon: HomeIcon },
    { name: 'Send Money', href: ROUTES.LINKED_SEND, icon: PaperAirplaneIcon },
    { name: 'Scan & Pay', href: ROUTES.LINKED_SCAN, icon: QrCodeIcon },
    { name: 'Recharge', href: ROUTES.LINKED_RECHARGE, icon: ArrowPathIcon },
    { name: 'History', href: ROUTES.LINKED_TRANSACTIONS, icon: ClockIcon },
    { name: 'Request Increase', href: ROUTES.LINKED_REQUEST_INCREASE, icon: ArrowPathIcon },
  ];

  const bottomNavItems = [
    { name: 'Notifications', href: ROUTES.NOTIFICATIONS, icon: BellIcon, badge: unreadCount },
    { name: 'Settings', href: user?.role === 'PRIMARY' ? ROUTES.PRIMARY_SETTINGS : ROUTES.LINKED_PROFILE, icon: Cog6ToothIcon },
    { name: 'Help', href: ROUTES.SUPPORT, icon: QuestionMarkCircleIcon },
  ];

  const navItems = user?.role === 'PRIMARY' ? primaryNavItems : linkedNavItems;

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-50
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:relative lg:translate-x-0
        `}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <span className="text-xl font-bold text-primary">SnapPay</span>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name ? user.name.charAt(0).toUpperCase() : user?.phone?.slice(-2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role === 'PRIMARY' ? 'Primary Account' : 'Linked Account'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`
                    }
                    onClick={handleLinkClick}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Bottom navigation */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <ul className="space-y-1">
                {bottomNavItems.map((item) => (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative
                        ${isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`
                      }
                      onClick={handleLinkClick}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="ml-auto min-w-[1.25rem] h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center px-1">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Version */}
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center">Version 1.0.0</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;