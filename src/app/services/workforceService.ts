import { apiFetch } from './apiClient';

export interface WorkforcePlan {
  id: string;
  title: string;
  planningPeriod: string;
  planningType: string;
  status: string;
  justification: string;
  versionNumber: number;
  createdAt: string;
  updatedAt: string;
  items: WorkforcePlanItem[];
}

export interface WorkforcePlanItem {
  id: string;
  departmentId: string;
  departmentName: string;
  jobTitle: string;
  employmentType: string;
  headcount: number;
  plannedStart: string;
  justification: string;
}

export interface CreateWorkforcePlanData {
  title: string;
  planningPeriod: string;
  planningType: string;
  justification: string;
  items: Omit<WorkforcePlanItem, 'id' | 'departmentName'>[];
}

export const workforceService = {
  async getPlans(): Promise<WorkforcePlan[]> {
    const result = await apiFetch('/api/v1/workforce/plans');
    return result.data;
  },

  async getPlanById(planId: string): Promise<WorkforcePlan> {
    const result = await apiFetch(`/api/v1/workforce/plans/${planId}`);
    return result.data;
  },

  async createPlan(data: CreateWorkforcePlanData, status: 'draft' | 'submitted' = 'draft'): Promise<WorkforcePlan> {
    const result = await apiFetch('/api/v1/workforce/plans', {
      method: 'POST',
      body: JSON.stringify({ ...data, status }),
    });
    return result.data;
  },

  async updatePlan(planId: string, data: Partial<CreateWorkforcePlanData>, options?: { submit?: boolean }): Promise<WorkforcePlan> {
    const result = await apiFetch(`/api/v1/workforce/plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...data,
        status: options?.submit ? 'submitted' : 'draft',
      }),
    });
    return result.data;
  },

  async submitPlan(planId: string): Promise<WorkforcePlan> {
    const result = await apiFetch(`/api/v1/workforce/plans/${planId}/submit`, {
      method: 'POST',
    });
    return result.data;
  },

  async approvePlan(planId: string, notes?: string): Promise<WorkforcePlan> {
    const result = await apiFetch(`/api/v1/workforce/plans/${planId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    return result.data;
  },

  async rejectPlan(planId: string, reason: string): Promise<WorkforcePlan> {
    const result = await apiFetch(`/api/v1/workforce/plans/${planId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return result.data;
  },

  async getDepartments() {
    const result = await apiFetch('/api/v1/workforce/departments');
    return result.data;
  },
};
