import React, { useState } from 'react';
import { useApp } from '@/state';
import { NotificationsPanel } from './shared/NotificationsPanel';
import {
  MockDataBanner,
  HeaderActions,
  HeaderUserInfo,
} from '@/components/DefaultLayout/components';

interface HeaderProps {
  sidebarOpen?: boolean;
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ sidebarOpen, onMenuClick }) => {
  const { usingMockData, setMockMode } = useApp();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <>
      {usingMockData && <MockDataBanner onTryApi={() => setMockMode(false)} />}
      <header
        className={`fixed top-0 right-0 z-40 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-white/95 px-3 md:px-5 glass-header transition-[left,width] duration-300 ${
          sidebarOpen ? 'lg:left-[260px] lg:w-[calc(100%-260px)]' : 'lg:left-0 lg:w-full'
        }`}
      >
        <button
          type="button"
          onClick={onMenuClick}
          className="mr-2 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant bg-white text-on-surface-variant shadow-sm transition-all hover:bg-surface-container-low"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <span className="material-symbols-outlined">
            {sidebarOpen ? 'menu_open' : 'menu'}
          </span>
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 md:gap-4">
          <HeaderActions onNotificationsClick={() => setNotificationsOpen(true)} />
          <HeaderUserInfo />
        </div>
      </header>
      <NotificationsPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </>
  );
};
