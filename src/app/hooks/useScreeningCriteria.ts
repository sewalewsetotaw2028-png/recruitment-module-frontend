import { apiFetch } from '@/services/apiClient';

const API_V1 = '/api/v1';

export const SCREENING_CRITERIA_ROUTES = {
  criteria: `${API_V1}/config/screening-criteria`,
  criteriaByVacancy: (vacancyId: string) =>
    `${API_V1}/config/screening-criteria/vacancy/${vacancyId}`,
  criterionById: (id: string) => `${API_V1}/config/screening-criteria/${id}`,
};

export const SCREENING_CRITERIA_FIELDS = [
  'Educational Qualification',
  'Field of Study',
  'Relevant Work Experience',
  'Technical Skills',
  'Language Proficiency',
  'Availability',
  'Location Requirement',
  'Preferred Job Category',
  'Current Position Level',
  'Salary Expectation',
] as const;

export const SCREENING_CRITERIA_OPERATORS = [
  'required',
  'min_years',
  'equals',
  'contains',
  'max_salary',
] as const;

export const SCREENING_CRITERIA_OPERATOR_OPTIONS = {
  'Educational Qualification': ['equals', 'contains'],
  'Field of Study': ['equals', 'contains'],
  'Relevant Work Experience': ['min_years', 'equals'],
  'Technical Skills': ['contains', 'required'],
  'Language Proficiency': ['equals', 'contains'],
  Availability: ['equals'],
  'Location Requirement': ['equals'],
  'Preferred Job Category': ['equals', 'contains'],
  'Current Position Level': ['equals', 'contains'],
  'Salary Expectation': ['max_salary'],
} as const satisfies Record<
  ScreeningCriterionField,
  readonly ScreeningCriterionOperator[]
>;

export const SCREENING_CRITERIA_VALUE_PLACEHOLDERS = {
  'Educational Qualification': "e.g. Bachelor's Degree",
  'Field of Study': 'e.g. Computer Science, Business Administration',
  'Relevant Work Experience': 'e.g. 3',
  'Technical Skills': 'e.g. React, SQL, project management',
  'Language Proficiency': 'e.g. English, Amharic',
  Availability: 'e.g. Immediate or within notice period',
  'Location Requirement': 'e.g. Addis Ababa',
  'Preferred Job Category': 'e.g. Software Engineering, Finance',
  'Current Position Level': 'e.g. Mid-level, Senior, Lead',
  'Salary Expectation': 'e.g. 50000 (max budget in ETB)',
} as const satisfies Record<ScreeningCriterionField, string>;

// Dropdown options for candidate-facing fields
export const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js', 'Python',
  'Java', 'C#', 'C++', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
  'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST API',
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Git',
  'Agile', 'Scrum', 'Project Management', 'Leadership', 'Communication',
  'Problem Solving', 'Critical Thinking', 'Team Collaboration', 'Time Management',
  'Data Analysis', 'Machine Learning', 'Data Science', 'DevOps', 'Cybersecurity',
  'UI/UX Design', 'Graphic Design', 'User Research', 'Wireframing', 'Prototyping',
  'Sales', 'Marketing', 'Customer Service', 'Business Development', 'Negotiation',
  'Accounting', 'Finance', 'Budgeting', 'Financial Analysis', 'Risk Management',
  'HR Management', 'Recruiting', 'Talent Acquisition', 'Employee Relations',
  'Operations Management', 'Supply Chain', 'Logistics', 'Quality Assurance',
  'Content Writing', 'Copywriting', 'Technical Writing', 'SEO', 'Social Media',
  'Mobile Development', 'iOS', 'Android', 'Flutter', 'React Native',
  'Testing', 'Unit Testing', 'Integration Testing', 'E2E Testing', 'TDD',
  'System Design', 'Architecture', 'Microservices', 'Serverless',
] as const;

export const SCREENING_CRITERIA_VALUE_OPTIONS = {
  // Values match exactly what the candidate profile degree field stores
  'Educational Qualification': [
    'High School',
    "Associate's Degree",
    "Bachelor's Degree",
    "Master's Degree",
    'PhD',
    'Professional Certificate',
  ],
  'Field of Study': [
    'Computer Science',
    'Information Technology',
    'Software Engineering',
    'Business Administration',
    'Finance',
    'Accounting',
    'Marketing',
    'Human Resources',
    'Economics',
    'Engineering',
    'Data Science',
    'Other',
  ],
  Availability: [
    'IMMEDIATELY',
    'TWO_WEEKS',
    'ONE_MONTH',
    'MORE_THAN_ONE_MONTH',
  ],
  'Location Requirement': [
    'Addis Ababa',
    'Dire Dawa',
    'Mekelle',
    'Gondar',
    'Hawassa',
    'Bahir Dar',
    'Adama',
    'Jimma',
    'Remote',
    'Willing to Relocate',
  ],
  // Language Proficiency is intentionally NOT here → renders as free-text input
  'Current Position Level': [
    'Entry Level',
    'Junior',
    'Mid-level',
    'Senior',
    'Lead',
    'Manager',
    'Director',
    'Executive',
  ],
  'Technical Skills': COMMON_SKILLS,
} as const satisfies Partial<Record<ScreeningCriterionField, readonly string[]>>;

export type ScreeningCriterionField =
  (typeof SCREENING_CRITERIA_FIELDS)[number];
export type ScreeningCriterionOperator =
  (typeof SCREENING_CRITERIA_OPERATORS)[number];

export interface ScreeningCriterion {
  field: ScreeningCriterionField | string;
  operator: ScreeningCriterionOperator | string;
  value: any;
  weight: number;
}

export interface ScreeningCriteria {
  id: string;
  vacancy_id: string | null;
  job_template_id: string | null;
  criteria_json: ScreeningCriterion[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateScreeningCriteriaPayload {
  vacancyId?: string;
  jobTemplateId?: string;
  criteriaJson: ScreeningCriterion[];
  isActive?: boolean;
}

export interface UpdateScreeningCriteriaPayload {
  criteriaJson?: ScreeningCriterion[];
  isActive?: boolean;
}

export const createEmptyScreeningCriterion = (): ScreeningCriterion => ({
  field: SCREENING_CRITERIA_FIELDS[0],
  operator: 'required',
  value: '',
  weight: 10,
});

export async function fetchScreeningCriteria(): Promise<ScreeningCriteria[]> {
  const res = await apiFetch(SCREENING_CRITERIA_ROUTES.criteria);
  return res.data as ScreeningCriteria[];
}

export async function fetchScreeningCriteriaForVacancy(
  vacancyId: string,
): Promise<ScreeningCriteria[]> {
  const res = await apiFetch(
    SCREENING_CRITERIA_ROUTES.criteriaByVacancy(vacancyId),
  );
  return res.data as ScreeningCriteria[];
}

export async function createScreeningCriteria(
  payload: CreateScreeningCriteriaPayload,
): Promise<ScreeningCriteria> {
  const res = await apiFetch(SCREENING_CRITERIA_ROUTES.criteria, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data as ScreeningCriteria;
}

export async function saveScreeningCriteriaForVacancy(
  vacancyId: string,
  payload: UpdateScreeningCriteriaPayload,
): Promise<ScreeningCriteria> {
  const res = await apiFetch(
    SCREENING_CRITERIA_ROUTES.criteriaByVacancy(vacancyId),
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  );
  return res.data as ScreeningCriteria;
}

export async function updateScreeningCriteria(
  id: string,
  payload: UpdateScreeningCriteriaPayload,
): Promise<ScreeningCriteria> {
  const res = await apiFetch(SCREENING_CRITERIA_ROUTES.criterionById(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data as ScreeningCriteria;
}

export async function deleteScreeningCriteria(id: string): Promise<void> {
  await apiFetch(SCREENING_CRITERIA_ROUTES.criterionById(id), {
    method: 'DELETE',
  });
}
