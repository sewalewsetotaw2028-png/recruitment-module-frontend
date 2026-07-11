import { useWorkforcePlanningSlice } from './slice';
import React, { useMemo, useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  useDepartmentsSlice,
  departmentsActions,
} from '@/slice/departmentsSlice';
import { selectDepartments } from '@/slice/departmentsSlice/selectors';
import { useSession } from '@/hooks/useSession';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/components/common/Toast';
import {
  selectWorkforcePlanningLoading,
  selectWorkforcePlanningError,
  selectWorkforcePlanningActionLoading,
  selectWorkforcePlanningActionError,
  selectWorkforcePlanningActionSuccess,
  selectWorkforcePlanningPlans,
} from './slice/selectors';
import { workforcePlanningActions } from './slice';
import { FilterToolbar } from '@/components/shared/FilterToolbar';
import { PlanSummaryCards } from './components/PlanSummaryCards';
import { WorkforcePlanTable } from './components/WorkforcePlanTable';
import { WorkforcePlanDetailsModal } from './components/WorkforcePlanDetailsModal';
import { PlanDecisionModal } from './components/PlanDecisionModal';
import { PERMISSIONS } from '@/lib/permissions-shared';
import { deleteWorkforcePlan } from './api';
import type { WorkforcePlan } from '@/types';
import { PageSectionHeader } from '@/components/common/PageSectionHeader';

export const WorkforcePlanningListPage: React.FC = () => {
  useWorkforcePlanningSlice();
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  useDepartmentsSlice();
  const departments = useAppSelector(selectDepartments) as Array<{
    id: string;
    name: string;
  }>;
  const workforcePlans = useAppSelector(
    selectWorkforcePlanningPlans,
  ) as WorkforcePlan[];
  const loading = useAppSelector(selectWorkforcePlanningLoading);
  const actionLoading = useAppSelector(selectWorkforcePlanningActionLoading);
  const error = useAppSelector(selectWorkforcePlanningError);
  const actionError = useAppSelector(selectWorkforcePlanningActionError);
  const actionSuccess = useAppSelector(selectWorkforcePlanningActionSuccess);
  const { defaultPath } = useSession();
  const { can, canAny } = usePermissions();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    | 'all'
    | 'draft'
    | 'submitted'
    | 'under_hr_review'
    | 'under_ceo_review'
    | 'approved'
    | 'rejected'
    | 'returned_for_revision'
    | 'closed'
  >('all');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [planningTypeFilter, setPlanningTypeFilter] = useState<
    'all' | 'annual' | 'quarterly' | 'semi_annual' | 'monthly'
  >('all');
  const [decision, setDecision] = useState<
    | null
    | {
        mode: 'hr_review' | 'ceo_review' | 'reject';
        planId: string;
        planTitle?: string;
      }
  >(null);

  useEffect(() => {
    dispatch(workforcePlanningActions.fetchWorkforcePlanningDataRequest());
    dispatch(departmentsActions.fetchDepartmentsRequest());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast(error, 'error');
      dispatch(workforcePlanningActions.clearActionStatus());
    }
  }, [error, toast, dispatch]);

  useEffect(() => {
    if (actionError) {
      toast(actionError, 'error');
      dispatch(workforcePlanningActions.clearActionStatus());
    }
  }, [actionError, toast, dispatch]);

  useEffect(() => {
    if (actionSuccess) {
      toast(actionSuccess, 'success');
      dispatch(workforcePlanningActions.clearActionStatus());
    }
  }, [actionSuccess, toast, dispatch]);

  const selectedPlan = selectedPlanId
    ? workforcePlans.find((plan) => plan.id === selectedPlanId) || null
    : null;

  const summary = useMemo(
    () => ({
      total: workforcePlans.length,
      draft: workforcePlans.filter((p) => p.status === 'draft').length,
      submitted: workforcePlans.filter((p) => p.status === 'submitted').length,
      under_review: workforcePlans.filter((p) =>
        ['under_hr_review', 'under_ceo_review'].includes(p.status),
      ).length,
      approved: workforcePlans.filter((p) => p.status === 'approved').length,
      returned: workforcePlans.filter((p) => p.status === 'returned_for_revision').length,
      rejected: workforcePlans.filter((p) => p.status === 'rejected').length,
    }),
    [workforcePlans],
  );

  const filteredPlans = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return workforcePlans.filter((plan) => {
      const planDepartmentId = String(
        plan.departmentId || plan.items?.[0]?.departmentId || '',
      );
      if (statusFilter !== 'all' && plan.status !== statusFilter) return false;
      if (
        planningTypeFilter !== 'all' &&
        plan.planningType?.toLowerCase() !== planningTypeFilter.toLowerCase()
      )
        return false;
      if (departmentFilter && planDepartmentId !== departmentFilter)
        return false;
      if (!query) return true;

      const searchable = [
        plan.title,
        plan.departmentName,
        plan.createdByName,
        plan.supportingDocumentName,
        plan.businessUnit,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [
    workforcePlans,
    searchQuery,
    statusFilter,
    departmentFilter,
    planningTypeFilter,
  ]);

  const handleDeletePlan = async (planId: string) => {
    // Show styled confirmation instead of window.confirm
    setConfirmingDeleteId(planId);
  };

  const confirmDelete = async () => {
    if (!confirmingDeleteId) return;
    try {
      await deleteWorkforcePlan(confirmingDeleteId);
      toast('Workforce plan deleted successfully.', 'success');
      setSelectedPlanId(null);
      setConfirmingDeleteId(null);
      dispatch(workforcePlanningActions.fetchWorkforcePlanningDataRequest());
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Failed to delete workforce plan.', 'error');
      setConfirmingDeleteId(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPlanningTypeFilter('all');
    setDepartmentFilter('');
  };

  const canAccessWorkforcePlanning = canAny(
    PERMISSIONS.WORKFORCE_PLAN_READ,
    PERMISSIONS.WORKFORCE_PLAN_CREATE,
    PERMISSIONS.WORKFORCE_PLAN_UPDATE,
    PERMISSIONS.WORKFORCE_PLAN_SUBMIT,
    PERMISSIONS.WORKFORCE_PLAN_FORWARD,
    PERMISSIONS.WORKFORCE_PLAN_APPROVE,
    PERMISSIONS.WORKFORCE_PLAN_REJECT,
    PERMISSIONS.WORKFORCE_PLAN_RETURN,
  );
  const canCreatePlan = can(PERMISSIONS.WORKFORCE_PLAN_CREATE);
  const canUpdatePlan = can(PERMISSIONS.WORKFORCE_PLAN_UPDATE);
  const canSubmitPlan = can(PERMISSIONS.WORKFORCE_PLAN_SUBMIT);
  const canForwardPlan = can(PERMISSIONS.WORKFORCE_PLAN_FORWARD);
  const canApprovePlan = can(PERMISSIONS.WORKFORCE_PLAN_APPROVE);
  const canRejectPlan = can(PERMISSIONS.WORKFORCE_PLAN_REJECT);
  const canReturnPlan = can(PERMISSIONS.WORKFORCE_PLAN_RETURN);
  const canDeletePlan = can(PERMISSIONS.WORKFORCE_PLAN_UPDATE);

  if (!canAccessWorkforcePlanning) {
    return <Navigate to={defaultPath} replace />;
  }

  return (
    <section className="max-w-7xl mx-auto p-6 space-y-6 text-sm bg-slate-50 min-h-screen text-slate-800 animate-fade-in">
      {/* Header Panel */}
      <PageSectionHeader
        eyebrow="Workforce planning"
        title="Plan headcount before recruitment starts"
        description="Department plan, HR review, CEO approval, then vacancy creation."
        usePrimaryColor={true}
        action={
          canCreatePlan ? (
            <button
              type="button"
              className="bg-white text-indigo-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => navigate('/dashboard/workforce-planning/create')}
              disabled={actionLoading || loading}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New plan
            </button>
          ) : (
            <div className="text-xs text-white/80 max-w-xs text-right">
              You can review and track plans, but cannot create new plans with
              your current role.
            </div>
          )
        }
      />

      {/* Summary Cards Module */}
      <PlanSummaryCards
        summary={summary}
        onFilterClick={(status) => setStatusFilter(status as typeof statusFilter)}
      />

      {/* Filtering Actions Area */}
      <FilterToolbar
        fields={[
          {
            key: 'search',
            label: 'Search plans',
            type: 'search',
            placeholder: 'Title, department...',
            value: searchQuery,
            onChange: setSearchQuery,
          },
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            value: statusFilter,
            onChange: (value) => setStatusFilter(value as typeof statusFilter),
            options: [
              { value: 'all', label: 'All' },
              { value: 'draft', label: 'Draft' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'under_hr_review', label: 'Under HR review' },
              { value: 'under_ceo_review', label: 'Under CEO review' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'returned_for_revision', label: 'Returned for revision' },
              { value: 'closed', label: 'Closed' },
            ],
          },
          {
            key: 'department',
            label: 'Department',
            type: 'select',
            value: departmentFilter,
            onChange: setDepartmentFilter,
            options: [
              { value: '', label: 'All departments' },
              ...departments.map((dept) => ({
                value: dept.id,
                label: dept.name,
              })),
            ],
          },
        ]}
        onClear={clearFilters}
        resultCount={filteredPlans.length}
        resultLabel="plans"
      />

      {/* Main Table Wrapper */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <WorkforcePlanTable
          plans={filteredPlans}
          selectedPlanId={selectedPlanId}
          onRowSelect={setSelectedPlanId}
        />
      </div>

      {/* Detailed Modal Overlay */}
      {selectedPlan && (
        <WorkforcePlanDetailsModal
          plan={selectedPlan}
          onClose={() => setSelectedPlanId(null)}
          onEdit={(plan) =>
            navigate(`/dashboard/workforce-planning/${plan.id}/edit`)
          }
          onDelete={handleDeletePlan}
          canUpdatePlan={canUpdatePlan}
          canDeletePlan={canDeletePlan}
          canSubmitPlan={canSubmitPlan}
          canForwardPlan={canForwardPlan}
          canApprovePlan={canApprovePlan}
          canRejectPlan={canRejectPlan}
          canReturnPlan={canReturnPlan}
          onSubmit={(planId) => {
            dispatch(
              workforcePlanningActions.submitWorkforcePlanRequest({
                planId,
                successMessage: 'Workforce plan submitted.',
              }),
            );
          }}
          onAction={(planId, intent) => {
            const planTitle =
              workforcePlans.find((p) => p.id === planId)?.title ?? undefined;
            // Map intent to modal mode so the correct primary button appears
            const mode =
              intent === 'approve' ? 'ceo_review' :
              intent === 'reject' ? 'reject' :
              'hr_review';
            setDecision({ mode, planId, planTitle });
          }}
        />
      )}

      {/* Styled delete confirmation — replaces window.confirm */}
      {confirmingDeleteId && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 border border-rose-200">
                <span className="material-symbols-outlined text-rose-600 text-[20px]">delete</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Workforce Plan?</h3>
                <p className="mt-1 text-sm text-slate-500">
                  This will permanently remove the plan and all its line items. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmingDeleteId(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 transition-all"
              >
                Delete plan
              </button>
            </div>
          </div>
        </div>
      )}

      {decision && (
        <PlanDecisionModal
          mode={decision.mode}
          planTitle={decision.planTitle}
          planStatus={selectedPlan?.status}
          canReturnPlan={canReturnPlan}
          canForwardPlan={canForwardPlan}
          canApprovePlan={canApprovePlan}
          canRejectPlan={canRejectPlan}
          onClose={() => setDecision(null)}
          onConfirm={(value, action) => {
            if (action === 'reject') {
              toast('Workforce plan rejected.', 'success');
              dispatch(
                workforcePlanningActions.rejectWorkforcePlanRequest({
                  planId: decision.planId,
                  reason: value || 'Rejected',
                  successMessage: 'Workforce plan rejected.',
                }),
              );
              setDecision(null);
              setSelectedPlanId(null);
              return;
            }

            if (action === 'return') {
              if (!value) {
                toast('Please add a comment before returning the plan.', 'error');
                return;
              }
              toast('Workforce plan returned for revision.', 'success');
              dispatch(
                workforcePlanningActions.returnWorkforcePlanForRevisionRequest({
                  planId: decision.planId,
                  reason: value,
                  successMessage: 'Workforce plan returned for revision.',
                }),
              );
              setDecision(null);
              setSelectedPlanId(null);
              return;
            }

            if (action === 'approve') {
              toast('Workforce plan approved.', 'success');
              dispatch(
                workforcePlanningActions.approveWorkforcePlanRequest({
                  planId: decision.planId,
                  successMessage: 'Workforce plan approved.',
                }),
              );
              setDecision(null);
              setSelectedPlanId(null);
              return;
            }

            if (action === 'forward') {
              toast('Workforce plan forwarded to CEO.', 'success');
              dispatch(
                workforcePlanningActions.forwardWorkforcePlanToCeoRequest({
                  planId: decision.planId,
                  notes: value,
                  successMessage: 'Workforce plan forwarded to CEO.',
                }),
              );
              setDecision(null);
              setSelectedPlanId(null);
              return;
            }

            // Legacy fallback for mode-based logic
            if (decision.mode === 'reject') {
              toast('Workforce plan rejected.', 'success');
              dispatch(
                workforcePlanningActions.rejectWorkforcePlanRequest({
                  planId: decision.planId,
                  reason: value || 'Rejected',
                  successMessage: 'Workforce plan rejected.',
                }),
              );
              setDecision(null);
              setSelectedPlanId(null);
              return;
            }

            // Default to forward for hr_review
            toast('Workforce plan forwarded to CEO.', 'success');
            dispatch(
              workforcePlanningActions.forwardWorkforcePlanToCeoRequest({
                planId: decision.planId,
                notes: value,
                successMessage: 'Workforce plan forwarded to CEO.',
              }),
            );
            setDecision(null);
            setSelectedPlanId(null);
          }}
        />
      )}
    </section>
  );
};

export default WorkforcePlanningListPage;
