import { apiFetch } from '@/services/apiClient';

const API_V1 = '/api/v1';

export const APPROVAL_WORKFLOW_ROUTES = {
  workflows: `${API_V1}/config/approval-workflows`,
  workflowById: (id: string) => `${API_V1}/config/approval-workflows/${id}`,
  workflowStages: (id: string) =>
    `${API_V1}/config/approval-workflows/${id}/stages`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApprovalWorkflowStage {
  id: string;
  workflow_id: string;
  stage_order: number;
  stage_name: string;
  approver_role_id: string | null;
  is_mandatory: boolean;
  created_at: string;
}

export interface ApprovalWorkflow {
  id: string;
  company_id: number;
  name: string;
  entity_type: 'WorkforcePlan' | 'RecruitmentRequest' | 'HiringMinute';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stages: ApprovalWorkflowStage[];
}

export interface CreateApprovalWorkflowPayload {
  name: string;
  entityType: 'WorkforcePlan' | 'RecruitmentRequest' | 'HiringMinute';
  stages: {
    stageOrder: number;
    stageName: string;
    approverRoleId?: string;
    isMandatory?: boolean;
  }[];
}

export interface UpdateApprovalWorkflowPayload {
  name?: string;
  isActive?: boolean;
}

export interface UpdateApprovalWorkflowStagesPayload {
  stages: {
    stageOrder: number;
    stageName: string;
    approverRoleId?: string;
    isMandatory?: boolean;
  }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchApprovalWorkflows(): Promise<
  ApprovalWorkflow[]
> {
  const res = await apiFetch(APPROVAL_WORKFLOW_ROUTES.workflows);
  return res.data as ApprovalWorkflow[];
}

export async function createApprovalWorkflow(
  payload: CreateApprovalWorkflowPayload,
): Promise<ApprovalWorkflow> {
  const res = await apiFetch(APPROVAL_WORKFLOW_ROUTES.workflows, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data as ApprovalWorkflow;
}

export async function updateApprovalWorkflow(
  id: string,
  payload: UpdateApprovalWorkflowPayload,
): Promise<ApprovalWorkflow> {
  const res = await apiFetch(APPROVAL_WORKFLOW_ROUTES.workflowById(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data as ApprovalWorkflow;
}

export async function updateApprovalWorkflowStages(
  id: string,
  payload: UpdateApprovalWorkflowStagesPayload,
): Promise<ApprovalWorkflow> {
  const res = await apiFetch(APPROVAL_WORKFLOW_ROUTES.workflowStages(id), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data as ApprovalWorkflow;
}

export async function deleteApprovalWorkflow(id: string): Promise<void> {
  await apiFetch(APPROVAL_WORKFLOW_ROUTES.workflowById(id), {
    method: 'DELETE',
  });
}
