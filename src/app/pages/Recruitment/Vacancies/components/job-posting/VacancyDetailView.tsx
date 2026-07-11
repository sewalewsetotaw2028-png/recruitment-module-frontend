import React from 'react';
import type { Application, JobPosting, Vacancy } from '@/types';
import { statusBadgeClass } from '@/utils/jobPosting';

interface VacancyDetailViewProps {
  vacancy: Vacancy;
  posting?: JobPosting;
  applications: Application[];
  onEditDescription: () => void;
  onManagePosting: () => void;
  onPutOnHold: () => void;
  onBack: () => void;
}

export const VacancyDetailView: React.FC<VacancyDetailViewProps> = ({
  vacancy,
  posting,
  applications,
  onEditDescription,
  onManagePosting,
  onPutOnHold,
  onBack,
}) => {
  const vacApps = applications.filter((a) => a.vacancyId === vacancy.id);

  return (
    <div className="space-y-lg">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-md">
        <div>
          <button type="button" onClick={onBack} className="text-label-md text-on-surface-variant hover:text-primary mb-sm flex items-center gap-xs">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to Hub
          </button>
          <div className="flex items-center gap-md flex-wrap">
            <span className="text-label-md text-on-surface-variant uppercase">Vacancy: {vacancy.id}</span>
            <span className={`text-[10px] font-black px-sm py-0.5 rounded-full uppercase ${statusBadgeClass(vacancy.vacancyStatus)}`}>
              {vacancy.vacancyStatus.replace('_', ' ')}
            </span>
            {posting && (
              <span className={`text-[10px] font-black px-sm py-0.5 rounded-full uppercase ${statusBadgeClass(posting.publicationStatus)}`}>
                Posting: {posting.publicationStatus.replace('_', ' ')}
              </span>
            )}
          </div>
          <h2 className="font-display-lg text-primary mt-xs">{vacancy.title}</h2>
          <p className="text-body-sm text-on-surface-variant">{vacancy.departmentName} • {vacancy.location}</p>
        </div>
        <div className="flex flex-wrap gap-sm">
          <button type="button" onClick={onPutOnHold} className="flex items-center gap-sm px-md py-sm border border-outline-variant rounded font-label-md">
            <span className="material-symbols-outlined text-[18px]">pause</span> Pause Hiring
          </button>
          <button type="button" onClick={onManagePosting} className="flex items-center gap-sm px-md py-sm border border-outline-variant rounded font-label-md">
            <span className="material-symbols-outlined text-[18px]">public</span> Manage Posting
          </button>
          <button type="button" onClick={onEditDescription} className="flex items-center gap-sm px-md py-sm bg-primary text-on-primary rounded font-label-md">
            <span className="material-symbols-outlined text-[18px]">edit</span> Edit Job Description
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        <div className="lg:col-span-8 space-y-lg">
          <div className="bg-white border border-outline-variant rounded-xl p-lg">
            <h3 className="font-headline-sm text-primary mb-md">Role Summary</h3>
            <p className="text-body-md text-on-surface-variant whitespace-pre-line">{vacancy.description}</p>
            <div className="grid grid-cols-2 gap-md mt-lg">
              {[
                ['Department', vacancy.departmentName],
                ['Location', vacancy.location],
                ['Closing Date', vacancy.closingDate || posting?.closingDate || '—'],
                ['Employment Type', vacancy.employmentType.replace('_', ' ')],
                ['Salary Range', vacancy.salaryMin ? `${vacancy.salaryMin.toLocaleString()} – ${vacancy.salaryMax?.toLocaleString()} ETB/mo` : '—'],
                ['Experience', vacancy.experienceRequired || '—'],
              ].map(([label, val]) => (
                <div key={label} className="bg-surface-container-low p-md rounded border border-outline-variant/30">
                  <p className="text-[10px] text-on-surface-variant uppercase">{label}</p>
                  <p className="font-bold text-primary text-sm">{val}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-outline-variant rounded-xl p-lg">
            <h3 className="font-headline-sm text-primary mb-md">Responsibilities</h3>
            <ul className="list-disc pl-lg text-body-sm text-on-surface-variant space-y-1">
              {vacancy.responsibilities.split('\n').filter(Boolean).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>

          {vacancy.employmentTerms && (
            <div className="bg-white border border-outline-variant rounded-xl p-lg">
              <h3 className="font-headline-sm text-primary mb-md">Employment Terms</h3>
              <p className="text-body-sm text-on-surface-variant">{vacancy.employmentTerms}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-lg">
          {posting && (
            <div className="bg-white border border-outline-variant rounded-xl p-lg">
              <h3 className="font-label-md text-on-surface-variant uppercase mb-md">Posting Metrics</h3>
              <div className="space-y-sm text-sm">
                <div className="flex justify-between"><span>Views</span><span className="font-bold">{posting.views}</span></div>
                <div className="flex justify-between"><span>Applications</span><span className="font-bold">{posting.applicationsCount}</span></div>
                <div className="flex justify-between"><span>Visibility</span><span className="font-bold capitalize">{posting.visibility.replace('_', ' ')}</span></div>
              </div>
            </div>
          )}

          <div className="bg-white border border-outline-variant rounded-xl p-lg">
            <h3 className="font-label-md text-on-surface-variant uppercase mb-md">Hiring Funnel</h3>
            <p className="text-display-lg text-primary font-black">{vacApps.length}</p>
            <p className="text-[10px] text-on-surface-variant uppercase">Total Applicants</p>
          </div>

          {/* FR-16 History */}
          <div className="bg-white border border-outline-variant rounded-xl p-lg">
            <h3 className="font-label-md text-on-surface-variant uppercase mb-md">Activity / History</h3>
            <div className="space-y-md max-h-64 overflow-y-auto">
              {[...vacancy.activities].reverse().map((act) => (
                <div key={act.id} className="border-l-2 border-primary pl-md">
                  <p className="text-xs font-bold text-primary">{act.action}</p>
                  <p className="text-[10px] text-on-surface-variant">{act.actorName} • {new Date(act.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
