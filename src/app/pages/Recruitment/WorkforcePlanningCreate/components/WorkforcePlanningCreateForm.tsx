import React from 'react';
import type { WorkforcePlanFormPayload } from '@/types';

interface WorkforcePlanningCreateFormProps {
  form: WorkforcePlanFormPayload;
  departments: Array<{ id: string; name: string }>;
  selectedDepartment?: { id: string; name: string } | null;
  allowDepartmentSelection?: boolean;
  canSubmit?: boolean;
  isDepartmentsLoading?: boolean;
  isDepartmentLocked?: boolean;
  onDepartmentChange?: (departmentId: string) => void;
  setField: <K extends keyof WorkforcePlanFormPayload>(
    key: K,
    value: WorkforcePlanFormPayload[K],
  ) => void;
  updateItem: (
    index: number,
    key: keyof WorkforcePlanFormPayload['items'][number],
    value: string | number | undefined,
  ) => void;
  addItem: () => void;
  removeItem: (index: number) => void;
  onCancel: () => void;
  onSaveDraft: (e?: React.FormEvent) => void;
  onSubmit: (event: React.FormEvent) => void;
}

export const WorkforcePlanningCreateForm: React.FC<
  WorkforcePlanningCreateFormProps
> = ({
  form,
  departments: _departments,
  selectedDepartment,
  allowDepartmentSelection = false,
  canSubmit = true,
  isDepartmentsLoading = false,
  isDepartmentLocked = false,
  onDepartmentChange,
  setField,
  updateItem,
  addItem,
  removeItem,
  onCancel,
  onSaveDraft,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Department locked notice */}
      {isDepartmentLocked && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0 mt-0.5">lock</span>
          <p className="text-sm text-amber-800 font-medium">
            Form is locked. Your account is not mapped to a department.
            Contact an administrator to assign your department before creating a plan.
          </p>
        </div>
      )}
      {/* Top Meta Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 self-start sm:self-auto"
        >
          <span>←</span> Back to plans
        </button>
        <p className="text-xs font-medium text-slate-500">
          Start your new workforce plan and submit it when ready.
        </p>
      </div>

      {/* Primary Details Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Plan Title
          </label>
          <input
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 font-medium text-slate-800"
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            required
            placeholder="Annual branch operations hiring plan"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Planning Cadence
          </label>
          <select
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
            value={form.planningType}
            onChange={(e) =>
              setField('planningType', e.target.value as 'annual' | 'quarterly')
            }
          >
            <option value="annual">Annual</option>
            <option value="quarterly">Quarterly</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Planning Period (Year)
          </label>
          <input
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
            type="number"
            value={form.planningPeriod}
            onChange={(e) => setField('planningPeriod', e.target.value)}
            required
            min={2024}
            max={2035}
          />
        </div>

        {form.planningType === 'quarterly' && (
          <div className="md:col-span-2 animate-fade-in">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Quarter
            </label>
            <select
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
              value={form.quarter || 'Q1'}
              onChange={(e) => setField('quarter', e.target.value)}
              required
            >
              {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter) => (
                <option key={quarter} value={quarter}>
                  {quarter}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Department
          </label>
          {allowDepartmentSelection ? (
            <select
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
              value={selectedDepartment?.id || ''}
              onChange={(e) => onDepartmentChange?.(e.target.value)}
            >
              <option value="" disabled>
                Select department
              </option>
              {(_departments || []).map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          ) : selectedDepartment ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <p className="text-sm font-semibold text-slate-800">
                {selectedDepartment.name}
              </p>
              <p className="text-[11px] text-slate-500">
                Locked to your assigned department.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5">
              <p className="text-sm font-semibold text-amber-900">
                Department not assigned
              </p>
              <p className="text-[11px] text-amber-800">
                Your account does not have an assigned department yet.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Business Unit
          </label>
          <input
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 font-medium text-slate-800"
            value={form.businessUnit}
            onChange={(e) => setField('businessUnit', e.target.value)}
            placeholder="Enter business unit or function"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Supporting Document / BRD Reference
          </label>
          <input
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 font-medium text-slate-800"
            value={form.supportingDocumentName || ''}
            onChange={(e) => setField('supportingDocumentName', e.target.value)}
            placeholder="Example: FY27 BRD headcount request"
          />
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Dynamic Positions Sub-section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Positions Included
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Specify headcount allotments, roles, and targeting metrics.
            </p>
          </div>
          <button
            type="button"
            className="border border-indigo-200 text-indigo-600 bg-indigo-50/50 font-semibold px-3.5 py-1.5 rounded-lg text-xs shadow-sm hover:bg-indigo-50 hover:text-indigo-700 active:bg-indigo-100 transition-all"
            onClick={addItem}
          >
            + Add Position
          </button>
        </div>

        <div className="space-y-5">
          {form.items.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 bg-slate-50/40 p-5 space-y-4 relative group hover:border-slate-300 transition-colors"
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Position Title
                  </label>
                  <input
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                    value={item.jobTitle}
                    onChange={(e) =>
                      updateItem(index, 'jobTitle', e.target.value)
                    }
                    required
                    placeholder="Senior Wealth Manager"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Headcount
                  </label>
                  <input
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-800"
                    type="number"
                    min={1}
                    value={item.headcountRequired}
                    onChange={(e) =>
                      updateItem(
                        index,
                        'headcountRequired',
                        Number(e.target.value),
                      )
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Target Start Date
                  </label>
                  <input
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                    type="date"
                    value={item.plannedStartDate}
                    onChange={(e) =>
                      updateItem(index, 'plannedStartDate', e.target.value)
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Employment Type
                  </label>
                  <select
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                    value={item.employmentType}
                    onChange={(e) =>
                      updateItem(index, 'employmentType', e.target.value)
                    }
                  >
                    <option value="full_time">Full-time</option>
                    <option value="part_time">Part-time</option>
                    <option value="contractor">Contract</option>
                    <option value="internship">Internship</option>
                    </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Job Grade
                  </label>
                  <select
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                    value={item.jobGrade || ''}
                    onChange={(e) => updateItem(index, 'jobGrade', e.target.value)}
                  >
                    <option value="">Select grade</option>
                    <option value="Level 1">Level 1</option>
                    <option value="Level 2">Level 2</option>
                    <option value="Level 3">Level 3</option>
                    <option value="Level 4">Level 4</option>
                    <option value="Level 5">Level 5</option>
                    <option value="Level 6">Level 6</option>
                    <option value="Level 7">Level 7</option>
                    <option value="Level 8">Level 8</option>
                    <option value="Level 9">Level 9</option>
                    <option value="Level 10">Level 10</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Salary Budget
                  </label>
                  <input
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                    type="number"
                    min={0}
                    value={item.salaryBudget ?? ''}
                    onChange={(e) =>
                      updateItem(
                        index,
                        'salaryBudget',
                        e.target.value === '' ? undefined : Number(e.target.value),
                      )
                    }
                    placeholder="5000"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Position Type
                  </label>
                  <select
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                    value={item.positionType || 'new'}
                    onChange={(e) =>
                      updateItem(index, 'positionType', e.target.value)
                    }
                  >
                    <option value="new">New position</option>
                    <option value="replacement">Replacement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Priority
                  </label>
                  <select
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                    value={item.priority || 'Medium'}
                    onChange={(e) => updateItem(index, 'priority', e.target.value)}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {(item.positionType || 'new') === 'replacement' && (
                  <div className="animate-fade-in">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Replacement Employee Reference
                    </label>
                    <input
                      className="w-full px-3 py-1.5 text-sm border border-slate-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                      value={item.replacementEmployeeRef || ''}
                      onChange={(e) =>
                        updateItem(index, 'replacementEmployeeRef', e.target.value)
                      }
                      placeholder="Employee ID or name"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Required Qualifications
                  </label>
                  <input
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                    value={item.requiredQualifications || ''}
                    onChange={(e) =>
                      updateItem(index, 'requiredQualifications', e.target.value)
                    }
                    placeholder="Bachelor's degree, 3+ years experience"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Expected Impact
                  </label>
                  <textarea
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-slate-700 min-h-[70px] resize-y"
                    value={item.expectedImpact || ''}
                    onChange={(e) =>
                      updateItem(index, 'expectedImpact', e.target.value)
                    }
                    placeholder="Operational or commercial outcome expected from this role"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Remarks
                  </label>
                  <textarea
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-slate-700 min-h-[70px] resize-y"
                    value={item.remarks || ''}
                    onChange={(e) => updateItem(index, 'remarks', e.target.value)}
                    placeholder="Any additional notes for HR or CEO review"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Position Justification
                </label>
                <textarea
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-slate-700 min-h-[70px] resize-y"
                  value={item.justification}
                  onChange={(e) =>
                    updateItem(index, 'justification', e.target.value)
                  }
                  required
                  placeholder="Why this specific role is needed at this time..."
                />
              </div>

              {form.items.length > 1 && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    className="text-xs text-rose-500 font-semibold hover:text-rose-600 bg-rose-50 hover:bg-rose-100/70 transition-all px-2.5 py-1 rounded-md border border-rose-100"
                    onClick={() => removeItem(index)}
                  >
                    Remove Position
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Corporate Strategy Justification Block */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          Global Business Justification
        </label>
        <textarea
          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-slate-700 min-h-[110px] resize-y"
          value={form.justification}
          onChange={(e) => setField('justification', e.target.value)}
          required
          placeholder="Explain high-level business need, operational ROI, budget alignment, and overall team scaling timeline details."
        />
      </div>

      {/* Submission Panel Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          disabled={!canSubmit}
          className="w-full sm:w-auto border border-slate-200 text-slate-700 font-semibold px-5 py-2 rounded-lg text-sm shadow-sm hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onSaveDraft}
        >
          Save Draft
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full sm:w-auto bg-indigo-600 text-white font-semibold px-5 py-2 rounded-lg text-sm shadow-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit for Review
        </button>
      </div>
    </form>
  );
};
