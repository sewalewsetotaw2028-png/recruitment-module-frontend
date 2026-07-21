import React, { useRef, useState, useEffect } from 'react';
import type { CandidateProfileData } from '@/pages/Candidate/types';
import { PROFILE_THEME } from './profileTheme';
import Modal from '@/components/ui/Modal/Modal';
import { API_ROUTES } from '@/API/apiRoutes';
import { extractTextFromPdf, parseCvText } from '../utils/cvExtractor';
import type { ExtractedProfile } from '../utils/cvExtractor';

// Build an authenticated proxy URL for viewing a document through the backend
const buildViewUrl = (rawUrl: string): string => {
  if (!rawUrl) return rawUrl;
  const base = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token') || '';
  const proxyPath = `${base}${API_ROUTES.candidates.viewDocument(rawUrl)}`;
  return token ? `${proxyPath}&token=${encodeURIComponent(token)}` : proxyPath;
};

// ─── PDF Canvas Viewer ────────────────────────────────────────────────────────
// Renders a PDF directly with pdfjs-dist on a <canvas> — no iframe, no external service
interface PdfCanvasViewerProps { url: string; }

const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({ url }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pdfRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.mjs',
          import.meta.url,
        ).toString();

        // Suppress verbose pdfjs console output — only show real errors
        (pdfjs as any).GlobalWorkerOptions.verbosity = 0;

        const pdf = await pdfjs.getDocument({ url }).promise;
        if (cancelled) return;
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err: any) {
        if (!cancelled) {
          // Show a clean message — don't expose the full URL or token in the UI
          setError('Could not load PDF. Please try again.');
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  // Render the current page whenever page number or pdf changes
  useEffect(() => {
    if (!pdfRef.current || !canvasRef.current || loading) return;

    (async () => {
      try {
        // Cancel any in-progress render
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        const page = await pdfRef.current.getPage(currentPage);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const task = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = task;
        await task.promise;
        renderTaskRef.current = null;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('[PdfCanvasViewer] render error:', err);
        }
      }
    })();
  }, [currentPage, loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
        <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
        <p className="text-sm">Loading PDF…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2 text-rose-600 text-sm">
        <span className="material-symbols-outlined text-3xl">error</span>
        <p className="font-semibold">Could not load PDF</p>
        <p className="text-xs text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Page navigation */}
      {numPages > 1 && (
        <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition text-xs"
          >
            ← Prev
          </button>
          <span className="text-xs">Page {currentPage} of {numPages}</span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage === numPages}
            className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition text-xs"
          >
            Next →
          </button>
        </div>
      )}
      {/* PDF canvas */}
      <div className="w-full overflow-auto max-h-[65vh] rounded-xl border border-slate-200 bg-slate-50">
        <canvas
          ref={canvasRef}
          className="mx-auto block"
          style={{ maxWidth: '100%' }}
        />
      </div>
    </div>
  );
};

interface CandidateProfileDocumentsTabProps {
  profile: CandidateProfileData;
  onUpload: (file: File, documentType: string) => void;
  onDelete: (id: string) => void;
  uploading: boolean;
  onCvExtracted?: (data: ExtractedProfile) => void;
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
> = ({ profile, onUpload, onDelete, uploading, onCvExtracted }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = React.useState('cv');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractMsg, setExtractMsg] = useState<string | null>(null);
  // Extracted CV data awaiting user review before apply
  const [extractedData, setExtractedData] = useState<ExtractedProfile | null>(null);
  const [showExtractModal, setShowExtractModal] = useState(false);

  // Filter documents by the currently selected document type (or show all)
  const isAllMode = documentType === 'all';
  const filteredDocuments = isAllMode
    ? profile.documents
    : profile.documents.filter((doc) => doc.documentType === documentType);

  // States handling the dynamic inline document previews
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');
  // Track whether the original file is a PDF or image (proxy URL loses extension)
  const [previewType, setPreviewType] = useState<'pdf' | 'image' | 'other'>('other');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadError(null);
      const file = e.target.files[0];
      try {
        onUpload(file, documentType);
        e.target.value = '';
      } catch (err: any) {
        setUploadError(err?.message || 'Failed to upload document. Please try again.');
        return;
      }

      // Auto-extract text from CV PDFs
      if (documentType === 'cv' && file.type === 'application/pdf' && onCvExtracted) {
        setExtracting(true);
        setExtractMsg(null);
        try {
          const text = await extractTextFromPdf(file);
          console.log('[cvExtractor] raw text length:', text.length, 'preview:', text.slice(0, 300));
          if (text.trim().length > 50) {
            const extracted = parseCvText(text);
            console.log('[cvExtractor] extracted:', extracted);
            setExtractedData(extracted);
            setShowExtractModal(true);
            setExtractMsg(null);
          } else {
            setExtractMsg('CV uploaded. Could not extract enough text — please fill fields manually.');
          }
        } catch (err) {
          console.warn('[cvExtractor] extraction failed:', err);
          setExtractMsg('CV uploaded. Auto-fill not available for this file.');
        } finally {
          setExtracting(false);
        }
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
    const lower = url.toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].some((ext) => lower.includes(ext));

    if (isImage) {
      setPreviewType('image');
      setPreviewUrl(url);
      setPreviewName(name);
    } else {
      // Use the backend proxy URL — Cloudinary raw URLs block CORS fetch from the browser.
      // The proxy follows redirects and adds Access-Control-Allow-Origin: * so pdfjs can load it.
      setPreviewType('pdf');
      setPreviewUrl(buildViewUrl(url));
      setPreviewName(name);
    }
  };

  const renderPreviewContent = () => {
    if (!previewUrl) return null;

    if (previewType === 'image') {
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

    if (previewType === 'pdf') {
      return <PdfCanvasViewer url={previewUrl} />;
    }

    return null;
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
          {!isAllMode && documentType === 'cv' && (
            <p className="text-[10px] text-indigo-500 mt-1.5 leading-relaxed max-w-56 font-medium">
              Uploading a PDF CV will auto-fill your profile fields.
            </p>
          )}
        </div>
      </div>

      {/* Auto-fill status banner */}
      {extracting && (
        <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700 font-medium">
          <span className="material-symbols-outlined text-sm animate-spin">sync</span>
          Extracting profile data from your CV…
        </div>
      )}
      {extractMsg && !extracting && (
        <div className={`flex items-start gap-2 p-3 rounded-xl text-xs font-medium border ${
          extractMsg.startsWith('Profile fields') 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          <span className="material-symbols-outlined text-sm shrink-0">
            {extractMsg.startsWith('Profile fields') ? 'auto_awesome' : 'info'}
          </span>
          <span>{extractMsg}</span>
          <button type="button" onClick={() => setExtractMsg(null)} className="ml-auto shrink-0">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

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
                  className="inline-flex items-center justify-center px-3 py-1.5 bg-indigo-500 hover:bg-indigo-700 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-lg border border-indigo-200 transition-all focus:outline-none cursor-pointer"
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
          setPreviewType('other');
        }}
        title={`Review Asset: ${previewName}`}
        size="lg"
      >
        <div className="space-y-4">
          {renderPreviewContent()}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setPreviewUrl(null);
                setPreviewName('');
                setPreviewType('other');
              }}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-medium rounded-xl transition-colors"
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

      {/* CV Extraction Review Modal */}
      {showExtractModal && extractedData && (
        <Modal
          isOpen={showExtractModal}
          onClose={() => { setShowExtractModal(false); setExtractedData(null); }}
          title="CV Auto-Fill Preview"
          size="lg"
        >
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 flex items-start gap-2">
              <span className="material-symbols-outlined text-sm shrink-0">auto_awesome</span>
              <span>We extracted the following fields from your CV. Click <strong>Apply</strong> to auto-fill your profile, or <strong>Cancel</strong> to skip.</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs max-h-[55vh] overflow-y-auto pr-1">
              {extractedData.firstName && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">First Name</p>
                  <p className="font-semibold text-slate-800">{extractedData.firstName}</p>
                </div>
              )}
              {extractedData.lastName && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Last Name</p>
                  <p className="font-semibold text-slate-800">{extractedData.lastName}</p>
                </div>
              )}
              {extractedData.email && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Email</p>
                  <p className="font-semibold text-slate-800 truncate">{extractedData.email}</p>
                </div>
              )}
              {extractedData.phone && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Phone</p>
                  <p className="font-semibold text-slate-800">{extractedData.phone}</p>
                </div>
              )}
              {extractedData.gender && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Gender</p>
                  <p className="font-semibold text-slate-800">{extractedData.gender}</p>
                </div>
              )}
              {extractedData.dateOfBirth && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Date of Birth</p>
                  <p className="font-semibold text-slate-800">{extractedData.dateOfBirth}</p>
                </div>
              )}
              {extractedData.nationality && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Nationality</p>
                  <p className="font-semibold text-slate-800">{extractedData.nationality}</p>
                </div>
              )}
              {extractedData.currentAddress && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Address</p>
                  <p className="font-semibold text-slate-800">{extractedData.currentAddress}</p>
                </div>
              )}
              {extractedData.currentEmployer && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Current Employer</p>
                  <p className="font-semibold text-slate-800">{extractedData.currentEmployer}</p>
                </div>
              )}
              {extractedData.currentPosition && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Current Position</p>
                  <p className="font-semibold text-slate-800">{extractedData.currentPosition}</p>
                </div>
              )}
              {extractedData.yearsOfExperience != null && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Years of Experience</p>
                  <p className="font-semibold text-slate-800">{extractedData.yearsOfExperience}</p>
                </div>
              )}
              {extractedData.expectedSalary != null && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Expected Salary</p>
                  <p className="font-semibold text-slate-800">{extractedData.expectedSalary.toLocaleString()}</p>
                </div>
              )}
              {extractedData.preferredLocation && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Preferred Location</p>
                  <p className="font-semibold text-slate-800">{extractedData.preferredLocation}</p>
                </div>
              )}
              {extractedData.preferredJobCategory && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Preferred Category</p>
                  <p className="font-semibold text-slate-800">{extractedData.preferredJobCategory}</p>
                </div>
              )}
              {extractedData.availabilityStatus && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Availability</p>
                  <p className="font-semibold text-slate-800">{extractedData.availabilityStatus.replace(/_/g, ' ')}</p>
                </div>
              )}
              {extractedData.portfolioUrl && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Portfolio / Website</p>
                  <p className="font-semibold text-slate-800 truncate">{extractedData.portfolioUrl}</p>
                </div>
              )}
              {extractedData.summary && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Professional Summary</p>
                  <p className="text-slate-700 text-[11px] leading-relaxed line-clamp-3">{extractedData.summary}</p>
                </div>
              )}
              {extractedData.skills && extractedData.skills.length > 0 && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Skills ({extractedData.skills.length})</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {extractedData.skills.slice(0, 20).map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-medium">{s}</span>
                    ))}
                    {extractedData.skills.length > 20 && <span className="text-[10px] text-slate-400">+{extractedData.skills.length - 20} more</span>}
                  </div>
                </div>
              )}
              {extractedData.languages && extractedData.languages.length > 0 && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Languages ({extractedData.languages.length})</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {extractedData.languages.map((l, i) => (
                      <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-medium">{l}</span>
                    ))}
                  </div>
                </div>
              )}
              {extractedData.experiences && extractedData.experiences.length > 0 && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Work Experience ({extractedData.experiences.length})</p>
                  {extractedData.experiences.map((e, i) => (
                    <p key={i} className="text-slate-700 text-[11px] mt-0.5">• {e.position} at {e.companyName} ({e.startDate}{e.endDate ? ` – ${e.endDate}` : ' – Present'})</p>
                  ))}
                </div>
              )}
              {extractedData.educations && extractedData.educations.length > 0 && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Education ({extractedData.educations.length})</p>
                  {extractedData.educations.map((e, i) => (
                    <p key={i} className="text-slate-700 text-[11px] mt-0.5">• {e.degree}{e.fieldOfStudy ? ` in ${e.fieldOfStudy}` : ''} — {e.institution}{e.graduationYear ? ` (${e.graduationYear})` : ''}</p>
                  ))}
                </div>
              )}
              {extractedData.certifications && extractedData.certifications.length > 0 && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Certifications ({extractedData.certifications.length})</p>
                  {extractedData.certifications.map((c, i) => (
                    <p key={i} className="text-slate-700 text-[11px] mt-0.5">• {c.name}{c.issuingOrganization ? ` — ${c.issuingOrganization}` : ''}</p>
                  ))}
                </div>
              )}
              {/* Nothing extracted at all */}
              {!extractedData.firstName && !extractedData.email && !extractedData.currentPosition &&
               !extractedData.skills?.length && !extractedData.experiences?.length && !extractedData.educations?.length && (
                <div className="col-span-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  <p className="font-semibold mb-1">No structured data could be extracted from this PDF.</p>
                  <p>This can happen if the CV is image-based (scanned), uses complex formatting, or is a secured PDF. Please fill in your profile fields manually.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowExtractModal(false); setExtractedData(null); }}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onCvExtracted && extractedData) {
                    onCvExtracted(extractedData);
                    setExtractMsg('Profile fields queued for auto-fill. They will be applied after the upload completes.');
                  }
                  setShowExtractModal(false);
                  setExtractedData(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
              >
                Apply to Profile
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
