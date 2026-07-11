import type { Application, Candidate, Interview, TalentAvailability, TalentPoolEntry, TalentTier } from '../types';

export function tierBadge(tier: TalentTier): { label: string; className: string } {
  const map: Record<TalentTier, { label: string; className: string }> = {
    high_potential: { label: '⭐ High Potential', className: 'bg-amber-50 text-amber-900' },
    standard: { label: 'Standard', className: 'bg-surface-container text-on-surface-variant' },
    developing: { label: 'Developing', className: 'bg-blue-50 text-blue-800' },
  };
  return map[tier];
}

export function availabilityBadge(avail: TalentAvailability): { label: string; className: string } {
  const map: Record<TalentAvailability, { label: string; className: string }> = {
    available: { label: '🟢 Available', className: 'bg-emerald-50 text-emerald-800' },
    passive: { label: '🟡 Passive', className: 'bg-amber-50 text-amber-800' },
    employed: { label: 'Employed Elsewhere', className: 'bg-surface-container text-on-surface-variant' },
  };
  return map[avail];
}

export function buildTalentEntryFromRejection(
  candidate: Candidate,
  application: Application,
  interviews: Interview[],
  opts: {
    rejectionReason: string;
    tags: string[];
    futureFitLabels: string[];
    addedByName: string;
  }
): TalentPoolEntry {
  const relatedInts = interviews.filter((i) => i.applicationId === application.id);
  const lastEval = relatedInts
    .flatMap((i) => i.evaluations || [])
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];

  const historyFromApps: TalentPoolEntry['history'] = [
    {
      id: `th-${application.id}`,
      year: new Date(application.submittedAt).getFullYear(),
      vacancyTitle: application.vacancyTitle,
      outcome: 'Rejected → Talent Pool',
      interviewScore: lastEval?.overallScore ?? application.evaluationScore,
      feedback: application.screeningComments,
      rejectionReason: opts.rejectionReason,
    },
  ];

  const tier: TalentTier =
    (lastEval?.overallScore ?? application.matchScore) >= 85
      ? 'high_potential'
      : (lastEval?.overallScore ?? application.matchScore) >= 70
        ? 'standard'
        : 'developing';

  return {
    id: `tp-${candidate.id}-${Date.now()}`,
    organizationId: application.organizationId,
    candidateId: candidate.id,
    candidateName: `${candidate.firstName} ${candidate.lastName}`,
    email: candidate.email,
    currentPosition: candidate.currentPosition,
    sourceApplicationId: application.id,
    tags: [...new Set(['Previously Interviewed', ...opts.tags])],
    tier,
    availability: 'available',
    rejectionReason: opts.rejectionReason,
    futureFitLabels: opts.futureFitLabels,
    skills: candidate.skills.map((s) => s.skillName),
    yearsOfExperience: candidate.yearsOfExperience ?? 0,
    educationSummary: candidate.education[0]
      ? `${candidate.education[0].degree}, ${candidate.education[0].institution}`
      : undefined,
    lastInterviewScore: lastEval?.overallScore ?? application.evaluationScore,
    departmentInterest: application.vacancyTitle.split(' ')[0],
    addedAt: new Date().toISOString(),
    addedByName: opts.addedByName,
    history: historyFromApps,
  };
}

export function matchTalentToVacancy(
  entry: TalentPoolEntry,
  vacancy: { title: string; departmentName: string; skills?: string[] }
): number {
  let score = 0;
  const title = vacancy.title.toLowerCase();
  if (entry.currentPosition?.toLowerCase().includes(title.split(' ')[0].toLowerCase())) score += 30;
  if (entry.departmentInterest && vacancy.departmentName.toLowerCase().includes(entry.departmentInterest.toLowerCase()))
    score += 20;
  const vacSkills = vacancy.skills || [];
  const overlap = entry.skills.filter((s) =>
    vacSkills.some((vs) => vs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(vs.toLowerCase()))
  );
  score += Math.min(40, overlap.length * 15);
  if (entry.tier === 'high_potential') score += 10;
  return Math.min(100, score);
}
