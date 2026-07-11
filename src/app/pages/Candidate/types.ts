export type CandidateProfileTab =
  | 'overview'
  | 'personal-details'
  | 'experience'
  | 'education'
  | 'documents'
  | 'certifications'
  | 'skills-languages';

export interface CandidateProfileDocument {
  id: string;
  name: string;
  fileUrl: string;
  documentType: string;
}

export interface Experience {
  id: string;
  companyName: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
  documentUrl?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: number;
  certificateUrl?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuing_organization?: string;
  issue_date?: string;
  expiration_date?: string;
  credential_id?: string;
  credential_url?: string;
}

export interface CandidatePhone {
  id: string;
  phone_number: string;
  phone_type?: string;
  is_primary: boolean;
}

export interface CandidateAddress {
  id: string;
  region?: string;
  city?: string;
  sub_city?: string;
  woreda?: string;
}

export interface CandidateProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  photo?: string;
  location?: string;
  gender?: string;
  date_of_birth?: string;
  nationality?: string;
  current_address?: string;
  years_of_experience?: number;
  current_employer?: string;
  current_position?: string;
  skills: string[];
  languages: string[];
  portfolio_url?: string;
  preferred_job_category?: string;
  preferred_location?: string;
  expected_salary?: number;
  availability_status?: string;
  remarks?: string;
  experiences: Experience[];
  educations: Education[];
  documents: CandidateProfileDocument[];
  certifications: Certification[];
  phones: CandidatePhone[];
  addresses: CandidateAddress[];
}
