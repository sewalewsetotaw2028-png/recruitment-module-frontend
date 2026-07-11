import React from 'react';
import type { Vacancy } from '@/types';

interface ScreeningCriteriaListProps {
  scope: 'template' | 'vacancy';
  vacancies: Vacancy[];
  selectedVacancyId: string | null;
  loadingVacancies: boolean;
  hasVacancyOverride: boolean;
  currentRuleCount: number;
  currentWeightTotal: number;
  onScopeChange: (scope: 'template' | 'vacancy') => void;
  onVacancyChange: (vacancyId: string) => void;
  onRemoveOverride?: () => void;
  removingOverride?: boolean;
}

const getVacancyLabel = (vacancy: Vacancy) =>
  `${vacancy.displayCode} - ${vacancy.title}`;

export const ScreeningCriteriaList: React.FC<ScreeningCriteriaListProps> = ({
  scope,
  vacancies,
  selectedVacancyId,
  loadingVacancies,
  hasVacancyOverride,
  currentRuleCount,
  currentWeightTotal,
  onScopeChange,
  onVacancyChange,
  onRemoveOverride,
  removingOverride,
}) => {
  const selectedVacancy =
    vacancies.find((vacancy) => vacancy.id === selectedVacancyId) ?? null;

  return (
    <div className="flex flex-col h-full min-h-0 text-sm">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-white select-none shrink-0">
        <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
          Screening Scopes
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          100 Point Model
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 bg-slate-50/40">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onScopeChange('template')}
            className={`px-3 py-2 rounded-xl border text-left transition-all cursor-pointer focus:outline-none ${
              scope === 'template'
                ? 'bg-indigo-50 border-indigo-600 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="text-xs font-extrabold text-slate-800">
              Template Default
            </div>
            <div className="mt-1 text-[10px] font-medium text-slate-500">
              Baseline screening rules shared across vacancies.
            </div>
          </button>

          <button
            type="button"
            onClick={() => onScopeChange('vacancy')}
            className={`px-3 py-2 rounded-xl border text-left transition-all cursor-pointer focus:outline-none ${
              scope === 'vacancy'
                ? 'bg-indigo-50 border-indigo-600 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="text-xs font-extrabold text-slate-800">
              Vacancy Override
            </div>
            <div className="mt-1 text-[10px] font-medium text-slate-500">
              Vacancy-specific scoring can override the template.
            </div>
          </button>
        </div>

        {scope === 'vacancy' && (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1">
                Select vacancy
              </label>
              <select
                value={selectedVacancyId ?? ''}
                onChange={(e) => onVacancyChange(e.target.value)}
                disabled={loadingVacancies || vacancies.length === 0}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingVacancies
                    ? 'Loading vacancies...'
                    : vacancies.length === 0
                      ? 'No vacancies available'
                      : 'Choose a vacancy'}
                </option>
                {vacancies.map((vacancy) => (
                  <option key={vacancy.id} value={vacancy.id}>
                    {getVacancyLabel(vacancy)}
                  </option>
                ))}
              </select>
            </div>

            {selectedVacancy ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase tracking-wider">
                    {hasVacancyOverride ? 'Override active' : 'Using template'}
                  </span>
                  {hasVacancyOverride && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/60 uppercase tracking-wider">
                      Overrides template
                    </span>
                  )}
                </div>
                <h4 className="mt-2 text-sm font-extrabold text-slate-800">
                  {selectedVacancy.title}
                </h4>
                <p className="mt-1 text-[11px] text-slate-500 font-medium">
                  {selectedVacancy.displayCode} | {selectedVacancy.departmentName} |{' '}
                  {selectedVacancy.location}
                </p>
                <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                  {hasVacancyOverride
                    ? 'This vacancy is using its own screening criteria profile.'
                    : 'This vacancy is currently inheriting the template-level screening profile. Saving here will create an override.'}
                </p>
                {hasVacancyOverride && onRemoveOverride && (
                  <button
                    type="button"
                    onClick={onRemoveOverride}
                    disabled={removingOverride}
                    className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-bold hover:bg-rose-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[15px] leading-none">
                      delete
                    </span>
                    {removingOverride ? 'Removing...' : 'Remove override'}
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-xs font-semibold text-slate-500">
                  Select a vacancy to edit a vacancy-specific override.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Current scope
              </p>
              <h4 className="mt-1 text-sm font-extrabold text-slate-800">
                {scope === 'template' ? 'Template default' : 'Vacancy override'}
              </h4>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Rules
              </p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {currentRuleCount}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-600">
              Weight total
            </span>
            <span
              className={`text-xs font-extrabold ${
                currentWeightTotal === 100 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {currentWeightTotal} / 100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreeningCriteriaList;
