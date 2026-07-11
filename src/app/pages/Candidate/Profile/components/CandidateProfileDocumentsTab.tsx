import React, { useRef, useState } from 'react';
import type { CandidateProfileData } from '@/pages/Candidate/types';
import { PROFILE_THEME } from './profileTheme';
import Modal from '@/components/ui/Modal/Modal';

interface CandidateProfileDocumentsTabProps {
  profile: CandidateProfileData;
  onUpload: (file: File, documentType: string) => void;
  onDelete: (id: string) => void;
  uploading: boolean;
}

const DOCUMENT_TYPES = [
  { value: 'all', label: 'All Documents' },
  { value: 'cv', label: 'CV / Resume' },
  { value: 'photo', label: 'Profile Photo' },
  { value: 'id_documents', label: 'ID Document' },
];

const ID_HELPER_TEXT = 'Accepted ID types: Passport, National ID, Kebele ID, Driving License, or any government-issued identification.';

const DOCUMENT_TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  cv:           { label: 'CV / Resume',   color: '#6366f1', bg: '#eef2ff' },
  photo:        { label: 'Profile Photo', color: '#ec4899', bg: '#fdf2f8' },
  id_documents: { label: 'ID Document',   color: '#ef4444', bg: '#fef2f2' },
};

export const CandidateProfileDocumentsTab: React.FC<
  CandidateProfileDocumentsTabProps
> = ({ profile, onUpload, onDelete, uploading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = React.useState('cv');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const isAllMode = documentType === 'all';

  // Filter documents by the currently selected document type (or show all)
  const filteredDocuments = isAllMode
    ? profile.documents
    : profile.documents.filter((doc) => doc.documentType === documentType);

  // States handling the dynamic inline document previews
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadError(null);
      try {
        onUpload(e.target.files[0], documentType);
        e.target.value = '';
      } catch (err: any) {
        setUploadError(err?.message || 'Failed to upload document. Please try again.');
      }
    }
  };

  const handleDelete = (docId: string) => {
    setDeleteError(null);
    try {
      onDelete(docId);
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete document. Please try again.');
    }
  };

  const handleViewFile = (url: string, name: string) => {
    const lowerUrl = url.toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].some((ext) => lowerUrl.endsWith(ext));
    const isPdf = lowerUrl.endsWith('.pdf');

    if (isImage || isPdf) {
      setPreviewUrl(url);
      setPreviewName(name);
    } else {
      // Safe fallback for raw files that browsers can't preview inline (e.g., .docx, .zip)
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const renderPreviewContent = () => {
    if (!previewUrl) return null;
    const lowerUrl = previewUrl.toLowerCase();

    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].some((ext) => lowerUrl.endsWith(ext))) {
      return (
        <div className="flex justify-center items-center bg-slate-50 p-4 rounded-xl max-h-[70vh] overflow-y-auto">
          <img
            src={previewUrl}
            alt={previewName}
            className="max-w-full h-auto object-contain rounded-lg shadow-sm"
          />
        </div>
      );
    }

    if (lowerUrl.endsWith('.pdf')) {
      return (
        <iframe
          src={previewUrl}
          title={previewName}
          className="w-full h-[70vh] rounded-xl border border-slate-200"
        />
      );
    }

    return <p className="text-sm text-slate-500">Preview mapping unavailable for this file format.</p>;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Documents
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Upload and manage your CV, profile photo, and ID documents.
          </p>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full sm:w-56 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:border-primary mb-3"
            disabled={uploading}
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => !isAllMode && fileInputRef.current?.click()}
            disabled={uploading || isAllMode}
            className={`disabled:opacity-50 !text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${
              isAllMode ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            style={{ backgroundColor: PROFILE_THEME.primary }}
          >
            <span className="material-symbols-outlined text-[16px]">upload</span>
            {uploading
              ? 'Uploading...'
              : isAllMode
                ? 'Select a category to upload'
                : 'Upload Document'}
          </button>
          {isAllMode && (
            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed max-w-56">
              Select a specific document type from the dropdown above to enable uploads.
            </p>
          )}
          {!isAllMode && documentType === 'id_documents' && (
            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed max-w-56">
              {ID_HELPER_TEXT}
            </p>
          )}
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <svg
            className="w-8 h-8 text-slate-400 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm font-medium text-slate-500">
            No documents uploaded yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-all duration-200 group"
              style={{ borderColor: 'var(--color-primary-100, #d4e3ff)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: PROFILE_THEME.primaryLighter,
                    color: PROFILE_THEME.primary,
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-slate-700 truncate group-hover:text-slate-900 transition-colors">
                    {doc.name}
                  </span>
                  <span
                    className="inline-flex self-start mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full"
                    style={{
                      color: DOCUMENT_TYPE_META[doc.documentType]?.color || '#64748b',
                      backgroundColor: DOCUMENT_TYPE_META[doc.documentType]?.bg || '#f1f5f9',
                    }}
                  >
                    {DOCUMENT_TYPE_META[doc.documentType]?.label || doc.documentType}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleViewFile(doc.fileUrl, doc.name)}
                  className="inline-flex items-center justify-center px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-lg border border-slate-200 transition-all focus:outline-none cursor-pointer"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.fileUrl)}
                  className="inline-flex items-center justify-center p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-all focus:outline-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dynamic Asset Preview Modal */}
      <Modal
        isOpen={Boolean(previewUrl)}
        onClose={() => {
          setPreviewUrl(null);
          setPreviewName('');
        }}
        title={`Review Asset: ${previewName}`}
        size="lg"
      >
        <div className="space-y-4">
          {renderPreviewContent()}
          <div className="flex justify-end gap-2">
            <a
              href={previewUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              Open in new tab
            </a>
            <button
              type="button"
              onClick={() => {
                setPreviewUrl(null);
                setPreviewName('');
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Upload Error Modal */}
      <Modal
        isOpen={Boolean(uploadError)}
        onClose={() => setUploadError(null)}
        title="Upload Error"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{uploadError}</p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Error Modal */}
      <Modal
        isOpen={Boolean(deleteError)}
        onClose={() => setDeleteError(null)}
        title="Delete Error"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{deleteError}</p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setDeleteError(null)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
