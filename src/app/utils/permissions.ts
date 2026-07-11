import type { User, WorkforcePlan, RecruitmentRequest } from '../types';

/**
 * Permission utility functions for role-based access control
 */

// Helper to check if user is in a specific role
const hasRole = (user: User, ...roles: User['roleSlug'][]): boolean => {
  return roles.includes(user.roleSlug);
};

// Helper to check if user owns the department
const ownsDepartment = (
  user: User,
  departmentId?: string,
  departmentName?: string,
): boolean => {
  if (user.departmentId && departmentId && user.departmentId === departmentId) {
    return true;
  }
  if (
    user.departmentName &&
    departmentName &&
    user.departmentName.toLowerCase() === departmentName.toLowerCase()
  ) {
    return true;
  }
  return false;
};

/**
 * Check if user can create a workforce plan
 * - Department managers / HR / HR admin / recruiter: own department only
 * - CEO: does not create workforce plans directly
 */
export const canCreateWorkforcePlan = (
  user: User,
  targetDepartmentId?: string,
): boolean => {
  if (hasRole(user, 'ceo')) {
    return false;
  }
  if (!targetDepartmentId) {
    return false;
  }
  return ownsDepartment(user, targetDepartmentId);
};

/**
 * Check if user can view a workforce plan
 * - Department managers: own department only
 * - HR admin, recruiter, CEO: all plans
 */
export const canViewWorkforcePlan = (
  user: User,
  plan: WorkforcePlan,
): boolean => {
  if (hasRole(user, 'ceo', 'hr_admin', 'recruiter')) {
    return true;
  }
  if (hasRole(user, 'department_manager')) {
    return (
      ownsDepartment(
        user,
        plan.departmentId || plan.items?.[0]?.departmentId,
        plan.departmentName,
      )
    );
  }
  return false;
};

/**
 * Check if user can edit/update a workforce plan (only in draft status)
 * - Creator of draft plan in own department
 * - CEO: cannot edit (only approve)
 */
export const canEditWorkforcePlan = (
  user: User,
  plan: WorkforcePlan,
): boolean => {
  if (plan.status !== 'draft') {
    return false; // Can only edit draft plans
  }
  return ownsDepartment(
    user,
    plan.departmentId || plan.items?.[0]?.departmentId,
    plan.departmentName,
  );
};

/**
 * Check if user can submit a workforce plan for approval
 * - Creator in draft status and own department only
 */
export const canSubmitWorkforcePlan = (
  user: User,
  plan: WorkforcePlan,
): boolean => {
  if (plan.status !== 'draft') {
    return false;
  }
  return ownsDepartment(
    user,
    plan.departmentId || plan.items?.[0]?.departmentId,
    plan.departmentName,
  );
};

/**
 * Check if user can approve a workforce plan
 * - CEO: final approval
 * - HR admin/recruiter: review/submit
 */
export const canApproveWorkforcePlan = (
  user: User,
  plan: WorkforcePlan,
): boolean => {
  return hasRole(user, 'ceo') && plan.status === 'pending_ceo';
};

/**
 * Check if user can create a recruitment request
 * - Department managers: own department only
 * - HR admin & recruiter: all departments
 */
export const canCreateRecruitmentRequest = (
  user: User,
  targetDepartmentId?: string,
): boolean => {
  if (hasRole(user, 'ceo', 'hr_admin', 'recruiter')) {
    return true;
  }
  if (hasRole(user, 'department_manager')) {
    return targetDepartmentId
      ? ownsDepartment(user, targetDepartmentId)
      : false;
  }
  return false;
};

/**
 * Check if user can view a recruitment request
 * - Creator/department manager of the request
 * - HR admin & recruiter: all requests
 * - CEO: all requests
 */
export const canViewRecruitmentRequest = (
  user: User,
  request: RecruitmentRequest,
): boolean => {
  if (hasRole(user, 'ceo', 'hr_admin', 'recruiter')) {
    return true;
  }
  if (hasRole(user, 'department_manager')) {
    return (
      user.id === request.requestedBy ||
      ownsDepartment(user, request.departmentId)
    );
  }
  return false;
};

/**
 * Check if user can approve/review recruitment request
 * - HR admin & recruiter: can review and forward to CEO
 * - CEO: final approval
 */
export const canReviewRecruitmentRequest = (
  user: User,
  request: RecruitmentRequest,
): boolean => {
  if (hasRole(user, 'hr_admin', 'recruiter')) {
    return request.status === 'submitted' || request.status === 'under_review';
  }
  if (hasRole(user, 'ceo')) {
    return request.status === 'pending_ceo';
  }
  return false;
};

/**
 * Check if user can create a vacancy
 * - HR admin & recruiter only
 * - CEO: can view but cannot create directly
 */
export const canCreateVacancy = (user: User): boolean => {
  return hasRole(user, 'hr_admin', 'recruiter');
};

/**
 * Check if user can view all workforce data
 * - CEO & HR admin & recruiter: full visibility
 * - Department manager: own department only
 */
export const hasFullDataVisibility = (user: User): boolean => {
  return hasRole(user, 'ceo', 'hr_admin', 'recruiter');
};

/**
 * Get department filter for data retrieval
 * Returns undefined for full access, or departmentId for filtered access
 */
export const getDepartmentFilter = (user: User): string | undefined => {
  if (hasRole(user, 'department_manager')) {
    return user.departmentId;
  }
  return undefined; // No filter = full access
};

/**
 * Check if user can access role switcher
 * Used to determine who can test different roles
 */
export const canAccessRoleSwitcher = (user: User): boolean => {
  // For development: allow switcher access to non-applicant users
  return !hasRole(user, 'applicant');
};

/**
 * Check if user can perform HR operations
 * Includes screening, shortlisting, interview coordination
 */
export const canPerformHROperations = (user: User): boolean => {
  return hasRole(user, 'hr_admin', 'recruiter', 'ceo');
};

/**
 * Check if user can participate in interviews as panel member
 */
export const canBeInterviewPanelMember = (user: User): boolean => {
  return hasRole(
    user,
    'hr_admin',
    'recruiter',
    'hiring_manager',
    'department_manager',
  );
};

/**
 * Get list of allowed departments for user
 * Returns all departments if user has full access
 */
export const getAllowedDepartments = (
  user: User,
  allDepartments: string[],
): string[] => {
  if (hasFullDataVisibility(user)) {
    return allDepartments;
  }
  if (user.departmentName) {
    return [user.departmentName];
  }
  return [];
};
