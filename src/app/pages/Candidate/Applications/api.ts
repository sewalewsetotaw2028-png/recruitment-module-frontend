// @ts-nocheck
import type { CandidateApplication, CandidateInterview } from './slice/types';

export function mapApiCandidateApplication(
  raw: Record<string, unknown>,
): CandidateApplication {
  const vacancy = raw.vacancy as Record<string, unknown> | undefined;
  const rawStatus = String(
    raw.application_status ?? raw.applicationStatus ?? raw.status ?? 'applied',
  ).toLowerCase();
  const applicationStatus =
    rawStatus === 'under_screening'
      ? 'screening'
      : rawStatus === 'selected'
        ? 'interview'
        : rawStatus === 'interview_completed'
          ? 'interview'
          : rawStatus === 'under_evaluation'
            ? 'interview'
            : rawStatus === 'interview_scheduled'
              ? 'interview'
              : rawStatus === 'offer_issued'
                ? 'offered'
                : rawStatus === 'offer_accepted'
                  ? 'hired'
                  : rawStatus === 'offer_declined'
                    ? 'rejected'
                    : rawStatus;
  return {
    id: String(raw.id ?? ''),
    vacancyId: String(
      vacancy?.id ?? raw.vacancy_id ?? raw.vacancyId ?? '',
    ),
    vacancyTitle: String(
      vacancy?.title ?? raw.vacancy_title ?? raw.vacancyTitle ?? 'Role',
    ),
    currentStage: String(
      raw.current_stage ?? raw.currentStage ?? raw.status ?? 'Applied',
    ),
    applicationStatus,
    appliedAt: raw.created_at
      ? String(raw.created_at)
      : raw.appliedAt
        ? String(raw.appliedAt)
        : undefined,
    location: vacancy?.location
      ? String(vacancy.location)
      : raw.location
        ? String(raw.location)
        : undefined,
  };
}

export function mapApiCandidateInterview(
  raw: Record<string, unknown>,
): CandidateInterview {
  return {
    id: String(raw.id ?? ''),
    applicationId: String(raw.application_id ?? raw.applicationId ?? ''),
    interviewRound: raw.interview_round
      ? Number(raw.interview_round)
      : raw.interviewRound
        ? Number(raw.interviewRound)
        : 1,
    interviewType: String(
      raw.interview_type ?? raw.interviewType ?? 'interview',
    ),
    scheduledStart: String(
      raw.scheduled_start ?? raw.scheduledStart ?? new Date().toISOString(),
    ),
    meetingLink: raw.meeting_link
      ? String(raw.meeting_link)
      : raw.meetingLink
        ? String(raw.meetingLink)
        : undefined,
    interviewStatus: String(
      raw.interview_status ?? raw.interviewStatus ?? 'scheduled',
    )
      .toLowerCase()
      .replace('finalized', 'completed'),
  };
}
