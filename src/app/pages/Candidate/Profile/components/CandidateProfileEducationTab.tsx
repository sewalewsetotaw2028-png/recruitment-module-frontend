import React, { useState } from 'react';
import type { CandidateProfileData, Education } from '@/pages/Candidate/types';
import Modal from '@/components/ui/Modal/Modal';
import { PROFILE_THEME } from './profileTheme';
import { EducationDetailModal } from './EducationDetailModal';

interface CandidateProfileEducationTabProps {
  profile: CandidateProfileData;

  editingEducation: Education | null;

  newEducation: Partial<Education>;

  educationFile: File | null;

  uploading: boolean;

  setEditingEducation: React.Dispatch<React.SetStateAction<Education | null>>;

  setNewEducation: React.Dispatch<React.SetStateAction<Partial<Education>>>;

  setEducationFile: React.Dispatch<React.SetStateAction<File | null>>;

  onAddEducation: () => void;

  onUpdateEducation: () => void;

  onDeleteEducation: (id: string) => void;
}

export const CandidateProfileEducationTab: React.FC<
  CandidateProfileEducationTabProps
> = ({
  profile,

  editingEducation,

  newEducation,

  educationFile,

  uploading,

  setEditingEducation,

  setNewEducation,

  setEducationFile,

  onAddEducation,

  onUpdateEducation,

  onDeleteEducation,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEducation, setSelectedEducation] = useState<Education | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddClick = () => {
    setFormError(null);
    setNewEducation({});
    setEducationFile(null);
    setEditingEducation(null);
    setShowModal(true);
  };

  const handleEditClick = (edu: Education) => {
    setFormError(null);
    setEditingEducation(edu);
    setEducationFile(null);
    setShowModal(true);
  };

  const handleViewClick = (edu: Education) => {
    setSelectedEducation(edu);
    setShowDetailModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEducation) {
      if (
        !editingEducation.institution ||
        !editingEducation.degree ||
        !editingEducation.fieldOfStudy ||
        !editingEducation.graduationYear
      ) {
        setFormError('Please fill in all required fields.');
        return;
      }
      onUpdateEducation();
    } else {
      if (
        !newEducation.institution ||
        !newEducation.degree ||
        !newEducation.fieldOfStudy ||
        !newEducation.graduationYear
      ) {
        setFormError('Please fill in all required fields.');
        return;
      }
      onAddEducation();
    }
    setShowModal(false);
    setFormError(null);
    setEditingEducation(null);
    setNewEducation({});
    setEducationFile(null);
  };

  const handleCancel = () => {
    setShowModal(false);
    setFormError(null);
    setEditingEducation(null);
    setNewEducation({});
    setEducationFile(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Education
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            Add your academic qualifications and certifications.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Education Records
          </div>
          <button
            type="button"
            onClick={handleAddClick}
            className="!text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            style={{ backgroundColor: PROFILE_THEME.primary }}
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Education
          </button>
        </div>

        {/* Education List */}
        {profile.educations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">
              school
            </span>
            <p className="text-sm font-medium text-slate-500">
              No education entries yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {profile.educations.map((edu) => (
              <div
                key={edu.id}
                className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 hover:shadow-md/50 transition-all duration-300 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                    {edu.degree}
                  </span>
                  <h4 className="text-base font-bold text-slate-800 pt-1">
                    {edu.institution}
                  </h4>
                  <p className="text-sm text-slate-600 font-medium">
                    {edu.fieldOfStudy}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 pt-2">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        calendar_today
                      </span>
                      Class of {edu.graduationYear}
                    </span>
                    {edu.certificateUrl && (
                      <a
                        href={edu.certificateUrl}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          download
                        </span>
                        View Certificate
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                  <button
                    type="button"
                    onClick={() => handleViewClick(edu)}
                    className="p-2 text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors focus:outline-none"
                    title="View Details"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      visibility
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditClick(edu)}
                    className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none"
                    title="Edit"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      edit
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteEducation(edu.id)}
                    className="p-2 text-rose-400 hover:text-rose-600 bg-rose-50/50 hover:bg-rose-50 rounded-xl transition-colors focus:outline-none"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      delete
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={showModal}
        onClose={handleCancel}
        title={editingEducation ? 'Edit Education' : 'Add Education'}
        size="xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
              {formError}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
              Institution Name *
            </label>
            <input
              type="text"
              required
              value={
                editingEducation?.institution || newEducation.institution || ''
              }
              onChange={(e) => {
                const value = e.target.value;
                if (editingEducation) {
                  setEditingEducation({
                    ...editingEducation,
                    institution: value,
                  });
                } else {
                  setNewEducation({ ...newEducation, institution: value });
                }
              }}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none focus:border-primary text-slate-700"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
              Degree *
            </label>
            <select
              required
              value={editingEducation?.degree || newEducation.degree || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (editingEducation) {
                  setEditingEducation({ ...editingEducation, degree: value });
                } else {
                  setNewEducation({ ...newEducation, degree: value });
                }
              }}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none focus:border-primary text-slate-700"
            >
              <option value="">Select degree level</option>
              <option value="HIGH_SCHOOL">High School</option>
              <option value="CERTIFICATE">Certificate</option>
              <option value="DIPLOMA">Diploma</option>
              <option value="ASSOCIATE">Associate</option>
              <option value="BACHELOR">Bachelor</option>
              <option value="MASTER">Master</option>
              <option value="DOCTORATE">Doctorate</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Field of Study *
              </label>
              <input
                type="text"
                required
                value={
                  editingEducation?.fieldOfStudy ||
                  newEducation.fieldOfStudy ||
                  ''
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (editingEducation) {
                    setEditingEducation({
                      ...editingEducation,
                      fieldOfStudy: value,
                    });
                  } else {
                    setNewEducation({ ...newEducation, fieldOfStudy: value });
                  }
                }}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none focus:border-primary text-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Graduation Year *
              </label>
              <input
                type="number"
                required
                min="1900"
                max="2100"
                value={
                  editingEducation?.graduationYear ||
                  newEducation.graduationYear ||
                  ''
                }
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (editingEducation) {
                    setEditingEducation({
                      ...editingEducation,
                      graduationYear: Number.isNaN(value) ? 0 : value,
                    });
                  } else {
                    setNewEducation({
                      ...newEducation,
                      graduationYear: Number.isNaN(value) ? undefined : value,
                    });
                  }
                }}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none focus:border-primary text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
              Certificate / Transcript
            </label>
            {editingEducation?.certificateUrl && (
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-2">
                <span className="material-symbols-outlined text-slate-400 text-[16px]">
                  attachment
                </span>
                <a
                  href={editingEducation.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 font-medium hover:underline truncate"
                >
                  Current attachment
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
                onChange={(e) => setEducationFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            {educationFile && (
              <p className="text-xs font-medium text-slate-500">
                {educationFile.name}
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
              {uploading ? 'Saving...' : 'Save Education'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <EducationDetailModal
        education={selectedEducation}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </div>
  );
};
