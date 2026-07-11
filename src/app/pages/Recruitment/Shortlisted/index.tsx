import { useShortlistedSlice, shortlistedActions } from './slice';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useToast } from '@/components/common/Toast';
import { FilterToolbar } from '@/components/shared/FilterToolbar';
import { ShortlistedCandidates } from './components/ShortlistedCandidates';
import { Modal } from '@/components/ui/Modal';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import {
  selectShortlistedApplications,
  selectShortlistedError,
  selectShortlistedLoading,
} from './slice/selectors';

export const ShortlistedPage: React.FC = () => {
  useShortlistedSlice();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { can } = usePermissions();
  const canRead = can(PERMISSIONS.APPLICATION_READ);
  const canShortlist = can(PERMISSIONS.APPLICATION_SHORTLIST);
  const canScheduleInterview = can(PERMISSIONS.INTERVIEW_CREATE);

  const applications = useAppSelector(selectShortlistedApplications);
  const loading = useAppSelector(selectShortlistedLoading);
  const error = useAppSelector(selectShortlistedError);

  const [vacancyFilterId, setVacancyFilterId] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(shortlistedActions.fetchShortlistedRequest());
  }, [dispatch]);

  // Re-fetch every time this page is navigated to (location.key changes on each navigation)
  useEffect(() => {
    dispatch(shortlistedActions.fetchShortlistedRequest());
  }, [location.key, dispatch]);

  useEffect(() => {
    if (error) {
      toast(error, 'error');
    }
  }, [error, toast]);

  const shortlisted = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((a) => {
      if (vacancyFilterId !== 'all' && a.vacancyId !== vacancyFilterId)
        return false;
      if (!q) return true;
      return (
        a.candidateName.toLowerCase().includes(q) ||
        a.vacancyTitle.toLowerCase().includes(q)
      );
    });
  }, [applications, vacancyFilterId, search]);

  const vacancyOptions = useMemo(
    () =>
      Array.from(
        new Map(
          applications.map((application) => [
            application.vacancyId,
            { value: application.vacancyId, label: application.vacancyTitle },
          ]),
        ).values(),
      ),
    [applications],
  );

  return (
    <section className="max-w-7xl mx-auto p-6 space-y-6 text-sm bg-slate-50 min-h-screen text-slate-800 animate-fade-in">
      {!canRead ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center space-y-2">
          <span className="material-symbols-outlined text-3xl text-rose-400">lock</span>
          <p className="text-sm font-bold text-rose-700">Access restricted</p>
          <p className="text-xs text-rose-500">You do not have permission to view shortlisted candidates.</p>
        </div>
      ) : (
        <>
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 border border-slate-200 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase text-indigo-600 tracking-wider">
            Shortlist
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Shortlisted candidates
          </h2>
          <p className="text-slate-500 mt-1 text-sm">
            Ready for interview scheduling and panel coordination.
          </p>
        </div>
        {canScheduleInterview ? (
          <button
            type="button"
            className="bg-indigo-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-700 shadow-sm transition-all flex items-center justify-center gap-2"
            onClick={() => navigate('/dashboard/interviews')}
          >
            <span className="material-symbols-outlined text-[18px]">
              calendar_month
            </span>
            Schedule interviews
          </button>
        ) : (
          <div className="text-xs text-slate-500">
            You can review shortlisted candidates, but cannot schedule interviews
            with your current permissions.
          </div>
        )}
      </div>

      <FilterToolbar
        fields={[
          {
            key: 'search',
            label: 'Search candidates',
            type: 'search',
            placeholder: 'Name or vacancy…',
            value: search,
            onChange: setSearch,
          },
          {
            key: 'vacancy',
            label: 'Vacancy',
            type: 'select',
            value: vacancyFilterId,
            onChange: setVacancyFilterId,
            options: [
              { value: 'all', label: 'All vacancies' },
              ...vacancyOptions,
            ],
          },
        ]}
        onClear={() => {
          setSearch('');
          setVacancyFilterId('all');
        }}
        resultCount={shortlisted.length}
        resultLabel="shortlisted"
      />

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
          Loading shortlisted candidates...
        </div>
      )}

      <ShortlistedCandidates
        applications={shortlisted}
        onSchedule={(appId) => {
          toast('Opening interview scheduler…', 'info');
          navigate('/dashboard/interviews', {
            state: { scheduleAppId: appId },
          });
        }}
        onViewDetails={(appId) => setSelectedRecordId(appId)}
        canScheduleInterview={canScheduleInterview}
      />

      {/* Candidate Detail Modal with Shortlist Audit Log */}
      <Modal
        isOpen={Boolean(selectedRecordId)}
        onClose={() => setSelectedRecordId(null)}
        title={
          applications.find((app) => app.id === selectedRecordId)?.candidateName ||
          'Candidate details'
        }
        size="lg"
      >
        {(() => {
          const selectedRecord = applications.find(
            (app) => app.id === selectedRecordId
          );
          if (!selectedRecord) return null;

          return (
            <div className="space-y-5 text-sm text-slate-700">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Candidate
                  </p>
                  <p className="font-semibold text-slate-900">
                    {selectedRecord.candidate.currentPosition ||
                      'Position not specified'}
                  </p>
                  <p>{selectedRecord.candidate.email}</p>
                  {selectedRecord.candidate.phone && (
                    <p>{selectedRecord.candidate.phone}</p>
                  )}
                  <p>
                    {selectedRecord.candidate.yearsOfExperience} yr(s) experience
                  </p>
                  <p className="font-semibold text-indigo-600">
                    Match score: {selectedRecord.matchScore}%
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Vacancy
                  </p>
                  <p className="font-semibold text-slate-900">
                    {selectedRecord.vacancyTitle}
                  </p>
                  <p>{selectedRecord.candidate.skills.slice(0, 3).join(', ')}</p>
                </div>
              </div>

              {selectedRecord.shortlistReason && (
                <div className="p-3 bg-emerald-50/60 text-emerald-800 border border-emerald-100 rounded-xl text-xs flex items-start gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-base shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <div>
                    <span className="font-semibold">
                      Shortlist Audit Log:{' '}
                    </span>
                    <span className="text-emerald-700/90">
                      {selectedRecord.shortlistReason}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                {canScheduleInterview && (
                  <button
                    type="button"
                    onClick={() => {
                      toast('Opening interview scheduler…', 'info');
                      navigate('/dashboard/interviews', {
                        state: { scheduleAppId: selectedRecord.id },
                      });
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
                  >
                    Schedule Interview
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
        </>
      )}
    </section>
  );
};

export default ShortlistedPage;
