import type { Application, Interview, JobOffer, Vacancy, VacancyStatus } from '../types';

export function generateVacancyDisplayCode(seq: number, year = new Date().getFullYear()): string {
  return `VAC-${year}-${String(seq).padStart(3, '0')}`;
}

export function daysOpen(vacancy: Vacancy): number {
  const start = new Date(vacancy.createdAt).getTime();
  const end = vacancy.filledAt
    ? new Date(vacancy.filledAt).getTime()
    : Date.now();
  return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
}

export function isUrgentVacancy(vacancy: Vacancy): boolean {
  if (vacancy.isUrgent) return true;
  if (!vacancy.closingDate) return false;
  const daysToClose = Math.floor(
    (new Date(vacancy.closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return daysToClose >= 0 && daysToClose <= 14;
}

export function vacancyStatusBadge(status: VacancyStatus): { label: string; className: string } {
  const normalized = String(status ?? '').toLowerCase() as VacancyStatus;
  const map: Record<VacancyStatus, { label: string; className: string }> = {
    draft: { label: '📝 Draft', className: 'bg-surface-container text-on-surface-variant border border-outline-variant' },
    pending_approval: { label: '📝 Draft', className: 'bg-surface-container text-on-surface-variant border border-outline-variant' },
    open: { label: '🟢 Open', className: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
    published: { label: '🟢 Published', className: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
    in_progress: { label: '🔵 In Progress', className: 'bg-blue-50 text-blue-800 border border-blue-200' },
    on_hold: { label: '🟡 On Hold', className: 'bg-amber-50 text-amber-800 border border-amber-200' },
    filled: { label: '⚫ Closed', className: 'bg-surface-container-high text-on-surface-variant border border-outline-variant' },
    cancelled: { label: '🔴 Cancelled', className: 'bg-red-50 text-red-800 border border-red-200' },
    closed: { label: '⚫ Closed', className: 'bg-surface-container-high text-on-surface-variant border border-outline-variant' },
    withdrawn: { label: '🔴 Withdrawn', className: 'bg-red-50 text-red-800 border border-red-200' },
    expired: { label: '⚫ Expired', className: 'bg-surface-dim text-on-surface-variant' },
  };
  return map[normalized] || { label: normalized, className: 'bg-surface-container' };
}

// Lifecycle has 6 display steps.
// "closed" and "cancelled" are both terminal states mapped to the same final step
// at 100% because they both mean the vacancy is fully done — just for different reasons.
export const LIFECYCLE_STEPS: { status: VacancyStatus; label: string }[] = [
  { status: 'draft', label: 'Draft' },
  { status: 'open', label: 'Open' },
  { status: 'published', label: 'Published' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'on_hold', label: 'On Hold' },
  { status: 'closed', label: 'Closed / Cancelled' },
];

export function getLifecycleProgress(status: VacancyStatus): number {
  const normalized = String(status ?? '').toLowerCase() as VacancyStatus;

  // Both terminal statuses represent 100% — vacancy is fully done
  if (normalized === 'closed' || normalized === 'cancelled' || normalized === 'filled') {
    return 100;
  }

  // 5 non-terminal steps spread evenly across the first 5 of 6 slots
  const order: VacancyStatus[] = [
    'draft',
    'open',
    'published',
    'in_progress',
    'on_hold',
  ];

  const idx = order.indexOf(normalized);
  if (idx < 0) return 0;

  // Each step = 1/6 of the bar, so max non-terminal = 5/6 ≈ 83%
  return Math.round(((idx + 1) / 6) * 100);
}

export function getHiringFunnel(applications: Application[], vacancyId: string) {
  const apps = applications.filter((a) => a.vacancyId === vacancyId);
  const normalize = (value: string) => String(value ?? '').toLowerCase();
  return {
    total: apps.length,
    screening: apps.filter((a) => ['submitted', 'screening'].includes(normalize(a.applicationStatus))).length,
    shortlisted: apps.filter((a) => normalize(a.applicationStatus) === 'shortlisted').length,
    interviewed: apps.filter((a) =>
      ['interview', 'offered', 'hired'].includes(normalize(a.applicationStatus))
    ).length,
    offered: apps.filter((a) => ['offered', 'hired'].includes(normalize(a.applicationStatus))).length,
    hired: apps.filter((a) => normalize(a.applicationStatus) === 'hired').length,
  };
}

export function getVacancyInterviews(interviews: Interview[], applications: Application[], vacancyId: string) {
  const appIds = new Set(applications.filter((a) => a.vacancyId === vacancyId).map((a) => a.id));
  return interviews.filter((i) => appIds.has(i.applicationId));
}

export function aggregateByDepartment(vacancies: Vacancy[]): { name: string; count: number }[] {
  const map = new Map<string, number>();
  vacancies.forEach((v) => {
    if (!['open', 'published', 'in_progress', 'on_hold'].includes(String(v.vacancyStatus ?? '').toLowerCase())) return;
    map.set(v.departmentName, (map.get(v.departmentName) || 0) + 1);
  });
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export function averageTimeToFillDays(vacancies: Vacancy[], jobOffers: JobOffer[]): number {
  const filled = vacancies.filter((v) => v.filledAt || String(v.vacancyStatus ?? '').toLowerCase() === 'closed');
  if (filled.length === 0) return 0;
  const total = filled.reduce((s, v) => {
    const approvalDate = (v as any).approvedAt || v.createdAt;
    // Find the accepted offer for this vacancy
    const vacancyOffer = jobOffers.find(o => 
      o.vacancyId === v.id && o.status === 'accepted' && o.acceptedAt
    );
    const offerAcceptanceDate = vacancyOffer?.acceptedAt || v.filledAt || (v as any).closedAt;
    if (!approvalDate || !offerAcceptanceDate) return s;
    const days = Math.floor((new Date(offerAcceptanceDate).getTime() - new Date(approvalDate).getTime()) / (1000 * 60 * 60 * 24));
    return s + Math.max(0, days);
  }, 0);
  return Math.round(total / filled.length);
}

export function buildActivityFeed(vacancy: Vacancy, applicationCount: number): { date: string; text: string; type: string }[] {
  const fromHistory = vacancy.statusHistory.map((h) => ({
    date: h.timestamp,
    text: h.fromStatus
      ? `Status: ${h.fromStatus.replace('_', ' ')} → ${h.toStatus.replace('_', ' ')}${h.notes ? ` — ${h.notes}` : ''}`
      : `Status set to ${h.toStatus.replace('_', ' ')}`,
    type: 'status',
  }));
  const fromActivities = vacancy.activities.map((a) => ({
    date: a.timestamp,
    text: a.action,
    type: 'activity',
  }));
  const merged = [...fromHistory, ...fromActivities].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  if (applicationCount > 0) {
    merged.unshift({
      date: new Date().toISOString(),
      text: `${applicationCount} application(s) in pipeline`,
      type: 'metric',
    });
  }
  return merged;
}
