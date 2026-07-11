import type { UserRole } from '@/state';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  actionTab?: string;
  icon: string;
}

const HR_NOTIFICATIONS: AppNotification[] = [
  { id: 'n-hr-1', title: 'New application', body: 'Alexander Sterling applied for Senior Wealth Manager.', time: '2h ago', read: false, actionTab: 'screening', icon: 'person_add' },
  { id: 'n-hr-2', title: 'Interview scheduled', body: 'Panel interview tomorrow 10:00 for Sterling.', time: '5h ago', read: false, actionTab: 'interviews', icon: 'calendar_today' },
  { id: 'n-hr-3', title: 'Offer pending approval', body: 'OFF-2026-001 awaiting executive sign-off.', time: '1d ago', read: true, actionTab: 'offers', icon: 'local_offer' },
  { id: 'n-hr-4', title: 'Workforce plan submitted', body: 'FY27 plan entered HR review queue.', time: '2d ago', read: true, actionTab: 'workforce_planning', icon: 'event_seat' },
];

const CANDIDATE_NOTIFICATIONS: AppNotification[] = [
  { id: 'n-c-1', title: 'Interview scheduled', body: 'Virtual panel interview on May 24 at 10:00 EAT.', time: '1h ago', read: false, actionTab: 'applications', icon: 'videocam' },
  { id: 'n-c-2', title: 'Application received', body: 'Your application for Senior Wealth Manager was received.', time: '3d ago', read: true, actionTab: 'applications', icon: 'check_circle' },
  { id: 'n-c-3', title: 'Profile reminder', body: 'Upload your latest CV to stay eligible for roles.', time: '1w ago', read: true, actionTab: 'documents', icon: 'upload_file' },
];

const CEO_NOTIFICATIONS: AppNotification[] = [
  { id: 'n-ceo-1', title: 'Requisition pending', body: '2 recruitment requests need your approval.', time: '4h ago', read: false, actionTab: 'requisitions', icon: 'assignment' },
  { id: 'n-ceo-2', title: 'Offer package ready', body: 'Senior Wealth Manager offer pending signature.', time: '1d ago', read: false, actionTab: 'offers', icon: 'verified' },
  { id: 'n-ceo-3', title: 'Workforce plan approved', body: 'FY26 strategic plan was authorized last week.', time: '5d ago', read: true, actionTab: 'planning', icon: 'event_seat' },
];

const HM_NOTIFICATIONS: AppNotification[] = [
  { id: 'n-hm-1', title: 'Scorecard due', body: 'Complete evaluation for Alexander Sterling.', time: 'Today', read: false, actionTab: 'dashboard', icon: 'rate_review' },
  { id: 'n-hm-2', title: 'Request approved', body: 'Cloud Engineer request approved by CEO.', time: '2d ago', read: true, actionTab: 'requisitions', icon: 'check' },
];

export function getNotificationsForRole(role: UserRole): AppNotification[] {
  switch (role) {
    case 'recruiter': return HR_NOTIFICATIONS;
    case 'candidate': return CANDIDATE_NOTIFICATIONS;
    case 'ceo': return CEO_NOTIFICATIONS;
    case 'hiring_manager': return HM_NOTIFICATIONS;
    default: return [];
  }
}
