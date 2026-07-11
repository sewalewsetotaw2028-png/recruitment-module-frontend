import React from 'react';

interface VacancyHubMetricsProps {
  openVacancies: number;
  avgTtf: number | string;
  urgentCount: number;
  inProgressCount: number;
  publishedCount: number;
}

export const VacancyHubMetrics: React.FC<VacancyHubMetricsProps> = ({
  openVacancies,
  avgTtf,
  urgentCount,
  inProgressCount,
  publishedCount,
}) => (
  <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
    {[
      ['Open Vacancies', openVacancies, 'work', false],
      ['Avg. Time to Fill', avgTtf, 'schedule', false],
      ['Urgent', urgentCount, 'priority_high', true],
      ['In Progress', inProgressCount, 'hourglass_empty', false],
      ['Published', publishedCount, 'public', false],
    ].map(([label, value, icon, isRed]) => (
      <div
        key={label as string}
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            {label}
          </p>
          <span className={`material-symbols-outlined p-1.5 rounded-lg text-lg ${isRed ? 'text-red-600 bg-red-50' : 'text-indigo-600 bg-indigo-50'}`}>
            {icon}
          </span>
        </div>
        <p className={`mt-2 text-2xl font-bold tracking-tight ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
          {value}
        </p>
      </div>
    ))}
  </div>
);
