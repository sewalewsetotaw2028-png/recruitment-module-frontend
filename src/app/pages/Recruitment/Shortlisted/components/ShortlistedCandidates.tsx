import React from 'react';
import type { ScreeningApplicationRecord } from '../../Screening/api';

interface ShortlistedCandidatesProps {
  applications: ScreeningApplicationRecord[];
  onSchedule: (appId: string) => void;
  onViewDetails: (appId: string) => void;
  canScheduleInterview?: boolean;
}

export const ShortlistedCandidates: React.FC<ShortlistedCandidatesProps> = ({
  applications,
  onSchedule,
  onViewDetails,
  canScheduleInterview = true,
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm text-slate-800 antialiased">
      {/* Component Header Metadata Node */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Shortlisted Candidates
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            Vacancy-filtered shortlist view for scheduling and operational
            handoffs.
          </p>
        </div>
        <span className="shrink-0 text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md font-mono">
          {applications.length} candidates
        </span>
      </div>

      {/* Internal Grid Sub-Workspace */}
      <div className="grid grid-cols-12 gap-4 border-t border-slate-100 pt-4">
        {applications.map((app) => {
          return (
            <div
              key={app.id}
              className="col-span-12 md:col-span-6 lg:col-span-4 bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                {/* Title and Position Meta */}
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate tracking-tight">
                    {app.candidateName}
                  </p>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    {app.vacancyTitle}
                  </p>
                </div>

                {/* Score & Experience Pill Markers */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="inline-flex items-center text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded-md font-mono">
                    Match: {app.matchScore}%
                  </span>
                  <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
                    Exp: {app.candidate.yearsOfExperience || 0} yrs
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {app.candidate.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Trigger Node */}
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => onViewDetails(app.id)}
                  className="w-full bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100 font-bold py-2 px-3 rounded-lg text-xs transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-slate-100/20"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    visibility
                  </span>
                  View Details
                </button>
                {canScheduleInterview && (
                  <button
                    type="button"
                    onClick={() => onSchedule(app.id)}
                    className="w-full bg-indigo-600 text-white border border-indigo-600 hover:bg-indigo-700 font-bold py-2 px-3 rounded-lg text-xs transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20"
                  >
                    <span className="material-symbols-outlined text-[15px] group-hover:animate-pulse">
                      calendar_today
                    </span>
                    Schedule Interview
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty Fallback Display Layer */}
        {applications.length === 0 && (
          <div className="col-span-12 text-center py-8 bg-slate-50/40 border border-dashed border-slate-200 rounded-xl space-y-2">
            <span className="material-symbols-outlined text-slate-300 text-xl block">
              folder_open
            </span>
            <p className="text-xs font-medium text-slate-400 max-w-xs mx-auto leading-relaxed">
              No shortlisted candidates match the active filters or vacancy
              options.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
