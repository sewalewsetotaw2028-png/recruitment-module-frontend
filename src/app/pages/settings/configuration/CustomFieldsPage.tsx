import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/common/Toast';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import {
  fetchCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
} from '@/hooks/useCustomFields';
import type {
  CustomField,
  CreateCustomFieldPayload,
  UpdateCustomFieldPayload,
} from '@/hooks/useCustomFields';
import { Modal } from '@/components/ui/Modal';
import { CustomFieldList } from '@/components/config/CustomFieldList';
import { CustomFieldDetail } from '@/components/config/CustomFieldDetail';
import { CustomFieldFormModal } from '@/components/config/CustomFieldFormModal';

const AccessDenied = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-xs max-w-md mx-auto my-12 animate-fade-in text-sm">
    <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200/60 flex items-center justify-center shadow-xs">
      <span className="material-symbols-outlined text-red-500 text-xl">
        lock
      </span>
    </div>
    <div className="space-y-1">
      <h2 className="text-sm font-bold text-slate-900">Access Denied</h2>
      <p className="text-xs font-medium text-slate-500 max-w-xs leading-relaxed">
        You don't have permission to access configuration settings. Contact your
        HR Administrator.
      </p>
    </div>
  </div>
);

export const CustomFieldsPage: React.FC = () => {
  const { can } = usePermissions();
  const { toast } = useToast();
  const canManage = can(PERMISSIONS.CONFIG_MANAGE);
  const canWrite = canManage;

  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [deletingField, setDeletingField] = useState<CustomField | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadFields = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCustomFields();
      setFields(data);
      setSelectedFieldId((current) => {
        if (current && data.some((field) => field.id === current)) {
          return current;
        }
        return data[0]?.id ?? null;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load fields');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null;

  if (!canManage) return <AccessDenied />;

  const handleCreateField = async (
    payload: CreateCustomFieldPayload | UpdateCustomFieldPayload,
  ) => {
    const newField = await createCustomField(
      payload as CreateCustomFieldPayload,
    );
    await loadFields();
    setSelectedFieldId(newField.id);
    toast('Field created successfully', 'success');
  };

  const handleUpdateField = async (
    payload: CreateCustomFieldPayload | UpdateCustomFieldPayload,
  ) => {
    if (!editingField) return;
    await updateCustomField(editingField.id, payload as UpdateCustomFieldPayload);
    await loadFields();
    toast('Field updated successfully', 'success');
  };

  const handleDeleteField = async () => {
    if (!deletingField) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteCustomField(deletingField.id);
      await loadFields();
      setDeletingField(null);
      setDeleteError(null);
      toast('Field deleted', 'success');
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : 'Failed to delete field',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateFieldDetail = async (payload: any) => {
    if (!selectedField) return;
    await updateCustomField(selectedField.id, payload);
    await loadFields();
    toast('Field updated successfully', 'success');
  };

  return (
    <section className="flex flex-col h-full min-h-0 animate-fade-in text-sm overflow-hidden">
      <div className="border-b border-slate-200 px-6 py-5 select-none shrink-0 bg-white">
        <div className="flex items-center gap-3 mb-2">
          <Link
            to="/dashboard/configuration"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-sm transition"
          >
            <span className="material-symbols-outlined text-base">
              arrow_back
            </span>
            Back to Hub
          </Link>
        </div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
          Configuration
        </p>
        <h1 className="text-xl font-extrabold text-slate-800 mt-1 tracking-tight">
          Custom Fields
        </h1>
        <p className="text-slate-500 text-xs font-medium mt-1 leading-normal">
          Configure custom fields for additional data capture on entities.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 mx-6 mt-4 p-4 bg-red-50/60 border border-red-200/60 rounded-xl text-xs text-red-700 animate-fade-in select-none shrink-0">
          <span className="material-symbols-outlined text-red-500 text-lg leading-none">
            error
          </span>
          <span className="font-bold">{error}</span>
          <button
            onClick={loadFields}
            className="ml-auto text-xs font-extrabold text-red-700 underline underline-offset-2 hover:text-red-900 focus:outline-none cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0 gap-0 overflow-hidden">
        <div className="w-[300px] shrink-0 flex flex-col min-h-0 border-r border-slate-200 bg-white">
          <CustomFieldList
            fields={fields}
            selectedFieldId={selectedFieldId}
            loading={loading}
            onSelect={(f) => setSelectedFieldId(f.id)}
            onAdd={() => setShowAddModal(true)}
            onEdit={(f) => setEditingField(f)}
            onDelete={(f) => {
              setDeletingField(f);
              setDeleteError(null);
            }}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-slate-50/30">
          {selectedField ? (
            <CustomFieldDetail
              field={selectedField}
              loading={loading}
              onSave={handleUpdateFieldDetail}
              canWrite={canWrite}
            />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 gap-3 animate-fade-in select-none p-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                <span className="material-symbols-outlined text-2xl">
                  data_object
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400">
                Select a field from the sidebar to edit
              </p>
            </div>
          )}
        </div>
      </div>

      <CustomFieldFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        field={null}
        onSubmit={handleCreateField}
      />

      <CustomFieldFormModal
        isOpen={!!editingField}
        onClose={() => setEditingField(null)}
        field={editingField}
        onSubmit={handleUpdateField}
      />

      <Modal
        isOpen={!!deletingField}
        onClose={() => {
          setDeletingField(null);
          setDeleteError(null);
        }}
        title="Delete Custom Field"
        size="sm"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700 leading-relaxed">
              Delete{' '}
              <span className="font-extrabold text-slate-900">
                {deletingField?.field_name}
              </span>
              ?
            </p>
            <p className="text-xs leading-relaxed text-slate-500">
              This removes the field from configuration and also clears any
              stored values linked to it.
            </p>
          </div>

          {deleteError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200/60 bg-red-50/60 p-3.5 animate-fade-in">
              <span className="material-symbols-outlined mt-0.5 shrink-0 text-base text-red-500">
                error
              </span>
              <p className="text-xs font-semibold leading-relaxed text-red-700">
                {deleteError}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setDeletingField(null);
                setDeleteError(null);
              }}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900 focus:outline-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteField}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete Field'}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default CustomFieldsPage;
