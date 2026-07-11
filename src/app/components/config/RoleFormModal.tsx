import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type {
  AppRole,
  CreateRolePayload,
  UpdateRolePayload,
} from '@/hooks/useRolesConfig';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: AppRole | null; // null = create mode, defined = edit mode
  onSubmit: (payload: CreateRolePayload | UpdateRolePayload) => Promise<void>;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_]/g, '')
    .replace(/\s+/g, '_');
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  onClose,
  role,
  onSubmit,
}) => {
  const isEditMode = !!role;

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate fields when modal opens or role changes
  useEffect(() => {
    if (isOpen) {
      setName(role?.name ?? '');
      setSlug(role?.slug ?? '');
      setDescription(role?.description ?? '');
      setSlugTouched(false);
      setError(null);
    }
  }, [isOpen, role]);

  // Auto-generate slug from name unless user has manually edited it
  useEffect(() => {
    if (!slugTouched && !isEditMode) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      if (isEditMode) {
        const payload: UpdateRolePayload = {
          name: name.trim(),
          description: description.trim() || undefined,
        };
        await onSubmit(payload);
      } else {
        const payload: CreateRolePayload = {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
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

  const slugReadOnly = isEditMode && (role?.is_system ?? false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Role' : 'Add New Role'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        {/* Name */}
        <div>
          <label
            htmlFor="role-name"
            className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1.5 select-none"
          >
            Role Name <span className="text-red-500">*</span>
          </label>
          <input
            id="role-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Senior Recruiter"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-xs text-xs"
          />
        </div>

        {/* Slug */}
        <div>
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
            <label
              htmlFor="role-slug"
              className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide select-none"
            >
              Slug
            </label>
            {slugReadOnly && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/60 uppercase tracking-wider">
                Locked for system roles
              </span>
            )}
          </div>
          <input
            id="role-slug"
            type="text"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
            }}
            readOnly={slugReadOnly}
            placeholder="e.g. senior_recruiter"
            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all shadow-xs focus:outline-none ${
              slugReadOnly
                ? 'bg-slate-50/80 border-slate-200 text-slate-400 cursor-not-allowed select-none'
                : 'border-slate-200 bg-white text-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600'
            }`}
          />
          {!slugReadOnly && (
            <p className="mt-1.5 text-[11px] font-medium text-slate-400 leading-normal">
              Auto-generated from name. Only lowercase letters, numbers, and
              underscores.
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="role-description"
            className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1.5 select-none"
          >
            Description
          </label>
          <textarea
            id="role-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional: describe what this role is responsible for…"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-xs resize-none text-xs leading-relaxed"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50/60 border border-red-200/60 rounded-xl animate-fade-in">
            <span className="material-symbols-outlined text-red-500 text-base shrink-0 mt-0.5">
              error
            </span>
            <p className="text-xs text-red-700 font-semibold leading-relaxed">
              {error}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs focus:outline-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="role-form-submit"
            type="submit"
            disabled={submitting || !name.trim()}
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
              'Update Role'
            ) : (
              'Create Role'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RoleFormModal;
