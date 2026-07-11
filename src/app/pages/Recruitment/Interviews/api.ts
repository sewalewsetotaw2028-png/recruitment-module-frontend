import type { Interview } from '@/types';

export function mapApiInterview(raw: Record<string, unknown>): Interview {
  const application = raw.application as Record<string, unknown> | undefined;
  const candidate = application?.candidate as
    | Record<string, unknown>
    | undefined;
  const vacancy = application?.vacancy as Record<string, unknown> | undefined;

  return {
    id: String(raw.id ?? ''),
    organizationId: String(raw.organization_id ?? raw.organizationId ?? ''),
    applicationId: String(raw.application_id ?? raw.applicationId ?? ''),
    candidateName:
      `${String(candidate?.first_name ?? candidate?.firstName ?? '')} ${String(candidate?.last_name ?? candidate?.lastName ?? '')}`.trim() ||
      'Candidate',
    vacancyTitle: String(
      vacancy?.title ?? raw.vacancy_title ?? raw.vacancyTitle ?? 'Interview',
    ),
    interviewRound: raw.round
      ? Number(raw.round)
      : Number(raw.interview_round ?? 1),
    interviewType: (() => {
      const mode = String(
        raw.mode ?? raw.type ?? raw.interview_type ?? 'virtual',
      ).toLowerCase();
      if (mode === 'physical' || mode === 'hybrid' || mode === 'virtual') {
        return mode as Interview['interviewType'];
      }
      return 'virtual';
    })(),
    scheduledStart: String(
      raw.start_time ??
        raw.scheduled_start ??
        raw.scheduledStart ??
        new Date().toISOString(),
    ),
    scheduledEnd: String(
      raw.end_time ??
        raw.scheduled_end ??
        raw.scheduledEnd ??
        new Date().toISOString(),
    ),
    location: raw.office_location
      ? String(raw.office_location)
      : raw.location
        ? String(raw.location)
        : undefined,
    meetingLink: raw.meeting_link
      ? String(raw.meeting_link)
      : raw.meetingLink
        ? String(raw.meetingLink)
        : undefined,
    interviewStatus: (() => {
      const status = String(
        raw.status ?? raw.interview_status ?? raw.interviewStatus ?? 'scheduled',
      ).toLowerCase();
      // Preserve these states distinctly — components need them to show correct badges
      if (status === 'evaluation_pending') return 'evaluation_pending';
      if (status === 'finalized') return 'finalized';
      if (status === 'completed') return 'completed';
      if (status === 'cancelled') return 'cancelled';
      if (status === 'rescheduled') return 'rescheduled';
      return 'scheduled';
    })() as Interview['interviewStatus'],
    panelMembers: Array.isArray(raw.interview_panels)
      ? (raw.interview_panels as Record<string, unknown>[]).map((panel) => {
          const user = panel.user as Record<string, unknown> | undefined;
          const roles = user?.app_user_roles as
            | Record<string, unknown>[]
            | undefined;
          const role = roles?.[0]?.role as Record<string, unknown> | undefined;
          return {
            userId: String(
              panel.panel_member_id ?? user?.id ?? panel.userId ?? '',
            ),
            userName:
              `${String(user?.first_name ?? '')} ${String(user?.last_name ?? '')}`.trim() ||
              String(panel.panel_member_name ?? panel.userName ?? 'Panel Member'),
            roleSlug: String(role?.slug ?? panel.role_slug ?? panel.roleSlug ?? 'interviewer'),
          };
        })
      : [],
    questions: (() => {
      const source = raw.questions_json ?? raw.questions;
      if (!Array.isArray(source)) return undefined;
      return source.map((item) => {
        if (typeof item === 'string') return item;
        const row = item as Record<string, unknown>;
        return String(row.question ?? row.questionText ?? item);
      });
    })(),
    evaluations: Array.isArray(raw.evaluations)
      ? (raw.evaluations as Record<string, unknown>[]).map((evaluation) => ({
          id: String(evaluation.id ?? ''),
          interviewId: String(
            evaluation.interview_id ?? evaluation.interviewId ?? '',
          ),
          evaluatorId: String(
            evaluation.evaluator_id ?? evaluation.evaluatorId ?? '',
          ),
          evaluatorName: String(
            evaluation.evaluator_name ?? evaluation.evaluatorName ?? '',
          ),
          overallScore: Number(
            evaluation.overall_score ?? evaluation.overallScore ?? 0,
          ),
          recommendation: String(evaluation.recommendation ?? 'hold') as any,
          comments: String(evaluation.comments ?? ''),
          submittedAt: String(
            evaluation.submitted_at ??
              evaluation.submittedAt ??
              new Date().toISOString(),
          ),
          criteriaScores: Array.isArray(evaluation.criteria_scores)
            ? (evaluation.criteria_scores as Record<string, unknown>[]).map(
                (criteria) => ({
                  criteriaName: String(
                    criteria.criteria_name ?? criteria.criteriaName ?? '',
                  ),
                  score: Number(criteria.score ?? 0),
                  maxScore: Number(
                    criteria.max_score ?? criteria.maxScore ?? 0,
                  ),
                  comments: criteria.comments
                    ? String(criteria.comments)
                    : undefined,
                }),
              )
            : [],
        }))
      : undefined,
    hybridSegments: (() => {
      if (Array.isArray(raw.hybrid_segments)) {
        return (raw.hybrid_segments as Record<string, unknown>[]).map(
          (segment) => ({
            segmentType: String(
              segment.segment_type ?? segment.segmentType ?? 'virtual',
            ) as 'physical' | 'virtual',
            start: String(segment.start ?? new Date().toISOString()),
            end: String(segment.end ?? new Date().toISOString()),
            location: segment.location ? String(segment.location) : undefined,
            meetingLink: segment.meeting_link
              ? String(segment.meeting_link)
              : segment.meetingLink
                ? String(segment.meetingLink)
                : undefined,
          }),
        );
      }

      const segments: Interview['hybridSegments'] = [];
      const inOfficeStart = raw.in_office_start_time ?? raw.inOfficeStartTime;
      const inOfficeEnd = raw.in_office_end_time ?? raw.inOfficeEndTime;
      const remoteStart = raw.remote_start_time ?? raw.remoteStartTime;
      const remoteEnd = raw.remote_end_time ?? raw.remoteEndTime;

      if (inOfficeStart && inOfficeEnd) {
        segments.push({
          segmentType: 'physical',
          start: String(inOfficeStart),
          end: String(inOfficeEnd),
          location: raw.office_location ? String(raw.office_location) : undefined,
        });
      }
      if (remoteStart && remoteEnd) {
        segments.push({
          segmentType: 'virtual',
          start: String(remoteStart),
          end: String(remoteEnd),
          meetingLink: raw.meeting_link ? String(raw.meeting_link) : undefined,
        });
      }
      return segments.length ? segments : undefined;
    })(),
  };
}
