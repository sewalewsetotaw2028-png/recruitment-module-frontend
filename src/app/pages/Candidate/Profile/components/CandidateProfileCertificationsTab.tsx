import React, { useState } from 'react';
import type {
  CandidateProfileData,
  Certification,
} from '@/pages/Candidate/types';
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import { useToast } from '@/components/common/Toast';
import { useAppDispatch } from '@/hooks';
import Modal from '@/components/ui/Modal/Modal';
import { candidateProfileActions } from '../slice';
import { PROFILE_THEME } from './profileTheme';
import { CertificationDetailModal } from './CertificationDetailModal';

interface CandidateProfileCertificationsTabProps {
  profile: CandidateProfileData;
}

export const CandidateProfileCertificationsTab: React.FC<
  CandidateProfileCertificationsTabProps
> = ({ profile }) => {
  const { toast, dismiss } = useToast();
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);

  // Forms management
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [pendingDeleteCertId, setPendingDeleteCertId] = useState<string | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [issuingOrg, setIssuingOrg] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expDate, setExpDate] = useState('');
  const [credId, setCredId] = useState('');
  const [credUrl, setCredUrl] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const uploadCertificationAttachment = async (file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('document_type', 'certificate');
    const response = (await makeCall({
      method: 'POST',
      route: API_ROUTES.candidates.documents,
      body: formData,
      isSecureRoute: true,
    })) as any;
    const payload = response?.data?.data ?? response?.data ?? response;
    const url = payload?.uploaded_url || payload?.fileUrl || payload?.url;
    if (!url) {
      throw new Error('Certificate upload did not return a file URL.');
    }
    return String(url);
  };

  const resetForm = () => {
    setName('');
    setIssuingOrg('');
    setIssueDate('');
    setExpDate('');
    setCredId('');
    setCredUrl('');
    setAttachmentFile(null);
    setEditingCert(null);
    setShowAddForm(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToastId = toast('Saving certification...', 'info', {
      isLoading: true,
      duration: null,
    });
    setSubmitting(true);
    setShowAddForm(false);

    try {
      let uploadedUrl = credUrl;
      if (attachmentFile) {
        uploadedUrl = await uploadCertificationAttachment(attachmentFile);
      }
      await makeCall({
        method: 'POST',
        route: API_ROUTES.candidates.certification,
        isSecureRoute: true,
        body: {
          name,
          issuing_organization: issuingOrg || undefined,
          issue_date: issueDate || undefined,
          expiration_date: expDate || undefined,
          credential_id: credId || undefined,
          credential_url: uploadedUrl || undefined,
        },
      });
      if (loadingToastId) {
        dismiss(loadingToastId);
      }
      toast('Certification added successfully.', 'success');
      resetForm();
      dispatch(candidateProfileActions.fetchProfileRequest());
    } catch (err: any) {
      if (loadingToastId) {
        dismiss(loadingToastId);
      }
      toast(err?.message || 'Failed to add certification.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCert) return;
    const loadingToastId = toast('Saving certification...', 'info', {
      isLoading: true,
      duration: null,
    });
    setSubmitting(true);
    setEditingCert(null);
    setShowAddForm(false);

    try {
      let uploadedUrl = credUrl;
      if (attachmentFile) {
        uploadedUrl = await uploadCertificationAttachment(attachmentFile);
      }
      await makeCall({
        method: 'PATCH',
        route: API_ROUTES.candidates.certificationById(editingCert.id),
        isSecureRoute: true,
        body: {
          name,
          issuing_organization: issuingOrg || undefined,
          issue_date: issueDate || undefined,
          expiration_date: expDate || undefined,
          credential_id: credId || undefined,
          credential_url: uploadedUrl || undefined,
        },
      });
      if (loadingToastId) {
        dismiss(loadingToastId);
      }
      toast('Certification updated successfully.', 'success');
      resetForm();
      dispatch(candidateProfileActions.fetchProfileRequest());
    } catch (err: any) {
      if (loadingToastId) {
        dismiss(loadingToastId);
      }
      toast(err?.message || 'Failed to update certification.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (certId: string) => {
    try {
      setSubmitting(true);
      await makeCall({
        method: 'DELETE',
        route: API_ROUTES.candidates.certificationById(certId),
        isSecureRoute: true,
      });
      toast('Certification deleted.', 'info');
      dispatch(candidateProfileActions.fetchProfileRequest());
    } catch (err: any) {
      toast(err?.message || 'Failed to delete certification.', 'error');
    } finally {
      setSubmitting(false);
      setPendingDeleteCertId(null);
    }
  };

  const handleViewClick = (cert: Certification) => {
    setSelectedCert(cert);
    setShowDetailModal(true);
  };

  const startEdit = (cert: Certification) => {
    setEditingCert(cert);
    setName(cert.name);
    setIssuingOrg(cert.issuing_organization || '');
    setIssueDate(
      cert.issue_date
        ? new Date(cert.issue_date).toISOString().split('T')[0]
        : '',
    );
    setExpDate(
      cert.expiration_date
        ? new Date(cert.expiration_date).toISOString().split('T')[0]
        : '',
    );
    setCredId(cert.credential_id || '');
    setCredUrl(cert.credential_url || '');
    setAttachmentFile(null);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Certifications
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            Display your professional credentials, course achievements, and
            licenses.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Certification Records
          </div>
          {!showAddForm && !editingCert && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="!text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              style={{ backgroundColor: PROFILE_THEME.primary }}
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Add Certification
            </button>
          )}
        </div>

        {/* Certifications List */}
        {!showAddForm && !editingCert && (
          <div className="space-y-3">
            {!profile.certifications || profile.certifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">
                  workspace_premium
                </span>
                <p className="text-sm font-medium text-slate-500">
                  No certifications listed yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {profile.certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex flex-col justify-between p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-all duration-200 group"
                    style={{ borderColor: PROFILE_THEME.primaryBorder }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-slate-800 text-sm truncate">
                          {cert.name}
                        </h4>
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleViewClick(cert)}
                            className="p-1 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                            title="View Details"
                          >
                            <span className="material-symbols-outlined text-[15px] block">
                              visibility
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(cert)}
                            className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          >
                            <span className="material-symbols-outlined text-[15px] block">
                              edit
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteCertId(cert.id)}
                            className="p-1 hover:bg-slate-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          >
                            <span className="material-symbols-outlined text-[15px] block">
                              delete
                            </span>
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-400 text-xs font-semibold">
                        {cert.issuing_organization}
                      </p>

                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400 font-medium font-mono pt-1">
                        {cert.issue_date && (
                          <span>
                            Issued:{' '}
                            {new Date(cert.issue_date).toLocaleDateString()}
                          </span>
                        )}
                        <span>
                          {cert.expiration_date
                            ? `Expires: ${new Date(cert.expiration_date).toLocaleDateString()}`
                            : 'No Expiration'}
                        </span>
                      </div>

                      {cert.credential_id && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          ID: {cert.credential_id}
                        </p>
                      )}
                    </div>

                    {cert.credential_url && (
                      <div className="pt-3 border-t border-slate-100 mt-3 flex justify-end">
                        <a
                          href={cert.credential_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold hover:underline flex items-center gap-1"
                          style={{ color: PROFILE_THEME.primary }}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            link
                          </span>
                          View Credential
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={showAddForm || Boolean(editingCert)}
        onClose={resetForm}
        title={editingCert ? 'Edit Certification' : 'Add Certification'}
        size="xl"
      >
        {(showAddForm || editingCert) && (
          <form
            onSubmit={editingCert ? handleUpdate : handleAdd}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  Certification Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none focus:border-primary text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  Issuing Organization
                </label>
                <input
                  type="text"
                  value={issuingOrg}
                  onChange={(e) => setIssuingOrg(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none focus:border-primary text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none focus:border-primary text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none focus:border-primary text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  Credential ID
                </label>
                <input
                  type="text"
                  value={credId}
                  onChange={(e) => setCredId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none focus:border-primary text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  Credential URL
                </label>
                <input
                  type="url"
                  value={credUrl}
                  onChange={(e) => setCredUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none focus:border-primary text-slate-700"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  Upload Certificate File
                </label>
                {editingCert?.credential_url && (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-2">
                    <span className="material-symbols-outlined text-slate-400 text-[16px]">
                      attachment
                    </span>
                    <a
                      href={editingCert.credential_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 font-medium hover:underline truncate"
                    >
                      {editingCert.name || 'Current attachment'}
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
                    onChange={(e) =>
                      setAttachmentFile(e.target.files?.[0] || null)
                    }
                    className="hidden"
                  />
                </label>
                {attachmentFile && (
                  <p className="text-xs font-medium text-slate-500">
                    {attachmentFile.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60">
              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-3.5 py-1.5 !text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                style={{ backgroundColor: PROFILE_THEME.primary }}
              >
                {submitting ? 'Saving...' : 'Save Certification'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Detail Modal */}
      <CertificationDetailModal
        certification={selectedCert}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />

      <Modal
        isOpen={Boolean(pendingDeleteCertId)}
        onClose={() => setPendingDeleteCertId(null)}
        title="Delete Certification"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This will remove the certification from your profile.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPendingDeleteCertId(null)}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                pendingDeleteCertId && handleDelete(pendingDeleteCertId)
              }
              className="px-3.5 py-1.5 !text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
              style={{ backgroundColor: PROFILE_THEME.primary }}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
