import React from 'react';
import { Sparkline } from '../Sparkline';
import { PRIMARY_ACCENT_COLOR_HEX, PRIMARY_COLOR_HEX } from '@/config/theme';

interface SummaryMetricsCardsProps {
  summary?: {
    totalVacancies?: number;
    openVacancies?: number;
    totalApplications?: number;
    fulfillmentRate?: string;
    hiredCount?: number;
  };
  trends?: {
    vacancies?: number[];
    applications?: number[];
    fulfillment?: number[];
    hires?: number[];
    hiredImprovement?: number;
  };
  navigate: (path: string) => void;
}

const PRIMARY_COLOR = PRIMARY_COLOR_HEX;

/**
 * SummaryMetricsCards renders 4 org-level summary cards with sparklines.
 * Only renders if user has REPORTS_READ permission.
 */
export const SummaryMetricsCards: React.FC<SummaryMetricsCardsProps> = ({
  summary,
  trends,
  navigate,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    <button
      type="button"
      onClick={() => navigate('/dashboard/vacancies')}
      className="group p-6 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 text-left"
    >
      <div className="w-full">
        <div className="flex justify-between items-start mb-4">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
            Total vacancies
          </span>
          <span
            className="material-symbols-outlined p-2 rounded-xl text-xl group-hover:scale-110 transition-transform"
            style={{ color: PRIMARY_COLOR, backgroundColor: PRIMARY_ACCENT_COLOR_HEX }}
          >
            work_outline
          </span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">
          {summary?.totalVacancies ?? '-'}
        </h2>
        <div className="w-full h-8 opacity-80 group-hover:opacity-100 transition-opacity">
          <Sparkline
            values={
              trends?.vacancies && trends.vacancies.length > 0
                ? trends.vacancies
                : [0, 0, 0, 0, 0, 0, 0]
            }
            color={PRIMARY_COLOR}
          />
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-4">
        <span className="font-semibold" style={{ color: PRIMARY_COLOR }}>
          {summary?.openVacancies ?? '-'}
        </span>{' '}
        open roles
      </p>
    </button>

    <button
      type="button"
      onClick={() => navigate('/dashboard/kanban')}
      className="group p-6 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 text-left"
    >
      <div className="w-full">
        <div className="flex justify-between items-start mb-4">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
            Total applications
          </span>
          <span
            className="material-symbols-outlined p-2 rounded-xl text-xl group-hover:scale-110 transition-transform"
            style={{ color: PRIMARY_COLOR, backgroundColor: PRIMARY_ACCENT_COLOR_HEX }}
          >
            assignment
          </span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">
          {summary?.totalApplications ?? '-'}
        </h2>
        <div className="w-full h-8 opacity-80 group-hover:opacity-100 transition-opacity">
          <Sparkline
            values={
              trends?.applications && trends.applications.length > 0
                ? trends.applications
                : [0, 0, 0, 0, 0, 0, 0]
            }
            color={PRIMARY_COLOR}
          />
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-4">Current application volume</p>
    </button>

    <button
      type="button"
      onClick={() => navigate('/dashboard/vacancies')}
      className="group p-6 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 text-left"
    >
      <div className="w-full">
        <div className="flex justify-between items-start mb-4">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
            Fulfillment rate
          </span>
          <span
            className="material-symbols-outlined p-2 rounded-xl text-xl group-hover:scale-110 transition-transform"
            style={{ color: PRIMARY_COLOR, backgroundColor: PRIMARY_ACCENT_COLOR_HEX }}
          >
            trending_up
          </span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">
          {summary?.fulfillmentRate ?? '-'}
        </h2>
        <div className="w-full h-8 opacity-80 group-hover:opacity-100 transition-opacity">
          {trends?.fulfillment && trends.fulfillment.length > 0 && trends.fulfillment.some(v => v !== 0) ? (
            <Sparkline values={trends.fulfillment} color={PRIMARY_COLOR} />
          ) : (
            <p className="text-[10px] text-slate-300 mt-2">No trend data</p>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-4">of vacancies fulfilled</p>
    </button>

    <button
      type="button"
      onClick={() => navigate('/dashboard/offers')}
      className="group p-6 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 text-left"
    >
      <div className="w-full">
        <div className="flex justify-between items-start mb-4">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
            Hires
          </span>
          <span
            className="material-symbols-outlined p-2 rounded-xl text-xl group-hover:scale-110 transition-transform"
            style={{ color: PRIMARY_COLOR, backgroundColor: PRIMARY_ACCENT_COLOR_HEX }}
          >
            check_circle
          </span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">
          {summary?.hiredCount ?? '-'}
        </h2>
        <div className="w-full h-8 opacity-80 group-hover:opacity-100 transition-opacity">
          <Sparkline
            values={
              trends?.hires && trends.hires.length > 0
                ? trends.hires
                : [0, 0, 0, 0, 0, 0, 0]
            }
            color={PRIMARY_COLOR}
          />
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-4 flex items-center gap-1">
        <span
          className={`font-semibold px-1.5 py-0.5 rounded ${
            (trends?.hiredImprovement ?? 0) >= 0
              ? 'text-emerald-600 bg-emerald-50'
              : 'text-red-600 bg-red-50'
          }`}
        >
          {(trends?.hiredImprovement ?? 0) > 0 ? '+' : ''}
          {trends?.hiredImprovement ?? 0}%
        </span>{' '}
        improvement
      </p>
    </button>
  </div>
);

export default SummaryMetricsCards;
