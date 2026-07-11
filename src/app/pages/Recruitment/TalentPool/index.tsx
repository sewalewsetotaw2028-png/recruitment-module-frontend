import { useTalentPoolSlice, talentPoolActions } from './slice';
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useApp } from '@/state';
import { useToast } from '@/components/common/Toast';
import { OdooViewHeader } from '@/components/OdooViewHeader/OdooViewHeader';
import { FilterToolbar } from '@/components/shared/FilterToolbar';
import {
  tierBadge,
  availabilityBadge,
  matchTalentToVacancy,
} from '@/utils/talentRoster';
import {
  selectTalentPoolEntries,
  selectTalentPoolError,
  selectTalentPoolLoading,
} from './slice/selectors';

export const TalentPoolPage: React.FC = () => {
  useTalentPoolSlice();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { toast } = useToast();
  const talentPool = useAppSelector(selectTalentPoolEntries);
  const loading = useAppSelector(selectTalentPoolLoading);
  const error = useAppSelector(selectTalentPoolError);
  const {
    vacancies,
    candidates,
    users,
    assignTalentToVacancy,
    scheduleInterview,
  } = useApp();

  useEffect(() => {
    dispatch(talentPoolActions.fetchTalentPoolRequest());
  }, [dispatch, location.key]);

  useEffect(() => {
    if (error) {
      toast(error, 'error');
    }
  }, [error, toast]);

  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState('');
  const [minExp, setMinExp] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignVacancyId, setAssignVacancyId] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [dirIntVacancyId, setDirIntVacancyId] = useState('');
  const [dirIntDate, setDirIntDate] = useState('2026-05-26');
  const [dirIntTime, setDirIntTime] = useState('10:00');
  const [dirIntType, setDirIntType] = useState<
    'physical' | 'virtual' | 'hybrid'
  >('virtual');

  const allSkills = useMemo(
    () => Array.from(new Set(talentPool.flatMap((t) => t.skills))),
    [talentPool],
  );
  const departments = useMemo(
    () =>
      Array.from(
        new Set(talentPool.map((t) => t.departmentInterest).filter(Boolean)),
      ),
    [talentPool],
  );

  const filtered = useMemo(() => {
    return talentPool.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        t.candidateName.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.currentPosition?.toLowerCase().includes(q);
      const matchSkill = !skillFilter || t.skills.includes(skillFilter);
      const matchTier = tierFilter === 'all' || t.tier === tierFilter;
      const matchDept = !deptFilter || t.departmentInterest === deptFilter;
      const matchExp = !minExp || t.yearsOfExperience >= Number(minExp);
      return matchSearch && matchSkill && matchTier && matchDept && matchExp;
    });
  }, [talentPool, search, skillFilter, tierFilter, deptFilter, minExp]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const selected = talentPool.find((t) => t.id === selectedId);
  const selectedCandidate = selected
    ? candidates.find((c) => c.id === selected.candidateId)
    : undefined;

  const vacancyMatches = useMemo(() => {
    if (!selected) return [];
    return vacancies
      .map((v) => ({ vac: v, score: matchTalentToVacancy(selected, v) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [selected, vacancies]);

  const handleDirectInterviewSubmit = () => {
    if (!selected || !dirIntVacancyId) return;
    const startIso = new Date(`${dirIntDate}T${dirIntTime}:00`).toISOString();
    const endIso = new Date(
      `${dirIntDate}T${Number(dirIntTime.split(':')[0]) + 1}:${dirIntTime.split(':')[1]}:00`,
    ).toISOString();

    const appId = assignTalentToVacancy(selected.id, dirIntVacancyId);
    if (!appId) return;

    const recruiter =
      users.find((u) => u.roleSlug === 'recruiter')?.id || 'user-1';
    scheduleInterview(
      appId,
      dirIntType,
      startIso,
      endIso,
      'Capital Bank HQ',
      [recruiter],
      [],
    );

    toast(`Interview scheduled for ${selected.candidateName}.`, 'success');
    setShowDirectModal(false);
    setDirIntVacancyId('');
  };

  return (
    <section className="max-w-7xl mx-auto p-6 space-y-6 text-sm text-slate-700 animate-fade-in">
      <OdooViewHeader
        title="Talent Roster"
        subtitle="Long-term recruitment intelligence — candidate pool CRM"
        breadcrumbs={[{ label: 'Recruitment' }, { label: 'Talent Pool' }]}
        stats={[
          { label: 'Pool Size', value: talentPool.length },
          {
            label: 'High Potential',
            value: talentPool.filter((t) => t.tier === 'high_potential').length,
            color: 'text-amber-600 font-semibold',
          },
          {
            label: 'Available',
            value: talentPool.filter((t) => t.availability === 'available')
              .length,
            color: 'text-emerald-600 font-semibold',
          },
        ]}
      />

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
          Loading talent pool...
        </div>
      )}

      <FilterToolbar
        resultCount={filtered.length}
        resultLabel="candidates in pool"
        onClear={() => {
          setSearch('');
          setSkillFilter('');
          setTierFilter('all');
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
          },
          {
            key: 'tier',
            label: 'Tier',
            type: 'select',
            value: tierFilter,
            onChange: setTierFilter,
            options: [
              { value: 'all', label: 'All Tiers' },
              { value: 'high_potential', label: 'High Potential' },
              { value: 'standard', label: 'Standard' },
            ],
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side Roster List */}
        <div className="lg:col-span-7 space-y-3">
          {paged.length === 0 ? (
            <div className="text-center text-slate-400 py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="font-medium text-slate-500">
                No matching candidate files found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try broadening your active layout parameters
              </p>
            </div>
          ) : (
            paged.map((t) => {
              const tier = tierBadge(t.tier);
              const isSelected = selectedId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left p-4 border rounded-xl transition-all duration-200 flex justify-between items-center group relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-50 border-slate-400 ring-1 ring-slate-400 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-1">
                    <p
                      className={`font-semibold text-base transition-colors ${isSelected ? 'text-slate-900' : 'text-slate-800 group-hover:text-slate-900'}`}
                    >
                      {t.candidateName}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <span className="font-medium text-slate-600">
                        {t.currentPosition}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>{t.yearsOfExperience} yrs experience</span>
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-medium tracking-wide px-2.5 py-1 rounded-md shadow-sm border ${tier.className}`}
                  >
                    {tier.label}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Right Side Detail Sheet */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden sticky top-6">
          {selected ? (
            <div className="divide-y divide-slate-100">
              {/* Card Header */}
              <div className="p-5 flex justify-between items-center bg-slate-50/70">
                <div>
                  <h4 className="font-bold text-slate-400 text-xs tracking-wider uppercase">
                    Profile Sheet
                  </h4>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    {selected.candidateName}
                  </p>
                </div>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="px-3 py-1.5 border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 bg-white font-medium rounded-lg text-xs transition shadow-sm"
                >
                  Full Dossier
                </button>
              </div>

              {/* Core Information Details Grid */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-x-2 gap-y-3 text-xs">
                  <span className="text-slate-400 font-medium">Position:</span>
                  <span className="col-span-2 text-slate-900 font-medium">
                    {selected.currentPosition}
                  </span>

                  <span className="text-slate-400 font-medium">Skills:</span>
                  <div className="col-span-2 flex flex-wrap gap-1">
                    {selected.skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {selected.rejectionReason && (
                  <div className="p-3 bg-rose-50/60 text-rose-800 border border-rose-100 rounded-xl text-xs flex items-start gap-2">
                    <span className="material-symbols-outlined text-rose-500 text-base shrink-0 mt-0.5">
                      warning
                    </span>
                    <div>
                      <span className="font-semibold">
                        Rejection Audit Log:{' '}
                      </span>
                      <span className="text-rose-700/90">
                        {selected.rejectionReason}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Vacancy Match Score Tracker */}
              {vacancyMatches.length > 0 && (
                <div className="p-5 bg-emerald-50/30">
                  <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2.5">
                    Pipeline Matching Intelligence
                  </h5>
                  <div className="space-y-2">
                    {vacancyMatches.map(({ vac, score }) => (
                      <div
                        key={vac.id}
                        className="flex justify-between items-center p-2 bg-white border border-slate-100 rounded-lg text-xs shadow-sm"
                      >
                        <span className="font-medium text-slate-700">
                          {vac.title}
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[11px]">
                          {score}% Match
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Workflow Actions Section */}
              <div className="p-5 space-y-3 bg-slate-50/40">
                <div className="relative">
                  <select
                    value={assignVacancyId}
                    onChange={(e) => setAssignVacancyId(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 appearance-none shadow-sm cursor-pointer"
                  >
                    <option value="">-- Drop into structural vacancy --</option>
                    {vacancies.map((v) => (
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
                  <button
                    disabled={!assignVacancyId}
                    onClick={() => {
                      assignTalentToVacancy(selected.id, assignVacancyId);
                      toast(
                        `Added ${selected.candidateName} to vacancy pipeline.`,
                      );
                      setAssignVacancyId('');
                    }}
                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-400 font-semibold py-2.5 px-4 rounded-lg text-xs transition duration-150 shadow-sm"
                  >
                    Stage Pipeline
                  </button>
                  <button
                    disabled={!assignVacancyId}
                    onClick={() => setShowDirectModal(true)}
                    className="border border-slate-300 hover:border-slate-400 bg-white disabled:bg-slate-50 text-slate-700 disabled:text-slate-400 font-semibold py-2.5 px-4 rounded-lg text-xs transition duration-150 shadow-sm"
                  >
                    Book Evaluation
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 italic">
              Select a system file entry from the left roster canvas to review
              action fields.
            </div>
          )}
        </div>
      </div>

      {/* Profile Overlay Sheet Modal */}
      {showProfileModal && selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full space-y-5 shadow-2xl my-8 overflow-hidden transform transition-all scale-100">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-lg">
                Complete Dossier: {selectedCandidate.firstName}{' '}
                {selectedCandidate.lastName}
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <span className="material-symbols-outlined block">close</span>
              </button>
            </div>

            <div className="px-6 space-y-4 text-sm leading-relaxed text-slate-600">
              <div className="space-y-1">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Executive Summary
                </h5>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-700 italic">
                  "
                  {selectedCandidate.profile?.summary ||
                    'No summary configured.'}
                  "
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-0.5">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Location Base
                  </h5>
                  <p className="font-medium text-slate-800">
                    {selectedCandidate.city}, {selectedCandidate.country}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Structural Tenure
                  </h5>
                  <p className="font-medium text-slate-800">
                    {selectedCandidate.yearsOfExperience} Operational Years
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Educational History
                </h5>
                <div className="space-y-2">
                  {selectedCandidate.education.map((e, index) => (
                    <div
                      key={index}
                      className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs flex justify-between items-center"
                    >
                      <span className="font-medium text-slate-800">
                        {e.degree} in {e.fieldOfStudy}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {e.institution}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 font-semibold rounded-xl text-xs transition shadow-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scheduler Overlay Form Modal */}
      {showDirectModal && selected && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">
                System Evaluation Scheduler
              </h3>
              <button
                onClick={() => setShowDirectModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <span className="material-symbols-outlined block">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="text-slate-400 font-medium">
                  Candidate Subject:
                </span>{' '}
                <span className="font-bold text-slate-800">
                  {selected.candidateName}
                </span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Evaluation Protocol Matrix
                  </label>
                  <select
                    value={dirIntType}
                    onChange={(e) => setDirIntType(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-slate-500/20"
                  >
                    <option value="virtual">
                      Virtual Linkup (Teleconferencing)
                    </option>
                    <option value="physical">Physical Presence Required</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={dirIntDate}
                      onChange={(e) => setDirIntDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 focus:ring-2 focus:ring-slate-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Start Coordinates
                    </label>
                    <input
                      type="time"
                      value={dirIntTime}
                      onChange={(e) => setDirIntTime(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 focus:ring-2 focus:ring-slate-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowDirectModal(false)}
                className="px-4 py-2 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Abort
              </button>
              <button
                onClick={handleDirectInterviewSubmit}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition shadow-sm"
              >
                Commit Window
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TalentPoolPage;
