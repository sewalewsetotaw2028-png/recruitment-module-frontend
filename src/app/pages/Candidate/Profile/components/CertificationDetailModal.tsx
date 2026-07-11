import React from 'react';
import Modal from '@/components/ui/Modal/Modal';
import type { Certification } from '@/pages/Candidate/types';

interface CertificationDetailModalProps {
  certification: Certification | null;
  isOpen: boolean;
  onClose: () => void;
}

const degreeLabels: Record<string, string> = {
  HIGH_SCHOOL: 'High School',
  CERTIFICATE: 'Certificate',
  DIPLOMA: 'Diploma',
  ASSOCIATE: 'Associate Degree',
  BACHELOR: "Bachelor's Degree",
  MASTER: "Master's Degree",
  DOCTORATE: 'Doctorate',
};

export const CertificationDetailModal: React.FC<CertificationDetailModalProps> = ({
  certification,
  isOpen,
  onClose,
}) => {
  if (!certification) return null;

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isExpired =
    certification.expiration_date &&
    new Date(certification.expiration_date) < new Date();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Certification Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Name Badge */}
        <div className="flex items-center justify-center">
          <span
            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold"
            style={{
              backgroundColor: isExpired ? '#fef2f2' : '#f0fdfa',
              color: isExpired ? '#dc2626' : '#0d9488',
            }}
          >
            {isExpired ? 'Expired' : 'Active'}
          </span>
        </div>

        {/* Certification Name */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-900">
            {certification.name}
          </h3>
          {certification.issuing_organization && (
            <p className="text-base text-slate-600 mt-1 font-medium">
              {certification.issuing_organization}
            </p>
          )}
        </div>

        {/* Dates */}
        <div className="flex flex-col items-center gap-2">
          {certification.issue_date && (
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              <span>Issued: {formatDate(certification.issue_date)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <span className="material-symbols-outlined text-[18px]">
              {certification.expiration_date ? 'schedule' : 'check_circle'}
            </span>
            <span>
              {certification.expiration_date
                ? `Expires: ${formatDate(certification.expiration_date)}`
                : 'No Expiration — Never Expires'}
            </span>
          </div>
        </div>

        {/* Credential ID */}
        {certification.credential_id && (
          <div className="border-t border-slate-200 pt-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
              Credential ID
            </h4>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-700 font-mono">
                {certification.credential_id}
              </p>
            </div>
          </div>
        )}

        {/* Credential URL */}
        {certification.credential_url && (
          <div className="border-t border-slate-200 pt-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
              Credential URL
            </h4>
            <div className="bg-slate-50 rounded-xl p-4 flex justify-center">
              <a
                href={certification.credential_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                View Credential
              </a>
            </div>
          </div>
        )}

        {/* No links */}
        {!certification.credential_id && !certification.credential_url && (
          <div className="border-t border-slate-200 pt-6">
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl">
              <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">link_off</span>
              <p className="text-sm text-slate-500">No credential links or IDs attached</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
