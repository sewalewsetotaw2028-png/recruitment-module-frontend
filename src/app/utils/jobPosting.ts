import type { JobPosting, PostingVisibility, PublicationStatus, Vacancy } from '../types';
import type { UserRole } from '@/state';

/** FR-20 — Only HR/recruiter roles may publish or withdraw postings */
export function canManagePublishing(role: UserRole): boolean {
  return role === 'recruiter';
}

export function isPostingPubliclyVisible(posting: JobPosting): boolean {
  if (posting.publicationStatus !== 'published') return false;
  if (!posting.externalPosting) return false;
  if (posting.expiryDate && new Date(posting.expiryDate) < new Date()) return false;
  return posting.visibility === 'external_only' || posting.visibility === 'both';
}

export function isPostingInternallyVisible(posting: JobPosting): boolean {
  if (posting.publicationStatus !== 'published') return false;
  if (!posting.internalPosting) return false;
  if (posting.expiryDate && new Date(posting.expiryDate) < new Date()) return false;
  return posting.visibility === 'internal_only' || posting.visibility === 'both';
}

export function getPostingForVacancy(postings: JobPosting[], vacancyId: string): JobPosting | undefined {
  return postings.find((p) => p.vacancyId === vacancyId);
}

export function vacancyHasActivePosting(vacancy: Vacancy, postings: JobPosting[]): boolean {
  const posting = getPostingForVacancy(postings, vacancy.id);
  return posting?.publicationStatus === 'published';
}

export function visibilityFromFlags(internal: boolean, external: boolean): PostingVisibility {
  if (internal && external) return 'both';
  if (internal) return 'internal_only';
  return 'external_only';
}

export function formatEmploymentType(type: Vacancy['employmentType']): string {
  return type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    draft: 'bg-surface-container text-on-surface-variant',
    pending_approval: 'bg-surface-container text-on-surface-variant',
    published: 'bg-emerald-50 text-emerald-700',
    open: 'bg-emerald-50 text-emerald-700',
    withdrawn: 'bg-red-50 text-red-700',
    expired: 'bg-surface-dim text-on-surface-variant',
    closed: 'bg-surface-container-high text-on-surface-variant',
    in_progress: 'bg-blue-50 text-blue-700',
    on_hold: 'bg-amber-50 text-amber-700',
  };
  return map[status] || 'bg-surface-container text-on-surface-variant';
}

export function postingStatusBadge(status: PublicationStatus): { label: string; className: string } {
  const map: Record<PublicationStatus, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-surface-container text-on-surface-variant' },
    pending_approval: { label: 'Draft', className: 'bg-surface-container text-on-surface-variant' },
    published: { label: 'Published', className: 'bg-emerald-50 text-emerald-800' },
    withdrawn: { label: 'Withdrawn', className: 'bg-red-50 text-red-800' },
    expired: { label: 'Expired', className: 'bg-gray-100 text-gray-600' },
    closed: { label: 'Closed', className: 'bg-surface-container-high text-on-surface-variant' },
  };
  return map[status] || { label: status, className: statusBadgeClass(status) };
}

export const PUBLICATION_LIFECYCLE: { status: PublicationStatus; label: string }[] = [
  { status: 'draft', label: 'Draft' },
  { status: 'published', label: 'Published' },
  { status: 'expired', label: 'Expired' },
  { status: 'withdrawn', label: 'Withdrawn' },
  { status: 'closed', label: 'Closed' },
];

export function getPublicationProgress(status: PublicationStatus): number {
  const normalizedStatus = status === 'pending_approval' ? 'draft' : status;
  const order: PublicationStatus[] = ['draft', 'published', 'expired', 'closed'];
  const idx = order.indexOf(normalizedStatus);
  if (normalizedStatus === 'withdrawn') return 50;
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / order.length) * 100);
}

export function daysUntilClosing(dateStr?: string): number | null {
  if (!dateStr) return null;
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export function isPostingExpired(posting: JobPosting): boolean {
  if (posting.publicationStatus === 'expired') return true;
  if (posting.expiryDate && new Date(posting.expiryDate) < new Date()) return true;
  return false;
}

/** Channel slug → Material icon name */
export const CHANNEL_ICONS: Record<string, string> = {
  internal_portal: 'corporate_fare',
  company_website: 'language',
  linkedin: 'work',
  telegram: 'send',
  facebook: 'groups',
};

export function channelIcon(slug: string): string {
  return CHANNEL_ICONS[slug] || 'hub';
}

export function conversionRate(posting: JobPosting): string {
  if (posting.views <= 0) return '0';
  return ((posting.applicationsCount / posting.views) * 100).toFixed(1);
}

/** Strip simple HTML for list preview */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

export function linesToListItems(text: string): string[] {
  return text
    .split('\n')
    .map((l) => stripHtml(l).replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}
