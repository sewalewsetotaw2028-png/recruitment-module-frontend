import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { SidebarNavItem } from './SidebarNavItem';

interface SidebarNavProps {
  onNavClick: (path: string) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ onNavClick }) => {
  const location = useLocation();
  const { navItems, role } = useSession();

  return (
    <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-4">
      <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Menu
      </p>
      {navItems.map((item) => {
        const isActive =
          location.pathname === item.path ||
          (item.path !== '/dashboard' &&
            location.pathname.startsWith(item.path));

        return (
          <SidebarNavItem
            key={`${role}-${item.id}`}
            label={item.label}
            icon={item.icon}
            isActive={isActive}
            onClick={() => onNavClick(item.path)}
          />
        );
      })}
    </nav>
  );
};
