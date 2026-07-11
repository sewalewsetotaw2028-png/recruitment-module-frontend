import { apiFetch } from './apiClient';

export interface CandidateProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  organizationId: string;
  experience?: CandidateExperience[];
  education?: CandidateEducation[];
  documents?: CandidateDocument[];
}

export interface CandidateExperience {
  id: string;
  companyName: string;
  position: string;
  startDate: string;
  endDate?: string;
  totalMonths?: number;
  description?: string;
  documentUrl?: string;
}

export interface CandidateEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: number;
  certificateUrl?: string;
}

export interface CandidateDocument {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  uploadedAt: string;
}

export const candidateService = {
  async getProfile(): Promise<CandidateProfile> {
    const result = await apiFetch('/api/v1/candidates/me');
    return result.data;
  },

  async updateProfile(
    data: Partial<CandidateProfile>,
  ): Promise<CandidateProfile> {
    const result = await apiFetch('/api/v1/candidates/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return result.data;
  },

  async addExperience(
    data: Partial<CandidateExperience>,
  ): Promise<CandidateExperience> {
    const result = await apiFetch('/api/v1/candidates/experience', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data;
  },

  async updateExperience(
    experienceId: string,
    data: Partial<CandidateExperience>,
  ): Promise<CandidateExperience> {
    const result = await apiFetch(
      `/api/v1/candidates/experience/${experienceId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
    );
    return result.data;
  },

  async deleteExperience(experienceId: string): Promise<void> {
    await apiFetch(`/api/v1/candidates/experience/${experienceId}`, {
      method: 'DELETE',
    });
  },

  async addEducation(
    data: Partial<CandidateEducation>,
  ): Promise<CandidateEducation> {
    const result = await apiFetch('/api/v1/candidates/education', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data;
  },

  async updateEducation(
    educationId: string,
    data: Partial<CandidateEducation>,
  ): Promise<CandidateEducation> {
    const result = await apiFetch(
      `/api/v1/candidates/education/${educationId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
    );
    return result.data;
  },

  async deleteEducation(educationId: string): Promise<void> {
    await apiFetch(`/api/v1/candidates/education/${educationId}`, {
      method: 'DELETE',
    });
  },

  async getDocuments(): Promise<CandidateDocument[]> {
    const result = await apiFetch('/api/v1/candidates/documents');
    return result.data;
  },

  async uploadDocument(formData: FormData): Promise<CandidateDocument> {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const token = localStorage.getItem('token');
    const response = await fetch(base + '/api/v1/candidates/documents', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Upload failed');
    const parsed = await response.json();
    return parsed.data;
  },

  async deleteDocument(documentId: string): Promise<void> {
    await apiFetch(`/api/v1/candidates/documents?documentId=${encodeURIComponent(documentId)}`, {
      method: 'DELETE',
    });
  },

  async getApplications() {
    const result = await apiFetch('/api/v1/candidates/applications');
    return result.data;
  },

  async applyToVacancy(
    vacancyId: string,
    data: { coverLetter?: string; documentIds?: string[] },
  ) {
    const result = await apiFetch('/api/v1/candidates/apply', {
      method: 'POST',
      body: JSON.stringify({ vacancyId, ...data }),
    });
    return result.data;
  },

  async getPublicVacancies(orgId: string) {
    const result = await apiFetch(`/api/v1/candidates/vacancies/${orgId}`);
    return result.data;
  },
};
