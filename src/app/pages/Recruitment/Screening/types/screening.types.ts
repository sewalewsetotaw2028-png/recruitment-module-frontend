// Screening feature types
export interface ScreeningFilters {
  vacancyFilterId: string;
  filterExperienceMin: number;
  filterFieldOfStudy: string;
  filterSkill: string;
}

export interface RejectionData {
  notes: string;
  reason: string;
  addToTalentRoster: boolean;
  futureFitTag: string;
}

export interface InterviewSchedule {
  appId: string | null;
  type: 'physical' | 'virtual' | 'hybrid';
  start: string;
  end: string;
  location: string;
  meetingLink: string;
  round: number;
  panelIds: string[];
  hybridSegments: {
    segmentType: 'physical' | 'virtual';
    start: string;
    end: string;
    location?: string;
    meetingLink?: string;
  }[];
}

export interface EvaluationData {
  interviewId: string | null;
  overallScore: number;
  recommendation: 'pass' | 'fail' | 'hold';
  comments: string;
  criteria: { id: string; label: string; score: number }[];
}
