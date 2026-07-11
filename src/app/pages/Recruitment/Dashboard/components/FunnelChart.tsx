import React from 'react';

interface FunnelChartProps {
  funnelPeriod: 'monthly' | 'quarterly' | 'custom';
  setFunnelPeriod: (period: 'monthly' | 'quarterly' | 'custom') => void;
  funnelData: { label: string; pct: number; count: number }[];
}

export const FunnelChart: React.FC<FunnelChartProps> = ({
  funnelPeriod,
  setFunnelPeriod,
  funnelData,
}) => {
  return (
    <div className="lg:col-span-8 bg-white border border-outline-variant p-6 rounded-xl shadow-sm">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
        <h3 className="text-base font-semibold text-primary">
          Global Hiring Funnel
        </h3>
        <div className="flex shrink-0 flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => setFunnelPeriod('quarterly')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              funnelPeriod === 'quarterly'
                ? 'bg-primary text-white border-transparent shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            Quarterly
          </button>
          <button
            type="button"
            onClick={() => setFunnelPeriod('monthly')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              funnelPeriod === 'monthly'
                ? 'bg-primary text-white border-transparent shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>
      <div className="relative h-64 flex flex-col justify-between space-y-3 pt-2">
        {funnelData.map((row) => {
          const gradId = `grad-${row.label.replace(/\s+/g, '-').toLowerCase()}`;
          return (
            <div key={row.label} className="flex items-center gap-4 text-xs">
              <div className="w-24 shrink-0 text-right text-xs font-semibold text-on-surface-variant">
                {row.label}
              </div>
              <div className="flex-1">
                <svg
                  className="w-full h-3 funnel-svg"
                  viewBox="0 0 100 12"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label={`${row.label}: ${row.count} candidates — ${row.pct}%`}
                >
                  <defs>
                    <linearGradient id={gradId} x1="0" x2="1">
                      <stop
                        offset="0%"
                        stopColor="#60a5fa"
                        stopOpacity="0.95"
                      />
                      <stop
                        offset="100%"
                        stopColor="#0f2847"
                        stopOpacity="0.95"
                      />
                    </linearGradient>
                  </defs>
                  <rect
                    x="0"
                    y="2"
                    width="100"
                    height="8"
                    rx="2"
                    fill="#eef2f6"
                  />
                  <rect
                    x="0"
                    y="2"
                    width={Math.max(2, row.pct)}
                    height="8"
                    rx="2"
                    fill={`url(#${gradId})`}
                  />
                  <title>{`${row.count} Candidates — ${row.pct}%`}</title>
                </svg>
              </div>
              <div className="w-28 text-right text-xs font-semibold text-primary">
                {row.count} Candidates
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FunnelChart;
