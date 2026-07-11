// @ts-nocheck
import { useInterviewsSlice, interviewsActions } from './slice';
import { useShortlistedSlice, shortlistedActions } from '../Shortlisted/slice';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '@/state';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useToast } from '@/components/common/Toast';
import { usePermissions } from '@/hooks/usePermissions';
import { useSession } from '@/hooks/useSession';
import { PERMISSIONS } from '@/lib/permissions-shared';
import { InterviewSummaryCards } from './components/InterviewSummaryCards';
import { InterviewScheduler } from './components/InterviewScheduler';
import { EvaluationSubmissionForm } from './components/EvaluationSubmissionForm';
import {
  selectInterviews,
  selectInterviewsError,
  selectInterviewsLoading,
  selectInterviewsActionError,
  selectInterviewsActionSuccess,
} from './slice/selectors';
import { selectShortlistedApplications } from '../Shortlisted/slice/selectors';
import { fetchInterviewCategories } from '@/hooks/useInterviewCategories';
import type { InterviewCategory } from '@/hooks/useInterviewCategories';
import type { Interview } from '@/types';

// Status display config — maps normalised interviewStatus to badge styles and labels
const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  scheduled: {
    label: 'Scheduled',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: 'event',
  },
  rescheduled: {
    label: 'Rescheduled',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: 'update',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: 'check_circle',
  },
  evaluation_pending: {
    label: 'Eval Pending',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: 'assignment_late',
  },
  finalized: {
    label: 'Finalized',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: 'verified',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: 'cancel',
  },
};

const MODE_ICON: Record<string, string> = {
  physical: 'location_on',
  virtual: 'videocam',
  hybrid: 'hub',
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    isToday: new Date().toDateString() === d.toDateString(),
    isPast: d < new Date(),
  };
}

interface InterviewCardProps {
  interview: Interview;
  canEvaluate: boolean;
  canUpdate: boolean;
  onEvaluate: (id: string) => void;
  onReschedule: (payload: { interviewId: string; startTime: string; endTime: string; reason: string }) => void;
  onCancel: (interviewId: string) => void;
}

const InterviewCard: React.FC<InterviewCardProps> = ({
  interview: int,
  canEvaluate,
  canUpdate,
  onEvaluate,
  onReschedule,
  onCancel,
}) => {
  const statusKey = int.interviewStatus?.toLowerCase() ?? 'scheduled';
  const status = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.scheduled;
  const modeIcon = MODE_ICON[int.interviewType] ?? 'videocam';
  const { date, time, isToday, isPast } = formatDateTime(int.scheduledStart);
  const isEvaluable = (statusKey === 'completed' || statusKey === 'evaluation_pending' || statusKey === 'finalized') && canEvaluate;
  const isReschedulable = (statusKey === 'scheduled' || statusKey === 'rescheduled') && canUpdate;
  const isCancellable = (statusKey === 'scheduled' || statusKey === 'rescheduled') && canUpdate;

  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rescheduleTime, setRescheduleTime] = useState('10:00');
  const [rescheduleDuration, setRescheduleDuration] = useState(60);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');

  const handleRescheduleSubmit = () => {
    if (!rescheduleReason.trim()) {
      setRescheduleError('A reason for rescheduling is required.');
      return;
    }
    setRescheduleError('');
    const startMs = new Date(`${rescheduleDate}T${rescheduleTime}:00`).getTime();
    const endMs = startMs + rescheduleDuration * 60 * 1000;
    const endDate = new Date(endMs);
    const pad = (n: number) => String(n).padStart(2, '0');
    const startTime = `${rescheduleDate}T${rescheduleTime}:00+03:00`;
    const endTime = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:00+03:00`;
    onReschedule({ interviewId: int.id, startTime, endTime, reason: rescheduleReason.trim() });
    setShowRescheduleForm(false);
    setRescheduleReason('');
  };

  return (
    <div
      className={`group relative bg-white border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${
        isToday
          ? 'border-indigo-300 ring-1 ring-indigo-200'
          : 'border-slate-200'
      }`}
    >
      {/* Today indicator */}
      {isToday && (
        <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
          Today
        </span>
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Candidate & vacancy */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-slate-900 truncate">
            {int.candidateName}
          </h4>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {int.vacancyTitle}
          </p>
          {int.interviewRound > 1 && (
            <span className="inline-block mt-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
              Round {int.interviewRound}
            </span>
          )}
        </div>
        {/* Status badge */}
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.bg} ${status.text} ${status.border} shrink-0`}
        >
          <span className="material-symbols-outlined text-[11px]">
            {status.icon}
          </span>
          {status.label}
        </span>
      </div>

      {/* Date / time / mode row */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-3">
        <span className="flex items-center gap-1 font-medium">
          <span className="material-symbols-outlined text-[14px] text-slate-400">
            calendar_today
          </span>
          <span className={isToday ? 'text-indigo-600 font-bold' : ''}>{date}</span>
        </span>
        <span className="text-slate-300">·</span>
        <span className="flex items-center gap-1 font-medium">
          <span className="material-symbols-outlined text-[14px] text-slate-400">
            schedule
          </span>
          {time}
        </span>
        <span className="text-slate-300">·</span>
        <span className="flex items-center gap-1 font-medium capitalize">
          <span className="material-symbols-outlined text-[14px] text-slate-400">
            {modeIcon}
          </span>
          {int.interviewType}
        </span>
      </div>

      {/* Panel members */}
      {int.panelMembers.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
            Panel:
          </span>
          {int.panelMembers.slice(0, 3).map((p) => (
            <span
              key={p.userId}
              className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium"
            >
              {p.userName}
            </span>
          ))}
          {int.panelMembers.length > 3 && (
            <span className="text-[10px] text-slate-400 font-medium">
              +{int.panelMembers.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 flex-wrap">
        {/* Virtual / hybrid: show meeting link as a proper CTA */}
        {int.meetingLink &&
          (int.interviewType === 'virtual' || int.interviewType === 'hybrid') &&
          statusKey !== 'cancelled' && (
            <a
              href={int.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                !isPast
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">videocam</span>
              {isPast ? 'Meeting link' : 'Join meeting'}
            </a>
          )}

        {/* Physical: show office location label, plus a "View on map" button if a Maps URL exists */}
        {int.interviewType === 'physical' && statusKey !== 'cancelled' && (
          <>
            {int.location && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 truncate max-w-[180px]">
                <span className="material-symbols-outlined text-[13px] text-slate-400 shrink-0">
                  location_on
                </span>
                {int.location}
              </span>
            )}
            {int.meetingLink && (
              <a
                href={int.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                  !isPast
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">map</span>
                {isPast ? 'View location' : 'View on map'}
              </a>
            )}
          </>
        )}

        {/* Hybrid: show both meeting link (above) and office location if present */}
        {int.interviewType === 'hybrid' && int.location && statusKey !== 'cancelled' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 truncate max-w-[160px]">
            <span className="material-symbols-outlined text-[13px] text-slate-400 shrink-0">
              location_on
            </span>
            {int.location}
          </span>
        )}
        {/* Submit Evaluation CTA */}
        {isEvaluable && (
          <button
            type="button"
            onClick={() => onEvaluate(int.id)}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[13px]">
              rate_review
            </span>
            Submit Evaluation
          </button>
        )}
        {/* Already evaluated indicator */}
        {(statusKey === 'completed' || statusKey === 'finalized') && !canEvaluate && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
            <span className="material-symbols-outlined text-[13px]">
              task_alt
            </span>
            Interview completed
          </span>
        )}

        {/* Reschedule button */}
        {isReschedulable && (
          <button
            type="button"
            onClick={() => { setShowRescheduleForm(!showRescheduleForm); setShowCancelConfirm(false); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[13px]">update</span>
            Reschedule
          </button>
        )}

        {/* Cancel button */}
        {isCancellable && (
          <button
            type="button"
            onClick={() => { setShowCancelConfirm(!showCancelConfirm); setShowRescheduleForm(false); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[13px]">cancel</span>
            Cancel
          </button>
        )}
      </div>

      {/* Reschedule inline form */}
      {showRescheduleForm && (
        <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Reschedule Interview</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase">Date</label>
              <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase">Time</label>
              <input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase">Duration</label>
              <select value={rescheduleDuration} onChange={(e) => setRescheduleDuration(Number(e.target.value))}
                className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500">
                <option value={30}>30 min</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hr</option>
                <option value={120}>2 hr</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase">Reason *</label>
            <textarea value={rescheduleReason} onChange={(e) => { setRescheduleReason(e.target.value); setRescheduleError(''); }}
              placeholder="Provide the reason for rescheduling..."
              rows={2}
              className={`w-full mt-1 px-2 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 transition-all resize-none ${rescheduleError ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 focus:ring-amber-500/20 focus:border-amber-500'}`} />
            {rescheduleError && <p className="text-[10px] text-red-600 mt-0.5">{rescheduleError}</p>}
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowRescheduleForm(false); setRescheduleError(''); }}
              className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-semibold">
              Cancel
            </button>
            <button type="button" onClick={handleRescheduleSubmit}
              className="px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-semibold">
              Confirm Reschedule
            </button>
          </div>
        </div>
      )}

      {/* Cancel inline confirmation */}
      {showCancelConfirm && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-red-800">
              Cancel this interview? This cannot be undone. The candidate will need to be rescheduled manually.
            </p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowCancelConfirm(false)}
                className="px-3 py-1.5 text-xs border border-slate-200 bg-white text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-semibold">
                Keep Interview
              </button>
              <button type="button" onClick={() => { onCancel(int.id); setShowCancelConfirm(false); }}
                className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold">
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const InterviewListPage: React.FC = () => {
  useInterviewsSlice();
  useShortlistedSlice();

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { can } = usePermissions();
  const { user } = useSession();

  const { vacancies, applications, users, questionBank } = useApp();
  const shortlistedApplications = useAppSelector(selectShortlistedApplications);
  const [interviewCategories, setInterviewCategories] = useState<InterviewCategory[]>([]);
  const [evaluatingInterviewId, setEvaluatingInterviewId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentViewMode, setCurrentViewMode] = useState<'scheduler' | 'evaluator' | 'readonly'>('scheduler');

  const interviews = useAppSelector(selectInterviews);
  const loading = useAppSelector(selectInterviewsLoading);
  const error = useAppSelector(selectInterviewsError);
  const actionError = useAppSelector(selectInterviewsActionError);
  const actionSuccess = useAppSelector(selectInterviewsActionSuccess);

  useEffect(() => {
    dispatch(interviewsActions.fetchInterviewsRequest());
    dispatch(shortlistedActions.fetchShortlistedRequest());
    fetchInterviewCategories().then(setInterviewCategories).catch(console.error);
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast(error, 'error');
      dispatch(interviewsActions.clearActionState());
    }
  }, [error, toast, dispatch]);

  useEffect(() => {
    if (actionError) {
      toast(actionError, 'error');
      dispatch(interviewsActions.clearActionState());
    }
  }, [actionError, toast, dispatch]);

  useEffect(() => {
    if (actionSuccess) {
      toast(actionSuccess, 'success');
      dispatch(interviewsActions.clearActionState());
    }
  }, [actionSuccess, toast, dispatch]);

  const isHRUser = can(PERMISSIONS.INTERVIEW_CREATE);
  const canEvaluate = can(PERMISSIONS.INTERVIEW_EVALUATE);
  const canUpdate = can(PERMISSIONS.INTERVIEW_UPDATE);
  const canReadAll = can(PERMISSIONS.VIEW_INTERVIEWS) || can(PERMISSIONS.INTERVIEW_READ);
  const isInterviewPanelMember = can(PERMISSIONS.MY_INTERVIEW_READ);

  // Determine user's assigned interviews
  const assignedInterviews = useMemo(() => {
    if (!user) return [];
    return interviews.filter((interview) =>
      interview.panelMembers.some((panel) => panel.userId === user.id),
    );
  }, [interviews, user]);

  // Determine view mode based on permissions and assignments
  const viewMode = useMemo(() => {
    if (isHRUser) return 'scheduler'; // HR/Admin - full scheduling view
    if (canEvaluate && assignedInterviews.length > 0) return 'evaluator'; // Panel member with assignments
    if (isInterviewPanelMember) return 'panel'; // Panel member without assignments yet
    if (canReadAll) return 'readonly'; // Read-only access to all interviews
    return 'candidate'; // Candidate view
  }, [isHRUser, canEvaluate, assignedInterviews.length, isInterviewPanelMember, canReadAll]);

  const visibleInterviews = useMemo(() => {
    if (!user) return [];
    // Use manual view mode if user has toggle available (HR with assignments)
    const effectiveViewMode = (isHRUser && assignedInterviews.length > 0) ? currentViewMode : viewMode;
    
    switch (effectiveViewMode) {
      case 'scheduler':
      case 'readonly':
        return interviews; // Show all interviews
      case 'evaluator':
      case 'panel':
        return assignedInterviews; // Show only assigned interviews
      case 'candidate':
        return interviews.filter((interview) => {
          const application = applications.find((app) => app.id === interview.applicationId);
          return application?.candidateId === user.id;
        });
      default:
        return interviews;
    }
  }, [applications, user, interviews, viewMode, assignedInterviews, isHRUser, currentViewMode]);

  const filteredInterviews = useMemo(() => {
    if (statusFilter === 'all') return visibleInterviews;
    return visibleInterviews.filter(
      (i) => (i.interviewStatus ?? 'scheduled') === statusFilter,
    );
  }, [visibleInterviews, statusFilter]);

  const summary = useMemo(
    () => ({
      scheduled: visibleInterviews.length,
      completed: visibleInterviews.filter(
        (i) => i.interviewStatus === 'completed',
      ).length,
      awaitingSchedule: isHRUser ? shortlistedApplications.length : 0,
      hybrid: visibleInterviews.filter((i) => i.interviewType === 'hybrid').length,
    }),
    [visibleInterviews, isHRUser, shortlistedApplications],
  );

  // Upcoming interviews (today and future, not cancelled)
  const upcomingCount = useMemo(
    () =>
      visibleInterviews.filter((i) => {
        const s = i.interviewStatus ?? 'scheduled';
        return (
          (s === 'scheduled' || s === 'rescheduled') &&
          new Date(i.scheduledStart) >= new Date(new Date().setHours(0, 0, 0, 0))
        );
      }).length,
    [visibleInterviews],
  );

  const pendingEvalCount = useMemo(
    () =>
      visibleInterviews.filter(
        (i) =>
          i.interviewStatus === 'completed' &&
          can(PERMISSIONS.INTERVIEW_EVALUATE),
      ).length,
    [visibleInterviews, can],
  );

  const scheduleInterview = (
    applicationId: string,
    type: 'physical' | 'virtual' | 'hybrid',
    startTime: string,
    endTime: string,
    loc: string,
    panelIds: string[],
    questions: string[],
    meetingLink?: string,
    hybridConfig?: {
      segments?: {
        segmentType: 'physical' | 'virtual';
        start: string;
        end: string;
        location?: string;
        meetingLink?: string;
      }[];
    },
    categoryId?: string,
  ) => {
    const physicalSegment = hybridConfig?.segments?.find(
      (s) => s.segmentType === 'physical',
    );
    const virtualSegment = hybridConfig?.segments?.find(
      (s) => s.segmentType === 'virtual',
    );
    dispatch(
      interviewsActions.scheduleInterviewRequest({
        applicationId,
        type,
        startTime,
        endTime,
        location: loc,
        meetingLink:
          type !== 'physical'
            ? meetingLink ||
              virtualSegment?.meetingLink ||
              `https://meet.capitalbank.et/r/${applicationId}`
            : undefined,
        panelIds,
        questionTexts: questions,
        inOfficeStartTime: physicalSegment?.start,
        inOfficeEndTime: physicalSegment?.end,
        remoteStartTime: type === 'virtual' ? startTime : virtualSegment?.start,
        remoteEndTime: type === 'virtual' ? endTime : virtualSegment?.end,
        interviewCategoryId: categoryId,
      }),
    );
  };

  const handleReschedule = (payload: { interviewId: string; startTime: string; endTime: string; reason: string }) => {
    dispatch(interviewsActions.rescheduleInterviewRequest(payload));
  };

  const handleCancel = (interviewId: string) => {
    dispatch(interviewsActions.cancelInterviewRequest(interviewId));
  };

  const pageHeading = useMemo(() => {
    switch (viewMode) {
      case 'scheduler':
        return 'Interview coordination';
      case 'evaluator':
        return 'Your assigned interviews';
      case 'panel':
        return 'Interview evaluations';
      case 'readonly':
        return 'All interviews';
      case 'candidate':
        return 'My interviews';
      default:
        return 'Interviews';
    }
  }, [viewMode]);

  const pageDescription = useMemo(() => {
    switch (viewMode) {
      case 'scheduler':
        return 'Schedule rounds, assign panels, and attach role-based questions.';
      case 'evaluator':
        return 'Review your assigned panels, join meetings, and submit evaluations.';
      case 'panel':
        return 'You will see interviews here once you are assigned to a panel.';
      case 'readonly':
        return 'View and filter all interviews across the organization.';
      case 'candidate':
        return 'Track your upcoming interviews and view schedule details.';
      default:
        return '';
    }
  }, [viewMode]);

  return (
    <section className="max-w-7xl mx-auto p-6 space-y-6 text-sm bg-slate-50 min-h-screen text-slate-800 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase text-indigo-600 tracking-wider">
            Interviews
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {pageHeading}
          </h2>
          <p className="text-slate-500 mt-1 text-sm">{pageDescription}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {viewMode === 'scheduler' && (
            <button
              type="button"
              className="inline-flex items-center gap-2 border bg-indigo-500 border-indigo-200 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-600 transition-all"
              onClick={() => navigate('/dashboard/question-bank')}
            >
              <span className="material-symbols-outlined text-[18px]">quiz</span>
              Question bank
            </button>
          )}
          {/* View mode toggle for users with multiple access modes */}
          {(isHRUser && assignedInterviews.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setCurrentViewMode(currentViewMode === 'scheduler' ? 'evaluator' : 'scheduler');
              }}
              className="inline-flex items-center gap-2 border border-slate-200 bg-white text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
              {currentViewMode === 'scheduler' ? 'View as evaluator' : 'View as scheduler'}
            </button>
          )}
          {/* Pending evaluations callout for panel members */}
          {(viewMode === 'evaluator' || viewMode === 'panel') && pendingEvalCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="material-symbols-outlined text-amber-600 text-[16px]">
                assignment_late
              </span>
              <p className="text-xs font-semibold text-amber-800">
                {pendingEvalCount} evaluation{pendingEvalCount !== 1 ? 's' : ''} pending
              </p>
            </div>
          )}
        </div>
      </div>

      <InterviewSummaryCards summary={summary} />

      {(() => {
        const effectiveViewMode = (isHRUser && assignedInterviews.length > 0) ? currentViewMode : viewMode;
        
        if (effectiveViewMode === 'scheduler') {
          return (
            <InterviewScheduler
              vacancies={vacancies}
              applications={shortlistedApplications}
              interviews={interviews}
              users={users}
              questionBank={questionBank}
              interviewCategories={interviewCategories}
              scheduleInterview={scheduleInterview}
              preselectedAppId={location.state?.scheduleAppId}
            />
          );
        }
        
        return (
          <div className="space-y-4">
            {/* Enhanced filter toolbar for readonly mode */}
            {effectiveViewMode === 'readonly' && (
              <div className="flex items-center gap-3 flex-wrap bg-white border border-slate-200 rounded-xl p-3">
                <span className="text-xs font-semibold text-slate-500">Filter by:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
                >
                  <option value="all">All statuses</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="rescheduled">Rescheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div className="h-4 w-px bg-slate-200"></div>
                <span className="text-xs text-slate-400">
                  Showing {visibleInterviews.length} of {interviews.length} interviews
                </span>
              </div>
            )}
            
            {/* Standard filter toolbar for evaluator/panel/candidate modes */}
            {effectiveViewMode !== 'readonly' && (
              <div className="flex items-center gap-2 flex-wrap">
                {(['all', 'scheduled', 'rescheduled', 'completed', 'cancelled'] as const).map(
                  (s) => {
                    const cfg = s === 'all' ? null : STATUS_CONFIG[s];
                    const count =
                      s === 'all'
                        ? visibleInterviews.length
                        : visibleInterviews.filter(
                            (i) => (i.interviewStatus ?? 'scheduled') === s,
                          ).length;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatusFilter(s)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          statusFilter === s
                            ? cfg
                              ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                              : 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {cfg && (
                          <span className="material-symbols-outlined text-[11px]">
                            {cfg.icon}
                          </span>
                        )}
                        {s === 'all' ? 'All' : cfg!.label}
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            statusFilter === s && s !== 'all'
                              ? 'bg-white/40'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            )}

            {loading ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-500">Loading interviews...</p>
              </div>
            ) : filteredInterviews.length > 0 ? (
              <>
                {/* Upcoming section */}
                {(() => {
                  const upcoming = filteredInterviews.filter((i) => {
                    const s = i.interviewStatus ?? 'scheduled';
                    return (
                      (s === 'scheduled' || s === 'rescheduled') &&
                      new Date(i.scheduledStart) >= new Date(new Date().setHours(0, 0, 0, 0))
                    );
                  });
                  const past = filteredInterviews.filter((i) => {
                    const s = i.interviewStatus ?? 'scheduled';
                    return (
                      s === 'completed' ||
                      s === 'cancelled' ||
                      new Date(i.scheduledStart) < new Date(new Date().setHours(0, 0, 0, 0))
                    );
                  });
                  return (
                    <>
                      {upcoming.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-3">
                            Upcoming · {upcoming.length}
                          </p>
                          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {upcoming.map((int) => (
                              <InterviewCard
                                key={int.id}
                                interview={int}
                                canEvaluate={can(PERMISSIONS.INTERVIEW_EVALUATE)}
                                canUpdate={canUpdate}
                                onEvaluate={setEvaluatingInterviewId}
                                onReschedule={handleReschedule}
                                onCancel={handleCancel}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {past.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-3 mt-4">
                            Past · {past.length}
                          </p>
                          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {past.map((int) => (
                              <InterviewCard
                                key={int.id}
                                interview={int}
                                canEvaluate={can(PERMISSIONS.INTERVIEW_EVALUATE)}
                                canUpdate={canUpdate}
                                onEvaluate={setEvaluatingInterviewId}
                                onReschedule={handleReschedule}
                                onCancel={handleCancel}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                <span className="material-symbols-outlined text-slate-300 text-4xl block mb-3">
                  event_busy
                </span>
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  {statusFilter === 'all'
                    ? effectiveViewMode === 'panel' || effectiveViewMode === 'evaluator'
                      ? 'No interviews assigned yet'
                      : 'No interviews scheduled yet'
                    : `No ${STATUS_CONFIG[statusFilter]?.label.toLowerCase() ?? statusFilter} interviews`}
                </p>
                <p className="text-xs text-slate-400">
                  {statusFilter === 'all' && (effectiveViewMode === 'panel' || effectiveViewMode === 'evaluator')
                    ? 'You will be notified when you are added to an interview panel.'
                    : 'Try changing the filter above.'}
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Evaluation form — full modal launched from any Submit Evaluation button */}
      {evaluatingInterviewId && (
        <EvaluationSubmissionForm
          interviewId={evaluatingInterviewId}
          isOpen={true}
          onClose={() => setEvaluatingInterviewId(null)}
          onSuccess={() => setEvaluatingInterviewId(null)}
        />
      )}
    </section>
  );
};

export default InterviewListPage;
