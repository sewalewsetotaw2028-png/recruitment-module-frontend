import React from 'react';
import { useSession } from '@/hooks/useSession';
import { UnifiedDashboard } from './UnifiedDashboard';
import { CandidateDashboardPage } from '@/pages/Candidate/Dashboard';

export function DashboardHomePage() {
  const { user } = useSession();

  if (user?.role === 'candidate') {
    return <CandidateDashboardPage />;
  }

  return <UnifiedDashboard />;
}

export default DashboardHomePage;
