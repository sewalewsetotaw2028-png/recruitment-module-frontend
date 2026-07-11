import React from 'react';

interface KPICardsProps {
  kpis?: {
    averageTimeToFillDays?: number;
    averageTimeToHireDays?: number;
    offerAcceptanceRate?: string;
    candidateConversionRate?: string;
  };
  loading?: boolean;
}

/**
 * KPICards renders 4 KPI cards with key recruitment metrics.
 * Only renders if user has REPORTS_READ permission.
 */
export const KPICards: React.FC<KPICardsProps> = ({ kpis, loading }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
      <div className="text-xs text-slate-500 uppercase font-semibold">
        Avg time to fill
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse mt-2" />
      ) : (
        <div className="text-2xl font-bold mt-2">
          {kpis?.averageTimeToFillDays ?? '-'} days
        </div>
      )}
      <div className="text-xs text-slate-400 mt-1">Average</div>
    </div>

    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
      <div className="text-xs text-slate-500 uppercase font-semibold">
        Avg time to hire
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse mt-2" />
      ) : (
        <div className="text-2xl font-bold mt-2">
          {kpis?.averageTimeToHireDays ?? '-'} days
        </div>
      )}
      <div className="text-xs text-slate-400 mt-1">Application to offer</div>
    </div>

    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
      <div className="text-xs text-slate-500 uppercase font-semibold">
        Offer acceptance
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse mt-2" />
      ) : (
        <div className="text-2xl font-bold mt-2">
          {kpis?.offerAcceptanceRate ?? '-'}
        </div>
      )}
      <div className="text-xs text-slate-400 mt-1">of offers accepted</div>
    </div>

    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
      <div className="text-xs text-slate-500 uppercase font-semibold">
        Conversion flow
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse mt-2" />
      ) : (
        <div className="text-2xl font-bold mt-2">
          {kpis?.candidateConversionRate ?? '-'}
        </div>
      )}
      <div className="text-xs text-slate-400 mt-1">Screening to shortlist</div>
    </div>
  </div>
);

export default KPICards;
