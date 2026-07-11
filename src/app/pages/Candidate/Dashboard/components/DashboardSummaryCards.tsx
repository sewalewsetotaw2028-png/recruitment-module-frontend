import React from 'react';

interface Summary {
  totalApplications?: number;
  activeApplications?: number;
  scheduledInterviews?: number;
  pendingOffers?: number;
  completenessPercentage?: number;
}

export const DashboardSummaryCards: React.FC<{ summary?: Summary }> = ({
  summary = {},
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-slate-800 antialiased">
    {[
      {
        label: 'Active Applications',
        value: summary.activeApplications ?? 0,
        hint: 'In progress',
        icon: 'timeline',
        themeColor: 'text-primary bg-primary/10 border-primary/20',
      },
      {
        label: 'Upcoming Interviews',
        value: summary.scheduledInterviews ?? 0,
        hint: 'Scheduled events',
        icon: 'calendar_today',
        themeColor: 'text-primary bg-slate-50 border-slate-200/60',
      },
      {
        label: 'Pending Offers',
        value: summary.pendingOffers ?? 0,
        hint: 'Awaiting your review',
        icon: 'local_offer',
        themeColor: 'text-primary bg-primary/10 border-primary/20',
      },
      {
        label: 'Profile Completeness',
        value: `${summary.completenessPercentage ?? 0}%`,
        hint: 'Keep profile current',
        icon: 'person',
        themeColor: 'text-primary bg-slate-50 border-slate-200/60',
      },
    ].map((card) => (
      <div
        key={card.label}
        className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm flex items-start gap-4 hover:border-slate-300 transition-all duration-200"
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${card.themeColor}`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {card.icon}
          </span>
        </div>

        <div className="space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            {card.label}
          </p>
          <p className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {card.value}
          </p>
          <p className="text-xs font-medium text-slate-400">{card.hint}</p>
        </div>
      </div>
    ))}
  </div>
);
