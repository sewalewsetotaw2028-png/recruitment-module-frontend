import type { HrisSyncStatus, JobOffer, OfferStatus } from '../types';

export const OFFER_TRANSITION_STEPS = [
  { key: 'interview_passed', label: 'Interview Passed' },
  { key: 'generate_offer', label: 'Generate Offer' },
  { key: 'offer_sent', label: 'Offer Sent' },
  { key: 'offer_accepted', label: 'Offer Accepted' },
  { key: 'transfer_hris', label: 'Transfer to HRIS' },
  { key: 'onboarding', label: 'Onboarding Started' },
] as const;

export function generateOfferDisplayCode(seq: number): string {
  const year = new Date().getFullYear();
  return `OFF-${year}-${String(seq).padStart(3, '0')}`;
}

export function offerStatusBadge(status: OfferStatus): { label: string; className: string } {
  const normalized = String(status ?? '').toLowerCase();
  const resolved = (normalized === 'declined' ? 'rejected' : normalized) as OfferStatus;
  const map: Record<OfferStatus, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-surface-container text-on-surface-variant' },
    pending_approval: { label: 'Pending Approval', className: 'bg-amber-50 text-amber-800' },
    sent: { label: 'Sent', className: 'bg-blue-50 text-blue-800' },
    accepted: { label: 'Accepted', className: 'bg-emerald-50 text-emerald-800' },
    rejected: { label: 'Rejected', className: 'bg-red-50 text-red-800' },
    expired: { label: 'Expired', className: 'bg-gray-100 text-gray-600' },
    withdrawn: { label: 'Withdrawn', className: 'bg-red-50 text-red-700' },
  };
  return map[resolved] || map.draft;
}

export function hrisSyncBadge(status: HrisSyncStatus): { label: string; className: string; icon: string } {
  const map: Record<HrisSyncStatus, { label: string; className: string; icon: string }> = {
    not_connected: { label: 'Not Connected', className: 'bg-surface-container text-on-surface-variant', icon: 'link_off' },
    pending: { label: 'Sync Pending', className: 'bg-amber-50 text-amber-800', icon: 'sync' },
    synced: { label: 'Synced with HRIS', className: 'bg-emerald-50 text-emerald-800', icon: 'check_circle' },
    failed: { label: 'Sync Failed', className: 'bg-red-50 text-red-800', icon: 'error' },
    manual_mode: { label: 'Manual Onboarding', className: 'bg-blue-50 text-blue-800', icon: 'person_edit' },
  };
  return map[status];
}

export function getOfferTransitionStep(offer: JobOffer): number {
  const status = (String(offer.status ?? '').toLowerCase() === 'declined'
    ? 'rejected'
    : String(offer.status ?? '').toLowerCase()) as OfferStatus;
  if (offer.onboardingStatus === 'in_progress' || offer.onboardingStatus === 'completed') return 5;
  if (offer.hrisSyncStatus === 'synced' || offer.hrisSyncStatus === 'manual_mode') return 4;
  if (status === 'accepted') return 3;
  if (status === 'sent') return 2;
  if (status !== 'draft' && status !== 'withdrawn') return 1;
  return 0;
}

export function canSyncToHris(offer: JobOffer, hrisAvailable: boolean): boolean {
  return (String(offer.status ?? '').toLowerCase() === 'accepted') && (hrisAvailable || offer.manualOnboarding);
}
