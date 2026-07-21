export interface CandidateApplication {

  id: string;

  vacancyId: string;

  vacancyTitle: string;

  currentStage: string;

  applicationStatus: string;

  location?: string;

  appliedAt?: string;

}



export interface CandidateInterview {

  id: string;

  applicationId: string;

  interviewRound: number;

  interviewType: string;

  scheduledStart: string;

  meetingLink?: string;

  interviewStatus: string;

}



export interface CandidateApplicationsState {

  loading: boolean;

  error: string | null;

  applications: CandidateApplication[];

  interviews: CandidateInterview[];

}

