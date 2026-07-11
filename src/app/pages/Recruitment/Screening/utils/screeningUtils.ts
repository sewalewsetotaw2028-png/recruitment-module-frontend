import { type CandidateExperience } from '@/types';

export const calculateCandidateExperienceMonths = (
  experiences: CandidateExperience[],
): number => {
  return experiences.reduce((sum, exp) => {
    const start = new Date(exp.startDate);
    const end =
      exp.isCurrent || !exp.endDate ? new Date() : new Date(exp.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return sum;
    }
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    return sum + Math.max(0, months);
  }, 0);
};

export const formatCandidateExperience = (
  experiences: CandidateExperience[],
): string => {
  const totalMonths = calculateCandidateExperienceMonths(experiences);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return `${years} yr${years !== 1 ? 's' : ''}${months ? ` ${months} mo` : ''}`;
};

export const formatDateRange = (
  start: string,
  end?: string,
  isCurrent?: boolean,
): string => {
  if (!start) return 'Not set';
  const startDate = new Date(start);
  const endDate = isCurrent || !end ? new Date() : new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 'Invalid period';
  }
  return `${startDate.toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
  })} – ${
    isCurrent || !end
      ? 'Present'
      : endDate.toLocaleDateString('en-GB', {
          month: 'short',
          year: 'numeric',
        })
  }`;
};
