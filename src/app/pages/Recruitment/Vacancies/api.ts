import makeCall from "@/API";
import { API_ROUTES } from "@/API/apiRoutes";
import type { Vacancy } from "@/types";

/* ---------------- HELPERS ---------------- */

const parseExperienceRequired = (value?: string): number | undefined => {
  if (!value) return undefined;
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : undefined;
};

type VacancyWritePayload = {
  recruitment_request_id?: string;
  title?: string;
  location?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  open_positions?: number;
  required_experience?: number;
  required_qualifications?: string;
  opening_date?: string;
  closing_date?: string;
  benefits?: string;
  employmentTerms?: string;
  skills?: string[];
  experienceRequired?: string;
};

const buildVacancyWritePayload = (input: any): VacancyWritePayload => {
  const payload: VacancyWritePayload = {};

  console.log('buildVacancyWritePayload input:', input);

  const recruitmentRequestId =
    input?.recruitment_request_id ?? input?.recruitmentRequestId;
  // recruitment_request_id is required — only send if genuinely present
  if (recruitmentRequestId && String(recruitmentRequestId).trim()) {
    payload.recruitment_request_id = recruitmentRequestId;
  }

  const title = input?.title;
  if (title !== undefined && typeof title === "string") payload.title = title;

  const location = input?.location;
  // Only send location if it's explicitly provided in the input
  if (location !== undefined) {
    payload.location = (typeof location === "string" && location.trim()) ? location : 'TBD';
  }

  const employmentType = input?.employment_type ?? input?.employmentType;
  if (employmentType !== undefined && typeof employmentType === "string") payload.employment_type = employmentType;

  const salaryMin = input?.salary_min ?? input?.salaryMin;
  if (salaryMin !== undefined && salaryMin !== null && salaryMin !== "")
    payload.salary_min = Number(salaryMin);

  const salaryMax = input?.salary_max ?? input?.salaryMax;
  if (salaryMax !== undefined && salaryMax !== null && salaryMax !== "")
    payload.salary_max = Number(salaryMax);

  // Only include description fields if they are explicitly present in the input
  // This prevents data loss when updating other fields like closing_date
  const description = input?.description;
  if (description !== undefined) {
    payload.description = (typeof description === "string" && description.trim()) ? description : 'To be defined.';
  }

  const responsibilities = input?.responsibilities;
  if (responsibilities !== undefined) {
    payload.responsibilities = (typeof responsibilities === "string" && responsibilities.trim()) ? responsibilities : 'To be defined.';
  }

  const requirements =
    input?.requirements ?? input?.required_qualifications ?? input?.requiredQualifications;
  if (requirements !== undefined) {
    payload.requirements = (typeof requirements === "string" && requirements.trim()) ? requirements : 'To be defined.';
  }

  const openPositions = input?.open_positions ?? input?.openPositions;
  if (openPositions !== undefined && openPositions !== null && openPositions !== "")
    payload.open_positions = Number(openPositions);

  const requiredExperience =
    input?.required_experience ??
    parseExperienceRequired(input?.experienceRequired);
  if (
    requiredExperience !== undefined &&
    requiredExperience !== null &&
    requiredExperience !== ""
  )
    payload.required_experience = Number(requiredExperience);

  const requiredQualifications =
    input?.required_qualifications ?? input?.requiredQualifications;
  if (requiredQualifications !== undefined) {
    payload.required_qualifications = requiredQualifications;
  }

  const closingDate = input?.closing_date ?? input?.closingDate;
  if (closingDate) payload.closing_date = String(closingDate).slice(0, 10);

  const openingDate = input?.opening_date ?? input?.openingDate;
  if (openingDate !== undefined && openingDate !== null && openingDate !== '') {
    payload.opening_date = String(openingDate).slice(0, 10);
  }

  // Add extra job description fields - always include them if present in input
  // even if empty, so backend knows to update job_description
  if ('benefits' in input) payload.benefits = input.benefits;
  if ('employmentTerms' in input) payload.employmentTerms = input.employmentTerms;
  if ('skills' in input) payload.skills = input.skills;
  if ('experienceRequired' in input) payload.experienceRequired = input.experienceRequired;

  console.log('buildVacancyWritePayload output:', payload);

  return payload;
};

const normalizeVacancyStatus = (
  status: string,
  postingStatus: string
): Vacancy["vacancyStatus"] => {
  const normalizedStatus = String(status ?? "").toLowerCase();
  const normalizedPostingStatus = String(postingStatus ?? "").toLowerCase();

  if (normalizedStatus === "draft") return "draft";
  if (
    normalizedStatus === "open" &&
    ["posted", "published"].includes(normalizedPostingStatus)
  )
    return "published";
  if (normalizedStatus === "open") return "open";
  if (normalizedStatus === "published") return "published";
  if (normalizedStatus === "in_progress") return "in_progress";
  if (normalizedStatus === "on_hold") return "on_hold";
  if (normalizedStatus === "closed") return "closed";
  if (normalizedStatus === "filled") return "closed";
  if (normalizedStatus === "cancelled") return "cancelled";
  if (normalizedStatus === "pending" || normalizedPostingStatus === "pending")
    return "draft";

  return "draft";
};

/* ---------------- MAPPER ---------------- */

export const mapApiVacancy = (raw: any): Vacancy => {
  const createdAt = raw.created_at || new Date().toISOString();
  const updatedAt = raw.updated_at || createdAt;
  const nestedWorkforcePlan =
    raw.recruitment_request?.workforce_plan_item?.workforce_plan;

  const closingDate = raw.closing_date
    ? String(raw.closing_date).slice(0, 10)
    : raw.posted_at
      ? new Date(raw.posted_at).toISOString().slice(0, 10)
      : new Date(
          new Date(createdAt).setDate(new Date(createdAt).getDate() + 90)
        )
          .toISOString()
          .slice(0, 10);

  const openingDate = raw.opening_date
    ? String(raw.opening_date).slice(0, 10)
    : undefined;

  // Extract extra job description fields from job_description relation
  const jobDescription = raw.job_description as any || {};
  const extraJobData = {
    benefits: jobDescription.benefits || undefined,
    employmentTerms: jobDescription.employment_terms || undefined,
    skills: Array.isArray(jobDescription.skills) ? jobDescription.skills : [],
    experienceRequired: jobDescription.experience_required || undefined,
  };

  return {
    id: raw.id,
    displayCode:
      raw.display_code ||
      `VAC-${raw.id?.slice(0, 6).toUpperCase() || "000000"}`,
    organizationId: raw.company_id || raw.organizationId || "org-1",
    recruitmentRequestId:
      raw.recruitment_request_id || raw.recruitmentRequestId || "",
    recruitmentRequestReference:
      raw.recruitment_request_reference || raw.recruitmentRequestReference,
    workforcePlanId:
      raw.workforce_plan_id ||
      raw.workforcePlanId ||
      raw.recruitment_request?.workforce_plan_item?.workforce_plan_id ||
      nestedWorkforcePlan?.id ||
      "",
    workforcePlanReference:
      raw.workforce_plan_reference ||
      raw.workforcePlanReference ||
      nestedWorkforcePlan?.title,
    jobTemplateId: raw.job_template_id || raw.jobTemplateId || undefined,
    title: raw.title || "Untitled vacancy",
    departmentId:
      raw.department_id || raw.department?.id || raw.departmentId || "",
    departmentName:
      raw.department?.name ||
      raw.departmentName ||
      raw.department_name ||
      "General",
    location: raw.location || "TBD",
    employmentType: raw.employment_type || raw.employmentType || "full_time",
    vacancyStatus: normalizeVacancyStatus(raw.status, raw.posting_status),
    openPositions: raw.open_positions ?? raw.openPositions ?? 1,
    salaryMin:
      raw.salary_min !== undefined && raw.salary_min !== null
        ? Number(raw.salary_min)
        : raw.salaryMin,
    salaryMax:
      raw.salary_max !== undefined && raw.salary_max !== null
        ? Number(raw.salary_max)
        : raw.salaryMax,
    description: raw.description || raw.job_description || "",
    responsibilities: raw.responsibilities || "",
    requirements: raw.requirements || raw.required_qualifications || "",
    skills: extraJobData.skills,
    benefits: extraJobData.benefits,
    employmentTerms: extraJobData.employmentTerms,
    experienceRequired:
      raw.required_experience !== undefined && raw.required_experience !== null
        ? `${raw.required_experience}+ years`
        : extraJobData.experienceRequired || raw.experienceRequired || undefined,
    openingDate,
    closingDate,
    hiringManagerId: raw.hiring_manager_id || raw.hiringManagerId || "",
    hiringManagerName:
      raw.hiring_manager_name || raw.hiringManagerName || "TBD",
    ownerId: raw.owner_id || raw.ownerId || "",
    ownerName: raw.owner_name || raw.ownerName || "HR Team",
    isUrgent: !!raw.is_urgent,
    createdBy: raw.created_by || raw.createdBy || "",
    lastModifiedBy: raw.updated_by || raw.lastModifiedBy || undefined,
    lastModifiedByName:
      raw.updated_by_name || raw.lastModifiedByName || undefined,
    publishedAt:
      raw.posted_at || raw.published_at || raw.publishedAt || undefined,
    filledAt: raw.filled_at || raw.filledAt || undefined,
    createdAt,
    updatedAt,
    channels: Array.isArray(raw.channels) ? raw.channels : [],
    activities: Array.isArray(raw.activities) ? raw.activities : [],
    statusHistory: Array.isArray(raw.status_history) ? raw.status_history : [],
    notes: Array.isArray(raw.notes) ? raw.notes : []
  };
};

/* ---------------- API CALLS ---------------- */

export const fetchVacancies = async (): Promise<Vacancy[]> => {
  const { data } = await makeCall<{ status: string; data: unknown[] }>({
    method: "GET",
    route: API_ROUTES.recruitment.vacancies,
    isSecureRoute: true
  });

  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows.map(mapApiVacancy);
};

/* ✅ CREATE */
export const createVacancy = async (payload: any): Promise<Vacancy> => {
  const { data } = await makeCall<{ status: string; data: unknown }>({
    method: "POST",
    route: API_ROUTES.recruitment.vacancies,
    body: buildVacancyWritePayload(payload),
    isSecureRoute: true
  });

  return mapApiVacancy(data?.data);
};

/* ✅ UPDATE */
export const updateVacancy = async (
  vacancyId: string,
  payload: any
): Promise<Vacancy> => {
  const { data } = await makeCall<{ status: string; data: unknown }>({
    method: "PUT",
    route: API_ROUTES.vacancies.byId(vacancyId),
    body: buildVacancyWritePayload(payload),
    isSecureRoute: true
  });

  return mapApiVacancy(data?.data);
};

/* ✅ FETCH APPLICATIONS FOR VACANCY */
export const fetchVacancyApplications = async (
  vacancyId: string,
): Promise<any[]> => {
  const { data } = await makeCall<{ status: string; data: unknown[] }>({
    method: "GET",
    route: `${API_ROUTES.vacancies.byId(vacancyId)}/applications`,
    isSecureRoute: true
  });

  return Array.isArray(data?.data) ? data.data : [];
};

/* ✅ FETCH HIRING MINUTE FOR VACANCY */
export const fetchVacancyHiringMinute = async (
  vacancyId: string,
): Promise<any> => {
  const { data } = await makeCall<{ status: string; data: unknown }>({
    method: "GET",
    route: `${API_ROUTES.vacancies.byId(vacancyId)}/hiring-minute`,
    isSecureRoute: true
  });

  return data?.data || null;
};

/* ✅ POST (publish) */
export const postVacancy = async (vacancyId: string): Promise<Vacancy> => {
  const { data } = await makeCall<{ status: string; data: unknown }>({
    method: "POST",
    route: API_ROUTES.vacancies.post(vacancyId),
    isSecureRoute: true
  });

  return mapApiVacancy(data?.data);
};

/* ✅ UNPOST */
export const unpostVacancy = async (vacancyId: string): Promise<Vacancy> => {
  const { data } = await makeCall<{ status: string; data: unknown }>({
    method: "POST",
    route: API_ROUTES.vacancies.unpost(vacancyId),
    isSecureRoute: true
  });

  return mapApiVacancy(data?.data);
};

/* ✅ CLOSE (FULFILL) */
export const closeVacancy = async (vacancyId: string): Promise<Vacancy> => {
  const { data } = await makeCall<{ status: string; data: unknown }>({
    method: "POST",
    route: API_ROUTES.vacancies.close(vacancyId),
    isSecureRoute: true
  });

  return mapApiVacancy(data?.data);
};

/* ✅ APPROVE */
export const approveVacancyPosting = async (
  vacancyId: string,
  notes?: string
): Promise<Vacancy> => {
  const { data } = await makeCall<{ status: string; data: unknown }>({
    method: "POST",
    route: API_ROUTES.vacancies.approvePosting(vacancyId),
    body: { notes },
    isSecureRoute: true
  });

  return mapApiVacancy(data?.data);
};

/* ✅ REJECT */
export const rejectVacancyPosting = async (
  vacancyId: string,
  reason: string
): Promise<Vacancy> => {
  const { data } = await makeCall<{ status: string; data: unknown }>({
    method: "POST",
    route: API_ROUTES.vacancies.rejectPosting(vacancyId),
    body: { reason },
    isSecureRoute: true
  });

  return mapApiVacancy(data?.data);
};

export const holdVacancy = async (vacancyId: string): Promise<Vacancy> => {
  const { data } = await makeCall<{ status: string; data: unknown }>({
    method: "POST",
    route: API_ROUTES.vacancies.hold(vacancyId),
    isSecureRoute: true
  });

  return mapApiVacancy(data?.data);
};

export const resumeVacancy = async (vacancyId: string): Promise<Vacancy> => {
  const { data } = await makeCall<{ status: string; data: unknown }>({
    method: "POST",
    route: API_ROUTES.vacancies.resume(vacancyId),
    isSecureRoute: true
  });

  return mapApiVacancy(data?.data);
};

export const setVacancyStatus = async (
  vacancyId: string,
  status: string
): Promise<Vacancy> => {
  const { data } = await makeCall<{ status: string; data: unknown }>({
    method: "POST",
    route: API_ROUTES.vacancies.setStatus(vacancyId),
    body: { status },
    isSecureRoute: true
  });

  return mapApiVacancy(data?.data);
};

/* ✅ PUBLISH JOB POSTING */
export const publishJobPosting = async (
  vacancyId: string,
  channelIds: string[] = []
): Promise<Vacancy> => {
  const { data } = await makeCall<{ status: string; data: unknown }>({
    method: "POST",
    route: API_ROUTES.vacancies.post(vacancyId),
    body: { channels: channelIds },
    isSecureRoute: true
  });

  return mapApiVacancy(data?.data);
};

/* ✅ CREATE JOB POSTING */
export const createJobPosting = async (
  vacancyId: string,
  channelIds: string[] = []
): Promise<Vacancy> => {
  const { data } = await makeCall<{ status: string; data: unknown }>({
    method: "POST",
    route: API_ROUTES.vacancies.post(vacancyId),
    body: { channels: channelIds },
    isSecureRoute: true
  });

  return mapApiVacancy(data?.data);
};

/* ✅ WITHDRAW JOB POSTING */
export const withdrawJobPosting = async (vacancyId: string): Promise<Vacancy> => {
  const { data } = await makeCall<{ status: string; data: unknown }>({
    method: "POST",
    route: API_ROUTES.vacancies.unpost(vacancyId),
    isSecureRoute: true
  });

  return mapApiVacancy(data?.data);
};
