/**
 * permissions-shared.ts  —  FRONTEND SHARED CONSTANTS
 *
 * Mirrors the ROLES and PERMISSIONS from the backend rolePermissions.ts.
 * Do NOT import the full backend file here — only these constants are shared.
 *
 * The database is the live source of truth at runtime.
 * This file is used ONLY for:
 *   - usePermissions hook (slug type-safety + no magic strings in components)
 *   - Route guards (PermissionGate, RoleGuard)
 */

// ─────────────────────────────────────────────
// ROLES
// ─────────────────────────────────────────────

export const ROLES = {
  CEO: 'ceo',
  HR_ADMIN: 'hr_admin',
  HR: 'hr',
  WORK_UNIT: 'work_unit',
  RECRUITER: 'recruiter',
  HIRING_MANAGER: 'hiring_manager',
  DEPARTMENT_MANAGER: 'department_manager',
  INTERVIEWER: 'interviewer',
  CANDIDATE: 'candidate',
} as const;

export type RoleSlug = (typeof ROLES)[keyof typeof ROLES];

// ─────────────────────────────────────────────
// PERMISSIONS
// ─────────────────────────────────────────────

export const PERMISSIONS = {
  // ── Workforce planning ──────────────────────
  WORKFORCE_PLAN_READ: 'workforce_plan:read',
  WORKFORCE_PLAN_CREATE: 'workforce_plan:create',
  WORKFORCE_PLAN_UPDATE: 'workforce_plan:update',
  WORKFORCE_PLAN_UPDATE_ANY_DEPARTMENT: 'workforce_plan:update_any_department',
  WORKFORCE_PLAN_SUBMIT: 'workforce_plan:submit',
  WORKFORCE_PLAN_FORWARD: 'workforce_plan:forward',
  WORKFORCE_PLAN_APPROVE: 'workforce_plan:approve',
  WORKFORCE_PLAN_REJECT: 'workforce_plan:reject',
  WORKFORCE_PLAN_RETURN: 'workforce_plan:return',

  // ── Recruitment request ──────────────────────
  RECRUITMENT_REQUEST_READ: 'recruitment_request:read',
  RECRUITMENT_REQUEST_CREATE: 'recruitment_request:create',
  RECRUITMENT_REQUEST_UPDATE: 'recruitment_request:update',
  RECRUITMENT_REQUEST_SUBMIT: 'recruitment_request:submit',
  RECRUITMENT_REQUEST_FORWARD: 'recruitment_request:forward',
  RECRUITMENT_REQUEST_APPROVE: 'recruitment_request:approve',
  RECRUITMENT_REQUEST_REJECT: 'recruitment_request:reject',

  // ── Vacancy ──────────────────────────────────
  VACANCY_READ: 'vacancy:read',
  VACANCY_CREATE: 'vacancy:create',
  VACANCY_UPDATE: 'vacancy:update',
  VACANCY_PUBLISH: 'vacancy:publish',
  VACANCY_CLOSE: 'vacancy:close',

  // ── Applications ─────────────────────────────
  APPLICATION_READ: 'application:read',
  APPLICATION_SCREEN: 'application:screen',
  APPLICATION_SHORTLIST: 'application:shortlist',
  APPLICATION_REJECT: 'application:reject',

  // ── Interview ────────────────────────────────
  INTERVIEW_READ: 'interview:read',
  INTERVIEW_CREATE: 'interview:create',
  INTERVIEW_UPDATE: 'interview:update',
  INTERVIEW_EVALUATE: 'interview:evaluate',

  // ── Offer ────────────────────────────────────
  OFFER_READ: 'offer:read',
  OFFER_CREATE: 'offer:create',
  OFFER_UPDATE: 'offer:update',

  // ── Talent roster ────────────────────────────
  TALENT_ROSTER_READ: 'talent_roster:read',
  TALENT_ROSTER_MANAGE: 'talent_roster:manage',

  // ── Hiring minute ────────────────────────────
  HIRING_MINUTE_READ: 'hiring_minute:read',
  HIRING_MINUTE_CREATE: 'hiring_minute:create',
  HIRING_MINUTE_UPDATE: 'hiring_minute:update',
  HIRING_MINUTE_APPROVE: 'hiring_minute:approve',

  // ── Department ───────────────────────────────
  DEPARTMENT_READ: 'department:read',
  // NOTE: department:create is not currently part of the Prompt 1 matrix, but is
  // used elsewhere in the app. Keep it here as a valid permission slug.
  DEPARTMENT_CREATE: 'department:create',

  // ── Dashboard — candidate/personal widgets ──
  CANDIDATE_APPLICATION_READ: 'candidate_application:read',
  MY_VACANCY_READ: 'my_vacancy:read',
  MY_INTERVIEW_READ: 'my_interview:read',
  MY_EVALUATION_READ: 'my_evaluation:read',

  // ── System configuration ─────────────────────
  CONFIG_MANAGE: 'config:manage',

  // Backward-compatible aliases (older UI code references these names)
  CONFIG_READ: 'config:manage',
  CONFIG_WRITE: 'config:manage',

  // Backward-compatible reporting alias (older UI code references this)
  REPORTS_READ: 'report:read',
} as const;

export type PermissionSlug = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
