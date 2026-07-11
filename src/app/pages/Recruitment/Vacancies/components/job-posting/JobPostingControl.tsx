import React, { useEffect, useState } from 'react';
import type { JobPosting, PostingVisibility, Vacancy } from '@/types';
import { ConfirmModal } from '@/components/ConfirmModal';
import {
  channelIcon,
  conversionRate,
  daysUntilClosing,
  formatEmploymentType,
  postingStatusBadge,
} from '@/utils/jobPosting';
import {
  LIFECYCLE_STEPS,
  getLifecycleProgress,
} from '@/utils/vacancyManagement';
import { fetchCompanyChannels, type RawRecruitmentChannel } from '../../jobPostingApi';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import type { UserRole } from '@/state/appContext.types';

interface JobPostingControlProps {
  vacancy: Vacancy;
  posting: JobPosting;
  /** True while the API call to load/publish/withdraw is in-flight */
  postingLoading?: boolean;
  /** Error message from the last API call, if any */
  postingError?: string | null;
  /** True when posting comes from the DB (not a local fallback) */
  hasRealPosting?: boolean;
  currentRole: UserRole;
  onUpdateChannels: (enabledSlugs: string[]) => void;
  onUpdateVisibility: (visibility: PostingVisibility) => void;
  onUpdateClosingDate: (date: string) => void;
  /** Called with the selected channel IDs when publish is confirmed */
  onPublish: (channelIds: string[]) => void;
  onSchedule: (date: string, time: string) => void;
  onWithdraw: () => void;
  onUnpublish: () => void;
  onDuplicate: () => void;
  onSaveDraft: () => void;
  onSubmitForApproval: () => void;
  onApprove: (notes?: string) => void;
  onReject: (reason: string) => void;
  /** Called when the user wants to create a new job posting for this vacancy */
  onCreatePosting: (channelIds: string[]) => void;
  onPauseHiring: () => void;
  onResumeHiring: () => void;
  onBack: () => void;
  canPublishVacancy: boolean;
  canManagePosting: boolean;
  canCloseVacancy: boolean;
}

export const JobPostingControl: React.FC<JobPostingControlProps> = ({
  vacancy,
  posting,
  postingLoading = false,
  postingError = null,
  hasRealPosting = false,
  currentRole,
  onUpdateChannels,
  onUpdateVisibility,
  onUpdateClosingDate,
  onPublish,
  onSchedule,
  onWithdraw,
  onUnpublish,
  onDuplicate,
  onSaveDraft,
  onSubmitForApproval,
  onCreatePosting,
  onPauseHiring,
  onResumeHiring,
  onBack,
  canPublishVacancy: canPublishProp = false,
  canManagePosting: canManagePostingProp = false,
  canCloseVacancy: canCloseVacancyProp = false,
}) => {
  // Derive permissions from the live session — props are kept as optional fallbacks
  const { can } = usePermissions();
  const canRead    = can(PERMISSIONS.VACANCY_READ);
  const canUpdate  = can(PERMISSIONS.VACANCY_UPDATE);
  const canCreate = can (PERMISSIONS.VACANCY_CREATE);
  const canPublishPerm = can(PERMISSIONS.VACANCY_PUBLISH);
  const canClose   = can(PERMISSIONS.VACANCY_CLOSE) || canCloseVacancyProp;
  // canPublish = true if the user has either UPDATE or PUBLISH permission
  const canPublish = canUpdate || canPublishPerm || canPublishProp || canManagePostingProp;
  const [confirm, setConfirm] = useState<
    'publish' | 'withdraw' | 'unpublish' | null
  >(null);

  // Vacancy lifecycle — same progress/steps as VacancyManagementDetail
  const lifecycleProgress = getLifecycleProgress(vacancy.vacancyStatus);

  // Company channels — loaded from the backend
  const [companyChannels, setCompanyChannels] = useState<RawRecruitmentChannel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);

  // Which channel IDs are selected for publishing
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>(() =>
    posting.channels.filter((c) => c.enabled).map((c) => c.channelSlug),
  );

  useEffect(() => {
    setChannelsLoading(true);
    fetchCompanyChannels()
      .then(setCompanyChannels)
      .catch(() => setCompanyChannels([]))
      .finally(() => setChannelsLoading(false));
  }, []);

  // Keep selectedChannelIds in sync if posting changes (e.g. loaded from API)
  useEffect(() => {
    const enabled = posting.channels.filter((c) => c.enabled).map((c) => c.channelSlug);
    if (enabled.length > 0) setSelectedChannelIds(enabled);
  }, [posting.id]);

  const toggleChannelId = (id: string) => {
    setSelectedChannelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [showSchedule, setShowSchedule] = useState(false);

  const enabledSlugs = selectedChannelIds;
  const unsyncedSlugs = enabledSlugs.filter(id => {
    const existing = posting.channels.find(c => c.channelSlug === id);
    return existing?.syncStatus !== 'active';
  });
  const statusBadge = postingStatusBadge(posting.publicationStatus);
  const daysLeft = daysUntilClosing(posting.closingDate || vacancy.closingDate);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 text-slate-700 antialiased selection:bg-indigo-100">
      {/* Read guard */}
      {!canRead && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center space-y-2">
          <span className="material-symbols-outlined text-3xl text-rose-400">lock</span>
          <p className="text-sm font-bold text-rose-700">Access restricted</p>
          <p className="text-xs text-rose-500">You do not have permission to view job postings.</p>
        </div>
      )}
      {canRead && (<>
      {/* Loading overlay banner */}
      {postingLoading && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
          Loading job posting data…
        </div>
      )}

      {/* API error banner */}
      {postingError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          {postingError}
        </div>
      )}

      {/* No posting exists yet — prompt to create one */}
      {!postingLoading && !hasRealPosting && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-900">No job posting created yet</p>
              <p className="text-xs text-amber-700">
                Select channels below, then click <strong>Create Job Posting</strong> to publish to those channels.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onCreatePosting(selectedChannelIds)}
              disabled={postingLoading || selectedChannelIds.length === 0}
              className="shrink-0 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-sm disabled:opacity-40"
            >
              {selectedChannelIds.length === 0
                ? 'Select channels first'
                : `Publish to ${selectedChannelIds.length} channel${selectedChannelIds.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1.5">
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <button
              type="button"
              onClick={onBack}
              className="hover:text-indigo-600 transition-colors duration-150"
            >
              Vacancies
            </button>
            <span className="material-symbols-outlined text-sm text-slate-400">
              chevron_right
            </span>
            <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
              {vacancy.displayCode}
            </span>
            <span className="material-symbols-outlined text-sm text-slate-400">
              chevron_right
            </span>
            <span className="text-indigo-700 font-semibold">
              Job Posting Control
            </span>
          </nav>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            {vacancy.title}
          </h2>
          <p className="text-sm text-slate-500 flex items-center gap-2 flex-wrap">
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
              Req:{' '}
              {vacancy.recruitmentRequestReference ||
                vacancy.recruitmentRequestId}
            </span>
            <span className="text-slate-300">•</span>
            <span>Plan: {vacancy.workforcePlanReference || '—'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase tracking-wide">
              {vacancy.vacancyStatus
                ? vacancy.vacancyStatus.replace('_', ' ')
                : 'Draft'}
            </span>
          {daysLeft !== null && posting.publicationStatus === 'published' && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-sm animate-pulse">
              {daysLeft}d until deadline
            </span>
          )}
          {canPublish && (
            <div className="flex items-center gap-1.5 bg-indigo-50/60 px-3 py-1 rounded-full border border-indigo-100 text-xs">
              <span className="material-symbols-outlined text-base text-indigo-600">
                verified_user
              </span>
              <span className="font-semibold text-indigo-900">
                HR Publishing Authority
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Access Notification Banner */}
      {!canPublish && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-sm text-amber-900 flex items-start gap-3 shadow-sm">
          <span className="material-symbols-outlined text-amber-600 shrink-0">
            lock
          </span>
          <div>
            <p className="font-semibold">Read-only posting view</p>
            <p className="text-amber-700/90 text-xs mt-0.5">
              Users with vacancy update permission may edit posting details.
            </p>
          </div>
        </div>
      )}

      {/* Lifecycle Progress Bar — tracks vacancy status, identical to VacancyManagementDetail */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center text-xs font-semibold tracking-wider text-slate-500 uppercase">
          <span>Vacancy Lifecycle</span>
          <span className="font-mono text-indigo-600">{lifecycleProgress}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${lifecycleProgress}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {LIFECYCLE_STEPS.map((step) => {
            const currentIdx = LIFECYCLE_STEPS.findIndex(
              (s) => s.status === vacancy.vacancyStatus,
            );
            const stepIdx = LIFECYCLE_STEPS.findIndex(
              (s) => s.status === step.status,
            );
            const done = currentIdx >= stepIdx;
            return (
              <span
                key={step.status}
                className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md border transition-all ${
                  done
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-400 border-slate-200/60'
                }`}
              >
                {step.label}
              </span>
            );
          })}
        </div>
        {posting.scheduledPublishDate && (
          <p className="text-xs text-indigo-600 flex items-center gap-1 font-medium bg-indigo-50/40 p-2 rounded-lg border border-indigo-100/60 w-fit">
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            Scheduled Release:{' '}
            {new Date(posting.scheduledPublishDate).toLocaleString()}
          </p>
        )}
      </div>

      {/* Main Workspace Layout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side Content Column */}
        <div className="lg:col-span-8 space-y-6 ">
          {/* Metadata Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5  shadow-sm space-y-4 max-h-[70vh] overflow-y-auto">
            <h4 className="text-sm font-bold tracking-wider text-slate-900 uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="material-symbols-outlined text-slate-400">
                badge
              </span>
              Posting Parameters & Overview
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {[
                ['Job Title', vacancy.title],
                ['Department', vacancy.departmentName],
                ['Location', vacancy.location],
                [
                  'Employment Type',
                  formatEmploymentType(vacancy.employmentType),
                ],
                ['Experience Requirement', vacancy.experienceRequired || '—'],
                ['Total Openings', String(vacancy.openPositions)],
                ['Hiring Manager', vacancy.hiringManagerName],
                ['Vacancy Owner', vacancy.ownerName],
                [
                  ...(vacancy.salaryMin != null
                    ? [
                        'Salary Range',
                        `${vacancy.salaryMin.toLocaleString()} – ${vacancy.salaryMax?.toLocaleString()} ETB`,
                      ]
                    : ['Salary Range', 'Not disclosed']),
                ],
              ].map(([label, val]) => (
                <div
                  key={label}
                  className="bg-slate-50/50 p-3 rounded-lg border border-slate-200/60 flex flex-col justify-between"
                >
                  <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    {label}
                  </p>
                  <p
                    className="font-semibold text-slate-900 mt-1 truncate"
                    title={val}
                  >
                    {val}
                  </p>
                </div>
              ))}
            </div>
            <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-t border-slate-100">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-indigo-600 tracking-wider uppercase">
                  Qualifications & Requirements
                </p>
                <p className="text-slate-600 text-xs leading-relaxed line-clamp-4 whitespace-pre-line p-2 bg-slate-50/40 rounded border border-slate-100">
                  {vacancy.requirements}
                </p>
              </div>
              {vacancy.benefits && (
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-indigo-600 tracking-wider uppercase">
                    Compensation & Benefits
                  </p>
                  <p className="text-slate-600 text-xs leading-relaxed line-clamp-4 whitespace-pre-line p-2 bg-slate-50/40 rounded border border-slate-100">
                    {vacancy.benefits}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Configurable Publishing Channels */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
              <h4 className="text-sm font-bold tracking-wider text-slate-900 uppercase">
                Target Publishing Channels
              </h4>
              <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                {enabledSlugs.length} selected
              </span>
            </div>

            {channelsLoading ? (
              <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
                Loading channels…
              </div>
            ) : companyChannels.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 italic">
                No active channels configured. Add channels in{' '}
                <span className="font-semibold text-indigo-600">Settings → Recruitment Channels</span>.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {companyChannels.map((ch) => {
                  const isSelected = enabledSlugs.includes(ch.id);
                  // Check if this channel already has an active posting row
                  const existingRow = posting.channels.find(
                    (c) => c.channelSlug === ch.id,
                  );
                  const sync = existingRow?.syncStatus ?? 'not_linked';

                  return (
                    <div
                      key={ch.id}
                      className={`p-4 md:p-5 flex items-center gap-4 transition-all duration-150 cursor-pointer ${
                        isSelected ? 'bg-indigo-50/30' : 'hover:bg-slate-50/40'
                      }`}
                      onClick={() => canPublish && toggleChannelId(ch.id)}
                    >
                      <div className="flex items-center h-5 shrink-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!canPublish}
                          onChange={() => toggleChannelId(ch.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 transition cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>
                      <span className="material-symbols-outlined text-2xl text-slate-400 shrink-0">
                        {channelIcon(ch.name.toLowerCase().replace(/\s+/g, '_'))}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm">{ch.name}</p>
                        {ch.description && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {ch.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {ch.is_automated && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Automated API
                            </span>
                          )}
                          {ch.name.toLowerCase().includes('telegram') && (
                            ch.api_username ? (
                              <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 font-mono">
                                Chat: {ch.api_username}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                ⚠ No chat_id — configure in Settings
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wider uppercase ${
                            sync === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : sync === 'pending'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}
                        >
                          {sync === 'active' ? '✓ Active' : sync === 'pending' ? '⏳ Pending' : '— Not posted'}
                        </span>
                        {existingRow?.lastSyncAt && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {new Date(existingRow.lastSyncAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Scope Visibility Toggle */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold tracking-wider text-slate-900 uppercase">
              Target Ecosystem Visibility
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  {
                    v: 'internal_only' as const,
                    label: 'Internal Employees',
                    icon: 'lock',
                    desc: 'Private Talent Pipeline',
                  },
                  {
                    v: 'both' as const,
                    label: 'Universal Matrix',
                    icon: 'public',
                    desc: 'Internal + Public Portals',
                  },
                  {
                    v: 'external_only' as const,
                    label: 'External Pools',
                    icon: 'travel_explore',
                    desc: 'Public Markets Only',
                  },
                ] as const
              ).map(({ v, label, icon, desc }) => (
                <button
                  key={v}
                  type="button"
                  disabled={!canPublish}
                  onClick={() => onUpdateVisibility(v)}
                  className={`border p-4 rounded-xl text-left transition-all duration-150 relative overflow-hidden group ${
                    posting.visibility === v
                      ? 'border-2 border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined block mb-2 text-2xl ${posting.visibility === v ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                  >
                    {icon}
                  </span>
                  <p className="font-bold text-slate-900 text-xs tracking-tight">
                    {label}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                    {desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Workflow/Publication Logs */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h4 className="text-sm font-bold tracking-wider text-slate-900 uppercase">
              Audit Trail & History
            </h4>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 divide-y divide-slate-100">
              {[
                ...vacancy.statusHistory.map((h) => ({
                  id: h.id,
                  action: h.fromStatus
                    ? `Status: ${h.fromStatus.replace('_', ' ')} → ${h.toStatus.replace('_', ' ')}${h.notes ? ` — ${h.notes}` : ''}`
                    : `Status set to ${h.toStatus.replace('_', ' ')}`,
                  actorName: h.actorName || 'System',
                  timestamp: h.timestamp,
                })),
                ...vacancy.activities.map((a) => ({
                  id: a.id,
                  action: a.action,
                  actorName: a.actorName || 'System',
                  timestamp: a.timestamp,
                })),
                ...posting.publicationHistory.map((h) => ({
                  id: h.id,
                  action: h.action,
                  actorName: h.actorName,
                  timestamp: h.timestamp,
                })),
              ]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((h) => (
                  <div
                    key={h.id}
                    className="flex gap-4 items-start pt-3 first:pt-0"
                  >
                    <div className="h-2 w-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold text-slate-900">{h.action}</p>
                      <p className="text-slate-500">
                        Operator:{' '}
                        <span className="font-medium text-slate-700">
                          {h.actorName}
                        </span>{' '}
                        • {new Date(h.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Side Sidebar Control Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Scheduling Parameter Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              Application Deadline
            </h4>
            <input
              type="date"
              value={
                posting.closingDate?.slice(0, 10) ||
                vacancy.closingDate?.slice(0, 10) ||
                ''
              }
              disabled={!canPublish}
              onChange={(e) => onUpdateClosingDate(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm disabled:bg-slate-50 disabled:text-slate-400"
            />
            {daysLeft !== null && (
              <p className="text-xs text-amber-800 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">
                  hourglass_empty
                </span>
                {daysLeft} calendar days until auto-expiration
              </p>
            )}
            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-slate-400">
                info
              </span>
              Cloud-system enforces structural closeout at 23:59 on deadline.
            </p>
          </div>

          {/* Action Trigger Panels */}
          {canPublish && (
            <div className="bg-white-100 text-white p-5 rounded-2xl shadow-xl space-y-4 border border-indigo-800">
              <div className="space-y-1">
                <h4 className="font-bold text-sm tracking-wide text-slate-900 uppercase flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-400">
                    tune
                  </span>
                  Administrative Panels
                </h4>
                <p className="text-[11px] text-slate-900">
                  Control active marketplace availability nodes.
                </p>
              </div>

              <div className="space-y-2">
                

                <button
                  type="button"
                  onClick={() => setConfirm('publish')}
                  disabled={
                    unsyncedSlugs.length === 0 ||
                    postingLoading
                  }
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:pointer-events-none transform active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-base">
                    {postingLoading ? 'autorenew' : 'send'}
                  </span>
                  {postingLoading
                    ? 'Processing…'
                    : unsyncedSlugs.length === 0
                      ? 'Select new channels first'
                      : `Publish to ${unsyncedSlugs.length} new channel${unsyncedSlugs.length > 1 ? 's' : ''}`}
                </button>

                <button
                  type="button"
                  onClick={() => setShowSchedule(!showSchedule)}
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:pointer-events-none transform active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-base">
                    schedule
                  </span>
                  Schedule Posting
                </button>

                {showSchedule && (
                  <div className="space-y-2 p-3 bg-white-100 border border-slate-700/60 rounded-xl text-xs">
                    <div>
                      <label className="text-[10px] text-slate-900 uppercase tracking-wider block mb-1">
                        Execution Date
                      </label>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full p-2 bg-indigo-600 border border-indigo-700 rounded text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-900 uppercase tracking-wider block mb-1">
                        Execution Time
                      </label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full p-2 bg-indigo-600 border border-indigo-700 rounded text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        scheduleDate && onSchedule(scheduleDate, scheduleTime)
                      }
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-bold text-xs shadow transition mt-1"
                    >
                      Commit Target Release Window
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setConfirm('withdraw')}
                  disabled={postingLoading}
                  className="w-full border bg-rose-500 border-rose-900/50 hover:bg-rose-950/40 text-rose-300 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-base">
                    cancel
                  </span>
                  Withdraw Posting
                </button>

                <button
                  type="button"
                  onClick={vacancy.vacancyStatus === 'on_hold' ? onResumeHiring : onPauseHiring}
                  disabled={postingLoading}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:pointer-events-none transform active:scale-[0.98] ${
                    vacancy.vacancyStatus === 'on_hold'
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white'
                      : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {vacancy.vacancyStatus === 'on_hold' ? 'play_arrow' : 'pause'}
                  </span>
                  {vacancy.vacancyStatus === 'on_hold'
                    ? 'Continue Pipeline'
                    : 'Pause Pipeline'}
                </button>
                {posting.approvedByName && (
                  <p className="text-[10px] text-slate-500 text-center pt-1">
                    Node Signed: {posting.approvedByName}
                    {posting.approvedAt &&
                      ` • ${new Date(posting.approvedAt).toLocaleDateString()}`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Analytics Overview Grid Widget */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              Live Pipeline Metrics
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-4 bg-slate-50 border border-slate-100 rounded-xl shadow-sm">
                <p className="text-3xl font-black tracking-tight text-slate-900 font-mono">
                  {posting.views.toLocaleString()}
                </p>
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mt-1">
                  Traffic Views
                </p>
              </div>
              <div className="text-center p-4 bg-slate-50 border border-slate-100 rounded-xl shadow-sm">
                <p className="text-3xl font-black tracking-tight text-slate-900 font-mono">
                  {posting.applicationsCount}
                </p>
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mt-1">
                  Submissions
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">
                Conversion Performance Ratio
              </span>
              <strong className="text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 font-mono text-sm">
                {conversionRate(posting)}%
              </strong>
            </div>
            <p className="text-[10px] text-slate-400 text-center italic">
              Network metrics processed asynchronously via sample model buffers
            </p>
          </div>
        </div>
      </div>

      {/* Global Workspace Footer Controls
      <footer className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-slate-200">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={!canPublish}
          className="text-xs font-bold text-slate-500 hover:text-slate-900 transition disabled:opacity-40"
        >
          Preserve Configuration Draft
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          disabled={!canPublish}
          className="px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition disabled:opacity-40"
        >
          Clone Operational Configuration
        </button>
      </footer> */}

      {/* Confirm Action Modals */}
      <ConfirmModal
        open={confirm === 'publish'}
        title="Publish Job Posting?"
        message={`Publish "${vacancy.title}" to ${unsyncedSlugs.length} new channel(s)? Candidates will see this on selected portals.`}
        confirmText="Publish Job"
        onConfirm={() => {
          onPublish(unsyncedSlugs);
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm === 'withdraw'}
        title="Withdraw Posting?"
        message="Remove from all channels. Existing applications are retained."
        confirmText="Withdraw"
        variant="danger"
        onConfirm={() => {
          onWithdraw();
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm === 'unpublish'}
        title="Unpublish Posting?"
        message="Take offline; you can edit and republish later."
        confirmText="Unpublish"
        onConfirm={() => {
          onUnpublish();
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
      </>)}
    </div>
  );
};
