import React from 'react';
import Modal from '@/components/ui/Modal/Modal';
import type { Education } from '@/pages/Candidate/types';

interface EducationDetailModalProps {
  education: Education | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EducationDetailModal: React.FC<EducationDetailModalProps> = ({
  education,
  isOpen,
  onClose,
}) => {
  if (!education) return null;

  const degreeLabels: Record<string, string> = {
    HIGH_SCHOOL: 'High School',
    CERTIFICATE: 'Certificate',
    DIPLOMA: 'Diploma',
    ASSOCIATE: 'Associate Degree',
    BACHELOR: 'Bachelor\'s Degree',
    MASTER: 'Master\'s Degree',
    DOCTORATE: 'Doctorate',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Education Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Degree Badge */}
        <div className="flex items-center justify-center">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-indigo-100 text-indigo-800">
            {degreeLabels[education.degree] || education.degree}
          </span>
        </div>

        {/* Institution */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-900">
            {education.institution}
          </h3>
          <p className="text-lg text-slate-600 mt-1">
            {education.fieldOfStudy}
          </p>
        </div>

        {/* Graduation Year */}
        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-500">
          <span className="material-symbols-outlined text-[18px]">calendar_today</span>
          <span>Class of {education.graduationYear}</span>
        </div>

        {/* Certificate Preview */}
        {education.certificateUrl && (
          <div className="border-t border-slate-200 pt-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
              Certificate / Transcript
            </h4>
            <div className="bg-slate-50 rounded-xl p-4">
              {education.certificateUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={education.certificateUrl}
                  alt="Certificate"
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
                  onClick={() => window.open(education.certificateUrl, '_blank')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  Open in New Tab
                </button>
                <a
                  href={education.certificateUrl}
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

        {/* No Certificate */}
        {!education.certificateUrl && (
          <div className="border-t border-slate-200 pt-6">
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl">
              <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">description_off</span>
              <p className="text-sm text-slate-500">No certificate uploaded</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
