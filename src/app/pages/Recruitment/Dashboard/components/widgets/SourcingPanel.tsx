import React, { useMemo } from 'react';
import { PRIMARY_COLOR_HEX } from '@/config/theme';

interface SourcingItem {
  source: string;
  count: number;
}

interface SourcingPanelProps {
  sourcing?: SourcingItem[];
  trends?: {
    [key: string]: any;
  };
}

const PRIMARY_COLOR = PRIMARY_COLOR_HEX;

/**
 * SourcingPanel — sourcing distribution and insight cards.
 * Only renders if user has REPORTS_READ permission (checked by shell).
 */
export const SourcingPanel: React.FC<SourcingPanelProps> = ({
  sourcing,
  trends,
}) => {
  if (!sourcing?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Sourcing distribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Candidate volume by source for the current dashboard period.
            </p>
          </div>
          <div className="mt-1.5 sm:mt-0 text-[10px] uppercase tracking-[0.12em] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
            No sourcing data
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
          Sourcing data is not available for the selected period.
        </div>
      </div>
    );
  }

  const normalizeSourceLabel = (source: string) => {
    const map: Record<string, string> = {
      linkedin: 'LinkedIn',
      referral: 'Employee referrals',
      career_website: 'Company website',
      other: 'Other',
    };
    return (
      map[source] ??
      source.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    );
  };

  const totalSourced = useMemo(() => {
    return sourcing?.reduce((sum, item) => sum + (item.count ?? 0), 0) ?? 0;
  }, [sourcing]);

  const topSource = useMemo(() => {
    return sourcing?.reduce(
      (best, item) => (item.count > (best?.count ?? -1) ? item : best),
      sourcing?.[0],
    );
  }, [sourcing]);

  const topSourceLabel = topSource
    ? normalizeSourceLabel(topSource.source)
    : '—';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Sourcing distribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Candidate volume by source for the current dashboard period.
            </p>
          </div>
          <div className="mt-1.5 sm:mt-0 text-[10px] uppercase tracking-[0.12em] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
            {sourcing?.length ? 'Source mix' : 'No sourcing data'}
          </div>
        </div>

        <div className="space-y-5">
          {(sourcing ?? []).length ? (
            sourcing?.map((item) => {
              const pct = totalSourced
                ? Math.round((item.count / totalSourced) * 100)
                : 0;

              return (
                <div key={item.source}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-slate-700">
                      {normalizeSourceLabel(item.source)}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {item.count}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: PRIMARY_COLOR,
                      }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {pct}% of sourced candidates
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
              Sourcing data is not available for the selected period.
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-900">Sourcing insight</h3>
        <p className="text-sm text-slate-500 mt-3">
          Track where candidates are entering the pipeline so hiring teams can
          focus on high-performing channels.
        </p>

        <div className="mt-6 grid gap-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-semibold">
              Total sourced
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-3">
              {totalSourced ?? '—'}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Candidates sourced across channels.
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-semibold">
              Top source
            </div>
            <div className="text-xl font-bold text-slate-900 mt-3">
              {topSourceLabel}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Highest contributor to sourced volume.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourcingPanel;
