import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type {
  JobTemplate,
  CreateJobTemplatePayload,
  UpdateJobTemplatePayload,
} from '@/hooks/useJobTemplates';

interface JobTemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: JobTemplate | null;
  onSubmit: (
    payload: CreateJobTemplatePayload | UpdateJobTemplatePayload,
  ) => Promise<void>;
}

export const JobTemplateFormModal: React.FC<JobTemplateFormModalProps> = ({
  isOpen,
  onClose,
  template,
  onSubmit,
}) => {
  const isEditMode = !!template;

  const [title, setTitle] = useState('');
  const [employmentType, setEmploymentType] = useState('FULL_TIME');
  const [jobGrade, setJobGrade] = useState('');
  const [summary, setSummary] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [requirements, setRequirements] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(template?.title ?? '');
      setEmploymentType(template?.employment_type ?? 'FULL_TIME');
      setJobGrade(template?.job_grade ?? '');
      setSummary(template?.summary ?? '');
      setResponsibilities(template?.responsibilities ?? '');
      setRequirements(template?.requirements ?? '');
      setError(null);
    }
  }, [isOpen, template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      if (isEditMode) {
        const payload: UpdateJobTemplatePayload = {
          title: title.trim(),
          employmentType,
          jobGrade,
          summary,
          responsibilities,
          requirements,
        };
        await onSubmit(payload);
      } else {
        const payload: CreateJobTemplatePayload = {
          title: title.trim(),
          employmentType,
          jobGrade,
          summary,
          responsibilities,
          requirements,
        };
        await onSubmit(payload);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Job Template' : 'Add New Job Template'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Software Engineer"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-xs text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
            Employment Type <span className="text-red-500">*</span>
          </label>
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-xs text-xs"
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
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
            Job Grade
          </label>
          <input
            type="text"
            value={jobGrade}
            onChange={(e) => setJobGrade(e.target.value)}
            placeholder="e.g. L5, Senior, etc."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-xs text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
            Summary
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            placeholder="Brief summary of the role..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-xs resize-none text-xs leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
            Responsibilities <span className="text-red-500">*</span>
          </label>
          <textarea
            value={responsibilities}
            onChange={(e) => setResponsibilities(e.target.value)}
            rows={4}
            placeholder="Key responsibilities for this role..."
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-xs resize-none text-xs leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
            Requirements <span className="text-red-500">*</span>
          </label>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={4}
            placeholder="Required qualifications and skills..."
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-xs resize-none text-xs leading-relaxed"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50/60 border border-red-200/60 rounded-xl animate-fade-in">
            <span className="material-symbols-outlined text-red-500 text-base shrink-0 mt-0.5">
              error
            </span>
            <p className="text-xs text-red-700 font-semibold leading-relaxed">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs focus:outline-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="job-template-form-submit"
            type="submit"
            disabled={submitting || !title.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs focus:outline-none cursor-pointer"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin leading-none">
                  progress_activity
                </span>
                Saving…
              </>
            ) : isEditMode ? (
              'Update Template'
            ) : (
              'Create Template'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default JobTemplateFormModal;
