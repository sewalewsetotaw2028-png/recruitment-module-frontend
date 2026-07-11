import React from 'react';

interface PlanSummary {
  total: number;
  draft: number;
  submitted: number;
  under_review: number;
  approved: number;
  returned: number;
  rejected: number;
}

interface PlanSummaryCardsProps {
  summary: PlanSummary;
  onFilterClick?: (status: string) => void;
}

const CARDS: {
  key: keyof PlanSummary;
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: string;
  filterValue: string;
}[] = [
  {
    key: 'total',
    label: 'Total plans',
    bg: 'bg-white',
    text: 'text-slate-900',
    border: 'border-slate-200',
    icon: 'folder',
    filterValue: 'all',
  },
  {
    key: 'draft',
    label: 'Draft',
    bg: 'bg-white',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: 'edit_note',
    filterValue: 'draft',
  },
  {
    key: 'submitted',
    label: 'Submitted',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: 'send',
    filterValue: 'submitted',
  },
  {
    key: 'under_review',
    label: 'Under Review',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: 'manage_search',
    filterValue: 'under_hr_review',
  },
  {
    key: 'approved',
    label: 'Approved',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: 'check_circle',
    filterValue: 'approved',
  },
  {
    key: 'returned',
    label: 'Returned',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: 'keyboard_return',
    filterValue: 'returned_for_revision',
  },
  {
    key: 'rejected',
    label: 'Rejected',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: 'cancel',
    filterValue: 'rejected',
  },
];

export const PlanSummaryCards: React.FC<PlanSummaryCardsProps> = ({
  summary,
  onFilterClick,
}) => (
  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
    {CARDS.map(({ key, label, bg, text, border, icon, filterValue }) => {
      const count = summary[key] ?? 0;
      return (
        <button
          key={key}
          type="button"
          onClick={() => onFilterClick?.(filterValue)}
          className={`${bg} border ${border} rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer group`}
        >
          <div className="flex items-center justify-center mb-2">
            <span className={`material-symbols-outlined text-[18px] ${text} opacity-70 group-hover:opacity-100 transition-opacity`}>
              {icon}
            </span>
          </div>
          <p className={`text-2xl font-extrabold ${text}`}>{count}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
            {label}
          </p>
        </button>
      );
    })}
  </div>
);
