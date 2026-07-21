import React from 'react';

interface VacancyHubMetricsProps {
  openVacancies: number;
  urgentCount: number;
  inProgressCount: number;
  publishedCount: number;
}

export const VacancyHubMetrics: React.FC<VacancyHubMetricsProps> = ({
  openVacancies,
  urgentCount,
  inProgressCount,
  publishedCount,
}) => (
  <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
    {[
      ['Open Vacancies', openVacancies, 'work', false],
      ['Urgent', urgentCount, 'priority_high', true],
      ['In Progress', inProgressCount, 'hourglass_empty', false],
      ['Published', publishedCount, 'public', false],
    ].map(([label, value, icon, isRed]) => (
      <div
        key={label as string}
        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            {label}
          </p>
          <span className={`material-symbols-outlined p-1 rounded-md text-base ${isRed ? 'text-red-600 bg-red-50' : 'text-indigo-600 bg-indigo-50'}`}>
            {icon}
          </span>
        </div>
        <p className={`mt-1 text-xl font-bold tracking-tight ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
          {value}
        </p>
      </div>
    ))}
  </div>
);
