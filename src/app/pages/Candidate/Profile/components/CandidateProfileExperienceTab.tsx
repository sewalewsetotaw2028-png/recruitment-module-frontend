import React, { useState } from 'react';
import type { CandidateProfileData, Experience } from '@/pages/Candidate/types';
import Modal from '@/components/ui/Modal/Modal';
import { PROFILE_THEME } from './profileTheme';
import { ExperienceDetailModal } from './ExperienceDetailModal';

interface CandidateProfileExperienceTabProps {
  profile: CandidateProfileData;

  editingExperience: Experience | null;

  newExperience: Partial<Experience>;

  experienceFile: File | null;

  uploading: boolean;

  setEditingExperience: React.Dispatch<React.SetStateAction<Experience | null>>;

  setNewExperience: React.Dispatch<React.SetStateAction<Partial<Experience>>>;

  setExperienceFile: React.Dispatch<React.SetStateAction<File | null>>;

  onAddExperience: () => void;

  onUpdateExperience: () => void;

  onDeleteExperience: (id: string) => void;
}

export const CandidateProfileExperienceTab: React.FC<
  CandidateProfileExperienceTabProps
> = ({
  profile,

  editingExperience,

  newExperience,

  experienceFile,

  uploading,

  setEditingExperience,

  setNewExperience,

  setExperienceFile,

  onAddExperience,

  onUpdateExperience,

  onDeleteExperience,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedExperience, setSelectedExperience] =
    useState<Experience | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [currentlyWorking, setCurrentlyWorking] = useState(false);

  const handleAddClick = () => {
    setFormError(null);
    setCurrentlyWorking(false);
    setNewExperience({});
    setExperienceFile(null);
    setEditingExperience(null);
    setShowModal(true);
  };

  const handleEditClick = (exp: Experience) => {
    setFormError(null);
    setCurrentlyWorking(!exp.endDate);
    setEditingExperience(exp);
    setExperienceFile(null);
    setShowModal(true);
  };

  const handleViewClick = (exp: Experience) => {
    setSelectedExperience(exp);
    setShowDetailModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExperience) {
      if (
        !editingExperience.companyName ||
        !editingExperience.position ||
        !editingExperience.startDate
      ) {
        setFormError('Please fill in all required fields.');
        return;
      }
      onUpdateExperience();
    } else {
      if (
        !newExperience.companyName ||
        !newExperience.position ||
        !newExperience.startDate
      ) {
        setFormError('Please fill in all required fields.');
        return;
      }
      onAddExperience();
    }
    setShowModal(false);
    setFormError(null);
    setEditingExperience(null);
    setNewExperience({});
    setExperienceFile(null);
    setCurrentlyWorking(false);
  };

  const handleCancel = () => {
    setShowModal(false);
    setFormError(null);
    setCurrentlyWorking(false);
    setEditingExperience(null);
    setNewExperience({});
    setExperienceFile(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Work Experience
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            Document your professional journey and career milestones.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Experience Records
          </div>
          <button
            type="button"
            onClick={handleAddClick}
            className="!text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            style={{ backgroundColor: PROFILE_THEME.primary }}
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Experience
          </button>
        </div>

        {/* Experience List */}
        {profile.experiences.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">
              work_history
            </span>
            <p className="text-sm font-medium text-slate-500">
              No experience entries yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {profile.experiences.map((exp) => {
              const startDate = new Date(exp.startDate);
              const endDate = exp.endDate ? new Date(exp.endDate) : null;

              return (
                <div
                  key={exp.id}
                  className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 hover:shadow-md/50 transition-all duration-300 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                        {exp.companyName}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {startDate.toLocaleDateString()} —{' '}
                        {endDate ? endDate.toLocaleDateString() : 'Present'}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">
                      {exp.position}
                    </h4>

                    {exp.description && (
                      <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-line max-w-3xl">
                        {exp.description}
                      </p>
                    )}

                    {exp.documentUrl && (
                      <div className="pt-1">
                        <a
                          href={exp.documentUrl}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            download
                          </span>
                          View Document
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                    <button
                      type="button"
                      onClick={() => handleViewClick(exp)}
                      className="p-2 text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors focus:outline-none"
                      title="View Details"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        visibility
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditClick(exp)}
                      className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        edit
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteExperience(exp.id)}
                      className="p-2 text-rose-400 hover:text-rose-600 bg-rose-50/50 hover:bg-rose-50 rounded-xl transition-colors focus:outline-none"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={showModal}
        onClose={handleCancel}
        title={editingExperience ? 'Edit Experience' : 'Add Experience'}
        size="xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={
                  editingExperience?.companyName ||
                  newExperience.companyName ||
                  ''
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (editingExperience) {
                    setEditingExperience({
                      ...editingExperience,
                      companyName: value,
                    });
                  } else {
                    setNewExperience({ ...newExperience, companyName: value });
                  }
                }}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none focus:border-primary text-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={
                  editingExperience?.position || newExperience.position || ''
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (editingExperience) {
                    setEditingExperience({
                      ...editingExperience,
                      position: value,
                    });
                  } else {
                    setNewExperience({ ...newExperience, position: value });
                  }
                }}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none focus:border-primary text-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={
                  editingExperience?.startDate
                    ? new Date(editingExperience.startDate)
                        .toISOString()
                        .split('T')[0]
                    : newExperience.startDate || ''
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (editingExperience) {
                    setEditingExperience({
                      ...editingExperience,
                      startDate: value,
                    });
                  } else {
                    setNewExperience({ ...newExperience, startDate: value });
                  }
                }}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none focus:border-primary text-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                End Date
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={
                    editingExperience?.endDate
                      ? new Date(editingExperience.endDate)
                          .toISOString()
                          .split('T')[0]
                      : newExperience.endDate || ''
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (editingExperience) {
                      setEditingExperience({
                        ...editingExperience,
                        endDate: value,
                      });
                    } else {
                      setNewExperience({ ...newExperience, endDate: value });
                    }
                    setCurrentlyWorking(false);
                  }}
                  disabled={currentlyWorking}
                  className="flex-1 rounded-xl border border-slate-200 p-2 text-xs focus:outline-none focus:border-primary text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentlyWorking}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setCurrentlyWorking(checked);
                    if (checked) {
                      if (editingExperience) {
                        setEditingExperience({
                          ...editingExperience,
                          endDate: undefined,
                        });
                      } else {
                        setNewExperience({
                          ...newExperience,
                          endDate: undefined,
                        });
                      }
                    }
                  }}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-slate-500">
                  I currently work here
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
              Description
            </label>
            <textarea
              rows={3}
              value={
                editingExperience?.description ||
                newExperience.description ||
                ''
              }
              onChange={(e) => {
                const value = e.target.value;
                if (editingExperience) {
                  setEditingExperience({
                    ...editingExperience,
                    description: value,
                  });
                } else {
                  setNewExperience({ ...newExperience, description: value });
                }
              }}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none focus:border-primary text-slate-700 resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
              Supporting Document
            </label>
            {editingExperience?.documentUrl && (
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-2">
                <span className="material-symbols-outlined text-slate-400 text-[16px]">
                  attachment
                </span>
                <a
                  href={editingExperience.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 font-medium hover:underline truncate"
                >
                  {editingExperience.documentUrl?.split('/').pop() || 'Current attachment'}
                </a>
                <span className="text-[10px] text-slate-400 ml-auto">
                  (upload new to replace)
                </span>
              </div>
            )}
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
              <span className="material-symbols-outlined text-[20px] text-slate-400">
                upload_file
              </span>
              <span className="mt-1 text-xs font-medium text-slate-500">
                Click to upload PDF or image
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setExperienceFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            {experienceFile && (
              <p className="text-xs font-medium text-slate-500">
                {experienceFile.name}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60">
            <button
              type="button"
              onClick={handleCancel}
              disabled={uploading}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-3.5 py-1.5 !text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
              style={{ backgroundColor: PROFILE_THEME.primary }}
            >
              {uploading ? 'Saving...' : 'Save Experience'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <ExperienceDetailModal
        experience={selectedExperience}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </div>
  );
};
