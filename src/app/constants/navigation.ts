import type { UserRole } from '@/state/appContext.types';
import { PERMISSIONS } from '@/lib/permissions-shared';
import type { PermissionSlug } from '@/lib/permissions-shared';

export interface NavItemConfig {
  id: string;
  label: string;
  icon: string;
  path: string;
}

type NavItemDefinition = NavItemConfig & {
  /** Item is shown when the user has AT LEAST ONE of these permissions.
   *  Omit to always show (used for Dashboard which everyone can see). */
  requiredPermissions?: PermissionSlug[];
};

const p = (segment: string) =>
  segment ? `/dashboard/${segment}` : '/dashboard';

// ─── Permission group constants ──────────────────────────────────────────────

const WORKFORCE_MODULE_PERMISSIONS: PermissionSlug[] = [
  PERMISSIONS.WORKFORCE_PLAN_READ,
  PERMISSIONS.WORKFORCE_PLAN_CREATE,
  PERMISSIONS.WORKFORCE_PLAN_UPDATE,
  PERMISSIONS.WORKFORCE_PLAN_SUBMIT,
  PERMISSIONS.WORKFORCE_PLAN_APPROVE,
  PERMISSIONS.WORKFORCE_PLAN_REJECT,
  PERMISSIONS.WORKFORCE_PLAN_RETURN,
];

const WORKFORCE_CREATE_PERMISSIONS: PermissionSlug[] = [
  PERMISSIONS.WORKFORCE_PLAN_CREATE,
];

// Any permission that means "this user touches interviews in some capacity".
// Used for the Interviews nav item — regardless of role, if the user has ANY
// of these they must see the interviews page so they can act on them.
const INTERVIEW_ANY_PERMISSIONS: PermissionSlug[] = [
  PERMISSIONS.INTERVIEW_READ,
  PERMISSIONS.INTERVIEW_CREATE,
  PERMISSIONS.INTERVIEW_UPDATE,
  PERMISSIONS.INTERVIEW_EVALUATE,
  PERMISSIONS.MY_INTERVIEW_READ,
  PERMISSIONS.MY_EVALUATION_READ,
];

// ─── Route access guards ─────────────────────────────────────────────────────

/** Route path -> roles allowed to view (RoleGuard step 2 check) */
export const ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/dashboard': [
    'candidate',
    'recruiter',
    'hr',
    'hr_admin',
    'ceo',
    'hiring_manager',
    'interviewer',
    'department_manager',
  ],
  [p('workforce-planning')]: [
    'recruiter',
    'hr',
    'hr_admin',
    'ceo',
    'department_manager',
  ],
  [p('workforce-planning/create')]: [
    'department_manager',
    'hr',
    'hr_admin',
    'recruiter',
  ],
  [p('recruitment-requests')]: [
    'recruiter',
    'hr',
    'hr_admin',
    'ceo',
    'hiring_manager',
    'department_manager',
  ],
  [p('recruitment-requests/create')]: [
    'department_manager',
    'hr_admin',
    'recruiter',
    'hiring_manager',
  ],
  [p('vacancies')]: [
    'recruiter',
    'hr',
    'hr_admin',
    'department_manager',
    'hiring_manager',
  ],
  [p('screening')]: ['recruiter', 'hr', 'hr_admin', 'department_manager'],
  [p('shortlisted')]: ['recruiter', 'hr', 'hr_admin', 'department_manager'],
  [p('kanban')]: ['recruiter', 'hr', 'hr_admin'],
  // interviews page is accessible by every internal user who has any interview
  // permission — the page itself filters what each user sees
  [p('interviews')]: [
    'recruiter',
    'hr',
    'hr_admin',
    'hiring_manager',
    'interviewer',
    'department_manager',
    'ceo',
  ],
  [p('question-bank')]: [
    'recruiter',
    'hr',
    'hr_admin',
    'hiring_manager',
    'interviewer',
  ],
  [p('offers')]: ['recruiter', 'hr', 'hr_admin', 'ceo', 'candidate'],
  [p('roster')]: ['recruiter', 'hr', 'hr_admin'],
  [p('settings')]: ['recruiter', 'hr', 'hr_admin'],
  [p('configuration')]: ['hr_admin', 'ceo'],
  [p('settings/configuration/roles-permissions')]: ['hr_admin', 'ceo'],
  [p('applications')]: ['candidate'],
  [p('job-search')]: ['candidate'],
  [p('profile')]: ['candidate', 'interviewer'],
  [p('candidate-interviews')]: ['candidate'],
  [p('candidate-offers')]: ['candidate'],
  [p('candidate-settings')]: ['candidate'],
  [p('candidate-notifications')]: ['candidate'],
  [p('vacancies/:vacancyId/evaluation')]: [
    'recruiter',
    'hr',
    'hr_admin',
    'hiring_manager',
    'interviewer',
    'department_manager',
    'ceo',
  ],
  [p('vacancies/:vacancyId/hiring-minute')]: [
    'recruiter',
    'hr',
    'hr_admin',
    'hiring_manager',
    'ceo',
  ],
  [p('interviews/:interviewId/evaluate')]: [
    'recruiter',
    'hr',
    'hr_admin',
    'hiring_manager',
    'interviewer',
    'department_manager',
    'ceo',
  ],
};

export const ROUTE_PERMISSION_ACCESS: Record<string, PermissionSlug[]> = {
  [p('workforce-planning')]: WORKFORCE_MODULE_PERMISSIONS,
  [p('workforce-planning/create')]: WORKFORCE_CREATE_PERMISSIONS,
  [p('recruitment-requests')]: [
    PERMISSIONS.RECRUITMENT_REQUEST_READ,
    PERMISSIONS.RECRUITMENT_REQUEST_CREATE,
    PERMISSIONS.RECRUITMENT_REQUEST_UPDATE,
    PERMISSIONS.RECRUITMENT_REQUEST_APPROVE,
    PERMISSIONS.RECRUITMENT_REQUEST_REJECT,
  ],
  [p('recruitment-requests/create')]: [
    PERMISSIONS.RECRUITMENT_REQUEST_CREATE,
    PERMISSIONS.RECRUITMENT_REQUEST_UPDATE,
  ],
  [p('vacancies')]: [
    PERMISSIONS.VACANCY_READ,
    PERMISSIONS.VACANCY_CREATE,
    PERMISSIONS.VACANCY_UPDATE,
    PERMISSIONS.VACANCY_PUBLISH,
    PERMISSIONS.VACANCY_CLOSE,
  ],
  [p('screening')]: [
    PERMISSIONS.APPLICATION_READ,
    PERMISSIONS.APPLICATION_SCREEN,
    PERMISSIONS.APPLICATION_SHORTLIST,
    PERMISSIONS.APPLICATION_REJECT,
  ],
  [p('shortlisted')]: [
    PERMISSIONS.APPLICATION_READ,
    PERMISSIONS.APPLICATION_SHORTLIST,
  ],
  [p('kanban')]: [
    PERMISSIONS.APPLICATION_READ,
    PERMISSIONS.APPLICATION_SCREEN,
    PERMISSIONS.APPLICATION_SHORTLIST,
  ],
  // Any interview-related permission grants access to the interviews page
  [p('interviews')]: INTERVIEW_ANY_PERMISSIONS,
  [p('question-bank')]: [
    PERMISSIONS.INTERVIEW_READ,
    PERMISSIONS.INTERVIEW_CREATE,
    PERMISSIONS.INTERVIEW_UPDATE,
    PERMISSIONS.INTERVIEW_EVALUATE,
  ],
  [p('offers')]: [
    PERMISSIONS.OFFER_READ,
    PERMISSIONS.OFFER_CREATE,
    PERMISSIONS.OFFER_UPDATE,
  ],
  [p('roster')]: [
    PERMISSIONS.TALENT_ROSTER_READ,
    PERMISSIONS.TALENT_ROSTER_MANAGE,
  ],
  [p('settings/configuration/roles-permissions')]: [PERMISSIONS.CONFIG_MANAGE],
  [p('configuration')]: [PERMISSIONS.CONFIG_MANAGE],
  [p('settings')]: [PERMISSIONS.CONFIG_MANAGE],
  [p('vacancies/:vacancyId/evaluation')]: [
    PERMISSIONS.HIRING_MINUTE_READ,
    PERMISSIONS.INTERVIEW_EVALUATE,
  ],
  [p('vacancies/:vacancyId/hiring-minute')]: [
    PERMISSIONS.HIRING_MINUTE_READ,
    PERMISSIONS.HIRING_MINUTE_APPROVE,
  ],
  [p('interviews/:interviewId/evaluate')]: [
    PERMISSIONS.INTERVIEW_EVALUATE,
  ],
};

// ─── Master nav item list (all internal users) ───────────────────────────────
// Every non-candidate role uses this single list filtered by requiredPermissions.
// This means permission changes in the config UI instantly affect nav visibility
// — no role name is checked here at all.

const INTERNAL_NAV_ITEMS: NavItemDefinition[] = [
  // ── Always visible ──────────────────────────────────────────────────────
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/dashboard',
    // No requiredPermissions — every authenticated internal user sees the dashboard
  },

  // ── Workforce ───────────────────────────────────────────────────────────
  {
    id: 'workforce_planning',
    label: 'Workforce planning',
    icon: 'event_seat',
    path: p('workforce-planning'),
    requiredPermissions: WORKFORCE_MODULE_PERMISSIONS,
  },

  // ── Recruitment ─────────────────────────────────────────────────────────
  {
    id: 'recruitment_requests',
    label: 'Recruitment requests',
    icon: 'assignment',
    path: p('recruitment-requests'),
    requiredPermissions: [
      PERMISSIONS.RECRUITMENT_REQUEST_READ,
      PERMISSIONS.RECRUITMENT_REQUEST_CREATE,
      PERMISSIONS.RECRUITMENT_REQUEST_UPDATE,
      PERMISSIONS.RECRUITMENT_REQUEST_APPROVE,
      PERMISSIONS.RECRUITMENT_REQUEST_REJECT,
    ],
  },
  {
    id: 'vacancies',
    label: 'Vacancies',
    icon: 'work',
    path: p('vacancies'),
    requiredPermissions: [
      PERMISSIONS.VACANCY_READ,
      PERMISSIONS.VACANCY_CREATE,
      PERMISSIONS.VACANCY_UPDATE,
      PERMISSIONS.VACANCY_PUBLISH,
      PERMISSIONS.VACANCY_CLOSE,
    ],
  },

  // ── Pipeline ────────────────────────────────────────────────────────────
  {
    id: 'screening',
    label: 'Screening',
    icon: 'group',
    path: p('screening'),
    requiredPermissions: [
      PERMISSIONS.APPLICATION_READ,
      PERMISSIONS.APPLICATION_SCREEN,
      PERMISSIONS.APPLICATION_SHORTLIST,
      PERMISSIONS.APPLICATION_REJECT,
    ],
  },
  {
    id: 'shortlisted',
    label: 'Shortlisted',
    icon: 'done_all',
    path: p('shortlisted'),
    requiredPermissions: [
      PERMISSIONS.APPLICATION_READ,
      PERMISSIONS.APPLICATION_SHORTLIST,
    ],
  },
  {
    id: 'kanban',
    label: 'Pipeline',
    icon: 'view_kanban',
    path: p('kanban'),
    requiredPermissions: [
      PERMISSIONS.APPLICATION_READ,
      PERMISSIONS.APPLICATION_SCREEN,
      PERMISSIONS.APPLICATION_SHORTLIST,
    ],
  },

  // ── Interviews — shown to ANYONE with any interview-related permission ──
  // This covers HR users who schedule, interviewers who evaluate, hiring
  // managers assigned as panel members, and any other role given these perms.
  {
    id: 'interviews',
    label: 'Interviews',
    icon: 'calendar_today',
    path: p('interviews'),
    requiredPermissions: INTERVIEW_ANY_PERMISSIONS,
  },
  {
    id: 'question_bank',
    label: 'Question bank',
    icon: 'quiz',
    path: p('question-bank'),
    requiredPermissions: [
      PERMISSIONS.INTERVIEW_READ,
      PERMISSIONS.INTERVIEW_CREATE,
      PERMISSIONS.INTERVIEW_UPDATE,
      PERMISSIONS.INTERVIEW_EVALUATE,
    ],
  },

  // ── Hiring Minute — shown when user can read or act on hiring minutes ───
  {
    id: 'hiring_minute',
    label: 'Hiring minutes',
    icon: 'description',
    path: p('vacancies'),
    // Hiring minute detail lives in the vacancy detail tab — navigate there.
    // Anyone who can read, create, or approve hiring minutes sees this entry.
    requiredPermissions: [
      PERMISSIONS.HIRING_MINUTE_READ,
      PERMISSIONS.HIRING_MINUTE_CREATE,
      PERMISSIONS.HIRING_MINUTE_APPROVE,
    ],
  },

  // ── Post-selection ──────────────────────────────────────────────────────
  {
    id: 'offers',
    label: 'Offers & onboarding',
    icon: 'local_offer',
    path: p('offers'),
    requiredPermissions: [
      PERMISSIONS.OFFER_READ,
      PERMISSIONS.OFFER_CREATE,
      PERMISSIONS.OFFER_UPDATE,
    ],
  },
  {
    id: 'roster',
    label: 'Talent pool',
    icon: 'badge',
    path: p('roster'),
    requiredPermissions: [
      PERMISSIONS.TALENT_ROSTER_READ,
      PERMISSIONS.TALENT_ROSTER_MANAGE,
    ],
  },
];

// ─── getNavItemsForRole ───────────────────────────────────────────────────────

export function getNavItemsForRole(
  role: UserRole,
  permissions: string[] = [],
): NavItemConfig[] {
  // Candidates have their own fixed nav — no permission filtering needed
  if (role === 'candidate') {
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'dashboard',
        path: '/dashboard',
      },
      {
        id: 'applications',
        label: 'My applications',
        icon: 'work',
        path: p('applications'),
      },
      {
        id: 'job_search',
        label: 'Browse vacancies',
        icon: 'search',
        path: p('job-search'),
      },
      {
        id: 'interviews',
        label: 'Interviews',
        icon: 'calendar_today',
        path: p('candidate-interviews'),
      },
      {
        id: 'offers',
        label: 'Offers',
        icon: 'local_offer',
        path: p('candidate-offers'),
      },
      { id: 'profile', label: 'Profile', icon: 'person', path: p('profile') },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: 'notifications',
        path: p('candidate-notifications'),
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: 'settings',
        path: p('candidate-settings'),
      },
    ];
  }

  // All other roles: filter the master list by what the user can actually do.
  // No role names checked here — permissions from the DB drive visibility.
  const allowedPermissions = new Set(
    permissions.filter(Boolean) as PermissionSlug[],
  );

  const canSee = (requiredPermissions?: PermissionSlug[]) =>
    !requiredPermissions?.length ||
    requiredPermissions.some((perm) => allowedPermissions.has(perm));

  // Deduplicate: hiring_minute shows vacancies path, same as vacancies item.
  // If user already has vacancies access, drop the redundant hiring_minute entry.
  const filtered = INTERNAL_NAV_ITEMS.filter((item) => canSee(item.requiredPermissions));

  const hasVacanciesItem = filtered.some((item) => item.id === 'vacancies');
  return filtered.filter(
    (item) => !(item.id === 'hiring_minute' && hasVacanciesItem),
  );
}

// ─── canAccessPath ────────────────────────────────────────────────────────────

export function canAccessPath(
  pathname: string,
  role: UserRole,
  permissions: string[] = [],
): boolean {
  const normalized = pathname.replace(/\/$/, '') || '/dashboard';

  const rules = Object.entries(ROUTE_ACCESS).sort(
    (a, b) => b[0].length - a[0].length,
  );

  const allowedPermissions = new Set(
    permissions.filter(Boolean) as PermissionSlug[],
  );

  for (const [routePrefix, roles] of rules) {
    if (
      normalized === routePrefix ||
      (routePrefix !== '/dashboard' && normalized.startsWith(routePrefix))
    ) {
      if (!roles.includes(role)) {
        return false;
      }

      const permissionRules = Object.entries(ROUTE_PERMISSION_ACCESS).sort(
        (a, b) => b[0].length - a[0].length,
      );
      for (const [permissionPrefix, requiredPermissions] of permissionRules) {
        if (
          normalized === permissionPrefix ||
          (permissionPrefix !== '/dashboard' &&
            normalized.startsWith(permissionPrefix))
        ) {
          return requiredPermissions.some((permission) =>
            allowedPermissions.has(permission),
          );
        }
      }

      return true;
    }
  }

  return normalized === '/dashboard';
}

// ─── getDefaultDashboardPath ──────────────────────────────────────────────────

export function getDefaultDashboardPath(
  role: UserRole,
  permissions: string[] = [],
): string {
  if (role === 'candidate') {
    return '/dashboard/candidate';
  }
  const items = getNavItemsForRole(role, permissions);
  return items[0]?.path ?? '/dashboard';
}
