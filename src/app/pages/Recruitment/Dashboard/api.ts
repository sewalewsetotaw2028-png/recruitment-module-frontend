import makeCall from '@/API';
import { API_ROUTES } from '@/API/apiRoutes';
import type { RecruitmentDashboardStats } from './slice/types';

export async function fetchReportingDashboard(params?: {
  period?: string;
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  vacancyId?: string;
}): Promise<RecruitmentDashboardStats> {
  const query: Record<string, string> = {};
  if (params?.period) query.period = params.period;
  if (params?.startDate) query.startDate = params.startDate;
  if (params?.endDate) query.endDate = params.endDate;
  if (params?.departmentId) query.departmentId = params.departmentId;
  if (params?.vacancyId) query.vacancyId = params.vacancyId;

  const { data } = await makeCall<{
    status: string;
    data: RecruitmentDashboardStats;
  }>({
    method: 'GET',
    route: API_ROUTES.reporting.dashboard,
    isSecureRoute: true,
    query,
  });

  return data.data;
}

export async function generateHiringMinute(vacancyId: string): Promise<any> {
  const { data } = await makeCall<any>({
    method: 'POST',
    route: API_ROUTES.reporting.hiringMinute(vacancyId),
    isSecureRoute: true,
  });
  return data.data;
}
