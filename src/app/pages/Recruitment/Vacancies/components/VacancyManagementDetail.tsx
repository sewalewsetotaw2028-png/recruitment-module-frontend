import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type {
  Application,
  Interview,
  JobPosting,
  RecruitmentRequest,
  Vacancy,
  WorkforcePlan,
  VacancyStatus,
} from '@/types';
import {
  buildActivityFeed,
  daysOpen,
  getHiringFunnel,
  getLifecycleProgress,
  getVacancyInterviews,
  isUrgentVacancy,
  LIFECYCLE_STEPS,
  vacancyStatusBadge,
} from '@/utils/vacancyManagement';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import { EvaluationResultsView } from './EvaluationResultsView';
import { HiringMinuteDetailView } from './HiringMinuteDetailView';

type DetailTab =
  | 'overview'
  | 'candidates'
  | 'interviews'
  | 'evaluation'
  | 'hiring_minute';

interface Props {
  vacancy: Vacancy;
  posting?: JobPosting;
  request?: RecruitmentRequest;
  workforcePlan?: WorkforcePlan;
  applications: Application[];
  interviews: Interview[];
  onEditDescription: () => void;
  onManagePosting: () => void;
  onPutOnHold: () => void;
  onResume: () => void;
  onTransitionStatus: (status: VacancyStatus, notes?: string) => void;
  onUpdateMeta: (
    updates: Partial<
      Pick<Vacancy, 'closingDate' | 'openPositions' | 'isUrgent'>
    >,
  ) => void;
  onAddNote: (body: string) => void;
  onBack: () => void;
  canUpdate: boolean;
  canManageStatus: boolean;
  canCancel: boolean;
  canPublish: boolean;
  canClose: boolean;
}

export const VacancyManagementDetail: React.FC<Props> = ({
  vacancy,
  posting,
  request,
  workforcePlan,
  applications,
  interviews,
  onEditDescription,
  onManagePosting,
  onPutOnHold,
  onResume,
  onTransitionStatus,
  onUpdateMeta,
  onAddNote,
  onBack,
  canUpdate,
  canManageStatus,
  canCancel,
  canPublish,
  canClose,
}) => {
  const { can } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  const getTabFromPath = (path: string): DetailTab => {
    if (path.endsWith('/evaluation')) return 'evaluation';
    if (path.endsWith('/hiring-minute')) return 'hiring_minute';
    return 'overview';
  };

  const [tab, setTab] = useState<DetailTab>(() => getTabFromPath(location.pathname));

  useEffect(() => {
    setTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const [noteText, setNoteText] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [selectedTransition, setSelectedTransition] = useState<
    VacancyStatus | ''
  >('');
  const [hmStatus, setHmStatus] = useState<string | null>(null);

  // Performance Optimizations
  const funnel = useMemo(
    () => getHiringFunnel(applications, vacancy.id),
    [applications, vacancy.id],
  );
  const vacInterviews = useMemo(
    () => getVacancyInterviews(interviews, applications, vacancy.id),
    [interviews, applications, vacancy.id],
  );
  const vacApps = useMemo(
    () => applications.filter((a) => a.vacancyId === vacancy.id),
    [applications, vacancy.id],
  );
  const feed = useMemo(
    () => buildActivityFeed(vacancy, funnel.total),
    [vacancy, funnel.total],
  );
  const badge = useMemo(
    () => vacancyStatusBadge(vacancy.vacancyStatus),
    [vacancy.vacancyStatus],
  );
  const progress = useMemo(
    () => getLifecycleProgress(vacancy.vacancyStatus),
    [vacancy.vacancyStatus],
  );
  const urgent = useMemo(() => isUrgentVacancy(vacancy), [vacancy]);
  const reversedNotes = useMemo(
    () => [...(vacancy.notes ?? [])].reverse(),
    [vacancy.notes],
  );
  const workforcePlanLabel = useMemo(() => {
    // Try every possible source in priority order, skipping blanks
    const candidates = [
      vacancy.workforcePlanReference,
      workforcePlan?.title,
      request?.workforcePlanReference,
      request?.workforcePlanId,
      vacancy.workforcePlanId,
    ];
    const found = candidates.find((v) => v && String(v).trim().length > 0);
    return found ?? 'Not linked to a plan';
  }, [
    request?.workforcePlanId,
    request?.workforcePlanReference,
    vacancy.workforcePlanId,
    vacancy.workforcePlanReference,
    workforcePlan?.title,
  ]);

  const handleTransitionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value as VacancyStatus;
    if (nextStatus) {
      onTransitionStatus(nextStatus, statusNotes);
      setSelectedTransition('');
      setStatusNotes('');
    }
  };

  const tabs: { id: DetailTab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'candidates', label: 'Candidates', count: funnel.total },
    { id: 'interviews', label: 'Interviews', count: vacInterviews.length },
    { id: 'evaluation', label: 'Evaluation Results' },
    { id: 'hiring_minute', label: 'Hiring Minute' }
  ];


  const statusOptions: VacancyStatus[] = [
    ...(canManageStatus
      ? (["open", "on_hold", "in_progress"] as VacancyStatus[])
      : []),
    ...(canClose ? (["closed"] as VacancyStatus[]) : []),
    ...(canCancel ? (["cancelled"] as VacancyStatus[]) : []),
  ];


  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 bg-slate-50/50 min-h-screen text-slate-800 antialiased ">
      {/* Navigation Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
        
        <button
          type="button"
          onClick={onBack}
          className="hover:text-indigo-600 transition-colors"
        >
          Vacancies
        </button>
        <span className="material-symbols-outlined text-sm text-slate-400 select-none">
          chevron_right
        </span>
        <span className="text-indigo-600 font-semibold">
          {vacancy.displayCode}
        </span>
      </nav>

      {/* Hero Header Card Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {vacancy.displayCode}
              </span>
              {urgent && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 animate-pulse">
                  🔥 Urgent
                </span>
              )}
              {posting && (
                 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase tracking-wide">
              {vacancy.vacancyStatus
                ? vacancy.vacancyStatus.replace('_', ' ')
                : 'Draft'}
            </span>
              )}
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              {vacancy.title}
            </h2>

            <p className="text-sm text-slate-600 font-medium flex flex-wrap items-center gap-1.5">
              <span>{vacancy.departmentName}</span>
              <span className="text-slate-300">&bull;</span>
              <span>{vacancy.location}</span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-indigo-600 font-semibold">
                {request?.hiringManagerName || "Unassigned"}
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-slate-500">Owner: {vacancy.ownerName}</span>
            </p>

            <p className="text-xs text-slate-500 font-medium">
              {vacancy.openPositions} opening(s) &bull; Closes{" "}
              {vacancy.closingDate} &bull;{" "}
              <span className="text-indigo-600 font-semibold">
                {daysOpen(vacancy)} days open
              </span>
              {vacancy.lastModifiedByName &&
                ` &bull; Modified by ${vacancy.lastModifiedByName}`}
            </p>
          </div>

          {/* Core Workflow Trigger Actions */}
          <div className="flex flex-wrap gap-2.5 w-full lg:w-auto shrink-0">
            {canUpdate && vacancy.vacancyStatus !== 'on_hold' && (
              <button
                type="button"
                onClick={onPutOnHold}
                className="flex-1 lg:flex-none px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm"
              >
                On hold
              </button>
            )}
            {canUpdate && vacancy.vacancyStatus === 'on_hold' && (
              <button
                type="button"
                onClick={onResume}
                className="flex-1 lg:flex-none px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm"
              >
                Continue
              </button>
            )}
            {canPublish && (
              <button
                type="button"
                onClick={onManagePosting}
                className="flex-1 lg:flex-none px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm"
              >
                Manage posting
              </button>
            )}
            {canUpdate && (
              <button
                type="button"
                onClick={onEditDescription}
                className="flex-1 lg:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm"
              >
                Edit job description
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Structural Audit References */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="font-semibold text-slate-500 mb-1 uppercase tracking-wider text-[10px]">
              Source Request
            </p>
            <p className="font-mono text-slate-800 bg-white border border-slate-200/40 rounded px-1.5 py-0.5 inline-block">
              {vacancy.recruitmentRequestReference ||
                request?.referenceCode ||
                vacancy.recruitmentRequestId}
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-500 mb-1 uppercase tracking-wider text-[10px]">
              Workforce Plan
            </p>
            <p
              className="font-medium text-slate-800 truncate"
              title={
                vacancy.workforcePlanReference ||
                workforcePlan?.title ||
                request?.workforcePlanReference
              }
            >
              {workforcePlanLabel}
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-500 mb-1 uppercase tracking-wider text-[10px]">
              Vacancy ID
            </p>
            <p className="font-mono text-slate-700">
              {vacancy.displayCode}{" "}
              <span className="text-slate-400">({vacancy.id})</span>
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-500 mb-1 uppercase tracking-wider text-[10px]">
              Employment Type
            </p>
            <p className="capitalize font-medium text-slate-800">
              {vacancy.employmentType.replace("_", " ")}
            </p>
          </div>
        </div>

        {/* Operational Flow Progress Tracker */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span className="uppercase tracking-wider text-[11px]">
              Lifecycle Tracking
            </span>
            <span className="font-mono text-indigo-600">{progress}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {LIFECYCLE_STEPS.map((step) => {
              const currentIdx = LIFECYCLE_STEPS.findIndex(
                (s) => s.status === vacancy.vacancyStatus
              );
              const stepIdx = LIFECYCLE_STEPS.findIndex(
                (s) => s.status === step.status
              );
              const done = currentIdx >= stepIdx;
              return (
                <span
                  key={step.status}
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md border transition-all ${
                    done
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-50 text-slate-400 border-slate-200/60"
                  }`}
                >
                  {step.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Aggregate Recruitment Pipeline Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Applications", value: funnel.total },
          { label: "Screening", value: funnel.screening },
          { label: "Shortlisted", value: funnel.shortlisted },
          { label: "Interviewed", value: funnel.interviewed },
          { label: "Hired", value: funnel.hired }
        ].map((k) => (
          <div
            key={k.label}
            className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm"
          >
            <p className="text-2xl font-bold text-indigo-600 font-mono tracking-tight">
              {k.value}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
              {k.label}
            </p>
          </div>
        ))}
      </div>

      {/* Tab Control Section Toolbar Header */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto scrollbar-none pt-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"

            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition-all ${

              tab === t.id
                ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                tab === t.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Dynamic Tab Framework Content Views */}
      {tab === "overview" && (
        
          <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                Role Description
              </h4>
              <p className="whitespace-pre-line text-sm text-slate-600 leading-relaxed">
                {vacancy.description}
              </p>
            </div>

            {vacancy.responsibilities && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                  Key Responsibilities
                </h4>
                <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2 leading-relaxed">
                  {vacancy.responsibilities
                    .split("\n")
                    .filter(Boolean)
                    .map((line, i) => (
                      <li key={i}>{line.replace(/^[•\-]\s*/, "")}</li>
                    ))}
                </ul>
              </div>
            )}

            {vacancy.requirements && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                  Qualifications & Requirements
                </h4>
                <div className="whitespace-pre-line text-sm text-slate-600 leading-relaxed">
                  {vacancy.requirements}
                </div>
              </div>
            )}

            {vacancy.skills && vacancy.skills.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                  Required Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {vacancy.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {vacancy.benefits && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                  Benefits & Perks
                </h4>
                <div className="whitespace-pre-line text-sm text-slate-600 leading-relaxed">
                  {vacancy.benefits}
                </div>
              </div>
            )}

            {vacancy.employmentTerms && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                  Employment Terms
                </h4>
                <div className="whitespace-pre-line text-sm text-slate-600 leading-relaxed">
                  {vacancy.employmentTerms}
                </div>
              </div>
            )}

            {vacancy.experienceRequired && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                  Experience Required
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {vacancy.experienceRequired}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-100 text-sm">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4 shadow-md">
                <label
                  htmlFor="closingDate"
                  className="font-bold uppercase tracking-wider text-[11px] text-indigo-700 mb-2 block"
                >
                  Closing Date Target
                </label>
                <input
                  id="closingDate"
                  type="date"
                  value={vacancy.closingDate?.slice(0, 10) || ""}
                  onChange={(e) =>
                    onUpdateMeta({ closingDate: e.target.value })
                  }
                  disabled={!canUpdate}
                  className="w-full p-3 border-2 border-indigo-300 rounded-lg bg-white text-slate-800 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 text-sm shadow-sm"
                />
              </div>
              
            </div>
          </div>

        
      )}

      {tab === "candidates" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-500 font-bold tracking-wider">
                  <th className="p-4">Candidate Name</th>
                  <th className="p-4">Pipeline Stage</th>
                  <th className="p-4">Matching Matrix Score</th>
                  <th className="p-4">Submission Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {vacApps.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-6 text-center italic text-slate-400 bg-slate-50/20"
                    >
                      No matching records or applications associated with this
                      workflow track.
                    </td>
                  </tr>
                ) : (
                  vacApps.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4 font-semibold text-slate-900">
                        {app.candidateName}
                      </td>
                      <td className="p-4 font-medium text-slate-600">
                        {app.currentStage}
                      </td>
                      <td className="p-4 font-mono">
                        {app.matchScore != null ? (
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-xs ${
                              app.matchScore >= 75
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {app.matchScore}%
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-4 text-slate-500 font-medium">
                        {new Date(app.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "interviews" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-500 font-bold tracking-wider">
                  <th className="p-4">Candidate Target</th>
                  <th className="p-4">Assessment Mode</th>
                  <th className="p-4">Scheduled Time Slot</th>
                  <th className="p-4">Confirmation State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {vacInterviews.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-6 text-center italic text-slate-400 bg-slate-50/20"
                    >
                      No evaluation boards or milestones scheduled for runtime
                      dependencies.
                    </td>
                  </tr>
                ) : (
                  vacInterviews.map((int) => (
                    <tr
                      key={int.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4 font-semibold text-slate-900">
                        {
                          applications.find((a) => a.id === int.applicationId)
                            ?.candidateName
                        }
                      </td>
                      <td className="p-4 font-medium text-slate-600 capitalize">
                        {int.interviewType}
                      </td>
                      <td className="p-4 font-mono text-slate-500">
                        {new Date(int.scheduledStart).toLocaleString(
                          undefined,
                          {
                            dateStyle: "medium",
                            timeStyle: "short"
                          }
                        )}
                      </td>
                      <td className="p-4 capitalize">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-xs ${
                            int.interviewStatus === "completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}
                        >
                          {int.interviewStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "evaluation" && (
        <EvaluationResultsView vacancyId={vacancy.id} />
      )}

      {tab === "hiring_minute" && (
        <HiringMinuteDetailView hiringMinuteId="" vacancyId={vacancy.id} onStatusChange={setHmStatus} />
      )}
  </div>
  );
};
