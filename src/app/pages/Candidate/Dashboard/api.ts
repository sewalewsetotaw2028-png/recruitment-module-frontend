import type {
  CandidateDashboardApplication,
  CandidateDashboardInterview,
} from './slice/types';

export function mapApiApplication(raw: Record<string, unknown>): CandidateDashboardApplication {
  const vacancy = raw.vacancy as Record<string, unknown> | undefined;
  const interviews = Array.isArray(raw.interviews) ? raw.interviews : [];
  const status = String(
    raw.status ?? raw.applicationStatus ?? raw.application_status ?? 'submitted',
  ).toLowerCase();
  return {
    id: String(raw.id ?? ''),
    vacancyTitle: String(
      vacancy?.title ?? raw.vacancy_title ?? raw.vacancyTitle ?? 'Role',
    ),
    location: vacancy?.location ? String(vacancy.location) : undefined,
    currentStage: String(
      raw.current_stage ?? raw.currentStage ?? (status === 'submitted' ? 'Screening Queue' : 'Applied'),
    ),
    appliedAt: raw.created_at
      ? String(raw.created_at)
      : raw.appliedAt
        ? String(raw.appliedAt)
        : undefined,
    interviewsCount: interviews.length,
  };
}

export function mapApiInterview(raw: Record<string, unknown>): CandidateDashboardInterview {
  return {
    id: String(raw.id ?? ''),
    applicationId: raw.application_id
      ? String(raw.application_id)
      : undefined,
    vacancyTitle: String(raw.vacancy_title ?? raw.vacancyTitle ?? 'Interview'),
    scheduledStart: String(
      raw.scheduled_start ?? raw.scheduledStart ?? new Date().toISOString(),
    ),
    interviewRound: raw.interview_round
      ? Number(raw.interview_round)
      : undefined,
    meetingLink: raw.meeting_link
      ? String(raw.meeting_link)
      : raw.meetingLink
        ? String(raw.meetingLink)
        : undefined,
    interviewStatus: (() => {
      const status = String(
        raw.interview_status ?? raw.interviewStatus ?? 'scheduled',
      ).toLowerCase();
      if (status === 'completed' || status === 'finalized' || status === 'evaluation_pending') {
        return 'completed';
      }
      if (status === 'cancelled') return 'cancelled';
      if (status === 'rescheduled') return 'rescheduled';
      return 'scheduled';
    })(),
  };
}
