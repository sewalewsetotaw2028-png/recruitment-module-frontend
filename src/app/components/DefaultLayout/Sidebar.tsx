import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { SidebarHeader } from './components/SidebarHeader';
import { SidebarNav } from './components/SidebarNav';
import { SidebarFooter } from './components/SidebarFooter';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onClose }) => {
  const navigate = useNavigate();
  const { role } = useSession();

  const handleNavClick = (path: string) => {
    navigate(path);
    // On mobile (< 1024px) the sidebar is an overlay, so close it after navigation.
    // On desktop the sidebar stays open — only the toggle button should close it.
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-slate-200 transform transition-transform duration-300 flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <SidebarHeader role={role} />
      <SidebarNav onNavClick={handleNavClick} />
      <SidebarFooter onNavClick={handleNavClick} />
    </aside>
  );
};
