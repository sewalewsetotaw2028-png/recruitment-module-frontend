import { useTalentPoolSlice, talentPoolActions } from './slice';
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useApp } from '@/state';
import { useToast } from '@/components/common/Toast';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import { FilterToolbar } from '@/components/shared/FilterToolbar';
import {
  tierBadge,
  matchTalentToVacancy,
} from '@/utils/talentRoster';
import {
  selectTalentPoolEntries,
  selectTalentPoolError,
  selectTalentPoolLoading,
  selectTalentPoolLinking,
  selectRosterHistory,
  selectRosterHistoryLoading,
  selectLastLinkedRosterId,
  selectInterviewScheduling,
  selectInterviewSuccess,
  selectInterviewError,
} from './slice/selectors';
import { getCandidateById } from './api';
import { useInterviewsSlice } from '../Interviews/slice';

export const TalentPoolPage: React.FC = () => {
  useTalentPoolSlice();
  useInterviewsSlice(); // keeps interviews saga alive so Interview page stays fresh
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { toast } = useToast();
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.TALENT_ROSTER_MANAGE);
  const canRead = can(PERMISSIONS.TALENT_ROSTER_READ);
  const talentPool = useAppSelector(selectTalentPoolEntries);
  const loading = useAppSelector(selectTalentPoolLoading);
  const error = useAppSelector(selectTalentPoolError);
  const linking = useAppSelector(selectTalentPoolLinking);
  const rosterHistory = useAppSelector(selectRosterHistory);
  const historyLoading = useAppSelector(selectRosterHistoryLoading);
  const lastLinkedRosterId = useAppSelector(selectLastLinkedRosterId);
  const interviewScheduling = useAppSelector(selectInterviewScheduling);
  const interviewSuccess = useAppSelector(selectInterviewSuccess);
  const interviewError = useAppSelector(selectInterviewError);
  const {
    vacancies,
    candidates,
    users,
    questionBank,
  } = useApp();

  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fieldOfStudyFilter, setFieldOfStudyFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [minExp, setMinExp] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignVacancyId, setAssignVacancyId] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [wasLinking, setWasLinking] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [dirIntVacancyId, setDirIntVacancyId] = useState('');
  const [dirIntDate, setDirIntDate] = useState('2026-05-26');
  const [dirIntTime, setDirIntTime] = useState('10:00');
  const [dirIntType, setDirIntType] = useState<
    'physical' | 'virtual' | 'hybrid'
  >('virtual');
  const [dirIntDuration, setDirIntDuration] = useState(60);
  const [dirIntPanelIds, setDirIntPanelIds] = useState<string[]>([]);
  const [dirIntQuestions, setDirIntQuestions] = useState<string[]>([]);
  const [dirIntMeetingLink, setDirIntMeetingLink] = useState('');
  const [dirIntLocation, setDirIntLocation] = useState('');
  const [dirIntCategoryId, setDirIntCategoryId] = useState('');
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeReason, setRemoveReason] = useState('');

  useEffect(() => {
    dispatch(talentPoolActions.fetchTalentPoolRequest());
  }, [dispatch, location.key]);

  useEffect(() => {
    if (error) {
      toast(error, 'error');
    }
  }, [error, toast]);

  // Client-side filtering like Interviews page
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return talentPool.filter((t: any) => {
      // Search filter
      if (query) {
        const searchable = [
          t.candidateName,
          t.email,
          t.currentPosition,
          ...t.skills,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(query)) return false;
      }

      // Skill filter (case-insensitive, partial match)
      if (skillFilter) {
        const skillLower = skillFilter.toLowerCase();
        if (!t.skills.some((skill: any) => skill.toLowerCase().includes(skillLower))) {
          return false;
        }
      }

      // Field of study filter
      if (fieldOfStudyFilter) {
        const fieldLower = fieldOfStudyFilter.toLowerCase();
        const candidate = candidates.find((c) => c.id === t.candidateId);
        const hasFieldOfStudy = candidate?.education?.some((edu: any) =>
          edu.field_of_study?.toLowerCase().includes(fieldLower)
        );
        if (!hasFieldOfStudy) return false;
      }

      // Status filter (source_stage)
      if (statusFilter !== 'all' && t.sourceStage !== statusFilter) return false;

      // Department filter
      if (deptFilter && t.departmentInterest !== deptFilter) return false;

      // Min experience filter
      if (minExp && t.yearsOfExperience < Number(minExp)) return false;

      return true;
    });
  }, [talentPool, search, skillFilter, statusFilter, fieldOfStudyFilter, deptFilter, minExp]);

  // Stats calculations
  const totalRosterCandidates = talentPool.length;
  const currentMonth = new Date();
  const addedThisMonth = talentPool.filter((t: any) => {
    const addedDate = new Date(t.addedAt);
    return (
      addedDate.getMonth() === currentMonth.getMonth() &&
      addedDate.getFullYear() === currentMonth.getFullYear()
    );
  }).length;
  const linkedToOpenVacancies = talentPool.filter((t: any) => t.sourcedFromVacancyIds && t.sourcedFromVacancyIds.length > 0).length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const selected = talentPool.find((t: any) => t.id === selectedId);
  const selectedCandidate = selected
    ? candidates.find((c) => c.id === selected.candidateId)
    : undefined;

  // Fetch candidate profile when profile modal is opened
  useEffect(() => {
    if (showProfileModal && selected?.candidateId) {
      getCandidateById(selected.candidateId)
        .then((response) => {
          setCandidateProfile(response.data);
        })
        .catch((err) => {
          console.error('Failed to fetch candidate profile:', err);
          setCandidateProfile(null);
        });
    } else if (!showProfileModal) {
      setCandidateProfile(null);
    }
  }, [showProfileModal, selected?.candidateId]);

  // Reset wasLinking when selected candidate changes
  useEffect(() => {
    setWasLinking(false);
  }, [selectedId]);

  // Show success toast after linking completes successfully
  useEffect(() => {
    if (wasLinking && linking === false && error === null) {
      toast(`Added ${selected?.candidateName} to vacancy pipeline.`, 'success');
      setAssignVacancyId('');
      setWasLinking(false);
    }
    // Reset wasLinking if there's an error
    if (wasLinking && linking === false && error !== null) {
      setWasLinking(false);
    }
  }, [linking, error, selected, toast, wasLinking]);

  // Auto-refetch company-wide history after a successful link, if history modal is open
  useEffect(() => {
    if (lastLinkedRosterId && showHistoryModal) {
      dispatch(talentPoolActions.fetchAllRosterActivityRequest());
    }
  }, [lastLinkedRosterId, showHistoryModal, dispatch]);

  // Toast on interview schedule result
  useEffect(() => {
    if (interviewSuccess) {
      toast(interviewSuccess, 'success');
      dispatch(talentPoolActions.clearInterviewState());
    }
  }, [interviewSuccess, toast, dispatch]);

  useEffect(() => {
    if (interviewError) {
      toast(interviewError, 'error');
      dispatch(talentPoolActions.clearInterviewState());
    }
  }, [interviewError, toast, dispatch]);

  const vacancyMatches = useMemo(() => {
    if (!selected) return [];
    return vacancies
      .map((v) => ({ vac: v, score: matchTalentToVacancy(selected, v) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [selected, vacancies]);

  const handleDirectInterviewSubmit = () => {
    if (!selected) {
      toast('No candidate selected.', 'error');
      return;
    }
    if (!dirIntVacancyId) {
      toast('Please select a vacancy.', 'error');
      return;
    }
    if (dirIntPanelIds.length === 0) {
      toast('Please select at least one panel member.', 'error');
      return;
    }
    if (dirIntPanelIds.length > 5) {
      toast('Maximum 5 panel members allowed.', 'error');
      return;
    }
    if (!dirIntDate || !dirIntTime) {
      toast('Please select interview date and time.', 'error');
      return;
    }

    const startDateTime = `${dirIntDate}T${dirIntTime}:00+03:00`;
    const startMs = new Date(`${dirIntDate}T${dirIntTime}:00`).getTime();
    const endMs = startMs + dirIntDuration * 60 * 1000;
    const endDate = new Date(endMs);
    const pad = (n: number) => String(n).padStart(2, '0');
    const endDateTime = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:00+03:00`;

    // Dispatch to the dedicated roster saga:
    // it calls linkCandidateToVacancy first → gets real application ID → then POST /api/v1/interviews
    dispatch(talentPoolActions.scheduleInterviewFromRosterRequest({
      rosterId: selected.id,
      vacancyId: dirIntVacancyId,
      type: dirIntType,
      startTime: startDateTime,
      endTime: endDateTime,
      location: dirIntLocation || undefined,
      meetingLink: dirIntMeetingLink || undefined,
      panelIds: dirIntPanelIds,
      questionTexts: dirIntQuestions.length > 0 ? dirIntQuestions : undefined,
    }));

    setShowDirectModal(false);
    setDirIntVacancyId('');
    setDirIntPanelIds([]);
    setDirIntQuestions([]);
    setDirIntMeetingLink('');
    setDirIntLocation('');
    setDirIntCategoryId('');
  };

  return (
    <section className="max-w-7xl mx-auto p-6 space-y-6 text-sm bg-slate-50 min-h-screen text-slate-800 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase text-indigo-600 tracking-wider">
            Talent Roster
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Long-term recruitment intelligence
          </h2>
          <p className="text-slate-500 mt-1 text-sm">
            Candidate pool CRM with eligibility rules and vacancy matching
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="inline-flex items-center gap-2 border border-indigo-200 bg-indigo-500 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-indigo-600 transition-all"
            onClick={() => {
              setShowHistoryModal(true);
              dispatch(talentPoolActions.fetchAllRosterActivityRequest());
            }}
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            View History
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          ['Total roster candidates', totalRosterCandidates, 'groups'],
          ['Added this month', addedThisMonth, 'event'],
          ['Linked to open vacancies', linkedToOpenVacancies, 'link'],
        ].map(([label, value, icon]) => (
          <div
            key={label as string}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                {label}
              </p>
              <span className="material-symbols-outlined text-indigo-600 bg-indigo-50 p-1.5 rounded-lg text-lg">
                {icon}
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
              {value}
            </p>
          </div>
        ))}
      </div>

      <FilterToolbar
        resultCount={filtered.length}
        resultLabel="candidates in pool"
        onClear={() => {
          setSearch('');
          setSkillFilter('');
          setStatusFilter('all');
          setFieldOfStudyFilter('');
          setDeptFilter('');
          setMinExp('');
        }}
        fields={[
          {
            key: 'search',
            label: 'Search',
            type: 'search',
            placeholder: 'Name, email...',
            value: search,
            onChange: setSearch,
            className: 'col-span-1',
          },
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All Stages' },
              { value: 'SCREENING', label: 'Screening' },
              { value: 'INTERVIEW', label: 'Interview' },
              { value: 'OFFER', label: 'Offer' },
            ],
            className: 'col-span-1',
          },
          {
            key: 'fieldOfStudy',
            label: 'Field of study',
            type: 'search',
            placeholder: 'e.g. Finance, Computer Science',
            value: fieldOfStudyFilter,
            onChange: setFieldOfStudyFilter,
            className: 'col-span-1',
          },
          {
            key: 'skill',
            label: 'Skill',
            type: 'search',
            placeholder: 'Filter by skill...',
            value: skillFilter,
            onChange: setSkillFilter,
            className: '!grid-column: auto !col-span-1',
          },
          {
            key: 'minExp',
            label: 'Min Experience',
            type: 'search',
            placeholder: 'Years...',
            value: minExp,
            onChange: setMinExp,
            className: '!grid-column: auto !col-span-1',
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side Roster List */}
        {(canManage || canRead) && (
          <div className="lg:col-span-7 space-y-3">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-indigo-50 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">Talent Candidates</h3>
                <p className="text-xs text-slate-500 mt-0.5">{filtered.length} candidates available</p>
              </div>
            <div className="divide-y divide-slate-100">
              {paged.length === 0 ? (
                <div className="text-center text-slate-400 py-12 px-4">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">person_search</span>
                  <p className="font-medium text-slate-500">
                    No matching candidate files found
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try broadening your active layout parameters
                  </p>
                </div>
              ) : (
                paged.map((t: any) => {
                  const tier = tierBadge(t.tier);
                  const isSelected = selectedId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={`w-full text-left p-4 transition-all duration-200 flex justify-between items-center group relative overflow-hidden ${
                        isSelected
                          ? 'bg-indigo-50 border-l-4 border-l-indigo-600'
                          : 'bg-white hover:bg-slate-50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`font-semibold text-sm transition-colors ${isSelected ? 'text-indigo-900' : 'text-slate-800 group-hover:text-indigo-700'}`}
                          >
                            {t.candidateName}
                          </p>
                          
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <span className="font-medium text-slate-600">
                            {t.currentPosition}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>{t.yearsOfExperience} yrs experience</span>
                        </p>
                        <div className="flex gap-1.5 mt-1">
                          {t.skills.slice(0, 3).map((skill: any, idx: number) => (
                            <span
                              key={idx}
                              className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {t.skills.length > 3 && (
                            <span className="text-slate-400 text-[10px]">+{t.skills.length - 3}</span>
                          )}
                        </div>
                      </div>
                      {t.tier !== 'standard' && (
                        <span
                          className={`text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-md shadow-sm border ml-3 ${tier.className}`}
                        >
                          {tier.label}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
            {totalPages > 1 && (
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Right Side Detail Sheet */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden sticky top-6">
          {selected ? (
            <div className="divide-y divide-slate-100">
              {/* Card Header */}
              <div className="p-5 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                <div>
                  <h4 className="font-bold text-indigo-600 text-[11px] tracking-wider uppercase">
                    Candidate Profile
                  </h4>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    {selected.candidateName}
                  </p>
                </div>
                
              </div>

              {/* Core Information Details Grid */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-medium text-[10px] uppercase tracking-wider block">Current Position</span>
                    <span className="text-slate-900 font-semibold text-sm mt-1 block">{selected.currentPosition}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-medium text-[10px] uppercase tracking-wider block">Experience</span>
                    <span className="text-slate-900 font-semibold text-sm mt-1 block">{selected.yearsOfExperience} years</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium text-[10px] uppercase tracking-wider block mb-2">Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-indigo-100"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {selected.rejectionReason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-rose-600 text-[16px]">cancel</span>
                      <span className="font-bold text-rose-800 uppercase tracking-wider text-[10px]">Rejection Reason</span>
                    </div>
                    <p className="text-rose-900 font-medium">{selected.rejectionReason}</p>
                  </div>
                )}
              </div>

             

              {/* Workflow Actions Section */}
              <div className="p-5 space-y-3 bg-slate-50/40 border-t border-slate-100">
                {selected?.sourcedFromVacancyIds && selected.sourcedFromVacancyIds.length > 0 && (
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <p className="text-xs font-semibold text-indigo-700 mb-2">Linked to vacancies</p>
                    <div className="space-y-1">
                      {selected.sourcedFromVacancyIds.map((vacancyId: any) => (
                        <p key={vacancyId} className="text-xs text-indigo-900 font-medium">
                          {vacancies.find(v => v.id === vacancyId)?.title || 'Unknown vacancy'}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                <div className="relative">
                  <select
                    value={assignVacancyId}
                    onChange={(e) => setAssignVacancyId(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none shadow-sm cursor-pointer"
                  >
                    <option value="">Link candidate to a vacancy</option>
                    {vacancies
                      .filter((v) => !selected?.sourcedFromVacancyIds?.includes(v.id))
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.title}
                        </option>
                      ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <span className="material-symbols-outlined text-lg">
                      unfold_more
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {canManage ? (
                    <button
                      disabled={!assignVacancyId}
                      onClick={() => {
                        setWasLinking(true);
                        dispatch(talentPoolActions.linkCandidateToVacancyRequest({
                          rosterId: selected.id,
                          vacancyId: assignVacancyId,
                        }));
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-semibold py-2.5 px-4 rounded-lg text-xs transition duration-150 shadow-sm"
                    >
                      Stage Pipeline
                    </button>
                  ) : (
                    <div className="bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-center">
                      <p className="text-xs text-slate-500 font-medium">Stage Pipeline</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Requires manage permission</p>
                    </div>
                  )}
                  {(can(PERMISSIONS.INTERVIEW_CREATE) || canRead) ? (
                    <button
                      onClick={() => setShowDirectModal(true)}
                      className="border border-slate-300 hover:border-slate-400 bg-white text-slate-700 font-semibold py-2.5 px-4 rounded-lg text-xs transition duration-150 shadow-sm"
                    >
                      Book Evaluation
                    </button>
                  ) : (
                    <div className="bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-center">
                      <p className="text-xs text-slate-500 font-medium">Book Evaluation</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">No access</p>
                    </div>
                  )}
                </div>
                
                {canRead ? (
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="w-full border border-slate-300 hover:border-slate-400 bg-white text-slate-700 font-semibold py-2.5 px-4 rounded-lg text-xs transition duration-150 shadow-sm flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    View Profile
                  </button>
                ) : (
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-center flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                    <div className="text-left">
                      <p className="text-xs text-slate-500 font-medium">View Profile</p>
                      <p className="text-[10px] text-slate-400">Requires read permission</p>
                    </div>
                  </div>
                )}
                
                {(canManage || canRead) ? (
                  <button
                    onClick={() => setShowRemoveModal(true)}
                    className="w-full border border-rose-300 hover:border-rose-400 bg-rose-50 text-rose-700 font-semibold py-2.5 px-4 rounded-lg text-xs transition duration-150 shadow-sm flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Remove from Roster
                  </button>
                ) : (
                  <div className="w-full bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-center flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-rose-300">delete</span>
                    <div className="text-left">
                      <p className="text-xs text-rose-500 font-medium">Remove from Roster</p>
                      <p className="text-[10px] text-rose-400">No access</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 italic">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">person_search</span>
              Select a system file entry from the left roster canvas to review
              action fields.
            </div>
          )}
        </div>
      </div>

      {/* Profile Overlay Sheet Modal */}
      {showProfileModal && selected && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden transform transition-all scale-100 flex flex-col max-h-[85vh]">
            {/* Header / Identity Block */}
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg border-2 border-indigo-200">
                    {candidateProfile 
                      ? `${candidateProfile.first_name?.[0]}${candidateProfile.last_name?.[0]}`
                      : selected.candidateName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                    }
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {candidateProfile 
                        ? `${candidateProfile.first_name} ${candidateProfile.last_name}`
                        : selected.candidateName
                      }
                    </h3>
                    {candidateProfile?.current_position && candidateProfile?.current_employer && (
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {candidateProfile.current_position} at {candidateProfile.current_employer}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-semibold rounded-full uppercase tracking-wide">
                        {candidateProfile?.talent_rosters?.[0]?.status || selected.status || 'ACTIVE'}
                      </span>
                      {candidateProfile?.availability_status && (
                        <span className={`px-2 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wide ${
                          candidateProfile.availability_status === 'IMMEDIATELY' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {candidateProfile.availability_status}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        Since {candidateProfile?.talent_rosters?.[0]?.added_at 
                          ? new Date(candidateProfile.talent_rosters[0].added_at).toLocaleDateString()
                          : new Date(selected.addedAt).toLocaleDateString()
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>

            <div className="px-5 py-4 space-y-5 text-xs leading-relaxed text-slate-600 overflow-y-auto flex-1">
              {/* Quick-match summary */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <h5 className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-indigo-500">work</span>
                    Experience
                  </h5>
                  <p className="font-semibold text-slate-800 text-[12px] mt-1">
                    {candidateProfile?.years_of_experience ?? selected.yearsOfExperience} years
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <h5 className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-indigo-500">category</span>
                    Preferred category
                  </h5>
                  <p className="font-semibold text-slate-800 text-[12px] mt-1">
                    {candidateProfile?.preferred_job_category ?? 'Not specified'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <h5 className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-indigo-500">location_on</span>
                    Preferred location
                  </h5>
                  <p className="font-semibold text-slate-800 text-[12px] mt-1">
                    {candidateProfile?.preferred_location ?? 'Not specified'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <h5 className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-indigo-500">payments</span>
                    Expected salary
                  </h5>
                  <p className="font-semibold text-slate-800 text-[12px] mt-1">
                    {candidateProfile?.expected_salary ?? 'Not specified'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 col-span-2">
                  <h5 className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-indigo-500">public</span>
                    Nationality
                  </h5>
                  <p className="font-semibold text-slate-800 text-[12px] mt-1">
                    {candidateProfile?.nationality ?? 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Key Skills */}
              <div className="bg-slate-50 rounded-xl p-2.5">
                <h5 className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                  <span className="material-symbols-outlined text-[13px] text-indigo-500">psychology</span>
                  Key skills
                </h5>
                {(candidateProfile?.skills || selected.skills)?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {(candidateProfile?.skills || selected.skills).map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-white text-indigo-700 px-2.5 py-1 rounded-full text-[10px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-[11px]">No skills listed</p>
                )}
              </div>

              {/* Languages */}
              {candidateProfile?.languages && candidateProfile.languages.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <h5 className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                    <span className="material-symbols-outlined text-[13px] text-indigo-500">translate</span>
                    Languages
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {candidateProfile.languages.map((lang: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-white text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-medium"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100" />

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <h5 className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-indigo-500">email</span>
                    Email
                  </h5>
                  <p className="font-semibold text-slate-800 text-[12px] mt-1 truncate">
                    {candidateProfile?.email ?? selected.email}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <h5 className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-indigo-500">phone</span>
                    Phone
                  </h5>
                  <p className="font-semibold text-slate-800 text-[12px] mt-1">
                    {candidateProfile?.phone ??
                      (candidateProfile?.phones?.[0]?.phone_number) ?? 'Not provided'
                    }
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="bg-slate-50 rounded-xl p-2.5">
                <h5 className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-indigo-500">home</span>
                  Address
                </h5>
                <p className="font-semibold text-slate-800 text-[12px] mt-1">
                  {candidateProfile?.current_address ??
                    (candidateProfile?.addresses?.[0]
                      ? [candidateProfile.addresses[0].city, candidateProfile.addresses[0].sub_city, candidateProfile.addresses[0].region].filter(Boolean).join(', ')
                      : 'Not provided'
                    )
                  }
                </p>
              </div>

              <div className="border-t border-slate-100" />

              {/* Experience */}
              {candidateProfile?.experiences && candidateProfile.experiences.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <h5 className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                    <span className="material-symbols-outlined text-[13px] text-indigo-500">business_center</span>
                    Work experience
                  </h5>
                  <div className="space-y-2">
                    {candidateProfile.experiences.map((exp: any, index: number) => (
                      <div
                        key={index}
                        className="p-2.5 bg-white rounded-lg"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-semibold text-slate-800 text-[11px]">{exp.job_title}</p>
                            <p className="text-slate-500 text-[10px]">{exp.company_name}</p>
                          </div>
                          <span className="text-slate-400 text-[9px] whitespace-nowrap">
                            {new Date(exp.start_date).toLocaleDateString()} –{' '}
                            {exp.end_date ? new Date(exp.end_date).toLocaleDateString() : 'Present'}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-slate-500 mt-1.5 text-[10px]">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              <div className="bg-slate-50 rounded-xl p-2.5">
                <h5 className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                  <span className="material-symbols-outlined text-[13px] text-indigo-500">school</span>
                  Education
                </h5>
                {candidateProfile?.educations && candidateProfile.educations.length > 0 ? (
                  <div className="space-y-2">
                    {candidateProfile.educations.map((e: any, index: number) => (
                      <div
                        key={index}
                        className="p-2.5 bg-white rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <p className="font-semibold text-slate-800 text-[11px]">
                            {e.degree} in {e.field_of_study}
                          </p>
                          <p className="text-slate-500 text-[10px] mt-0.5">
                            {e.institution_name || e.institution}
                          </p>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {e.graduation_year}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2.5 bg-white rounded-lg text-[11px] text-slate-500">
                    {selected.educationSummary || 'No education information provided.'}
                  </div>
                )}
              </div>

              {/* Certifications */}
              {candidateProfile?.certifications && candidateProfile.certifications.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <h5 className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                    <span className="material-symbols-outlined text-[13px] text-indigo-500">workspace_premium</span>
                    Certifications
                  </h5>
                  <div className="space-y-2">
                    {candidateProfile.certifications.map((cert: any, index: number) => {
                      const isExpired = cert.expiration_date && new Date(cert.expiration_date) < new Date();
                      return (
                        <div
                          key={index}
                          className={`p-2.5 rounded-lg flex justify-between items-center ${
                            isExpired ? 'bg-red-50' : 'bg-white'
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-slate-800 text-[11px]">{cert.name}</p>
                            <p className="text-slate-500 text-[10px] mt-0.5">{cert.issuing_organization}</p>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <span className="text-slate-400 text-[9px] block">
                              {new Date(cert.issue_date).toLocaleDateString()}
                            </span>
                            {cert.expiration_date && (
                              <span className={`block text-[9px] font-medium mt-0.5 ${isExpired ? 'text-red-600' : 'text-slate-400'}`}>
                                {isExpired ? 'Expired' : 'Expires'} {new Date(cert.expiration_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100" />

              {/* Resume/CV */}
              <div className="bg-slate-50 rounded-xl p-2.5">
                <h5 className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                  <span className="material-symbols-outlined text-[13px] text-indigo-500">description</span>
                  Resume/CV
                </h5>
                {candidateProfile?.candidate_document?.cv && candidateProfile.candidate_document.cv.length > 0 ? (
                  
                   <a href={candidateProfile.candidate_document.cv[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-medium transition"
                  >
                    <span className="material-symbols-outlined text-[14px]">download</span>
                    Download resume
                  </a>
                ) : (
                  <p className="text-slate-400 text-[11px]">No resume uploaded</p>
                )}
              </div>

              {/* Source */}
              <div className="bg-slate-50 rounded-xl p-2.5">
                <h5 className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                  <span className="material-symbols-outlined text-[13px] text-indigo-500">source</span>
                  Roster info
                </h5>
                <div className="space-y-1 text-[11px]">
                  <p className="flex justify-between text-slate-500">Added by <span className="font-semibold text-slate-800">{selected.addedByName}</span></p>
                  <p className="flex justify-between text-slate-500">Category <span className="font-semibold text-slate-800">{selected.talentCategory}</span></p>
                  <p className="flex justify-between text-slate-500">Added on <span className="font-semibold text-slate-800">{new Date(selected.addedAt).toLocaleDateString()}</span></p>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-[11px] transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal - Company-wide Persistent Activity */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Talent Roster Activity History</h3>
                <p className="text-xs text-slate-500 mt-0.5">All add, link, and remove events across the roster</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <span className="material-symbols-outlined block">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {historyLoading ? (
                <div className="text-center py-12 text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2 block animate-spin">sync</span>
                  <p className="text-sm">Loading activity...</p>
                </div>
              ) : (
                <>
                  {/* Activity Log Timeline */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-600">history</span>
                      Activity Log
                      {rosterHistory?.activityLogs?.length > 0 && (
                        <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {rosterHistory.activityLogs.length} events
                        </span>
                      )}
                    </h4>

                    {rosterHistory?.activityLogs && rosterHistory.activityLogs.length > 0 ? (
                      <div className="space-y-2">
                        {rosterHistory.activityLogs.map((log: any) => {
                          const colorMap: Record<string, string> = {
                            added_to_roster: 'bg-emerald-500',
                            linked_to_vacancy: 'bg-indigo-500',
                            removed_from_roster: 'bg-rose-500',
                          };
                          const labelMap: Record<string, string> = {
                            added_to_roster: 'Added to Roster',
                            linked_to_vacancy: 'Linked to Vacancy',
                            removed_from_roster: 'Removed from Roster',
                          };
                          const dotColor = colorMap[log.action] ?? 'bg-slate-400';
                          const actionLabel = labelMap[log.action] ?? log.action?.replace(/_/g, ' ');

                          return (
                            <div key={log.id} className="flex gap-3 items-start">
                              <div className="flex flex-col items-center mt-1 flex-shrink-0">
                                <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                                <div className="w-px flex-1 bg-slate-100 mt-1 min-h-[20px]" />
                              </div>
                              <div className="flex-1 pb-2">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                  <div className="flex items-start justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white ${dotColor}`}>
                                        {actionLabel}
                                      </span>
                                      <span className="text-xs font-semibold text-slate-800">
                                        {log.candidateName}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                      {new Date(log.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-slate-600 text-xs mt-1.5">{log.description}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 py-8 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="material-symbols-outlined text-3xl mb-2 block">history_toggle_off</span>
                        <p className="text-sm">No roster activity recorded yet.</p>
                        <p className="text-xs mt-1">Activity is logged when candidates are added, linked to vacancies, or removed.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 font-semibold rounded-xl text-xs transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Scheduler Overlay Form Modal */}
      {showDirectModal && selected && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-slate-50 z-10">
              <h3 className="font-bold text-slate-900 text-base">
                Schedule Interview
              </h3>
              <button
                onClick={() => setShowDirectModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <span className="material-symbols-outlined block">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="text-slate-400 font-medium">
                  Candidate:
                </span>{' '}
                <span className="font-bold text-slate-800">
                  {selected.candidateName}
                </span>
              </div>

              {/* Vacancy Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Vacancy
                </label>
                <select
                  value={dirIntVacancyId}
                  onChange={(e) => setDirIntVacancyId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Select vacancy</option>
                  {vacancies.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Interview Details */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600 text-lg">event</span>
                  <h4 className="font-semibold text-slate-900 text-sm">Interview Details</h4>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Mode
                    </label>
                    <select
                      value={dirIntType}
                      onChange={(e) => setDirIntType(e.target.value as any)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="virtual">Virtual</option>
                      <option value="physical">Physical</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Date
                    </label>
                    <input
                      type="date"
                      value={dirIntDate}
                      onChange={(e) => setDirIntDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Time (GMT+3)
                    </label>
                    <input
                      type="time"
                      value={dirIntTime}
                      onChange={(e) => setDirIntTime(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Duration
                  </label>
                  <select
                    value={dirIntDuration}
                    onChange={(e) => setDirIntDuration(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                {dirIntType === 'virtual' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Meeting Link
                    </label>
                    <input
                      type="url"
                      value={dirIntMeetingLink}
                      onChange={(e) => setDirIntMeetingLink(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                )}

                {dirIntType === 'physical' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Location
                    </label>
                    <input
                      type="text"
                      value={dirIntLocation}
                      onChange={(e) => setDirIntLocation(e.target.value)}
                      placeholder="e.g., Private Suite 402, Bole HQ"
                      className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                )}
              </div>

              {/* Panel Selection */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600 text-lg">groups</span>
                    <h4 className="font-semibold text-slate-900 text-sm">Interview Panel</h4>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                    dirIntPanelIds.length >= 5
                      ? 'bg-red-100 text-red-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {dirIntPanelIds.length}/5 selected
                  </span>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {users.map((u) => (
                    <label
                      key={u.id}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white rounded-lg transition-colors ${
                        dirIntPanelIds.includes(u.id) ? 'bg-white' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={dirIntPanelIds.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (dirIntPanelIds.length < 5) {
                              setDirIntPanelIds([...dirIntPanelIds, u.id]);
                            }
                          } else {
                            setDirIntPanelIds(dirIntPanelIds.filter((id) => id !== u.id));
                          }
                        }}
                        disabled={!dirIntPanelIds.includes(u.id) && dirIntPanelIds.length >= 5}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="flex-1 text-xs">{`${u.firstName} ${u.lastName}`}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{u.roleName || u.roleSlug}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Standardized Questions */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600 text-lg">quiz</span>
                  <h4 className="font-semibold text-slate-900 text-sm">Standardized Questions</h4>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {(() => {
                    const selectedVacancy = vacancies.find(v => v.id === dirIntVacancyId);
                    const relevantQuestions = questionBank.filter((q: any) => {
                      if (!selectedVacancy) return true;
                      const title = selectedVacancy.title.toLowerCase();
                      const role = q.jobRole.toLowerCase();
                      const area = q.functionalArea.toLowerCase();
                      return (
                        title.includes(role) ||
                        role.includes(title) ||
                        title.includes(area) ||
                        area.includes(title)
                      );
                    });
                    
                    return relevantQuestions.map((q: any) => (
                      <label
                        key={q.id}
                        className="flex items-start gap-3 cursor-pointer hover:bg-white p-2 rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={dirIntQuestions.includes(q.questionText)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDirIntQuestions([...dirIntQuestions, q.questionText]);
                            } else {
                              setDirIntQuestions(dirIntQuestions.filter((qt) => qt !== q.questionText));
                            }
                          }}
                          className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm text-slate-700">{q.questionText}</span>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                              {q.category}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full font-medium">
                              {q.grade}
                            </span>
                          </div>
                        </div>
                      </label>
                    ));
                  })()}
                  {(() => {
                    const selectedVacancy = vacancies.find(v => v.id === dirIntVacancyId);
                    const relevantQuestions = questionBank.filter((q: any) => {
                      if (!selectedVacancy) return true;
                      const title = selectedVacancy.title.toLowerCase();
                      const role = q.jobRole.toLowerCase();
                      const area = q.functionalArea.toLowerCase();
                      return (
                        title.includes(role) ||
                        role.includes(title) ||
                        title.includes(area) ||
                        area.includes(title)
                      );
                    });
                    if (relevantQuestions.length === 0) {
                      return (
                        <p className="text-slate-400 italic text-center text-sm py-4">
                          No predefined questions found for this role.
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-slate-50">
              <button
                onClick={() => setShowDirectModal(false)}
                className="px-4 py-2 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDirectInterviewSubmit}
                disabled={interviewScheduling}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center gap-2"
              >
                {interviewScheduling && (
                  <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                )}
                {interviewScheduling ? 'Scheduling...' : 'Confirm and Dispatch Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove from Roster Confirmation Modal */}
      {showRemoveModal && selected && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex justify-between items-center">
              <h3 className="font-bold text-rose-900 text-base">
                Remove from Talent Roster
              </h3>
              <button
                onClick={() => {
                  setShowRemoveModal(false);
                  setRemoveReason('');
                }}
                className="text-rose-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-100 transition"
              >
                <span className="material-symbols-outlined block">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 font-medium">Candidate</p>
                <p className="text-sm font-semibold text-slate-900">{selected.candidateName}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Reason for removal <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={removeReason}
                  onChange={(e) => setRemoveReason(e.target.value)}
                  placeholder="Please provide a reason for removing this candidate from the talent roster..."
                  className="w-full p-3 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                  rows={3}
                />
              </div>

              <p className="text-xs text-slate-500 italic">
                This will soft delete the candidate from the roster. The candidate can be re-added later if needed.
              </p>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRemoveModal(false);
                  setRemoveReason('');
                }}
                className="px-4 py-2 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 font-semibold rounded-xl text-xs transition shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!removeReason.trim()) {
                    toast('Please provide a reason for removal.', 'error');
                    return;
                  }
                  dispatch(talentPoolActions.removeFromRosterRequest({
                    rosterId: selected.id,
                    reason: removeReason.trim(),
                  }));
                  toast('Candidate removed from talent roster', 'success');
                  setSelectedId(null);
                  setShowRemoveModal(false);
                  setRemoveReason('');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition shadow-sm"
              >
                Remove Candidate
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TalentPoolPage;
