import { apiFetch } from '@/services/apiClient';

const API_V1 = '/api/v1';

export const COMPANY_PROFILE_ROUTES = {
  profile: `${API_V1}/config/company`,
  logo: `${API_V1}/config/company/logo`,
  stamp: `${API_V1}/config/company/stamp`,
};

export interface CompanyProfile {
  id: number;
  name: string;
  email: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  stamp_url: string | null;
  industry: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateCompanyProfilePayload {
  name?: string;
  email?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  stampUrl?: string;
  industry?: string;
  phone?: string;
  address?: string;
  website?: string;
}

export async function fetchCompanyProfile(): Promise<CompanyProfile> {
  const res = await apiFetch(COMPANY_PROFILE_ROUTES.profile);
  return res.data as CompanyProfile;
}

export async function updateCompanyProfile(
  payload: UpdateCompanyProfilePayload,
): Promise<CompanyProfile> {
  const res = await apiFetch(COMPANY_PROFILE_ROUTES.profile, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data as CompanyProfile;
}

export async function uploadCompanyLogo(file: File): Promise<CompanyProfile> {
  const formData = new FormData();
  formData.append('logo', file);

  const res = await apiFetch(COMPANY_PROFILE_ROUTES.logo, {
    method: 'POST',
    body: formData,
  });
  return res.data as CompanyProfile;
}

export async function uploadCompanyStamp(file: File): Promise<CompanyProfile> {
  const formData = new FormData();
  formData.append('stamp', file);

  const res = await apiFetch(COMPANY_PROFILE_ROUTES.stamp, {
    method: 'POST',
    body: formData,
  });
  return res.data as CompanyProfile;
}
