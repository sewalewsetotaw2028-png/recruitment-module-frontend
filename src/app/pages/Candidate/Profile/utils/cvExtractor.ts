/**
 * cvExtractor.ts
 * Extracts text from a PDF file using pdfjs-dist (browser-side)
 * and maps the content to ALL candidate profile fields shown on the overview page.
 */

export interface ExtractedProfile {
  // Personal Details
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  nationality?: string;
  currentAddress?: string;
  currentEmployer?: string;
  currentPosition?: string;
  yearsOfExperience?: number;
  expectedSalary?: number;
  portfolioUrl?: string;
  preferredJobCategory?: string;
  preferredLocation?: string;
  availabilityStatus?: string;
  summary?: string; // maps to `remarks`
  // Skills & Languages
  skills?: string[];
  languages?: string[];
  // Work Experience
  experiences?: Array<{
    companyName: string;
    position: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
  // Education
  educations?: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    graduationYear?: number;
  }>;
  // Certifications
  certifications?: Array<{
    name: string;
    issuingOrganization?: string;
  }>;
}

// ─── Step 1: Extract text from PDF preserving line structure ──────────────────

/**
 * Extract text lines from a PDF using pdfjs-dist.
 * Groups text items by y-position to reconstruct logical lines,
 * so the parser sees "John Smith" and "Senior Engineer" as separate lines
 * instead of one long space-joined string.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const allLines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group items by rounded y-position (same line = within 3px of each other)
    const yGroups = new Map<number, string[]>();
    for (const item of textContent.items) {
      if (!('str' in item)) continue;
      const str = item.str.trim();
      if (!str) continue;
      // y-coordinate from the transform matrix (index 5)
      const y = Math.round((item as any).transform?.[5] ?? 0);
      // Round to nearest 3px bucket to group items on the same visual line
      const bucket = Math.round(y / 3) * 3;
      if (!yGroups.has(bucket)) yGroups.set(bucket, []);
      yGroups.get(bucket)!.push(str);
    }

    // Sort buckets descending (PDFs have y=0 at bottom, so higher y = higher on page)
    const sorted = [...yGroups.entries()].sort((a, b) => b[0] - a[0]);
    for (const [, words] of sorted) {
      const line = words.join(' ').trim();
      if (line) allLines.push(line);
    }
  }

  return allLines.join('\n');
}

// ─── Step 2: Parse extracted text into structured profile fields ──────────────

export function parseCvText(rawText: string): ExtractedProfile {
  const result: ExtractedProfile = {};

  // Split into clean lines
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const fullText = rawText;
  const lowerFull = fullText.toLowerCase();

  // ─── Email ──────────────────────────────────────────────────────────────────
  const emailRx = /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g;
  const emails = [...fullText.matchAll(emailRx)];
  if (emails.length > 0) result.email = emails[0][0];

  // ─── Phone ──────────────────────────────────────────────────────────────────
  // Match phone numbers: +251912345678, (251) 912-345-678, 09-12-34-56-78 etc.
  const phoneRx = /(?:\+?[\d][\d\s\-().]{6,18}[\d])/g;
  const phones = [...fullText.matchAll(phoneRx)];
  for (const m of phones) {
    const raw = m[0].replace(/[\s\-().]/g, '');
    if (raw.length >= 7 && raw.length <= 15 && /^\+?\d+$/.test(raw)) {
      result.phone = m[0].trim();
      break;
    }
  }

  // ─── Portfolio / Website ────────────────────────────────────────────────────
  const urlRx = /https?:\/\/(?:www\.)?(?:linkedin\.com|github\.com|portfolio\.|behance\.|dribbble\.)[^\s,)>]*/gi;
  const urlMatch = fullText.match(urlRx);
  if (urlMatch) result.portfolioUrl = urlMatch[0];

  // ─── Name ───────────────────────────────────────────────────────────────────
  // Typically the first line(s) that look like "Firstname Lastname"
  // Skip lines that contain @ (email) or digits (phone/address)
  for (const line of lines.slice(0, 8)) {
    if (line.includes('@')) continue;
    if (/\d/.test(line)) continue;
    if (line.length > 60 || line.length < 3) continue;
    const words = line.split(/\s+/).filter((w) => /^[A-Za-zÀ-ÿ'\-]+$/.test(w));
    if (words.length >= 2 && words.length <= 5) {
      result.firstName = words[0];
      result.lastName = words.slice(1).join(' ');
      break;
    }
  }

  // ─── Current Position / Job Title ───────────────────────────────────────────
  const positionKeywords = [
    'engineer', 'developer', 'designer', 'manager', 'analyst', 'consultant',
    'specialist', 'officer', 'director', 'coordinator', 'lead', 'head',
    'architect', 'scientist', 'accountant', 'nurse', 'doctor', 'teacher',
    'administrator', 'executive', 'associate', 'intern', 'technician',
    'supervisor', 'president', 'ceo', 'cto', 'cfo', 'vp ', 'vice president',
  ];
  for (const line of lines.slice(0, 12)) {
    if (line.includes('@')) continue;
    if (/\d{4}/.test(line)) continue; // skip lines with years
    const lower = line.toLowerCase();
    if (positionKeywords.some((k) => lower.includes(k)) && line.length < 100) {
      result.currentPosition = line.trim();
      break;
    }
  }

  // ─── Gender ──────────────────────────────────────────────────────────────────
  const genderRx = /(?:gender|sex)\s*[:–-]?\s*(male|female|man|woman|non.binary|other)/i;
  const genderM = fullText.match(genderRx);
  if (genderM) {
    const g = genderM[1].toLowerCase();
    result.gender = g === 'man' || g === 'male' ? 'MALE'
      : g === 'woman' || g === 'female' ? 'FEMALE'
      : 'OTHER';
  }

  // ─── Date of Birth ───────────────────────────────────────────────────────────
  const dobRx = /(?:date of birth|dob|born|birth date)\s*[:–-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s*\d{4})/i;
  const dobM = fullText.match(dobRx);
  if (dobM) result.dateOfBirth = dobM[1].trim();

  // ─── Nationality ────────────────────────────────────────────────────────────
  const natRx = /(?:nationality|citizenship|citizen)\s*[:–-]?\s*([A-Za-z ]{3,40}?)(?:\n|,|;|$)/i;
  const natM = fullText.match(natRx);
  if (natM) result.nationality = natM[1].trim();

  // ─── Current Address / Location ─────────────────────────────────────────────
  const addrRx = /(?:address|location|city|residing|based in)\s*[:–-]?\s*([^\n,;]{5,80})/i;
  const addrM = fullText.match(addrRx);
  if (addrM) result.currentAddress = addrM[1].trim();

  // ─── Current Employer ────────────────────────────────────────────────────────
  // Look for "Currently at", "Employer:", or lines right before/after current position
  const empRx = /(?:currently\s+at|employer|company|working\s+at|works?\s+at)\s*[:–-]?\s*([^\n,;]{3,60})/i;
  const empM = fullText.match(empRx);
  if (empM) result.currentEmployer = empM[1].trim();

  // ─── Expected Salary ────────────────────────────────────────────────────────
  const salaryRx = /(?:expected\s+salary|salary\s+expectation|desired\s+salary|salary\s+range)\s*[:–-]?\s*\$?([\d,]+(?:\.\d+)?)\s*(?:k|K|usd|USD|ETB|birr|\/(?:month|year|mo|yr))?/i;
  const salaryM = fullText.match(salaryRx);
  if (salaryM) {
    const raw = salaryM[1].replace(/,/g, '');
    const num = parseFloat(raw);
    if (!isNaN(num)) result.expectedSalary = num > 999 ? num : num * 1000; // assume "k" suffix
  }

  // ─── Years of Experience ─────────────────────────────────────────────────────
  const expYrsRx = /(\d+)\+?\s*years?\s*(?:of\s+)?(?:work\s+)?experience/i;
  const expYrsM = fullText.match(expYrsRx);
  if (expYrsM) result.yearsOfExperience = parseInt(expYrsM[1], 10);

  // ─── Preferred Location ──────────────────────────────────────────────────────
  const prefLocRx = /(?:preferred\s+location|open\s+to\s+work(?:ing)?\s+in|willing\s+to\s+relocate\s+to)\s*[:–-]?\s*([^\n,;]{3,60})/i;
  const prefLocM = fullText.match(prefLocRx);
  if (prefLocM) result.preferredLocation = prefLocM[1].trim();

  // ─── Preferred Job Category ──────────────────────────────────────────────────
  const prefCatRx = /(?:preferred\s+(?:job\s+)?category|job\s+preference|looking\s+for\s+(?:a\s+)?role\s+in)\s*[:–-]?\s*([^\n,;]{3,60})/i;
  const prefCatM = fullText.match(prefCatRx);
  if (prefCatM) result.preferredJobCategory = prefCatM[1].trim();

  // ─── Availability ───────────────────────────────────────────────────────────
  const availRx = /(?:availability|available|notice\s+period)\s*[:–-]?\s*(immediately|two\s+weeks?|1\s*month|one\s+month|2\s*weeks?|30\s*days?|immediately\s+available)/i;
  const availM = fullText.match(availRx);
  if (availM) {
    const v = availM[1].toLowerCase();
    if (v.includes('immediat')) result.availabilityStatus = 'IMMEDIATELY';
    else if (v.includes('two') || v.includes('2') || v.includes('14')) result.availabilityStatus = 'TWO_WEEKS';
    else result.availabilityStatus = 'ONE_MONTH';
  }

  // ─── Professional Summary / Objective ──────────────────────────────────────
  const summaryIdx = findSectionIdx(lines, [
    'summary', 'professional summary', 'objective', 'career objective',
    'profile', 'about me', 'about', 'professional profile', 'overview',
  ]);
  if (summaryIdx >= 0) {
    const block = extractSectionBlock(lines, summaryIdx, 6);
    if (block.length) result.summary = block.join(' ').slice(0, 600);
  }

  // ─── Skills ─────────────────────────────────────────────────────────────────
  const skillsIdx = findSectionIdx(lines, [
    'skills', 'technical skills', 'core competencies', 'key skills',
    'expertise', 'technologies', 'tools', 'competencies', 'proficiencies',
  ]);
  if (skillsIdx >= 0) {
    const block = extractSectionBlock(lines, skillsIdx, 25);
    const rawSkills: string[] = [];
    for (const line of block) {
      // Split on commas, pipes, bullets, semicolons
      const parts = line
        .split(/[,|•·\t\/\\;]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && s.length < 50 && !/^\d+$/.test(s));
      rawSkills.push(...parts);
    }
    result.skills = [...new Set(rawSkills)].slice(0, 40);
  }
  // Fallback: scan full text for known tech keywords if skills section not found
  if (!result.skills?.length) {
    result.skills = detectSkillsFromText(fullText);
  }

  // ─── Languages ──────────────────────────────────────────────────────────────
  const langIdx = findSectionIdx(lines, [
    'languages', 'language skills', 'spoken languages', 'linguistic skills',
  ]);
  if (langIdx >= 0) {
    const block = extractSectionBlock(lines, langIdx, 10);
    const langs: string[] = [];
    for (const line of block) {
      const parts = line
        .split(/[,|•·\t;\/]+/)
        .map((s) => s.replace(/[-–]\s*(native|fluent|proficient|basic|intermediate|advanced|c1|c2|b1|b2|a1|a2).*/i, '').trim())
        .filter((s) => s.length > 1 && s.length < 40 && !/\d/.test(s));
      langs.push(...parts);
    }
    result.languages = [...new Set(langs)].slice(0, 10);
  }

  // ─── Work Experience ────────────────────────────────────────────────────────
  const expIdx = findSectionIdx(lines, [
    'experience', 'work experience', 'employment history',
    'professional experience', 'work history', 'career history',
    'employment', 'professional background',
  ]);
  if (expIdx >= 0) {
    result.experiences = parseExperiences(lines, expIdx);
  }

  // ─── Education ──────────────────────────────────────────────────────────────
  const eduIdx = findSectionIdx(lines, [
    'education', 'academic background', 'academic qualifications',
    'educational background', 'qualifications', 'academic history',
  ]);
  if (eduIdx >= 0) {
    result.educations = parseEducations(lines, eduIdx);
  }

  // ─── Certifications ─────────────────────────────────────────────────────────
  const certIdx = findSectionIdx(lines, [
    'certifications', 'certificates', 'professional certifications',
    'licenses', 'accreditations', 'credentials',
  ]);
  if (certIdx >= 0) {
    const block = extractSectionBlock(lines, certIdx, 20);
    result.certifications = block
      .filter((l) => l.length > 3 && l.length < 200)
      .map((l) => {
        const byMatch = l.match(/(.+?)\s*(?:by|from|issued by|–|-)\s*(.+)/i);
        return byMatch
          ? { name: byMatch[1].trim(), issuingOrganization: byMatch[2].trim() }
          : { name: l.trim() };
      })
      .slice(0, 10);
  }

  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SECTION_MARKERS = [
  'experience', 'education', 'skills', 'certifications', 'languages',
  'summary', 'objective', 'profile', 'about', 'references', 'projects',
  'awards', 'publications', 'volunteer', 'interests', 'hobbies', 'overview',
  'competencies', 'contact', 'personal', 'employment', 'academic',
];

function isSectionHeader(line: string): boolean {
  const l = line.toLowerCase().trim();
  return SECTION_MARKERS.some(
    (h) => l === h || l === h + ':' || l === h + 's' || l === h + 's:' || l.startsWith(h + ' '),
  );
}

function findSectionIdx(lines: string[], headings: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase().trim();
    if (headings.some((h) => lower === h || lower === h + ':' || lower === h + 's' || lower === h + 's:' || lower.startsWith(h + ': '))) {
      return i;
    }
  }
  return -1;
}

function extractSectionBlock(lines: string[], startIdx: number, maxLines = 20): string[] {
  const result: string[] = [];
  for (let i = startIdx + 1; i < lines.length && result.length < maxLines; i++) {
    if (isSectionHeader(lines[i])) break;
    result.push(lines[i]);
  }
  return result;
}

/** Known tech/professional skills to scan for when no "Skills" section found */
const KNOWN_SKILLS = [
  'JavaScript','TypeScript','React','Vue','Angular','Node.js','Python','Java','C#','C++',
  'Go','Rust','PHP','Ruby','Swift','Kotlin','SQL','MongoDB','PostgreSQL','MySQL','Redis',
  'GraphQL','REST','Docker','Kubernetes','AWS','Azure','GCP','Git','Agile','Scrum',
  'HTML','CSS','Sass','Webpack','Jest','Linux','Bash','Excel','Power BI','Tableau',
  'TensorFlow','PyTorch','Pandas','NumPy','Django','Flask','Spring','Laravel','Express',
  'Project Management','Leadership','Communication','Problem Solving','Teamwork',
  'Accounting','Finance','Marketing','Sales','HR','Data Analysis','Machine Learning',
];

function detectSkillsFromText(text: string): string[] {
  const found: string[] = [];
  for (const skill of KNOWN_SKILLS) {
    const rx = new RegExp(`\\b${skill.replace(/[.+]/g, '\\$&')}\\b`, 'i');
    if (rx.test(text)) found.push(skill);
  }
  return found.slice(0, 30);
}

/** Parse work experience entries from the section block */
function parseExperiences(
  lines: string[],
  startIdx: number,
): NonNullable<ExtractedProfile['experiences']> {
  const block = extractSectionBlock(lines, startIdx, 60);
  const results: NonNullable<ExtractedProfile['experiences']> = [];

  // Date range patterns
  const dateRangeRx =
    /(\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s*\d{4}|\d{4})\s*[-–—to]+\s*(present|current|now|\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s*\d{4}|\d{4})/i;

  type Entry = { companyName: string; position: string; startDate: string; endDate?: string; description?: string };
  let current: Entry | null = null;
  const desc: string[] = [];

  const flush = () => {
    if (current) {
      if (desc.length) current.description = desc.join(' ').trim().slice(0, 300);
      results.push(current);
    }
    current = null;
    desc.length = 0;
  };

  for (const line of block) {
    const dateM = line.match(dateRangeRx);
    if (dateM) {
      flush();
      const isPresent = /present|current|now/i.test(dateM[2]);
      current = {
        companyName: line.replace(dateRangeRx, '').replace(/[|\-–—]/g, '').trim() || 'Unknown Company',
        position: 'Unknown Position',
        startDate: dateM[1].trim(),
        endDate: isPresent ? undefined : dateM[2].trim(),
      };
    } else if (current) {
      if (current.position === 'Unknown Position' && line.length > 2 && line.length < 100 && !/^\d/.test(line)) {
        // First non-date non-empty line after date = likely job title or company
        if (current.companyName === 'Unknown Company' || current.companyName.length < 3) {
          current.companyName = line.trim();
        } else {
          current.position = line.trim();
        }
      } else if (line.length > 5) {
        desc.push(line);
      }
    }
  }
  flush();

  return results.slice(0, 6);
}

/** Parse education entries from the section block */
function parseEducations(
  lines: string[],
  startIdx: number,
): NonNullable<ExtractedProfile['educations']> {
  const block = extractSectionBlock(lines, startIdx, 40);
  const results: NonNullable<ExtractedProfile['educations']> = [];

  const degreeRx =
    /\b(bachelor(?:'s)?(?:\s+of\s+\w+)?|master(?:'s)?(?:\s+of\s+\w+)?|phd|ph\.d|doctorate|diploma|associate(?:'s)?|mba|msc|bsc|b\.sc|m\.sc|b\.a|m\.a|b\.eng|m\.eng)\b/i;
  const yearRx = /\b(19|20)\d{2}\b/;

  type EduEntry = { institution: string; degree: string; fieldOfStudy: string; graduationYear?: number };
  let current: EduEntry | null = null;

  const flush = () => {
    if (current) results.push(current);
    current = null;
  };

  for (const line of block) {
    const degM = line.match(degreeRx);
    const yearM = line.match(yearRx);

    if (degM) {
      flush();
      const year = yearM ? parseInt(yearM[0], 10) : undefined;
      // Extract field of study: "in X", "of X", or parenthetical
      const fieldM = line.match(/\b(?:in|of)\s+([A-Za-z][A-Za-z &,]+?)(?:\s*[,;(]|\s*\d|$)/i);
      current = {
        institution: 'Unknown Institution',
        degree: degM[0].trim(),
        fieldOfStudy: fieldM ? fieldM[1].trim() : '',
        graduationYear: year,
      };
      // If there's text beyond the degree on the same line, it might be the institution
      const rest = line.replace(degreeRx, '').replace(yearRx, '').replace(/\bin\b[^,]+/i, '').trim();
      if (rest.length > 2) current.institution = rest.replace(/[–\-|,]+$/, '').trim();
    } else if (current && current.institution === 'Unknown Institution') {
      if (line.length > 2 && line.length < 100) {
        current.institution = line.trim();
        flush();
      }
    }
  }
  flush();

  return results.slice(0, 4);
}
