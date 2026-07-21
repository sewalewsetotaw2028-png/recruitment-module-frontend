import React from 'react';
import { useSession } from '@/hooks/useSession';
import { HeaderActions } from './components/HeaderActions';
import { HeaderSearchBar } from './components/HeaderSearchBar';
import { HeaderUserInfo } from './components/HeaderUserInfo';

interface HeaderProps {
  sidebarOpen: boolean;
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ sidebarOpen, onMenuClick }) => {
  const { role } = useSession();

  return (
    <header className={`fixed top-0 right-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 transition-all duration-300 ${
      sidebarOpen ? 'left-[260px]' : 'left-0'
    }`}>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-indigo-700 transition-colors"
          aria-label={sidebarOpen ? 'Close sidebar menu' : 'Open sidebar menu'}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      <div className="flex-1 flex justify-center px-4">
        <HeaderSearchBar currentRole={role} />
      </div>
      <div className="flex items-center gap-4">
        <HeaderActions />
        <HeaderUserInfo />
      </div>
    </header>
  );
};
