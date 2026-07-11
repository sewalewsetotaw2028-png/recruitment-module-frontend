export interface CandidateApplication {

  id: string;

  vacancyTitle: string;

  currentStage: string;

  applicationStatus: string;

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

