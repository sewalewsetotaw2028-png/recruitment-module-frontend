import { apiFetch } from '@/services/apiClient';

const API_V1 = '/api/v1';

export const CUSTOM_FIELD_ROUTES = {
  fields: `${API_V1}/config/custom-fields`,
  fieldById: (id: string) => `${API_V1}/config/custom-fields/${id}`,
};

export const CUSTOM_FIELD_ENTITY_TYPES = [
  'Application',
  'Candidate',
  'Vacancy',
  'RecruitmentRequest',
] as const;

export const CUSTOM_FIELD_TYPES = [
  'text',
  'number',
  'date',
  'boolean',
  'select',
] as const;

export type CustomFieldEntityType =
  (typeof CUSTOM_FIELD_ENTITY_TYPES)[number];
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export interface CustomField {
  id: string;
  company_id: number;
  entity_type: CustomFieldEntityType | string;
  field_name: string;
  field_type: CustomFieldType | 'dropdown' | 'checkbox';
  is_required: boolean;
  options: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomFieldPayload {
  entityType: CustomFieldEntityType;
  fieldName: string;
  fieldType: CustomFieldType;
  isRequired?: boolean;
  options?: string;
}

export interface UpdateCustomFieldPayload {
  fieldName?: string;
  fieldType?: CustomFieldType;
  isRequired?: boolean;
  options?: string;
}

export const normalizeCustomFieldType = (
  fieldType: CustomField['field_type'],
): CustomFieldType => {
  if (fieldType === 'dropdown') return 'select';
  if (fieldType === 'checkbox') return 'boolean';
  return fieldType as CustomFieldType;
};

export const customFieldTypeLabel = (fieldType: CustomField['field_type']) => {
  switch (normalizeCustomFieldType(fieldType)) {
    case 'boolean':
      return 'Boolean';
    case 'select':
      return 'Select';
    case 'number':
      return 'Number';
    case 'date':
      return 'Date';
    default:
      return 'Text';
  }
};

export const customFieldEntityLabel = (entityType: string) => {
  switch (entityType) {
    case 'RecruitmentRequest':
      return 'Recruitment Request';
    case 'Vacancy':
      return 'Vacancy';
    case 'Candidate':
      return 'Candidate';
    case 'Application':
      return 'Application';
    default:
      return entityType;
  }
};

export async function fetchCustomFields(): Promise<CustomField[]> {
  const res = await apiFetch(CUSTOM_FIELD_ROUTES.fields);
  return res.data as CustomField[];
}

export async function createCustomField(
  payload: CreateCustomFieldPayload,
): Promise<CustomField> {
  const res = await apiFetch(CUSTOM_FIELD_ROUTES.fields, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data as CustomField;
}

export async function updateCustomField(
  id: string,
  payload: UpdateCustomFieldPayload,
): Promise<CustomField> {
  const res = await apiFetch(CUSTOM_FIELD_ROUTES.fieldById(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data as CustomField;
}

export async function deleteCustomField(id: string): Promise<void> {
  await apiFetch(CUSTOM_FIELD_ROUTES.fieldById(id), {
    method: 'DELETE',
  });
}
