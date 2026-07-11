import { apiFetch } from '@/services/apiClient';

const API_V1 = '/api/v1';

export const NOTIFICATION_TEMPLATE_ROUTES = {
  templates: `${API_V1}/config/notification-templates`,
  templateById: (id: string) => `${API_V1}/config/notification-templates/${id}`,
  templateByType: (type: string) =>
    `${API_V1}/config/notification-templates/${type}`,
  templatePreviewByType: (type: string) =>
    `${API_V1}/config/notification-templates/${type}/preview`,
  variables: `${API_V1}/config/notification-variables`,
  variablesByType: (type: string) =>
    `${API_V1}/config/notification-variables/${type}`,
} as const;

export interface NotificationVariable {
  id: string;
  notification_type: string;
  variable_key: string;
  description: string;
  example_value?: string;
}

export interface NotificationTemplate {
  id: string;
  company_id: number;
  type: string;
  subject: string;
  body_html: string;
  body_sms: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplatesResponse {
  templates: NotificationTemplate[];
  groupedByType: Record<string, NotificationTemplate[]>;
}

export interface NotificationVariablesResponse {
  variables: NotificationVariable[];
  groupedByType: Record<string, NotificationVariable[]>;
}

export interface NotificationTemplatePreview {
  subject_preview: string;
  body_preview: string;
}

export interface NotificationTemplateSavePayload {
  subject: string;
  bodyHtml: string;
  bodySms?: string;
  isActive?: boolean;
}

export interface NotificationTemplateSaveResult {
  template: NotificationTemplate;
  warnings?: {
    unknown_variables?: string[];
  };
}

export async function fetchNotificationTemplates(): Promise<NotificationTemplatesResponse> {
  const res = await apiFetch(NOTIFICATION_TEMPLATE_ROUTES.templates);
  return {
    templates: (res.data ?? []) as NotificationTemplate[],
    groupedByType: (res.groupedByType ?? {}) as Record<
      string,
      NotificationTemplate[]
    >,
  };
}

export async function fetchNotificationTemplateById(
  id: string,
): Promise<NotificationTemplate> {
  const res = await apiFetch(NOTIFICATION_TEMPLATE_ROUTES.templateById(id));
  return res.data as NotificationTemplate;
}

export async function saveNotificationTemplateByType(
  type: string,
  payload: NotificationTemplateSavePayload,
): Promise<NotificationTemplateSaveResult> {
  const res = await apiFetch(NOTIFICATION_TEMPLATE_ROUTES.templateByType(type), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return {
    template: res.data as NotificationTemplate,
    warnings: res.warnings as NotificationTemplateSaveResult['warnings'],
  };
}

export async function previewNotificationTemplateByType(
  type: string,
): Promise<NotificationTemplatePreview> {
  const res = await apiFetch(
    NOTIFICATION_TEMPLATE_ROUTES.templatePreviewByType(type),
    {
      method: 'POST',
    },
  );
  return res.data as NotificationTemplatePreview;
}

export async function fetchNotificationVariables(): Promise<NotificationVariablesResponse> {
  const res = await apiFetch(NOTIFICATION_TEMPLATE_ROUTES.variables);
  return {
    variables: (res.data ?? []) as NotificationVariable[],
    groupedByType: (res.groupedByType ?? {}) as Record<
      string,
      NotificationVariable[]
    >,
  };
}

export async function fetchNotificationVariablesByType(
  type: string,
): Promise<NotificationVariable[]> {
  const res = await apiFetch(NOTIFICATION_TEMPLATE_ROUTES.variablesByType(type));
  return res.data as NotificationVariable[];
}
