// @ts-nocheck
import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import type { TalentAvailability, TalentPoolEntry, TalentTier } from '@/types';

const asString = (value: unknown, fallback = '') =>
  typeof value === 'string'
    ? value
    : typeof value === 'number'
      ? String(value)
      : fallback;

const mapAvailability = (value: unknown): TalentAvailability => {
  const normalized = String(value ?? '').toUpperCase();
  if (normalized === 'IMMEDIATELY') return 'available';
  if (normalized === 'TWO_WEEKS' || normalized === 'ONE_MONTH') return 'passive';
  return 'employed';
};

const mapTier = (category: string): TalentTier => {
  const normalized = category.toLowerCase();
  if (
    normalized.includes('senior') ||
    normalized.includes('lead') ||
    normalized.includes('investment')
  ) {
    return 'high_potential';
  }
  if (normalized.includes('develop') || normalized.includes('intern')) {
    return 'developing';
  }
  return 'standard';
};

export function mapApiTalentRosterEntry(raw: Record<string, unknown>): TalentPoolEntry {
  const candidate = (raw.candidate ?? {}) as Record<string, unknown>;
  const addedBy = (raw.user ?? {}) as Record<string, unknown>;
  const educations = Array.isArray(candidate.educations) ? candidate.educations : [];
  const education = (educations[0] ?? {}) as Record<string, unknown>;
  const category = asString(raw.talent_category, 'General Talent Pool');

  return {
    id: asString(raw.id),
    organizationId: asString(raw.company_id),
    candidateId: asString(raw.candidate_id),
    candidateName:
      `${asString(candidate.first_name)} ${asString(candidate.last_name)}`.trim() ||
      'Candidate',
    email: asString(candidate.email),
    currentPosition: asString(candidate.current_position) || undefined,
    sourceApplicationId: undefined,
    tags: [category],
    tier: mapTier(category),
    availability: mapAvailability(candidate.availability_status),
    rejectionReason: asString(raw.notes) || undefined,
    futureFitLabels: [category],
    skills: Array.isArray(candidate.skills)
      ? candidate.skills.map((skill) => asString(skill)).filter(Boolean)
      : [],
    yearsOfExperience: Number(candidate.years_of_experience ?? 0),
    educationSummary: education.degree
      ? `${asString(education.degree)}${education.institution_name ? `, ${asString(education.institution_name)}` : ''}`
      : undefined,
    addedAt: asString(raw.added_at, new Date().toISOString()),
    addedByName:
      `${asString(addedBy.first_name)} ${asString(addedBy.last_name)}`.trim() ||
      'System',
    history: [],
  };
}

export async function fetchTalentPoolEntries(): Promise<TalentPoolEntry[]> {
  const { data } = await makeCall<{ status: string; data: unknown[] }>({
    method: 'GET',
    route: API_ROUTES.roaster.list,
    isSecureRoute: true,
  });
  const rows = Array.isArray((data as any)?.data) ? (data as any).data : [];
  return rows.map((row) => mapApiTalentRosterEntry(row as Record<string, unknown>));
}
