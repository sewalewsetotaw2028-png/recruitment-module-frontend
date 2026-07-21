import { useState, useEffect } from 'react';
import { apiFetch } from '@/services/apiClient';

const API_V1 = '/api/v1';

export interface Interview {
  id: string;
  applicationId: string;
  candidateName: string;
  vacancyTitle: string;
  round: number;
  mode: string;
  start_time: string;
  end_time: string;
  meeting_link?: string;
  status: string;
  interviewType?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  interviewStatus?: string;
  location?: string;
  panelMembers?: any[];
  questions?: any[];
  evaluations?: any[];
}

export async function fetchInterviewsByVacancy(vacancyId: string): Promise<Interview[]> {
  const res = await apiFetch(`${API_V1}/interviews/vacancy/${vacancyId}`);
  return res.data as Interview[];
}

export function useInterviewsByVacancy(vacancyId: string) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInterviews = async () => {
      try {
        setLoading(true);
        const data = await fetchInterviewsByVacancy(vacancyId);
        setInterviews(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load interviews:', err);
        setError('Failed to load interviews');
      } finally {
        setLoading(false);
      }
    };

    if (vacancyId) {
      loadInterviews();
    }
  }, [vacancyId]);

  return { interviews, loading, error };
}
