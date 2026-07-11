// @ts-nocheck
import { useKanbanSlice, kanbanActions } from './slice';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/state';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useToast } from '@/components/common/Toast';
import { FilterToolbar } from '@/components/shared/FilterToolbar';
import { PipelineBoard } from './components/PipelineBoard';
import { generateHiringMinute } from '../Dashboard/api';
import {
  selectKanbanApplications,
  selectKanbanError,
  selectKanbanLoading,
} from './slice/selectors';

export const KanbanPipelinePage: React.FC = () => {
  useKanbanSlice();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { vacancies } = useApp();

  const applications = useAppSelector(selectKanbanApplications);
  const loading = useAppSelector(selectKanbanLoading);
  const error = useAppSelector(selectKanbanError);
  const [vacancyFilter, setVacancyFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(kanbanActions.fetchKanbanRequest());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast(error, 'error');
    }
  }, [error, toast]);

  const filtered = applications.filter((a) => {
    if (vacancyFilter !== 'all' && a.vacancyId !== vacancyFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      a.candidateName.toLowerCase().includes(q) ||
      a.vacancyTitle.toLowerCase().includes(q)
    );
  });

  return (
    <section className="max-w-7xl mx-auto p-6 space-y-6 text-sm bg-slate-50 min-h-screen text-slate-800 animate-fade-in">
      <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
        <p className="text-[11px] font-bold uppercase text-indigo-600 tracking-wider">
          Pipeline
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
          Recruitment kanban
        </h2>
        <p className="text-slate-500 mt-1 text-sm">
          FR-65: Track candidates from screening through hire on a single board.
        </p>
      </div>

      <FilterToolbar
        fields={[
          {
            key: 'search',
            label: 'Search',
            type: 'search',
            placeholder: 'Candidate or role…',
            value: search,
            onChange: setSearch,
          },
          {
            key: 'vacancy',
            label: 'Vacancy',
            type: 'select',
            value: vacancyFilter,
            onChange: setVacancyFilter,
            options: [
              { value: 'all', label: 'All vacancies' },
              ...vacancies.map((v) => ({ value: v.id, label: v.title })),
            ],
          },
        ]}
        onClear={() => {
          setSearch('');
          setVacancyFilter('all');
        }}
        resultCount={filtered.length}
        resultLabel="applications"
      />

      {loading ? (
        <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm text-slate-500">
          Loading kanban pipeline…
        </div>
      ) : (
        <PipelineBoard
          applications={filtered}
          onScheduleInterview={(appId) =>
            navigate('/dashboard/interviews', {
              state: { scheduleAppId: appId },
            })
          }
          onViewCandidate={(appId) => {
            const app = applications.find((a) => a.id === appId);
            toast(
              app
                ? `Viewing ${app.candidateName} in screening context`
                : 'Candidate selected',
              'info',
            );
            navigate('/dashboard/screening');
          }}
          onManageOffer={() => navigate('/dashboard/offers')}
          onGenerateHiringMinute={async (appId) => {
            const app = applications.find((a) => a.id === appId);
            if (!app || !app.vacancyId) {
              toast('Could not find vacancy for this application.', 'error');
              return;
            }
            try {
              await generateHiringMinute(app.vacancyId);
              toast(`Hiring Minute document generated successfully for ${app.candidateName} (${app.vacancyTitle})!`, 'success');
            } catch (err: any) {
              toast(err.message || 'Failed to generate Hiring Minute.', 'error');
            }
          }}
        />
      )}
    </section>
  );
};

export default KanbanPipelinePage;
