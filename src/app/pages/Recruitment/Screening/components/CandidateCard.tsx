import React from 'react';
import type { ScreeningApplicationRecord } from '../api';

interface CandidateCardProps {
  record: ScreeningApplicationRecord;
  onShortlist?: (record: ScreeningApplicationRecord) => void;
  onReject?: (record: ScreeningApplicationRecord) => void;
  onViewDetails: (record: ScreeningApplicationRecord) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  record,
  onShortlist,
  onReject,
  onViewDetails,
}) => {
  const { candidate, vacancy } = record;
  const topSkills = candidate.skills.slice(0, 4);
  const latestEducation = candidate.educations[0];
  const experienceLabel =
    candidate.yearsOfExperience > 0
      ? `${candidate.yearsOfExperience} yrs experience`
      : candidate.experiences.length > 0
        ? `${candidate.experiences.length} work record(s)`
        : 'No experience records';

  return (
    <div
      className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between text-slate-800 antialiased cursor-pointer"
      onClick={() => onViewDetails(record)}
    >
      <div>
        {/* Card Header Layer */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 truncate tracking-tight">
              {candidate.firstName} {candidate.lastName}
            </h3>
            <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
              {vacancy.title}
            </p>
            <span className="inline-flex mt-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
              {record.matchScore}% match
            </span>
          </div>

          {/* Main Tonal Status Operations */}
          <div className="flex gap-1.5 shrink-0">
            {onShortlist && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onShortlist(record);
                }}
                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100/60 rounded-lg text-xs font-semibold hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-150 cursor-pointer"
              >
                Shortlist
              </button>
            )}
            {onReject && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReject(record);
                }}
                className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100/60 rounded-lg text-xs font-semibold hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all duration-150 cursor-pointer"
              >
                Reject
              </button>
            )}
          </div>
        </div>

        {/* Detailed Metrics Information Stack */}
        <div className="space-y-2 border-t border-slate-50 pt-3.5">
          <div className="flex items-center gap-2.5 text-xs text-slate-600">
            <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">
              work
            </span>
            <span className="font-medium truncate">
              {experienceLabel}
            </span>
          </div>

          {latestEducation && (
            <div className="flex items-center gap-2.5 text-xs text-slate-600">
              <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">
                school
              </span>
              <span className="font-medium truncate">
                {latestEducation.degree} in {latestEducation.fieldOfStudy}
              </span>
            </div>
          )}

          {topSkills.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {topSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2.5 text-xs text-slate-600">
            <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">
              description
            </span>
            <span className="font-medium truncate">
              {candidate.documents.length} document(s) attached
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <span className="material-symbols-outlined text-[16px] shrink-0">
              calendar_today
            </span>
            <span className="font-medium font-mono text-[11px]">
              Applied: {new Date(record.submittedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Navigation Trigger */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-start">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(record);
          }}
          className="px-3 py-1.5 bg-indigo-200 text-indigo-700 border border-indigo-100/60 rounded-lg text-xs font-semibold hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-150 cursor-pointer inline-flex items-center gap-1"
        >
          View Full Profile
          <span className="material-symbols-outlined text-[14px]">
            arrow_right_alt
          </span>
        </button>
      </div>
    </div>
  );
};
