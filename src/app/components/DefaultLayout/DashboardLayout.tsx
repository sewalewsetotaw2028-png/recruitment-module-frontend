import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { Header } from '../Header';

const WorkspaceFallback = () => (
  <div className="page-shell">
    <div className="card-premium p-6 text-sm font-semibold text-on-surface-variant">
      Loading workspace...
    </div>
  </div>
);

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false,
  );

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={`flex min-h-screen flex-1 flex-col transition-[padding] duration-300 ${
          sidebarOpen ? 'lg:pl-[260px]' : 'lg:pl-0'
        }`}
      >
        <Header
          sidebarOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen((open) => !open)}
        />

        <main className="custom-scrollbar mt-16 min-h-[calc(100vh-64px)] flex-grow overflow-x-hidden pb-16">
          <React.Suspense fallback={<WorkspaceFallback />}>
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </React.Suspense>
        </main>
      </div>
    </div>
  );
};
