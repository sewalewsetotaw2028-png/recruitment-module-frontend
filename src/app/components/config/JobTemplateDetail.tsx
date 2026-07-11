import React, { useEffect, useMemo, useState } from 'react';
import type { JobDescription, JobTemplate } from '@/hooks/useJobTemplates';

interface JobTemplateDetailProps {
  template: JobTemplate;
  loading: boolean;
  onSave: (payload: any) => Promise<void>;
  onCreateVersion: (payload: {
    title: string;
    summary?: string;
    responsibilities: string;
    requirements: string;
    employmentType: string;
    jobGrade?: string;
  }) => Promise<void>;
  canWrite: boolean;
}

export const JobTemplateDetail: React.FC<JobTemplateDetailProps> = ({
  template,
  loading,
  onSave,
  onCreateVersion,
  canWrite,
}) => {
  const [title, setTitle] = useState(template.title);
  const [employmentType, setEmploymentType] = useState(template.employment_type);
  const [jobGrade, setJobGrade] = useState(template.job_grade || '');
  const [summary, setSummary] = useState(template.summary || '');
  const [responsibilities, setResponsibilities] = useState(
    template.responsibilities,
  );
  const [requirements, setRequirements] = useState(template.requirements);
  const [isActive, setIsActive] = useState(template.is_active);
  const [saving, setSaving] = useState(false);
  const [versioning, setVersioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentVersion = useMemo(() => {
    if (template.job_descriptions.length === 0) return null;
    // Show the newest revision first so admins always see the latest version
    // that would be reused when they create another description entry.
    return [...template.job_descriptions].sort((a, b) => b.version - a.version)[0];
  }, [template.job_descriptions]);

  useEffect(() => {
    setTitle(template.title);
    setEmploymentType(template.employment_type);
    setJobGrade(template.job_grade || '');
    setSummary(template.summary || '');
    setResponsibilities(template.responsibilities);
    setRequirements(template.requirements);
    setIsActive(template.is_active);
    setError(null);
  }, [template]);

  const handleSave = async () => {
    if (!canWrite) return;
    if (!title.trim()) {
      setError('Template title is required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        employmentType,
        jobGrade: jobGrade.trim(),
        summary: summary.trim(),
        responsibilities: responsibilities.trim(),
        requirements: requirements.trim(),
        isActive,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!canWrite) return;
    if (!title.trim()) {
      setError('Template title is required');
      return;
    }

    setVersioning(true);
    setError(null);
    try {
      await onCreateVersion({
        title: title.trim(),
        summary: summary.trim(),
        responsibilities: responsibilities.trim(),
        requirements: requirements.trim(),
        employmentType,
        jobGrade: jobGrade.trim(),
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to create description',
      );
    } finally {
      setVersioning(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
                {template.title}
              </h2>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <p className="text-xs text-slate-500 font-medium">
                  Job template for vacancy creation
                </p>
                {template.is_active ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-green-50 text-green-700 border border-green-200/40 uppercase tracking-wider select-none">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider select-none">
                    Inactive
                  </span>
                )}
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider select-none">
                  {template.employment_type}
                </span>
              </div>
            </div>

            {canWrite && (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={handleCreateVersion}
                  disabled={versioning || loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs focus:outline-none cursor-pointer border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                {versioning ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin leading-none">
                      progress_activity
                    </span>
                      Creating...
                  </>
                ) : (
                  '+ New Version'
                )}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs focus:outline-none cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin leading-none">
                        progress_activity
                      </span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            )}
          </div>
          {currentVersion && (
            <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
              <span className="material-symbols-outlined text-[14px] leading-none">
                history
              </span>
              Current version: {currentVersion.version}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3.5 bg-red-50/60 border border-red-200/60 rounded-xl text-xs text-red-700 animate-fade-in">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canWrite}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
            Employment Type
          </label>
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            disabled={!canWrite}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="TEMPORARY">Temporary</option>
            <option value="CONSULTANT">Consultant</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
            Job Grade
          </label>
          <input
            type="text"
            value={jobGrade}
            onChange={(e) => setJobGrade(e.target.value)}
            disabled={!canWrite}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
            Summary
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            disabled={!canWrite}
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed resize-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
            Responsibilities
          </label>
          <textarea
            value={responsibilities}
            onChange={(e) => setResponsibilities(e.target.value)}
            disabled={!canWrite}
            rows={5}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed resize-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
            Requirements
          </label>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            disabled={!canWrite}
            rows={5}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed resize-none"
          />
        </div>

        {canWrite && (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
              />
              <span className="text-xs font-semibold text-slate-700">
                Active
              </span>
            </label>
          </div>
        )}

        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide mb-3">
            Description Versions
          </h3>
          <div className="space-y-2">
            {template.job_descriptions.length === 0 ? (
              <div className="px-4 py-6 bg-white border border-slate-200 rounded-xl text-xs text-slate-500 italic">
                No versions yet.
              </div>
            ) : (
              [...template.job_descriptions]
                .sort((a, b) => b.version - a.version)
                .map((desc: JobDescription) => (
                  <div
                    key={desc.id}
                    className="px-4 py-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        Version {desc.version}
                      </p>
                      <p className="text-[10px] text-slate-500">{desc.title}</p>
                    </div>
                    {desc.is_active && (
                      <span className="text-[9px] font-extrabold bg-green-50 text-green-700 px-2 py-1 rounded-md">
                        Current
                      </span>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobTemplateDetail;
