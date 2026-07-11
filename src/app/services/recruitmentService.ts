import { apiFetch } from './apiClient';
import { mapBackendRecruitmentRequest } from '@/state/appContext.mappers';
import type { RecruitmentRequest } from '@/types';

export interface CreateRecruitmentRequestData {
  workforcePlanItemId?: string;
  positionName?: string;
  requestTitle?: string;
  jobTitle?: string;
  departmentId: string;
  departmentName?: string;
  headcount?: number;
  employmentType?: string;
  priority?: string;
  requestType?: string;
  isReplacement?: boolean;
  replacementForEmployeeId?: string;
  replacementEmployeeId?: string;
  replacementReason?: string;
  justification: string;
  location?: string;
  supportingDocumentName?: string;
  customFieldValues?: Record<string, string>;
}

const normalizeRequestStatus = (status?: 'draft' | 'submitted') =>
  status === 'submitted' ? 'pending' : status || 'draft';

const toRequestApiPayload = (
  data: CreateRecruitmentRequestData | Partial<CreateRecruitmentRequestData>,
  status?: 'draft' | 'submitted',
) => ({
  workforce_plan_item_id: data.workforcePlanItemId || undefined,
  department_id: data.departmentId,
  position_name: data.positionName || data.requestTitle || data.jobTitle,
  request_title: data.requestTitle || data.positionName || data.jobTitle,
  job_title: data.jobTitle || data.requestTitle || data.positionName,
  employment_type: data.employmentType,
  request_type: data.requestType,
  priority: data.priority?.toLowerCase(),
  is_replacement: data.isReplacement,
  replacement_employee_id:
    data.replacementForEmployeeId || data.replacementEmployeeId,
  replacement_reason: data.replacementReason,
  justification: data.justification,
  status: normalizeRequestStatus(status),
  headcount: data.headcount,
  location: data.location,
  supporting_document_name: data.supportingDocumentName,
  custom_field_values: data.customFieldValues,
});

export interface Vacancy {
  id: string;
  displayCode: string;
  recruitmentRequestId: string;
  title: string;
  departmentId: string;
  departmentName: string;
  location: string;
  employmentType: string;
  status: string;
  postingStatus: string;
  openPositions: number;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  responsibilities: string;
  requirements: string;
  requiredExperience?: number;
  requiredQualifications?: string;
  createdAt: string;
  postedAt?: string;
  updatedAt: string;
}

export interface CreateVacancyData {
  recruitmentRequestId: string;
  title: string;
  location: string;
  employmentType: string;
  openPositions: number;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  responsibilities: string;
  requirements: string;
  requiredExperience?: number;
  requiredQualifications?: string;
}

export const recruitmentService = {
  async getRequests(): Promise<RecruitmentRequest[]> {
    const result = await apiFetch('/api/v1/recruitment/requests');
    return (result.data || []).map(mapBackendRecruitmentRequest);
  },

  async getRequestById(requestId: string): Promise<RecruitmentRequest> {
    const result = await apiFetch(`/api/v1/recruitment/requests/${requestId}`);
    return mapBackendRecruitmentRequest(result.data);
  },

  async createRequest(
    data: CreateRecruitmentRequestData,
    status: 'draft' | 'submitted' = 'draft',
  ): Promise<RecruitmentRequest> {
    const result = await apiFetch('/api/v1/recruitment/requests', {
      method: 'POST',
      body: JSON.stringify(toRequestApiPayload(data, status)),
    });
    return mapBackendRecruitmentRequest(result.data);
  },

  async updateRequest(
    requestId: string,
    data: Partial<CreateRecruitmentRequestData>,
    options?: { submit?: boolean },
  ): Promise<RecruitmentRequest> {
    const status = options?.submit ? 'submitted' : 'draft';
    const result = await apiFetch(`/api/v1/recruitment/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify(toRequestApiPayload(data, status)),
    });
    return mapBackendRecruitmentRequest(result.data);
  },

  async hrReviewRequest(
    requestId: string,
    action: 'approve' | 'reject',
    notes?: string,
  ): Promise<RecruitmentRequest> {
    const result = await apiFetch(
      `/api/v1/recruitment/requests/${requestId}/review`,
      {
        method: 'POST',
        body: JSON.stringify({ action, notes }),
      },
    );
    return mapBackendRecruitmentRequest(result.data);
  },

  async approveRequest(requestId: string, notes?: string): Promise<Vacancy> {
    const result = await apiFetch(
      `/api/v1/recruitment/requests/${requestId}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ notes }),
      },
    );
    return result.data;
  },

  async rejectRequest(
    requestId: string,
    reason: string,
  ): Promise<RecruitmentRequest> {
    const result = await apiFetch(
      `/api/v1/recruitment/requests/${requestId}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
    );
    return mapBackendRecruitmentRequest(result.data);
  },

  async getVacancies(): Promise<Vacancy[]> {
    const result = await apiFetch('/api/v1/vacancies');
    return result.data;
  },

  async getVacancyById(vacancyId: string): Promise<Vacancy> {
    const result = await apiFetch(`/${vacancyId}`);
    return result.data;
  },

  async createVacancy(data: CreateVacancyData): Promise<Vacancy> {
    const result = await apiFetch('/api/v1/vacancies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data;
  },

  async updateVacancy(
    vacancyId: string,
    data: Partial<CreateVacancyData>,
  ): Promise<Vacancy> {
    const result = await apiFetch(
      `/api/v1/vacancies/${vacancyId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
    );
    return result.data;
  },

  async postVacancy(vacancyId: string): Promise<Vacancy> {
    const result = await apiFetch(
      `/api/v1/vacancies/${vacancyId}/post`,
      {
        method: 'POST',
      },
    );
    return result.data;
  },

  async unpostVacancy(vacancyId: string): Promise<Vacancy> {
    const result = await apiFetch(
      `/api/v1/vacancies/${vacancyId}/unpost`,
      {
        method: 'POST',
      },
    );
    return result.data;
  },

  async approveVacancyPosting(
    vacancyId: string,
    notes?: string,
  ): Promise<Vacancy> {
    const result = await apiFetch(
      `/api/v1/vacancies/${vacancyId}/approve-posting`,
      {
        method: 'POST',
        body: JSON.stringify({ notes }),
      },
    );
    return result.data;
  },

  async rejectVacancyPosting(
    vacancyId: string,
    reason: string,
  ): Promise<Vacancy> {
    const result = await apiFetch(
      `/api/v1/vacancies/${vacancyId}/reject-posting`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
    );
    return result.data;
  },
};
