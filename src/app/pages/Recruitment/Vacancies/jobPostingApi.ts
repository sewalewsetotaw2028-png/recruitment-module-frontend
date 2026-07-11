/**
 * Frontend API service for Job Postings.
 *
 * The backend uses VacancyJobPosting (one row per channel per vacancy)
 * and RecruitmentChannel as the master channel list.
 *
 * The frontend JobPosting interface is synthesised from those rows.
 */

import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import type {
  JobPosting,
  JobPostingChannelState,
  PublicationStatus,
} from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

/** One row from VacancyJobPosting, as returned by the backend */
export interface RawVacancyJobPosting {
  id: string;
  vacancy_id: string;
  recruitment_channel_id: string;
  posting_status: string;   // 'PENDING' | 'PUBLISHED' | 'WITHDRAWN'
  posted_at: string | null;
  external_job_url: string | null;
  error_log: string | null;
  created_at: string;
  updated_at: string;
  recruitment_channel: {
    id: string;
    name: string;
    description: string | null;
    is_automated: boolean;
    is_active: boolean;
    company_id: number;
    api_username: string | null;
  };
}

/** One row from RecruitmentChannel */
export interface RawRecruitmentChannel {
  id: string;
  name: string;
  description: string | null;
  is_automated: boolean;
  is_active: boolean;
  company_id: number;
  api_username: string | null;  // Telegram chat_id (or other channel username)
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

const toPublicationStatus = (raw: string): PublicationStatus => {
  const s = String(raw ?? '').toUpperCase();
  if (s === 'PUBLISHED') return 'published';
  if (s === 'WITHDRAWN') return 'withdrawn';
  return 'draft';
};

const toSyncStatus = (raw: string): JobPostingChannelState['syncStatus'] => {
  const s = String(raw ?? '').toUpperCase();
  if (s === 'PUBLISHED') return 'active';
  if (s === 'PENDING') return 'pending';
  if (s === 'WITHDRAWN') return 'not_linked';
  return 'not_linked';
};

/**
 * Convert an array of VacancyJobPosting rows into a single synthetic
 * JobPosting object the UI expects.
 */
export const mapRawPostingsToJobPosting = (
  rows: RawVacancyJobPosting[],
  vacancyId: string,
): JobPosting => {
  // Determine overall status from the rows
  const hasPublished = rows.some((r) => r.posting_status === 'PUBLISHED');
  const allWithdrawn =
    rows.length > 0 && rows.every((r) => r.posting_status === 'WITHDRAWN');

  const publicationStatus: PublicationStatus = hasPublished
    ? 'published'
    : allWithdrawn
      ? 'withdrawn'
      : 'draft';

  const channels: JobPostingChannelState[] = rows.map((r) => ({
    channelSlug: r.recruitment_channel_id,  // use id as slug for matching
    channelId: r.recruitment_channel_id,
    channelName: r.recruitment_channel.name,
    enabled: r.posting_status === 'PUBLISHED',
    syncStatus: toSyncStatus(r.posting_status),
    lastSyncAt: r.posted_at ?? undefined,
    externalUrl: r.external_job_url ?? undefined,
  }));

  const firstRow = rows[0];

  // Build a full audit trail from ALL rows (not just firstRow).
  // Each row represents one channel's posting lifecycle event.
  // Sort all events chronologically newest-first.
  const allEvents: JobPosting['publicationHistory'] = rows.flatMap((r) => {
    const events: JobPosting['publicationHistory'] = [];

    // "Posted to channel" event — when it was first created/published
    if (r.posted_at) {
      events.push({
        id: `${r.id}-published`,
        action: `Published to ${r.recruitment_channel.name}`,
        actorId: '',
        actorName: r.recruitment_channel.name,
        timestamp: r.posted_at,
      });
    }

    // "Withdrawn from channel" event — if status is now WITHDRAWN
    if (r.posting_status === 'WITHDRAWN') {
      events.push({
        id: `${r.id}-withdrawn`,
        action: `Withdrawn from ${r.recruitment_channel.name}`,
        actorId: '',
        actorName: r.recruitment_channel.name,
        timestamp: r.updated_at,
      });
    }

    // "Created (pending)" event — initial draft/pending state
    if (r.posting_status === 'PENDING') {
      events.push({
        id: `${r.id}-pending`,
        action: `Queued to ${r.recruitment_channel.name} (pending)`,
        actorId: '',
        actorName: r.recruitment_channel.name,
        timestamp: r.created_at,
      });
    }

    return events;
  });

  // Sort newest first
  allEvents.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  return {
    id: firstRow?.id ?? `posting-${vacancyId}`,
    organizationId: String(firstRow?.recruitment_channel.company_id ?? ''),
    vacancyId,
    postingTitle: '',
    postingDescription: '',
    publicationStatus,
    visibility: 'both',
    internalPosting: true,
    externalPosting: true,
    publishDate: firstRow?.posted_at ?? undefined,
    scheduledPublishDate: undefined,
    expiryDate: undefined,
    closingDate: undefined,
    channels,
    views: 0,
    applicationsCount: 0,
    requiresHrApproval: false,
    approvedBy: undefined,
    approvedByName: undefined,
    approvedAt: undefined,
    createdBy: '',
    createdByName: '',
    createdAt: firstRow?.created_at ?? new Date().toISOString(),
    updatedAt: firstRow?.updated_at ?? new Date().toISOString(),
    publicationHistory: allEvents,
  };
};

// ─── API Calls ────────────────────────────────────────────────────────────────

/** Fetch all channel postings for a vacancy */
export const fetchJobPostingsByVacancy = async (
  vacancyId: string,
): Promise<JobPosting[]> => {
  const { data } = await makeCall<{ success: boolean; data: RawVacancyJobPosting[] }>({
    method: 'GET',
    route: API_ROUTES.jobPostings.list,
    query: { vacancyId },
    isSecureRoute: true,
  });

  const rows: RawVacancyJobPosting[] = Array.isArray((data as any)?.data)
    ? (data as any).data
    : [];

  if (rows.length === 0) return [];

  // Return a single synthesised JobPosting
  return [mapRawPostingsToJobPosting(rows, vacancyId)];
};

/** Fetch all RecruitmentChannels for the company */
export const fetchCompanyChannels = async (): Promise<RawRecruitmentChannel[]> => {
  const { data } = await makeCall<{ success: boolean; data: RawRecruitmentChannel[] }>({
    method: 'GET',
    route: API_ROUTES.jobPostings.channels,
    isSecureRoute: true,
  });
  return Array.isArray((data as any)?.data) ? (data as any).data : [];
};

/** Create postings for the given channel IDs */
export const createJobPosting = async (
  vacancyId: string,
  channelIds: string[],
): Promise<JobPosting> => {
  const { data } = await makeCall<{ success: boolean; data: RawVacancyJobPosting[] }>({
    method: 'POST',
    route: API_ROUTES.jobPostings.list,
    body: { vacancyId, channelIds },
    isSecureRoute: true,
  });

  const rows: RawVacancyJobPosting[] = Array.isArray((data as any)?.data)
    ? (data as any).data
    : [];

  return mapRawPostingsToJobPosting(rows, vacancyId);
};

/** Publish = create postings for selected channels */
export const publishJobPosting = async (
  vacancyId: string,
  channelIds: string[],
): Promise<JobPosting> => createJobPosting(vacancyId, channelIds);

/** Withdraw all channel postings for a vacancy */
export const withdrawJobPosting = async (
  vacancyId: string,
  reason = 'Withdrawn by HR',
): Promise<JobPosting> => {
  const { data } = await makeCall<{ success: boolean; data: RawVacancyJobPosting[] }>({
    method: 'PATCH',
    route: API_ROUTES.jobPostings.withdraw(vacancyId),
    body: { reason },
    isSecureRoute: true,
  });

  const rows: RawVacancyJobPosting[] = Array.isArray((data as any)?.data)
    ? (data as any).data
    : [];

  return mapRawPostingsToJobPosting(rows, vacancyId);
};
