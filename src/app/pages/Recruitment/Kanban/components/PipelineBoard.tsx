import React from 'react';
import type { Application } from '@/types';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';

interface PipelineBoardProps {
  applications: Application[];
  onScheduleInterview: (appId: string) => void;
  onViewCandidate: (appId: string) => void;
  onManageOffer: () => void;
  onGenerateHiringMinute: (appId: string) => void;
}

const STAGES: {
  key: string;
  title: string;
  statuses: string[];
  accent: string;
}[] = [
  {
    key: 'screening',
    title: 'Screening',
    statuses: ['submitted', 'screening'],
    accent: 'border-t-indigo-500',
  },
  {
    key: 'shortlist',
    title: 'Shortlist',
    statuses: ['shortlisted'],
    accent: 'border-t-blue-500',
  },
  {
    key: 'interview',
    title: 'Interviews',
    statuses: ['interview'],
    accent: 'border-t-amber-500',
  },
  {
    key: 'offered',
    title: 'Offered',
    statuses: ['offered'],
    accent: 'border-t-emerald-500',
  },
  {
    key: 'hired',
    title: 'Hired',
    statuses: ['hired'],
    accent: 'border-t-slate-700',
  },
];

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  applications,
  onScheduleInterview,
  onViewCandidate,
  onManageOffer,
  onGenerateHiringMinute,
}) => {
  const { can } = usePermissions();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const cards = applications
          .filter((a) => stage.statuses.includes(a.applicationStatus))
          .sort((a, b) => b.matchScore - a.matchScore);

        return (
          <div
            key={stage.key}
            className={`bg-white border border-slate-200 rounded-2xl shadow-sm min-h-[420px] flex flex-col border-t-4 ${stage.accent}`}
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {stage.title}
              </h3>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                {cards.length}
              </span>
            </div>
            <div className="p-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar max-h-[520px]">
              {cards.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  No candidates
                </p>
              ) : (
                cards.map((app) => (
                  <div
                    key={app.id}
                    className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => onViewCandidate(app.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onViewCandidate(app.id);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <p className="font-semibold text-sm text-slate-900 truncate">
                      {app.candidateName}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {app.vacancyTitle}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {app.matchScore}% match
                      </span>
                    </div>
                    {stage.key === 'shortlist' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onScheduleInterview(app.id);
                        }}
                        className="mt-2 w-full text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white py-1.5 rounded-lg hover:bg-indigo-700"
                      >
                        Schedule
                      </button>
                    )}
                    {stage.key === 'offered' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onManageOffer();
                        }}
                        className="mt-2 w-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white py-1.5 rounded-lg hover:bg-emerald-700"
                      >
                        Manage offer
                      </button>
                    )}
                    {stage.key === 'hired' && can(PERMISSIONS.HIRING_MINUTE_CREATE) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGenerateHiringMinute(app.id);
                        }}
                        className="mt-2 w-full text-[10px] font-bold uppercase tracking-wider border border-slate-200 text-slate-700 py-1.5 rounded-lg hover:bg-white"
                      >
                        Hiring minute
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
