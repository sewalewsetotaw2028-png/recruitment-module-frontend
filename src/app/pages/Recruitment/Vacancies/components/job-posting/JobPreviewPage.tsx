import React from 'react';
import type { JobPosting, Vacancy } from '@/types';
import {
  formatEmploymentType,
  daysUntilClosing,
  linesToListItems,
} from '@/utils/jobPosting';

interface JobPreviewPageProps {
  vacancy: Vacancy;
  posting?: JobPosting;
  mode: 'internal' | 'external';
  /** Company/organization name — used in the header branding. Defaults to vacancy data. */
  companyName?: string;
  onBack: () => void;
  onEdit?: () => void;
  onContinueToPosting?: () => void;
}

export const JobPreviewPage: React.FC<JobPreviewPageProps> = ({
  vacancy,
  posting,
  mode,
  companyName,
  onBack,
  onEdit,
  onContinueToPosting,
}) => {
  const closingDateRaw = posting?.closingDate || vacancy.closingDate;
  const daysLeft = daysUntilClosing(closingDateRaw);

  // Derive display name and initials from the passed company name or vacancy org
  const displayName = companyName || vacancy.organizationId || 'Your Company';
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const isValidDate = (dateStr: any): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime());
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 bg-slate-50/50 min-h-screen">
      {/* Navigation and Top Toolbar Controls */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <button
            type="button"
            onClick={onBack}
            className="hover:text-indigo-600 font-semibold transition-colors duration-150 flex items-center gap-1"
          >
            ← Back to Editor
          </button>
          <span className="material-symbols-outlined text-sm text-slate-400 select-none">
            chevron_right
          </span>
          <span className="text-slate-900 font-bold">Job Preview</span>
        </nav>

        <div className="flex gap-2 w-full sm:w-auto justify-end">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="px-4 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-semibold rounded-lg shadow-sm hover:bg-slate-50 active:bg-slate-100 transition-all duration-150"
            >
              Edit Content
            </button>
          )}
          {onContinueToPosting && (
            <button
              type="button"
              onClick={onContinueToPosting}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-indigo-700 active:bg-indigo-800 transition-all duration-150"
            >
              Continue to Posting
            </button>
          )}
        </div>
      </div>

      {/* Main Job Description Board Card */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white">
        {/* Corporate careers header branding container */}
        <div className="bg-slate-900 text-white p-6 md:p-8 relative overflow-hidden">
          {/* Subtle Decorative Background Mesh Element */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/40 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center font-bold text-md select-none tracking-tight shadow-inner">
                {initials || '??'}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                  {displayName} Careers
                </p>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  {mode === 'internal'
                    ? 'Internal Mobility Portal'
                    : 'External Careers Portal'}
                </p>
              </div>
            </div>

            <div>
              <span className="inline-flex items-center px-2.5 py-1 bg-white/10 border border-white/10 rounded-md text-[10px] font-bold text-indigo-300 uppercase tracking-wide">
                {vacancy.departmentName || 'General Operations'}
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-6">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {vacancy.title || 'Untitled Post Spec'}
            </h1>
          </div>

          <div className="relative z-10 flex flex-wrap gap-x-5 gap-y-2.5 mt-6 pt-5 border-t border-white/10 text-xs font-medium text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-md text-slate-400">
                location_on
              </span>
              {vacancy.location || 'Remote'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-md text-slate-400">
                schedule
              </span>
              {formatEmploymentType(vacancy.employmentType)}
            </span>
            {vacancy.salaryMin != null && (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="material-symbols-outlined text-md text-emerald-400/80">
                  payments
                </span>
                {vacancy.salaryMin.toLocaleString()} –{' '}
                {vacancy.salaryMax?.toLocaleString()} ETB
              </span>
            )}
          </div>
        </div>

        {/* Content Body Workspace */}
        <div className="p-6 md:p-8 space-y-8 bg-white">
          {/* Actionable Time Metric Alert Banner */}
          {daysLeft !== null && isValidDate(closingDateRaw) && (
            <div className="flex items-start gap-3.5 p-4 bg-amber-50 border border-amber-200/70 rounded-xl shadow-inner-sm">
              <span className="material-symbols-outlined text-amber-600 mt-0.5 select-none">
                event
              </span>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Application window constraints
                </p>
                <p className="text-sm text-amber-800 font-medium">
                  {daysLeft} days remaining — closes{' '}
                  {new Date(closingDateRaw!).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Core Content Block Sections */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-l-4 border-indigo-600 pl-2.5">
                Role Summary & Context
              </h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-normal px-1">
              {vacancy.description ||
                'No overview description provided for this job listing.'}
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-l-4 border-indigo-600 pl-2.5">
                Key Execution & Accountabilities
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm leading-relaxed font-normal">
              {linesToListItems(vacancy.responsibilities).map((line, i) => (
                <li
                  key={i}
                  className="pl-1 hover:text-slate-900 transition-colors"
                >
                  {line}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-l-4 border-indigo-600 pl-2.5">
                Required Target Background
              </h2>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-normal px-1">
              {vacancy.requirements ||
                'No specific background prerequisites recorded.'}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 border-t border-slate-50">
              {vacancy.experienceRequired && (
                <div className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-1.5 text-slate-700">
                  <span className="font-bold text-slate-900">
                    Experience Base:
                  </span>{' '}
                  <span className="font-medium text-slate-600">
                    {vacancy.experienceRequired}
                  </span>
                </div>
              )}

              {vacancy.skills && vacancy.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  {vacancy.skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-semibold shadow-xs"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {vacancy.benefits && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-l-4 border-indigo-600 pl-2.5">
                  Total Rewards & Packages
                </h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-normal px-1">
                {vacancy.benefits}
              </p>
            </section>
          )}

          {vacancy.employmentTerms && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-l-4 border-indigo-600 pl-2.5">
                  Contract terms & Rules
                </h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-normal px-1">
                {vacancy.employmentTerms}
              </p>
            </section>
          )}

          {/* Control Platform Footnote Block */}
          <div className="pt-5 border-t border-slate-200 bg-slate-50 -mx-6 md:-mx-8 px-6 md:px-8 py-4 mt-4">
            <div className="flex items-start gap-2.5 text-xs font-medium text-slate-500 leading-relaxed">
              <span className="material-symbols-outlined text-md text-slate-400 shrink-0 select-none mt-0.5">
                info
              </span>
              <p>
                <span className="font-bold text-slate-700">
                  Internal Preview Context:
                </span>{' '}
                Operational candidate submissions, system action links, and
                saving protocols are programmatically hidden inside this view
                matrix. Finalize and publish the core draft via the workflow
                sequence to open visibility criteria.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
