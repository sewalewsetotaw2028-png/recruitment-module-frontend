import React, { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useNavigate } from 'react-router-dom';
import { PRIMARY_COLOR_HEX, THEME_COLORS, TYPOGRAPHY } from '@/config/theme';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import {
  useCandidateDashboardSlice,
  candidateDashboardActions,
} from './slice';
import {
  selectDashboardLoading,
  selectDashboardError,
  selectDashboardApplications,
  selectDashboardInterviews,
  selectDashboardOffers,
  selectDashboardCompleteness,
  selectDashboardSummary,
} from './slice/selectors';
import type {
  CandidateDashboardApplication,
  CandidateDashboardInterview,
  CandidateDashboardOffer,
} from './slice/types';
import { DashboardSummaryCards } from './components/DashboardSummaryCards';
import { ApplicationsPanel } from './components/ApplicationsPanel';
import { ProfileCompletenessCard } from './components/ProfileCompletenessCard';
import { QuickActions } from './components/QuickActions';

export const CandidateDashboardPage: React.FC = () => {

  useCandidateDashboardSlice();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useSession();

  const loading = useAppSelector(selectDashboardLoading);
  const error = useAppSelector(selectDashboardError);
  const applications: CandidateDashboardApplication[] = useAppSelector(selectDashboardApplications);
  const interviews: CandidateDashboardInterview[] = useAppSelector(selectDashboardInterviews);
  const offers: CandidateDashboardOffer[] = useAppSelector(selectDashboardOffers);
  const completeness = useAppSelector(selectDashboardCompleteness);
  const summary = useAppSelector(selectDashboardSummary);

  useEffect(() => {
    dispatch(candidateDashboardActions.fetchDashboardRequest());
  }, [dispatch]);

  // Find any pending (SENT) offers
  const pendingOffer = useMemo(() => {
    return offers.find((o: CandidateDashboardOffer) => o.status === 'SENT');
  }, [offers]);

  // Find the next upcoming interview
  const upcomingInterview = useMemo(() => {
    const now = new Date();
    const scheduled = interviews.filter(
      (i: CandidateDashboardInterview) => i.interviewStatus === 'scheduled' && new Date(i.scheduledStart) > now
    );
    // Sort by scheduledStart ascending
    scheduled.sort(
      (a: CandidateDashboardInterview, b: CandidateDashboardInterview) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
    );
    return scheduled[0];
  }, [interviews]);

  // Greeting logic
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    let timeGreeting = 'Good morning';
    if (hours >= 12 && hours < 17) timeGreeting = 'Good afternoon';
    if (hours >= 17) timeGreeting = 'Good evening';
    return `${timeGreeting}, ${user?.first_name || 'Candidate'}`;
  }, [user]);

  // Dynamic context subtext under greeting
  const greetingSubtext = useMemo(() => {
    if (pendingOffer) {
      return 'You have an offer waiting for your review — please respond before the expiry date.';
    }
    if (upcomingInterview) {
      const dateStr = new Date(upcomingInterview.scheduledStart).toLocaleDateString(undefined, {
        dateStyle: 'medium',
      });
      return `You have an interview scheduled on ${dateStr} for the ${upcomingInterview.vacancyTitle} position.`;
    }
    const activeApps = summary.activeApplications;
    if (activeApps > 0) {
      return `You have ${activeApps} active application${activeApps > 1 ? 's' : ''} in progress.`;
    }
    return 'Start your journey — browse open positions.';
  }, [pendingOffer, upcomingInterview, summary.activeApplications]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-slate-50 min-h-screen text-slate-800 antialiased space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center gap-4">
        {/* User Avatar */}
        <div 
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.primaryLight} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: THEME_COLORS.textInverse,
            fontSize: TYPOGRAPHY.fontSize.xl,
            fontWeight: TYPOGRAPHY.fontWeight.bold,
            boxShadow: '0 4px 12px rgba(15, 40, 71, 0.15)',
          }}
        >
          {user?.first_name?.charAt(0).toUpperCase() || 'C'}
        </div>
        
        <div className="flex-1">
          <h1 
            style={{
              fontSize: TYPOGRAPHY.heading.h1.fontSize,
              fontWeight: TYPOGRAPHY.heading.h1.fontWeight,
              lineHeight: TYPOGRAPHY.heading.h1.lineHeight,
              letterSpacing: TYPOGRAPHY.heading.h1.letterSpacing,
              color: THEME_COLORS.textPrimary,
              margin: 0,
            }}
          >
            {greeting}
          </h1>
          <p 
            style={{
              fontSize: TYPOGRAPHY.body.base.fontSize,
              fontWeight: TYPOGRAPHY.body.base.fontWeight,
              lineHeight: TYPOGRAPHY.body.base.lineHeight,
              color: THEME_COLORS.textSecondary,
              marginTop: '4px',
              margin: '4px 0 0 0',
            }}
          >
            {greetingSubtext}
          </p>
        </div>
      </div>

      {error && (
        <Card padding="md" style={{ borderColor: THEME_COLORS.errorLight, backgroundColor: THEME_COLORS.errorLight }}>
          <p style={{ color: THEME_COLORS.errorDark, fontWeight: TYPOGRAPHY.fontWeight.medium, margin: 0 }}>
            {error}
          </p>
        </Card>
      )}

      {/* Pending Offer Banner */}
      {pendingOffer && (
        <Card 
          padding="md" 
          hover={false}
          style={{ 
            borderColor: THEME_COLORS.primary100, 
            backgroundColor: THEME_COLORS.primary100,
            borderLeft: `4px solid ${THEME_COLORS.primary}`,
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span 
                className="material-symbols-outlined"
                style={{
                  color: THEME_COLORS.primary,
                  fontSize: '24px',
                  marginTop: '2px',
                }}
              >
                local_offer
              </span>
              <div>
                <h3 
                  style={{
                    fontSize: TYPOGRAPHY.fontSize.base,
                    fontWeight: TYPOGRAPHY.fontWeight.bold,
                    color: THEME_COLORS.primary,
                    margin: '0 0 4px 0',
                  }}
                >
                  Offer Issued: {pendingOffer.application?.vacancy?.title || 'Job Offer'}
                </h3>
                <p 
                  style={{
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    fontWeight: TYPOGRAPHY.fontWeight.medium,
                    color: THEME_COLORS.textSecondary,
                    margin: 0,
                  }}
                >
                  Please review and respond by{' '}
                  {new Date(pendingOffer.expiry_date).toLocaleDateString(undefined, {
                    dateStyle: 'medium',
                  })}
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={() => navigate('/dashboard/candidate-offers')}
            >
              Review Offer
            </Button>
          </div>
        </Card>
      )}

      {loading && applications.length === 0 ? (
        <Card padding="lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
          <div style={{ textAlign: 'center' }}>
            <div 
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid THEME_COLORS.border',
                borderTopColor: THEME_COLORS.primary,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <p 
              style={{
                color: THEME_COLORS.textSecondary,
                fontSize: TYPOGRAPHY.fontSize.base,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                margin: 0,
              }}
            >
              Loading your dashboard details…
            </p>
          </div>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <DashboardSummaryCards summary={summary} />

          {/* Grid Layout — applications on the left, Profile Completeness on the right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left column — Applications */}
            <div className="lg:col-span-8 space-y-6">
              <ApplicationsPanel applications={applications} />
            </div>

            {/* Right column — Profile Completeness */}
            <div className="lg:col-span-4">
              <ProfileCompletenessCard completeness={completeness} />
            </div>

            {/* Right sidebar — Interview + Quick Actions */}
            <div className="lg:col-span-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Interview Card */}
                <div className="lg:col-span-2">
                  {upcomingInterview && (
                    <Card padding="lg" hover>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="info" size="sm">Upcoming Interview</Badge>
                          <Badge variant="primary" size="sm">Today</Badge>
                        </div>
                        <div>
                          <h4 
                            style={{
                              fontSize: TYPOGRAPHY.fontSize.base,
                              fontWeight: TYPOGRAPHY.fontWeight.bold,
                              color: THEME_COLORS.textPrimary,
                              margin: '0 0 8px 0',
                            }}
                          >
                            {upcomingInterview.vacancyTitle}
                          </h4>
                          <p 
                            style={{
                              fontSize: TYPOGRAPHY.fontSize.sm,
                              fontWeight: TYPOGRAPHY.fontWeight.medium,
                              color: THEME_COLORS.textSecondary,
                              margin: 0,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                              schedule
                            </span>
                            {new Date(upcomingInterview.scheduledStart).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </p>
                        </div>
                        {upcomingInterview.meetingLink && (
                          <Button 
                            size="sm" 
                            fullWidth
                            onClick={() => window.open(upcomingInterview.meetingLink, '_blank')}
                            leftIcon={<span className="material-symbols-outlined" style={{ fontSize: '18px' }}>videocam</span>}
                          >
                            Join Virtual Room
                          </Button>
                        )}
                      </div>
                    </Card>
                  )}
                </div>
                <div className="lg:col-span-1">
                  <QuickActions />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

};

export default CandidateDashboardPage;
