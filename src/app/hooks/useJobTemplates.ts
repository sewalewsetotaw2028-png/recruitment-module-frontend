import { apiFetch } from '@/services/apiClient';

const API_V1 = '/api/v1';

export const JOB_TEMPLATE_ROUTES = {
  templates: `${API_V1}/config/job-templates`,
  templateById: (id: string) => `${API_V1}/config/job-templates/${id}`,
  descriptions: (templateId: string) =>
    `${API_V1}/config/job-templates/${templateId}/descriptions`,
};

export interface JobDescription {
  id: string;
  company_id: number;
  job_template_id: string | null;
  title: string;
  summary: string | null;
  responsibilities: string;
  requirements: string;
  qualifications: string | null;
  employment_type: string | null;
  job_grade: string | null;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobTemplate {
  id: string;
  company_id: number;
  title: string;
  employment_type: string;
  job_grade: string | null;
  summary: string | null;
  responsibilities: string;
  requirements: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  job_descriptions: JobDescription[];
}

export interface CreateJobTemplatePayload {
  title: string;
  employmentType: string;
  jobGrade?: string;
  summary?: string;
  responsibilities: string;
  requirements: string;
}

export interface UpdateJobTemplatePayload {
  title?: string;
  employmentType?: string;
  jobGrade?: string;
  summary?: string;
  responsibilities?: string;
  requirements?: string;
  isActive?: boolean;
}

export interface CreateJobDescriptionPayload {
  title: string;
  summary?: string;
  responsibilities: string;
  requirements: string;
  qualifications?: string;
  employmentType?: string;
  jobGrade?: string;
}

export async function fetchJobTemplates(): Promise<JobTemplate[]> {
  const res = await apiFetch(JOB_TEMPLATE_ROUTES.templates);
  return res.data as JobTemplate[];
}

export async function createJobTemplate(
  payload: CreateJobTemplatePayload,
): Promise<JobTemplate> {
  const res = await apiFetch(JOB_TEMPLATE_ROUTES.templates, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data as JobTemplate;
}

export async function updateJobTemplate(
  id: string,
  payload: UpdateJobTemplatePayload,
): Promise<JobTemplate> {
  const res = await apiFetch(JOB_TEMPLATE_ROUTES.templateById(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data as JobTemplate;
}

export async function deleteJobTemplate(id: string): Promise<void> {
  await apiFetch(JOB_TEMPLATE_ROUTES.templateById(id), {
    method: 'DELETE',
  });
}

export async function createJobDescription(
  templateId: string,
  payload: CreateJobDescriptionPayload,
): Promise<JobDescription> {
  const res = await apiFetch(JOB_TEMPLATE_ROUTES.descriptions(templateId), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data as JobDescription;
}
