// src/components/layout/MobileNav.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  PaperAirplaneIcon,
  QrCodeIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  PaperAirplaneIcon as PaperAirplaneIconSolid,
  QrCodeIcon as QrCodeIconSolid,
  ClockIcon as ClockIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { ROUTES } from '../../utils/constants';

interface MobileNavProps {
  className?: string;
}

const MobileNav: React.FC<MobileNavProps> = ({ className = '' }) => {
  const { user, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();

  if (!isAuthenticated) return null;

  const getNavItems = () => {
    if (user?.role === 'PRIMARY') {
      return [
        { name: 'Home', href: ROUTES.PRIMARY_DASHBOARD, icon: HomeIcon, activeIcon: HomeIconSolid },
        {
          name: 'Send',
          href: ROUTES.PRIMARY_SEND,
          icon: PaperAirplaneIcon,
          activeIcon: PaperAirplaneIconSolid,
        },
        { name: 'Scan', href: ROUTES.PRIMARY_SCAN, icon: QrCodeIcon, activeIcon: QrCodeIconSolid },
        {
          name: 'History',
          href: ROUTES.PRIMARY_TRANSACTIONS,
          icon: ClockIcon,
          activeIcon: ClockIconSolid,
        },
        { 
          name: 'Profile', 
          href: ROUTES.PRIMARY_SETTINGS_PROFILE,
          icon: UserIcon, 
          activeIcon: UserIconSolid 
        },
      ];
    } else {
      return [
        { name: 'Home', href: ROUTES.LINKED_DASHBOARD, icon: HomeIcon, activeIcon: HomeIconSolid },
        {
          name: 'Send',
          href: ROUTES.LINKED_SEND,
          icon: PaperAirplaneIcon,
          activeIcon: PaperAirplaneIconSolid,
        },
        { name: 'Scan', href: ROUTES.LINKED_SCAN, icon: QrCodeIcon, activeIcon: QrCodeIconSolid },
        {
          name: 'History',
          href: ROUTES.LINKED_TRANSACTIONS,
          icon: ClockIcon,
          activeIcon: ClockIconSolid,
        },
        { 
          name: 'Profile', 
          href: ROUTES.LINKED_PROFILE, 
          icon: UserIcon, 
          activeIcon: UserIconSolid 
        },
      ];
    }
  };

  const navItems = getNavItems();
  const profileIndex = navItems.findIndex(item => item.name === 'Profile');

  return (
    <nav
      className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 ${className}`}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item, index) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors relative
              ${isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <item.activeIcon className="h-6 w-6" />
                ) : (
                  <item.icon className="h-6 w-6" />
                )}
                <span className="text-xs mt-1">{item.name}</span>
                
                {index === profileIndex && unreadCount > 0 && (
                  <span className="absolute -top-1 right-1/4 min-w-[1.25rem] h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center px-1 animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;