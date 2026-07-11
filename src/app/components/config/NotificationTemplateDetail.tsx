import React, { useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type {
  NotificationTemplate,
  NotificationTemplatePreview,
  NotificationTemplateSavePayload,
  NotificationTemplateSaveResult,
  NotificationVariable,
} from '@/hooks/useNotificationTemplates';

interface NotificationTemplateDetailProps {
  template: NotificationTemplate;
  loading: boolean;
  variablesLoading: boolean;
  variables: NotificationVariable[];
  onSave: (
    payload: NotificationTemplateSavePayload,
  ) => Promise<NotificationTemplateSaveResult>;
  onPreview: () => Promise<NotificationTemplatePreview>;
  canWrite: boolean;
}

type EditableField = 'subject' | 'bodyHtml' | 'bodySms';

const fieldLabels: Record<EditableField, string> = {
  subject: 'Subject',
  bodyHtml: 'Email Body (HTML)',
  bodySms: 'SMS Body',
};

export const NotificationTemplateDetail: React.FC<
  NotificationTemplateDetailProps
> = ({
  template,
  loading,
  variablesLoading,
  variables,
  onSave,
  onPreview,
  canWrite,
}) => {
  const [subject, setSubject] = useState(template.subject);
  const [bodyHtml, setBodyHtml] = useState(template.body_html);
  const [bodySms, setBodySms] = useState(template.body_sms || '');
  const [isActive, setIsActive] = useState(template.is_active);
  const [saveWarnings, setSaveWarnings] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<EditableField>('bodyHtml');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewData, setPreviewData] =
    useState<NotificationTemplatePreview | null>(null);

  const subjectRef = useRef<HTMLInputElement | null>(null);
  const bodyHtmlEditorRef = useRef<HTMLDivElement | null>(null);
  const bodySmsRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setSubject(template.subject);
    setBodyHtml(template.body_html);
    setBodySms(template.body_sms || '');
    setIsActive(template.is_active);
    setSaveWarnings([]);
    setError(null);
    setPreviewError(null);
    setPreviewData(null);
    setPreviewOpen(false);
    setActiveField('bodyHtml');
  }, [
    template.id,
    template.subject,
    template.body_html,
    template.body_sms,
    template.is_active,
    template.updated_at,
  ]);

  useEffect(() => {
    const editor = bodyHtmlEditorRef.current;
    if (!editor) return;
    // Keep the contentEditable DOM in sync without controlling it on every keystroke;
    // that avoids caret jumps while still reflecting backend updates and saves.
    if (editor.innerHTML !== bodyHtml) {
      editor.innerHTML = bodyHtml || '<p></p>';
    }
  }, [bodyHtml]);

  const getCurrentPayload = (
    nextIsActive: boolean = isActive,
  ): NotificationTemplateSavePayload => ({
    subject,
    // Read the live editor HTML at save time so a fast click cannot submit stale
    // React state if the browser hasn't flushed the latest input event yet.
    bodyHtml: bodyHtmlEditorRef.current?.innerHTML ?? bodyHtml,
    bodySms,
    isActive: nextIsActive,
  });

  const insertVariableToken = (variableKey: string) => {
    const field = activeField ?? 'bodyHtml';
    const token = `{{${variableKey}}}`;
    const fieldRefs: Record<
      Exclude<EditableField, 'bodyHtml'>,
      HTMLInputElement | HTMLTextAreaElement | null
    > = {
      subject: subjectRef.current,
      bodySms: bodySmsRef.current,
    };

    const fieldValues: Record<EditableField, string> = {
      subject,
      bodyHtml,
      bodySms,
    };

    const setFieldValues: Record<EditableField, (value: string) => void> = {
      subject: setSubject,
      bodyHtml: setBodyHtml,
      bodySms: setBodySms,
    };

    const currentValue = fieldValues[field];
    if (field === 'bodyHtml') {
      const editor = bodyHtmlEditorRef.current;
      if (!editor) return;

      editor.focus();
      document.execCommand('insertText', false, token);
      setBodyHtml(editor.innerHTML);
      return;
    }

    const input = fieldRefs[field];
    const start = input?.selectionStart ?? currentValue.length;
    const end = input?.selectionEnd ?? currentValue.length;
    const nextValue = `${currentValue.slice(0, start)}${token}${currentValue.slice(end)}`;

    // Keep the caret in place so the user can chain variable inserts without
    // manually clicking back into the editor after each token.
    setFieldValues[field](nextValue);

    requestAnimationFrame(() => {
      const nextCaret = start + token.length;
      input?.focus();
      if (input && 'setSelectionRange' in input) {
        input.setSelectionRange(nextCaret, nextCaret);
      }
    });
  };

  const applyBodyHtmlCommand = (command: string, value?: string) => {
    const editor = bodyHtmlEditorRef.current;
    if (!editor || !canWrite || saving || loading) return;

    editor.focus();
    document.execCommand(command, false, value);
    setBodyHtml(editor.innerHTML);
    setActiveField('bodyHtml');
  };

  const handleSave = async (nextIsActive: boolean = isActive) => {
    if (!canWrite) return;
    setSaving(true);
    setError(null);
    try {
      const result = await onSave(getCurrentPayload(nextIsActive));
      setSaveWarnings(result.warnings?.unknown_variables ?? []);
      setSubject(result.template.subject);
      setBodyHtml(result.template.body_html);
      setBodySms(result.template.body_sms ?? '');
      setIsActive(result.template.is_active);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (checked: boolean) => {
    if (!canWrite) return;
    setIsActive(checked);
    try {
      await handleSave(checked);
    } catch {
      setIsActive(!checked);
    }
  };

  const handlePreview = async () => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const preview = await onPreview();
      setPreviewData(preview);
    } catch (err: unknown) {
      setPreviewError(
        err instanceof Error ? err.message : 'Failed to load preview',
      );
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const lastSyncedLabel = new Date(template.updated_at).toLocaleString();

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="px-6 py-4 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
                  {template.type}
                </h2>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${
                    isActive
                      ? 'bg-green-50 text-green-700 border-green-200/60'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Configure email and SMS notification content for this event.
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Last synced from the database:{' '}
                <span className="font-semibold text-slate-600">
                  {lastSyncedLabel}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-end">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => {
                    void handleToggleActive(e.target.checked);
                  }}
                  disabled={!canWrite || saving || loading}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 disabled:cursor-not-allowed"
                />
                Active
              </label>
              <button
                type="button"
                onClick={() => {
                  void handlePreview();
                }}
                disabled={saving || loading}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleSave().catch(() => undefined);
                }}
                disabled={!canWrite || saving || loading}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs focus:outline-none cursor-pointer"
              >
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm animate-spin leading-none">
                      progress_activity
                    </span>
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>

          {saveWarnings.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-amber-50/80 border border-amber-200/70 rounded-xl text-xs text-amber-900">
              <span className="material-symbols-outlined text-amber-600 text-lg leading-none shrink-0">
                warning
              </span>
              <div className="space-y-2">
                <p className="font-bold leading-relaxed">
                  Unknown variables were found in this template. The save
                  succeeded, but these placeholders are not registered for this
                  notification type.
                </p>
                <div className="flex flex-wrap gap-2">
                  {saveWarnings.map((warning) => (
                    <span
                      key={warning}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-800 font-semibold"
                    >
                      {warning}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50/70 border border-red-200/70 rounded-xl text-xs text-red-700">
              <span className="material-symbols-outlined text-red-500 text-lg leading-none">
                error
              </span>
              <span className="font-bold">{error}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-6 items-start">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
                Subject
              </label>
              <input
                ref={subjectRef}
                type="text"
                value={subject}
                onFocus={() => setActiveField('subject')}
                onChange={(e) => setSubject(e.target.value)}
                disabled={!canWrite || saving || loading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
                Email Body (HTML)
              </label>
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 bg-slate-50/80 px-3 py-2">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBodyHtmlCommand('formatBlock', 'p')}
                    disabled={!canWrite || saving || loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Paragraph"
                  >
                    <span className="material-symbols-outlined text-sm">
                      text_fields
                    </span>
                    Paragraph
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBodyHtmlCommand('bold')}
                    disabled={!canWrite || saving || loading}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Bold"
                  >
                    <span className="material-symbols-outlined text-sm">
                      format_bold
                    </span>
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBodyHtmlCommand('italic')}
                    disabled={!canWrite || saving || loading}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Italic"
                  >
                    <span className="material-symbols-outlined text-sm">
                      format_italic
                    </span>
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBodyHtmlCommand('underline')}
                    disabled={!canWrite || saving || loading}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Underline"
                  >
                    <span className="material-symbols-outlined text-sm">
                      format_underlined
                    </span>
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                      applyBodyHtmlCommand('insertUnorderedList')
                    }
                    disabled={!canWrite || saving || loading}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Bullet list"
                  >
                    <span className="material-symbols-outlined text-sm">
                      format_list_bulleted
                    </span>
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                      applyBodyHtmlCommand('insertOrderedList')
                    }
                    disabled={!canWrite || saving || loading}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Numbered list"
                  >
                    <span className="material-symbols-outlined text-sm">
                      format_list_numbered
                    </span>
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBodyHtmlCommand('removeFormat')}
                    disabled={!canWrite || saving || loading}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Clear formatting"
                  >
                    <span className="material-symbols-outlined text-sm">
                      format_clear
                    </span>
                  </button>
                </div>

                <div
                  ref={bodyHtmlEditorRef}
                  role="textbox"
                  aria-multiline="true"
                  contentEditable={canWrite && !saving && !loading}
                  suppressContentEditableWarning
                  onFocus={() => setActiveField('bodyHtml')}
                  onInput={() => {
                    setBodyHtml(bodyHtmlEditorRef.current?.innerHTML ?? '');
                  }}
                  className="min-h-[280px] w-full px-4 py-4 text-sm leading-7 text-slate-800 outline-none focus:ring-0"
                  style={{ whiteSpace: 'normal' }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Use the toolbar to format text. You can still insert template
                variables from the panel on the right.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wide mb-1.5">
                SMS Body
              </label>
              <textarea
                ref={bodySmsRef}
                value={bodySms}
                onFocus={() => setActiveField('bodySms')}
                onChange={(e) => setBodySms(e.target.value)}
                disabled={!canWrite || saving || loading}
                rows={5}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed resize-none"
              />
            </div>
          </div>

          <aside className="lg:sticky lg:top-6">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/80">
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
                  Variable Reference
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                  Click a variable to insert it into the field that is currently
                  focused.
                </p>
              </div>

              <div className="p-3 max-h-[calc(100vh-22rem)] overflow-y-auto space-y-2">
                {variablesLoading ? (
                  <div className="px-4 py-8 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-xl bg-slate-50/60">
                    Loading variable registry...
                  </div>
                ) : variables.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-xl bg-slate-50/60">
                    No variables are registered for this notification type.
                  </div>
                ) : (
                  variables.map((variable) => (
                    <button
                      key={variable.id}
                      type="button"
                      onClick={() => insertVariableToken(variable.variable_key)}
                      disabled={!canWrite || saving || loading}
                      className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50/50 hover:border-indigo-200 transition-all shadow-xs focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-extrabold text-indigo-700 break-all">
                          {'{{'}
                          {variable.variable_key}
                          {'}}'}
                        </span>
                        {variable.example_value && (
                          <span className="text-[10px] font-bold text-slate-400 shrink-0">
                            e.g. {variable.example_value}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                        {variable.description}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-600">
              <p className="font-bold text-slate-800 mb-1">Current field</p>
              <p className="leading-relaxed">
                Tokens will be inserted into{' '}
                <span className="font-semibold text-slate-800">
                  {fieldLabels[activeField]}
                </span>
                .
              </p>
            </div>
          </aside>
        </div>
      </div>

      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Preview - ${template.type}`}
        size="xl"
      >
        <div className="space-y-6">
          {previewLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-500 gap-3">
              <span className="material-symbols-outlined animate-spin">
                progress_activity
              </span>
              Loading preview...
            </div>
          ) : previewError ? (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700 font-medium">
              {previewError}
            </div>
          ) : previewData ? (
            <>
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  Subject Preview
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
                  {previewData.subject_preview || '(empty)'}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  Body Preview
                </p>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 max-h-[60vh] overflow-auto">
                  {previewData.body_preview ? (
                    <div
                      className="prose prose-slate max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: previewData.body_preview,
                      }}
                    />
                  ) : (
                    <p className="text-slate-400 italic">Empty body.</p>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </Modal>
    </div>
  );
};

export default NotificationTemplateDetail;
