import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks';

import { useSession } from '@/hooks/useSession';
import { useWorkforcePlanningCreateSlice } from './slice';
import {
  selectWorkforcePlanningCreateError,
  selectWorkforcePlanningCreateLoading,
  selectWorkforcePlanningCreateSuccess,
} from './slice/selectors';
import { workforcePlanningCreateActions } from './slice';
import {
  useDepartmentsSlice,
  departmentsActions,
} from '@/slice/departmentsSlice';
import { selectDepartments } from '@/slice/departmentsSlice/selectors';
import { useToast } from '@/components/common/Toast';
import { usePermissions } from '@/hooks/usePermissions';
import { WorkforcePlanningCreateForm } from './components/WorkforcePlanningCreateForm';
import type { WorkforcePlan, WorkforcePlanFormPayload } from '@/types';
import {
  fetchWorkforcePlanById,
  updateWorkforcePlan,
  submitWorkforcePlan,
} from '@/pages/Recruitment/WorkforcePlanning/api';
import { PERMISSIONS } from '@/lib/permissions-shared';

const emptyPayload = (
  department?: { id: string; name: string } | null,
): WorkforcePlanFormPayload => ({
  title: '',
  departmentName: department?.name || '',
  businessUnit: '',
  planningPeriod: new Date().getFullYear().toString(),
  planningType: 'annual',
  quarter: 'Q1',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(new Date().getFullYear(), 11, 31)
    .toISOString()
    .slice(0, 10),
  justificationType: 'New role',
  justification: '',
  supportingDocumentName: '',
  items: [
    {
      departmentId: department?.id,
      departmentName: department?.name || '',
      jobTitle: '',
      employmentType: 'full_time',
      jobGrade: '',
      salaryBudget: undefined,
      positionType: 'new',
      replacementEmployeeRef: '',
      headcountRequired: 1,
      plannedStartDate: new Date().toISOString().slice(0, 10),
      justification: '',
      expectedImpact: '',
      requiredQualifications: '',
      remarks: '',
    },
  ],
});

const planToPayload = (plan: WorkforcePlan): WorkforcePlanFormPayload => ({
  title: plan.title,
  departmentName: plan.departmentName,
  businessUnit: plan.businessUnit,
  planningPeriod: plan.planningPeriod,
  planningType: plan.planningType,
  quarter: plan.quarter,
  startDate: plan.startDate,
  endDate: plan.endDate,
  justificationType: plan.justificationType,
  justification: plan.justification,
  supportingDocumentName: plan.supportingDocumentName,
  items: plan.items.map((item) => ({
    departmentId: item.departmentId,
    departmentName: item.departmentName,
    jobTitle: item.jobTitle,
    employmentType: item.employmentType,
    grade: item.grade,
    jobGrade: item.jobGrade || '',
    salaryBudget: item.salaryBudget,
    positionType: item.positionType,
    replacementEmployeeRef: item.replacementEmployeeRef,
    priority: item.priority,
    headcountRequired: item.headcountRequired,
    plannedStartDate: item.plannedStartDate,
    justification: item.justification,
    expectedImpact: item.expectedImpact,
    requiredQualifications: item.requiredQualifications,
    remarks: item.remarks,
  })),
});

export const WorkforcePlanningCreatePage: React.FC = () => {
  useWorkforcePlanningCreateSlice();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id: planId } = useParams<{ id?: string }>();
  const { toast } = useToast();
  const { role: currentRole, user: sessionUser, defaultPath } = useSession();
  const { can } = usePermissions();
  useDepartmentsSlice();
  const departments = useAppSelector(selectDepartments) as Array<{
    id: string;
    name: string;
  }>;
  const loading = useAppSelector(selectWorkforcePlanningCreateLoading);
  const error = useAppSelector(selectWorkforcePlanningCreateError);
  const success = useAppSelector(selectWorkforcePlanningCreateSuccess);
  const isEditMode = Boolean(planId);
  const canSelectAnyDepartment = can(
    PERMISSIONS.WORKFORCE_PLAN_UPDATE_ANY_DEPARTMENT,
  );
  const canCreatePlan = can(PERMISSIONS.WORKFORCE_PLAN_CREATE);
  const canUpdatePlan = can(PERMISSIONS.WORKFORCE_PLAN_UPDATE);
  const [saving, setSaving] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [editingPlanStatus, setEditingPlanStatus] = useState<
    WorkforcePlan['status'] | null
  >(null);

  const lockedDepartment = useMemo(() => {
    if (!sessionUser) {
      return null;
    }
    if (sessionUser.departmentId) {
      return (
        departments.find((dept) => dept.id === sessionUser.departmentId) || {
          id: sessionUser.departmentId,
          name: sessionUser.departmentName || 'Assigned department',
        }
      );
    }
    if (sessionUser.departmentName) {
      return (
        departments.find(
          (dept) =>
            dept.name.toLowerCase() ===
            sessionUser.departmentName!.toLowerCase(),
        ) || null
      );
    }
    return null;
  }, [departments, sessionUser]);

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(
    sessionUser?.departmentId || '',
  );
  const [form, setForm] = useState<WorkforcePlanFormPayload>(() =>
    emptyPayload(lockedDepartment),
  );

  if ((isEditMode && !canUpdatePlan) || (!isEditMode && !canCreatePlan)) {
    return <Navigate to={defaultPath} replace />;
  }

  const selectedDepartment = useMemo(() => {
    if (!canSelectAnyDepartment) {
      return lockedDepartment;
    }
    if (selectedDepartmentId) {
      return (
        departments.find((dept) => dept.id === selectedDepartmentId) ||
        lockedDepartment ||
        null
      );
    }
    return departments[0] || lockedDepartment || null;
  }, [
    canSelectAnyDepartment,
    departments,
    lockedDepartment,
    selectedDepartmentId,
  ]);

  useEffect(() => {
    dispatch(departmentsActions.fetchDepartmentsRequest());
  }, [dispatch]);

  useEffect(() => {
    if (!canSelectAnyDepartment && lockedDepartment) {
      setSelectedDepartmentId(lockedDepartment.id);
      return;
    }

    if (canSelectAnyDepartment && !selectedDepartmentId) {
      const nextId = sessionUser?.departmentId || departments[0]?.id || '';
      if (nextId) {
        setSelectedDepartmentId(nextId);
      }
    }
  }, [
    canSelectAnyDepartment,
    departments,
    lockedDepartment,
    selectedDepartmentId,
    sessionUser?.departmentId,
  ]);

  useEffect(() => {
    if (!selectedDepartment) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      departmentName: selectedDepartment.name,
      items: prev.items.map((item) => ({
        ...item,
        departmentId: selectedDepartment.id,
        departmentName: selectedDepartment.name,
      })),
    }));
  }, [selectedDepartment?.id, selectedDepartment?.name]);

  useEffect(() => {
    if (!isEditMode || !planId) {
      return;
    }

    let cancelled = false;
    setLoadingPlan(true);

    void (async () => {
      try {
        const plan = await fetchWorkforcePlanById(planId);
        if (cancelled) {
          return;
        }

        setForm(planToPayload(plan));
        setEditingPlanStatus(plan.status);
        const nextDepartmentId =
          plan.departmentId || plan.items[0]?.departmentId || '';
        if (nextDepartmentId) {
          setSelectedDepartmentId(nextDepartmentId);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          toast(
            err instanceof Error
              ? err.message
              : 'Failed to load workforce plan for editing.',
            'error',
          );
          navigate('/dashboard/workforce-planning');
        }
      } finally {
        if (!cancelled) {
          setLoadingPlan(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, navigate, planId, toast]);

  useEffect(() => {
    if (error) {
      toast(error, 'error');
    }
  }, [error, toast]);

  useEffect(() => {
    if (success) {
      toast('Workforce plan saved successfully.', 'success');
      dispatch(workforcePlanningCreateActions.reset());
      navigate('/dashboard/workforce-planning');
    }
  }, [success, toast, navigate, dispatch]);

  const setField = <K extends keyof WorkforcePlanFormPayload>(
    key: K,
    value: WorkforcePlanFormPayload[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const updateItem = (
    index: number,
    key: keyof WorkforcePlanFormPayload['items'][number],
    value: string | number | undefined,
  ) =>
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [key]: value };
      return { ...prev, items };
    });

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          jobTitle: '',
          departmentId: selectedDepartment?.id || prev.items[0]?.departmentId,
          departmentName: selectedDepartment?.name || prev.departmentName,
          employmentType: 'full_time',
          headcountRequired: 1,
          plannedStartDate: prev.startDate,
          justification: '',
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const persistPlan = async (status: 'draft' | 'submitted') => {
    if (!selectedDepartment) {
      toast('Please select a department first.', 'error');
      return;
    }

    const normalizedForm = {
      ...form,
      departmentName: selectedDepartment.name,
      items: form.items.map((item) => ({
        ...item,
        departmentId: selectedDepartment.id,
        departmentName: selectedDepartment.name,
      })),
    };
    const nextStatus = isEditMode ? undefined : status;

    if (isEditMode && planId) {
      setSaving(true);
      try {
        await updateWorkforcePlan(planId, normalizedForm, nextStatus);
        if (status === 'submitted') {
          await submitWorkforcePlan(planId);
        }
        toast(
          status === 'submitted'
            ? 'Workforce plan updated and submitted successfully.'
            : 'Workforce plan updated successfully.',
          'success',
        );
        navigate('/dashboard/workforce-planning');
      } catch (err: unknown) {
        let errorMessage = 'Failed to update workforce plan.';
        if (err instanceof Error) {
          // Parse Zod validation errors to show user-friendly messages
          const errorLower = err.message.toLowerCase();
          if (errorLower.includes('job_grade')) {
            errorMessage = 'Please select a job grade for all positions.';
          } else if (errorLower.includes('job_title')) {
            errorMessage = 'Please enter a job title for all positions.';
          } else if (errorLower.includes('headcount')) {
            errorMessage = 'Please enter a valid headcount for all positions.';
          } else if (errorLower.includes('justification')) {
            errorMessage = 'Please provide justification for all positions.';
          } else if (errorLower.includes('employment_type')) {
            errorMessage =
              'Please select an employment type for all positions.';
          } else if (errorLower.includes('planned_start')) {
            errorMessage =
              'Please provide a planned start date for all positions.';
          } else if (errorLower.includes('replacement_employee_ref')) {
            errorMessage =
              'Please provide a replacement employee reference for replacement positions.';
          } else if (errorLower.includes('expected_impact')) {
            errorMessage =
              'Please provide expected impact information for all positions.';
          } else if (errorLower.includes('required_qualifications')) {
            errorMessage =
              'Please provide required qualifications for all positions.';
          } else if (errorLower.includes('remarks')) {
            errorMessage = 'Please provide remarks for all positions.';
          } else if (
            errorLower.includes('title') &&
            errorLower.includes('string')
          ) {
            errorMessage = 'Please enter a plan title.';
          } else if (errorLower.includes('planning_period')) {
            errorMessage = 'Please enter a valid planning period.';
          } else if (
            errorLower.includes('items') &&
            errorLower.includes('min 1')
          ) {
            errorMessage =
              'Please add at least one position to the workforce plan.';
          } else {
            errorMessage = err.message;
          }
        }
        toast(errorMessage, 'error');
      } finally {
        setSaving(false);
      }
      return;
    }

    dispatch(
      workforcePlanningCreateActions.createWorkforcePlanRequest({
        payload: normalizedForm,
        status,
      }),
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 text-sm bg-slate-50 min-h-screen text-slate-800 animate-fade-in">
      {/* Breadcrumb navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={() => navigate('/dashboard/workforce-planning')}
          className="flex items-center gap-1 hover:text-slate-900 transition-colors font-medium"
        >
          <span className="material-symbols-outlined text-[14px]">
            arrow_back
          </span>
          Workforce Planning
        </button>
        <span className="text-slate-300">›</span>
        <span className="font-semibold text-slate-900">
          {isEditMode ? 'Edit Plan' : 'Create Plan'}
        </span>
      </nav>

      <div className="border-b border-slate-200 pb-5 mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {isEditMode ? 'Edit Workforce Plan' : 'Create Workforce Plan'}
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          {isEditMode
            ? 'Revise the returned plan and resubmit it for review.'
            : 'Draft headcount additions for reviews and requisition approvals.'}
        </p>
        {!selectedDepartment && (
          <p className="mt-2 text-xs font-medium text-amber-700">
            No assigned department was found for your account. Workforce plan
            creation is locked until the account is mapped to a department.
          </p>
        )}
        {canSelectAnyDepartment && (
          <p className="mt-2 text-xs font-medium text-slate-500">
            Users with department selection permission can switch the department
            before saving.
          </p>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        {loadingPlan ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Loading workforce plan...
          </div>
        ) : (
          <WorkforcePlanningCreateForm
            form={form}
            departments={departments}
            selectedDepartment={selectedDepartment}
            allowDepartmentSelection={canSelectAnyDepartment}
            canSubmit={Boolean(selectedDepartment) && !saving}
            isDepartmentsLoading={departments.length === 0}
            isDepartmentLocked={!selectedDepartment && !canSelectAnyDepartment}
            onDepartmentChange={(departmentId) =>
              setSelectedDepartmentId(departmentId)
            }
            setField={setField}
            updateItem={updateItem}
            addItem={addItem}
            removeItem={removeItem}
            onCancel={() => navigate('/dashboard/workforce-planning')}
            onSaveDraft={() => persistPlan('draft')}
            onSubmit={(e) => {
              e.preventDefault();
              persistPlan('submitted');
            }}
          />
        )}
      </div>

      {loading && !isEditMode && (
        <div className="text-sm text-slate-500 mt-3">
          Loading workforce planning data...
        </div>
      )}
    </div>
  );
};

export default WorkforcePlanningCreatePage;
