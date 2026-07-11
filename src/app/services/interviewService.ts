import { apiFetch } from './apiClient';

export interface Interview {
  id: string;
  applicationId: string;
  round: number;
  type: 'virtual' | 'hybrid' | 'inperson';
  startTime: string;
  endTime: string;
  status: string;
  meetingLink?: string;
  officeLocation?: string;
  googleMapsLocation?: string;
  inOfficeStartTime?: string;
  inOfficeEndTime?: string;
  remoteStartTime?: string;
  remoteEndTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInterviewData {
  applicationId: string;
  round?: number;
  type: 'virtual' | 'hybrid' | 'inperson';
  startTime: string;
  endTime: string;
  meetingLink?: string;
  officeLocation?: string;
  googleMapsLocation?: string;
  inOfficeStartTime?: string;
  inOfficeEndTime?: string;
  remoteStartTime?: string;
  remoteEndTime?: string;
  panelMemberIds?: string[];
}

export interface InterviewEvaluation {
  id: string;
  interviewId: string;
  evaluatorId: string;
  overallScore: number;
  comments?: string;
  questionsJson?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEvaluationData {
  interviewId: string;
  overallScore: number;
  comments?: string;
  questionsJson?: Record<string, unknown>;
}

export const interviewService = {
  async getInterviews(): Promise<Interview[]> {
    const result = await apiFetch('/api/v1/interviews/list');
    return result.data;
  },

  async getInterviewById(interviewId: string): Promise<Interview> {
    const result = await apiFetch(`/api/v1/interviews/${interviewId}`);
    return result.data;
  },

  async createInterview(data: CreateInterviewData): Promise<Interview> {
    const result = await apiFetch('/api/v1/interviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data;
  },

  async updateInterview(
    interviewId: string,
    data: Partial<CreateInterviewData>,
  ): Promise<Interview> {
    const result = await apiFetch(`/api/v1/interviews/${interviewId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.data;
  },

  async cancelInterview(interviewId: string): Promise<Interview> {
    const result = await apiFetch(`/api/v1/interviews/${interviewId}/cancel`, {
      method: 'POST',
    });
    return result.data;
  },

  async getEvaluations(interviewId: string): Promise<InterviewEvaluation[]> {
    const result = await apiFetch(
      `/api/v1/interviews/${interviewId}/evaluations`,
    );
    return result.data;
  },

  async submitEvaluation(
    data: CreateEvaluationData,
  ): Promise<InterviewEvaluation> {
    const result = await apiFetch('/api/v1/interviews/evaluations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.data;
  },

  async updateEvaluation(
    evaluationId: string,
    data: Partial<CreateEvaluationData>,
  ): Promise<InterviewEvaluation> {
    const result = await apiFetch(
      `/api/v1/interviews/evaluations/${evaluationId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
    );
    return result.data;
  },
};
