import type { Interview } from '@/types';



export interface ScheduleInterviewRequest {

  applicationId: string;

  type: 'physical' | 'virtual' | 'hybrid';

  startTime: string;

  endTime: string;

  location?: string;

  meetingLink?: string;

  panelIds: string[];

  questionTexts?: string[];
  inOfficeStartTime?: string;
  inOfficeEndTime?: string;
  remoteStartTime?: string;
  remoteEndTime?: string;
  interviewCategoryId?: string;
}

export interface RescheduleInterviewRequest {
  interviewId: string;
  startTime: string;
  endTime: string;
  reason: string;
  meetingLink?: string;
  location?: string;

}



export interface InterviewsState {
  loading: boolean;
  error: string | null;
  interviews: Interview[];
  actionSuccess: string | null;
  actionError: string | null;
  actionLoading: boolean;
}

