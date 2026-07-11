import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/common/Toast';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import {
  fetchNotificationTemplates,
  fetchNotificationTemplateById,
  fetchNotificationVariables,
  previewNotificationTemplateByType,
  saveNotificationTemplateByType,
} from '@/hooks/useNotificationTemplates';
import type {
  NotificationTemplate,
  NotificationTemplateSavePayload,
  NotificationVariable,
} from '@/hooks/useNotificationTemplates';
import { NotificationTemplateList } from '@/components/config/NotificationTemplateList';
import { NotificationTemplateDetail } from '@/components/config/NotificationTemplateDetail';

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

export const NotificationTemplatesPage: React.FC = () => {
  const { can } = usePermissions();
  const { toast } = useToast();

  if (!can(PERMISSIONS.CONFIG_MANAGE)) return <AccessDenied />;
  const canWrite = can(PERMISSIONS.CONFIG_MANAGE);

  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [variablesByType, setVariablesByType] = useState<
    Record<string, NotificationVariable[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [variablesLoading, setVariablesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotificationTemplates();
      setTemplates(data.templates);
      setSelectedTemplateId((current) => {
        if (current && data.templates.some((template) => template.id === current)) {
          return current;
        }
        return data.templates[0]?.id ?? null;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadVariables = useCallback(async () => {
    setVariablesLoading(true);
    try {
      const data = await fetchNotificationVariables();
      setVariablesByType(data.groupedByType);
    } catch {
      // Variables are a helpful editor aid, not a hard blocker for the page.
      setVariablesByType({});
    } finally {
      setVariablesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
    loadVariables();
  }, [loadTemplates, loadVariables]);

  const selectedTemplate =
    templates.find((t) => t.id === selectedTemplateId) ?? null;

  const selectedVariables = useMemo(() => {
    if (!selectedTemplate) return [];
    return variablesByType[selectedTemplate.type] ?? [];
  }, [selectedTemplate, variablesByType]);

  const handleSaveTemplate = async (payload: NotificationTemplateSavePayload) => {
    if (!selectedTemplate) {
      throw new Error('Select a template before saving');
    }

    const result = await saveNotificationTemplateByType(
      selectedTemplate.type,
      payload,
    );
    const freshTemplate = await fetchNotificationTemplateById(
      result.template.id,
    );

    setTemplates((current) =>
      current.map((template) =>
        template.id === freshTemplate.id ? freshTemplate : template,
      ),
    );

    toast('Template saved to the database successfully', 'success');
    return {
      template: freshTemplate,
      warnings: result.warnings,
    };
  };

  const handlePreviewTemplate = async () => {
    if (!selectedTemplate) {
      throw new Error('Select a template before previewing');
    }
    return await previewNotificationTemplateByType(selectedTemplate.type);
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
          Notification Templates
        </h1>
        <p className="text-slate-500 text-xs font-medium mt-1 leading-normal">
          Configure email and SMS notification templates for different events.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 mx-6 mt-4 p-4 bg-red-50/60 border border-red-200/60 rounded-xl text-xs text-red-700 animate-fade-in select-none shrink-0">
          <span className="material-symbols-outlined text-red-500 text-lg leading-none">
            error
          </span>
          <span className="font-bold">{error}</span>
          <button
            onClick={loadTemplates}
            className="ml-auto text-xs font-extrabold text-red-700 underline underline-offset-2 hover:text-red-900 focus:outline-none cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0 gap-0 overflow-hidden">
        <div className="w-[300px] shrink-0 flex flex-col min-h-0 border-r border-slate-200 bg-white">
          <NotificationTemplateList
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            loading={loading}
            onSelect={(t) => setSelectedTemplateId(t.id)}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-slate-50/30">
          {selectedTemplate ? (
            <NotificationTemplateDetail
              template={selectedTemplate}
              loading={loading}
              variablesLoading={variablesLoading}
              variables={selectedVariables}
              onSave={handleSaveTemplate}
              onPreview={handlePreviewTemplate}
              canWrite={canWrite}
            />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 gap-3 animate-fade-in select-none p-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                <span className="material-symbols-outlined text-2xl">
                  mail
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400">
                {loading
                  ? 'Loading templates...'
                  : 'Select a template from the sidebar to edit'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NotificationTemplatesPage;
