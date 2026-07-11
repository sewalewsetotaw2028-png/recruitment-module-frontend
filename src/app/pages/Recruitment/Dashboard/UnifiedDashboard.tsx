import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { PageSectionHeader } from '@/components/common/PageSectionHeader';
import { useNavigate } from 'react-router-dom';
import { recruitmentDashboardActions } from './slice';
import { useApp } from '@/state';
import { useSession } from '@/hooks/useSession';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import makeCall, { API_ROUTES } from '@/API';
import { useRecruitmentDashboardSlice } from './slice';
import {
  selectRecruitmentDashboardError,
  selectRecruitmentDashboardLoading,
  selectRecruitmentDashboardSummary,
  selectRecruitmentDashboardKpis,
  selectRecruitmentDashboardSourcing,
  selectRecruitmentDashboardTrends,
  selectRecruitmentDashboardPipeline,
  selectRecruitmentDashboardLastFetchedAt,
} from './slice/selectors';

// Widget imports
import { SummaryMetricsCards } from './components/widgets/SummaryMetricsCards';
import { KPICards } from './components/widgets/KPICards';
import { SourcingPanel } from './components/widgets/SourcingPanel';
import { ActivityFeed } from './components/ActivityFeed';
import { InterviewsTodayPanel } from './components/widgets/InterviewsTodayPanel';
import { MyVacancies } from './components/widgets/MyVacancies';
import { MyEvaluations } from './components/widgets/MyEvaluations';
import { FunnelChart } from './components/FunnelChart';

// Candidate widgets (rendered when candidate-scoped permissions are present)
import { mapApiApplication } from '@/pages/Candidate/Dashboard/api';
import type { CandidateDashboardApplication } from '@/pages/Candidate/Dashboard/slice/types';
import { DashboardSummaryCards } from '@/pages/Candidate/Dashboard/components/DashboardSummaryCards';
import { ApplicationsPanel } from '@/pages/Candidate/Dashboard/components/ApplicationsPanel';
import { QuickActions } from '@/pages/Candidate/Dashboard/components/QuickActions';
import { ProfileCompletenessCard } from '@/pages/Candidate/Dashboard/components/ProfileCompletenessCard';

/**
 * UnifiedDashboard — single entry point that adapts entirely based on
 * the live permission set. No hardcoded role checks.
 *
 * Each widget independently performs its own permission check and
 * renders nothing if the permission fails. The shell only manages
 * layout, filter controls, and orchestrated data fetching.
 */
export const UnifiedDashboard: React.FC = () => {
  useRecruitmentDashboardSlice();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { vacancies, departments } = useApp();
  const { user } = useSession();
  const { can } = usePermissions();

  // Data selectors
  const summary = useAppSelector(selectRecruitmentDashboardSummary);
  const sourcing = useAppSelector(selectRecruitmentDashboardSourcing);
  const loading = useAppSelector(selectRecruitmentDashboardLoading);
  const error = useAppSelector(selectRecruitmentDashboardError);
  const kpis = useAppSelector(selectRecruitmentDashboardKpis);
  const trends = useAppSelector(selectRecruitmentDashboardTrends);
  const pipeline = useAppSelector(selectRecruitmentDashboardPipeline);
  const lastFetchedAt = useAppSelector(selectRecruitmentDashboardLastFetchedAt);

  const minutesAgo = useMemo(() => {
    if (!lastFetchedAt) return null;
    const diff = Math.floor((Date.now() - lastFetchedAt) / 60000);
    return diff < 1 ? 'just now' : `${diff} min ago`;
  }, [lastFetchedAt]);

  // State for org-level reporting filters
  const canViewGlobalDashboard = can(PERMISSIONS.REPORTS_READ);
  const canViewCandidateDashboard =
    can(PERMISSIONS.CANDIDATE_APPLICATION_READ) && !canViewGlobalDashboard;
  const [funnelPeriod, setFunnelPeriod] = useState<
    'monthly' | 'quarterly' | 'custom'
  >('monthly');
  const [customRange, setCustomRange] = useState<{
    start?: string;
    end?: string;
  }>({});
  const [selectedDepartment, setSelectedDepartment] = useState<string>(
    canViewGlobalDashboard ? 'all' : user?.departmentId || '',
  );
  const [selectedVacancy, setSelectedVacancy] = useState<string>('all');

  // State for assignment-based data
  const [myVacancies, setMyVacancies] = useState<any[]>([]);
  const [myInterviews, setMyInterviews] = useState<any[]>([]);
  const [myEvaluations, setMyEvaluations] = useState<any[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  // Candidate dashboard data (scoped to the logged-in candidate)
  const [candidateApplications, setCandidateApplications] = useState<
    CandidateDashboardApplication[]
  >([]);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [candidateError, setCandidateError] = useState<string | null>(null);

  const candidateSummary = useMemo(() => {
    const totalApplications = candidateApplications.length;
    const activeApplications = candidateApplications.filter(
      (a) => !['rejected', 'withdrawn'].includes(a.currentStage.toLowerCase()),
    ).length;
    return {
      totalApplications,
      activeApplications,
      scheduledInterviews: candidateApplications.reduce(
        (count, application) =>
          count + (application.interviewsCount > 0 ? 1 : 0),
        0,
      ),
      pendingOffers: 0,
      completenessPercentage: 0,
    };
  }, [candidateApplications]);

  const funnelData = useMemo(() => {
    return (pipeline ?? []).map((p: any, idx: number, arr: any[]) => ({
      label: p.stage?.replace(/_/g, ' ') || p.stage,
      count: p.count || 0,
      pct: arr[0]?.count ? Math.round((p.count / arr[0].count) * 100) : 0,
    }));
  }, [pipeline]);

  const effectiveDepartmentId = canViewGlobalDashboard
    ? selectedDepartment !== 'all'
      ? selectedDepartment
      : undefined
    : user?.departmentId;

  const scopedVacancies = useMemo(() => {
    if (canViewGlobalDashboard || !effectiveDepartmentId) {
      return vacancies;
    }
    return vacancies.filter(
      (vacancy: any) => vacancy.departmentId === effectiveDepartmentId,
    );
  }, [canViewGlobalDashboard, effectiveDepartmentId, vacancies]);

  useEffect(() => {
    if (!canViewGlobalDashboard) {
      setSelectedDepartment(user?.departmentId || '');
    }
  }, [canViewGlobalDashboard, user?.departmentId]);

  // Fetch assignment-based data if user has relevant permissions
  useEffect(() => {
    if (
      can(PERMISSIONS.MY_VACANCY_READ) ||
      can(PERMISSIONS.MY_INTERVIEW_READ) ||
      can(PERMISSIONS.MY_EVALUATION_READ)
    ) {
      setAssignmentLoading(true);
      Promise.all([
        can(PERMISSIONS.MY_VACANCY_READ)
          ? makeCall<{ status: string; data: any[] }>({
              method: 'GET',
              route: API_ROUTES.reporting.myVacancies,
              isSecureRoute: true,
            }).catch(() => null)
          : Promise.resolve(null),
        can(PERMISSIONS.MY_INTERVIEW_READ)
          ? makeCall<{ status: string; data: any[] }>({
              method: 'GET',
              route: API_ROUTES.reporting.myInterviews,
              isSecureRoute: true,
            }).catch(() => null)
          : Promise.resolve(null),
        can(PERMISSIONS.MY_EVALUATION_READ)
          ? makeCall<{ status: string; data: any[] }>({
              method: 'GET',
              route: API_ROUTES.reporting.myEvaluations,
              isSecureRoute: true,
            }).catch(() => null)
          : Promise.resolve(null),
      ])
        .then(([vacRes, intRes, evalRes]) => {
          // makeCall returns Axios response; .data is the API body { status, data: [] }
          const toArray = (res: any) => {
            if (!res) return null;
            const body = res.data;
            if (Array.isArray(body)) return body;
            if (Array.isArray(body?.data)) return body.data;
            return [];
          };
          const vacs = toArray(vacRes);
          const ints = toArray(intRes);
          const evals = toArray(evalRes);
          if (vacs !== null) setMyVacancies(vacs);
          if (ints !== null) setMyInterviews(ints);
          if (evals !== null) setMyEvaluations(evals);
        })
        .finally(() => setAssignmentLoading(false));
    }
  }, [can]);

  // Fetch candidate-scoped dashboard data
  useEffect(() => {
    if (!canViewCandidateDashboard) return;
    setCandidateLoading(true);
    setCandidateError(null);

    makeCall<{ status: string; data: unknown[] }>({
      method: 'GET',
      route: API_ROUTES.candidates.applications,
      isSecureRoute: true,
    })
      .then((res) => {
        const rows = Array.isArray(res.data?.data) ? res.data.data : [];
        setCandidateApplications(
          rows.map((row) => mapApiApplication(row as Record<string, unknown>)),
        );
      })
      .catch((e: any) => {
        setCandidateError(String(e?.message || 'Could not load your dashboard.'));
        setCandidateApplications([]);
      })
      .finally(() => setCandidateLoading(false));
  }, [canViewCandidateDashboard]);

  // Fetch data based on what's needed
  useEffect(() => {
    // Only fetch org-level dashboard data if user has REPORTS_READ permission
    if (canViewGlobalDashboard) {
      dispatch(
        recruitmentDashboardActions.fetchDashboardRequest({
          period: funnelPeriod,
          startDate: customRange.start,
          endDate: customRange.end,
          departmentId: effectiveDepartmentId,
          vacancyId: selectedVacancy !== 'all' ? selectedVacancy : undefined,
        }),
      );
    }
  }, [
    customRange,
    dispatch,
    effectiveDepartmentId,
    funnelPeriod,
    selectedVacancy,
    canViewGlobalDashboard,
  ]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 text-sm bg-slate-50 min-h-screen text-slate-800 animate-fade-in">
      {/* Header with filter controls — only show reporting filters if user has REPORTS_READ */}
      <PageSectionHeader
        eyebrow={
          canViewCandidateDashboard
            ? 'Candidate portal'
            : 'Recruitment reporting & analytics'
        }
        title={
          canViewCandidateDashboard
            ? `Good morning, ${user?.firstName ?? 'there'}`
            : 'Dashboard'
        }
        description={
          canViewCandidateDashboard
            ? 'Track applications, interviews, and offers in one place.'
            : 'Personalized view of your recruitment activity'
        }
        usePrimaryColor={true}
        action={
          canViewGlobalDashboard && (
            <div className="flex flex-col gap-3 items-end">
              {minutesAgo && (
                <p className="text-xs text-slate-400">
                  Refreshed {minutesAgo} ·{' '}
                  <button
                    onClick={() => dispatch(recruitmentDashboardActions.fetchDashboardRequest({
                      period: funnelPeriod,
                      startDate: customRange.start,
                      endDate: customRange.end,
                      departmentId: effectiveDepartmentId,
                      vacancyId: selectedVacancy !== 'all' ? selectedVacancy : undefined,
                    }))}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    Refresh
                  </button>
                </p>
              )}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
                  <select
                    value={funnelPeriod}
                    onChange={(e) =>
                      setFunnelPeriod(
                        e.target.value as 'monthly' | 'quarterly' | 'custom',
                      )
                    }
                    className="text-sm bg-transparent outline-none pr-4"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div className="flex items-center bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="text-sm bg-transparent outline-none pr-4"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
                  <select
                    value={selectedVacancy}
                    onChange={(e) => setSelectedVacancy(e.target.value)}
                    className="text-sm bg-transparent outline-none pr-4"
                  >
                    <option value="all">All Vacancies</option>
                    {scopedVacancies.map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {v.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {funnelPeriod === 'custom' && (
                <div className="flex items-center gap-2 bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 shadow-sm self-end">
                  <input
                    type="date"
                    value={customRange.start ?? ''}
                    onChange={(e) =>
                      setCustomRange((s) => ({ ...s, start: e.target.value }))
                    }
                    className="text-sm bg-transparent outline-none"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="date"
                    value={customRange.end ?? ''}
                    onChange={(e) =>
                      setCustomRange((s) => ({ ...s, end: e.target.value }))
                    }
                    className="text-sm bg-transparent outline-none"
                  />
                </div>
              )}
            </div>
          )
        }
      />

      {/* Error display */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {candidateError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {candidateError}
        </div>
      )}

      {/* Department mapping warning for non-REPORTS_READ users without personal assignments */}
      {!canViewGlobalDashboard &&
        !user?.departmentId &&
        !can(PERMISSIONS.MY_VACANCY_READ) &&
        !can(PERMISSIONS.MY_INTERVIEW_READ) &&
        !can(PERMISSIONS.MY_EVALUATION_READ) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your account is not mapped to a department and has no assigned
            tasks, so dashboard data is unavailable.
          </div>
        )}

      {/* Loading state */}
      {(canViewCandidateDashboard
        ? candidateLoading
        : loading && canViewGlobalDashboard && !summary) ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          {canViewCandidateDashboard
            ? 'Loading your dashboard…'
            : 'Loading dashboard metrics…'}
        </div>
      ) : (
        <>
          {/* Candidate-scoped widgets */}
          {canViewCandidateDashboard && (
            <>
              <DashboardSummaryCards summary={candidateSummary} />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                  <ApplicationsPanel applications={candidateApplications} />
                </div>
                <div className="lg:col-span-4 space-y-6">
                  <QuickActions />
                  <ProfileCompletenessCard />
                </div>
              </div>
            </>
          )}

          {/* Org-level widgets — only render if user has REPORTS_READ */}
          {can(PERMISSIONS.REPORTS_READ) && (
            <>
              <SummaryMetricsCards
                summary={summary}
                trends={trends}
                navigate={navigate}
              />
              <KPICards kpis={kpis} loading={loading} />
              <SourcingPanel sourcing={sourcing} trends={trends} />
            </>
          )}

          {/* Personal assignment widgets */}
          {(can(PERMISSIONS.MY_VACANCY_READ) ||
            can(PERMISSIONS.MY_INTERVIEW_READ) ||
            can(PERMISSIONS.MY_EVALUATION_READ)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {can(PERMISSIONS.MY_VACANCY_READ) && (
                <div className="xl:col-span-1">
                  <MyVacancies vacancies={myVacancies} />
                </div>
              )}

              {can(PERMISSIONS.MY_INTERVIEW_READ) && (
                <div className="xl:col-span-1">
                  <InterviewsTodayPanel interviews={myInterviews} />
                </div>
              )}

              {can(PERMISSIONS.MY_EVALUATION_READ) && (
                <div className="xl:col-span-1">
                  <MyEvaluations evaluations={myEvaluations} />
                </div>
              )}
            </div>
          )}

          {/* Activity feed — only if REPORTS_READ */}
          {can(PERMISSIONS.REPORTS_READ) && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <FunnelChart funnelPeriod={funnelPeriod} setFunnelPeriod={setFunnelPeriod} funnelData={funnelData} />
              </div>
              <div className="lg:col-span-5">
                <ActivityFeed />
              </div>
            </div>
          )}

          {/* Fallback empty state for users with no permissions at all */}
          {!canViewGlobalDashboard &&
            !canViewCandidateDashboard &&
            !can(PERMISSIONS.MY_VACANCY_READ) &&
            !can(PERMISSIONS.MY_INTERVIEW_READ) &&
            !can(PERMISSIONS.MY_EVALUATION_READ) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <span className="material-symbols-outlined text-slate-300 text-5xl block mb-4">
                lock
              </span>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No dashboard access
              </h3>
              <p className="text-sm text-slate-500">
                You don't have the required permissions to view any dashboard widgets.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UnifiedDashboard;
