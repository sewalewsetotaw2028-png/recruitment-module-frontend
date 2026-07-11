import React from 'react';

interface ScreeningSummary {
  inPipeline: number;
  submitted: number;
  inScreening: number;
  highMatch: number;
}

interface ScreeningSummaryCardsProps {
  summary: ScreeningSummary;
}

export const ScreeningSummaryCards: React.FC<ScreeningSummaryCardsProps> = ({
  summary,
}) => (
  <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
    {[
      ['In pipeline', summary.inPipeline, 'inbox'],
      ['New applications', summary.submitted, 'mark_email_unread'],
      ['Under review', summary.inScreening, 'manage_search'],
      ['High match (80%+)', summary.highMatch, 'verified'],
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
);
