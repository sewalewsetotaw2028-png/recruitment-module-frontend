import React from 'react';
import Modal from '@/components/ui/Modal/Modal';
import type { Experience } from '@/pages/Candidate/types';

interface ExperienceDetailModalProps {
  experience: Experience | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExperienceDetailModal: React.FC<ExperienceDetailModalProps> = ({
  experience,
  isOpen,
  onClose,
}) => {
  if (!experience) return null;

  const startDate = new Date(experience.startDate);
  const endDate = experience.endDate ? new Date(experience.endDate) : new Date();
  
  // Calculate duration in months
  const totalMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  const formatDuration = () => {
    if (years > 0 && months > 0) {
      return `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
    } else if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''}`;
    }
    return 'Less than a month';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Work Experience Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Company Badge */}
        <div className="flex items-center justify-center">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-slate-100 text-slate-800">
            {experience.companyName}
          </span>
        </div>

        {/* Position */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-900">
            {experience.position}
          </h3>
        </div>

        {/* Duration */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            <span>
              {startDate.toLocaleDateString()} — {endDate ? endDate.toLocaleDateString() : 'Present'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>{formatDuration()}</span>
          </div>
        </div>

        {/* Description */}
        {experience.description && (
          <div className="border-t border-slate-200 pt-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
              Description
            </h4>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {experience.description}
              </p>
            </div>
          </div>
        )}

        {/* Document Preview */}
        {experience.documentUrl && (
          <div className="border-t border-slate-200 pt-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
              Supporting Document
            </h4>
            <div className="bg-slate-50 rounded-xl p-4">
              {experience.documentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={experience.documentUrl}
                  alt="Document"
                  className="max-w-full max-h-96 mx-auto rounded-lg border border-slate-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : (
                <div className="hidden text-center py-8">
                  <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">description</span>
                  <p className="text-sm text-slate-500">Document preview not available</p>
                </div>
              )}
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => window.open(experience.documentUrl, '_blank')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  Open in New Tab
                </button>
                <a
                  href={experience.documentUrl}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Download
                </a>
              </div>
            </div>
          </div>
        )}

        {/* No Document */}
        {!experience.documentUrl && (
          <div className="border-t border-slate-200 pt-6">
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl">
              <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">description_off</span>
              <p className="text-sm text-slate-500">No supporting document uploaded</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
