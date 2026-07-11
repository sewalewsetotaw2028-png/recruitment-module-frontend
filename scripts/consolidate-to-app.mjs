/**
 * Consolidate all app code under src/app (frontendguide-style).
 * Run from recruitment-module/: node scripts/consolidate-to-app.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('src');
const APP = path.join(ROOT, 'app');

function exists(p) {
  return fs.existsSync(p);
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function moveDir(from, to) {
  if (!exists(from)) return;
  ensureDir(path.dirname(to));
  fs.cpSync(from, to, { recursive: true });
  fs.rmSync(from, { recursive: true, force: true });
  console.log('moved', path.relative(process.cwd(), from), '->', path.relative(process.cwd(), to));
}

function copyFile(from, to) {
  if (!exists(from)) return;
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
  console.log('copied', path.relative(process.cwd(), from));
}

function moveFile(from, to) {
  if (!exists(from)) return;
  ensureDir(path.dirname(to));
  if (exists(to)) fs.rmSync(to);
  fs.renameSync(from, to);
  console.log('moved file', path.relative(process.cwd(), from));
}

function rmrf(p) {
  if (exists(p)) {
    fs.rmSync(p, { recursive: true, force: true });
    console.log('removed', path.relative(process.cwd(), p));
  }
}

// --- 1. Top-level -> app ---
const topMoves = [
  ['store', 'app/store'],
  ['utils', 'app/utils'],
  ['services', 'app/services'],
  ['types', 'app/types'],
  ['data', 'app/data'],
  ['config', 'app/config'],
  ['constants', 'app/constants'],
  ['assets', 'app/assets'],
  ['components', 'app/components'],
  ['hooks', 'app/hooks'],
  ['styles', 'app/styles'],
  ['lib', 'app/lib'],
  ['routes', 'app/routes'],
];

for (const [from, to] of topMoves) {
  moveDir(path.join(ROOT, from), path.join(ROOT, to));
}

// layouts -> DefaultLayout
const layoutsDir = path.join(ROOT, 'layouts');
if (exists(layoutsDir)) {
  const defaultLayout = path.join(APP, 'components', 'DefaultLayout');
  ensureDir(defaultLayout);
  for (const entry of fs.readdirSync(layoutsDir)) {
    const src = path.join(layoutsDir, entry);
    const dest = path.join(defaultLayout, entry);
    if (exists(dest)) continue;
    fs.renameSync(src, dest);
  }
  rmrf(layoutsDir);
}

// --- 2. Feature components -> page folders ---
const featureMoves = [
  ['features/screening/components', 'app/pages/Recruitment/Screening/components'],
  ['features/screening/types', 'app/pages/Recruitment/Screening/types'],
  ['features/screening/utils', 'app/pages/Recruitment/Screening/utils'],
  ['features/interviews/components', 'app/pages/Recruitment/Interviews/components'],
  ['features/question-bank/components', 'app/pages/Recruitment/QuestionBank/components'],
  ['features/applications/components/PipelineBoard.tsx', 'app/pages/Recruitment/Kanban/components/PipelineBoard.tsx'],
  ['features/applications/components/ShortlistedCandidates.tsx', 'app/pages/Recruitment/Shortlisted/components/ShortlistedCandidates.tsx'],
  ['features/vacancy/components', 'app/pages/Recruitment/Vacancies/components'],
  ['features/candidate/components', 'app/pages/Candidate/Profile/components'],
  ['features/candidate/types.ts', 'app/pages/Candidate/types.ts'],
  ['features/workforce-planning/components/WorkforcePlanningCreateForm.tsx', 'app/pages/Recruitment/WorkforcePlanningCreate/components/WorkforcePlanningCreateForm.tsx'],
  ['features/workforce-planning/components', 'app/pages/Recruitment/WorkforcePlanning/components'],
  ['features/recruitment-requests/components/RecruitmentRequestCreateForm.tsx', 'app/pages/Recruitment/RecruitmentRequestCreate/components/RecruitmentRequestCreateForm.tsx'],
  ['features/recruitment-requests/components/RecruitmentRequestList.tsx', 'app/pages/Recruitment/RecruitmentRequests/components/RecruitmentRequestList.tsx'],
  ['features/recruitment-requests/components', 'app/pages/Recruitment/RecruitmentRequests/components'],
  ['features/workspace/components', 'app/pages/Recruitment/Dashboard/components'],
  ['features/workspace/utils', 'app/pages/Recruitment/Dashboard/utils'],
  ['features/workspace/pages/HRDashboardPage.tsx', 'app/pages/Recruitment/Dashboard/workspaces/HRDashboardPage.tsx'],
  ['features/workspace/pages/CEOWorkspace.tsx', 'app/pages/Recruitment/Dashboard/workspaces/CEOWorkspace.tsx'],
  ['features/workspace/pages/HiringManagerWorkspace.tsx', 'app/pages/Recruitment/Dashboard/workspaces/HiringManagerWorkspace.tsx'],
  ['features/workspace/pages/DepartmentManagerWorkspace.tsx', 'app/pages/Recruitment/Dashboard/workspaces/DepartmentManagerWorkspace.tsx'],
  ['features/workspace/pages/CandidateDashboardPage.tsx', 'app/pages/Candidate/Dashboard/index.tsx'],
  ['features/candidate/pages/CandidateDashboardPage.tsx', 'app/pages/Candidate/Dashboard/index.tsx'],
  ['features/auth/components', 'app/components/auth'],
  ['features/auth/api', 'app/API/auth'],
];

for (const [from, to] of featureMoves) {
  const fromPath = path.join(ROOT, from);
  const toPath = path.join(ROOT, to);
  if (!exists(fromPath)) continue;
  if (from.endsWith('.tsx') || from.endsWith('.ts')) {
    copyFile(fromPath, toPath);
    fs.rmSync(fromPath, { force: true });
  } else {
    moveDir(fromPath, toPath);
  }
}

// Hub components to Dashboard
const hubFiles = [
  ['features/workforce-planning/components/WorkforcePlanningHub.tsx', 'app/pages/Recruitment/Dashboard/components/WorkforcePlanningHub.tsx'],
  ['features/recruitment-requests/components/RecruitmentRequestHub.tsx', 'app/pages/Recruitment/Dashboard/components/RecruitmentRequestHub.tsx'],
];
for (const [from, to] of hubFiles) {
  const fromPath = path.join(ROOT, from);
  if (exists(fromPath)) moveFile(fromPath, path.join(ROOT, to));
}

// --- 3. Remove legacy ---
rmrf(path.join(ROOT, 'features'));
rmrf(path.join(ROOT, 'pages'));
rmrf(path.join(ROOT, 'views'));
rmrf(path.join(APP, 'rootReducer.ts'));

console.log('\n--- Import rewrite ---');

function walk(dir, files = []) {
  if (!exists(dir)) return files;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') walk(full, files);
    else if (/\.(tsx?|jsx?)$/.test(e.name)) files.push(full);
  }
  return files;
}

const replacements = [
  // features -> new paths (longest first)
  [/from ['"]@?\.\.\/.*features\/screening\/components\//g, "from '@/pages/Recruitment/Screening/components/"],
  [/from ['"]@?\.\.\/.*features\/screening\/types\//g, "from '@/pages/Recruitment/Screening/types/"],
  [/from ['"]@?\.\.\/.*features\/interviews\/components\//g, "from '@/pages/Recruitment/Interviews/components/"],
  [/from ['"]@?\.\.\/.*features\/question-bank\/components\//g, "from '@/pages/Recruitment/QuestionBank/components/"],
  [/from ['"]@?\.\.\/.*features\/applications\/components\//g, "from '@/pages/Recruitment/"],
  [/from ['"]@?\.\.\/.*features\/vacancy\/components\//g, "from '@/pages/Recruitment/Vacancies/components/"],
  [/from ['"]@?\.\.\/.*features\/candidate\/components\//g, "from '@/pages/Candidate/Profile/components/"],
  [/from ['"]@?\.\.\/.*features\/candidate\/types['"]/g, "from '@/pages/Candidate/types'"],
  [/from ['"]@?\.\.\/.*features\/workforce-planning\/components\//g, "from '@/pages/Recruitment/WorkforcePlanning/components/"],
  [/from ['"]@?\.\.\/.*features\/recruitment-requests\/components\//g, "from '@/pages/Recruitment/RecruitmentRequests/components/"],
  [/from ['"]@?\.\.\/.*features\/workspace\/pages\//g, "from '@/pages/Recruitment/Dashboard/workspaces/"],
  [/from ['"]@?\.\.\/.*features\/workspace\/components\//g, "from '@/pages/Recruitment/Dashboard/components/"],
  [/from ['"]@?\.\.\/.*features\/candidate\/pages\/CandidateDashboardPage['"]/g, "from '@/pages/Candidate/Dashboard'"],
  [/from ['"]@?\.\.\/.*features\/auth\/components\//g, "from '@/components/auth/"],
  [/from ['"]@?\.\.\/.*features\/auth\/hooks\/useAuth['"]/g, "from '@/hooks/useAuth'"],
  [/from ['"]@?\.\.\/.*features\/auth\//g, "from '@/"],
  [/from ['"]@?\.\.\/\.\.\/\.\.\/features\//g, "from '@/pages/"],
  [/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/features\//g, "from '@/pages/"],

  // store paths
  [/from ['"]\.\.\/\.\.\/store\//g, "from '@/store/"],
  [/from ['"]\.\.\/\.\.\/\.\.\/store\//g, "from '@/store/"],
  [/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/store\//g, "from '@/store/"],
  [/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/store\//g, "from '@/store/"],
  [/from ['"]\.\.\/store\//g, "from '@/store/"],

  // app cross-refs (old src/store importing app/slice)
  [/from ['"]\.\.\/app\/slice\//g, "from '@/slice/"],
  [/from ['"]\.\.\/\.\.\/app\/slice\//g, "from '@/slice/"],
  [/from ['"]\.\.\/\.\.\/\.\.\/app\/slice\//g, "from '@/slice/"],
  [/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/app\/slice\//g, "from '@/slice/"],

  // common app modules
  [/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/components\//g, "from '@/components/"],
  [/from ['"]\.\.\/\.\.\/\.\.\/components\//g, "from '@/components/"],
  [/from ['"]\.\.\/\.\.\/components\//g, "from '@/components/"],
  [/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/services\//g, "from '@/services/"],
  [/from ['"]\.\.\/\.\.\/\.\.\/services\//g, "from '@/services/"],
  [/from ['"]\.\.\/\.\.\/services\//g, "from '@/services/"],
  [/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/utils\//g, "from '@/utils/"],
  [/from ['"]\.\.\/\.\.\/\.\.\/utils\//g, "from '@/utils/"],
  [/from ['"]\.\.\/\.\.\/utils\//g, "from '@/utils/"],
  [/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/types/g, "from '@/types"],
  [/from ['"]\.\.\/\.\.\/\.\.\/types/g, "from '@/types"],
  [/from ['"]\.\.\/\.\.\/types/g, "from '@/types"],
  [/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/data\//g, "from '@/data/"],
  [/from ['"]\.\.\/\.\.\/\.\.\/data\//g, "from '@/data/"],
  [/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/hooks\//g, "from '@/hooks/"],
  [/from ['"]\.\.\/\.\.\/\.\.\/hooks\//g, "from '@/hooks/"],
  [/from ['"]\.\.\/\.\.\/\.\.\/state['"]/g, "from '@/state'"],
  [/from ['"]\.\.\/\.\.\/state['"]/g, "from '@/state'"],
  [/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/state['"]/g, "from '@/state'"],
  [/from ['"]\.\.\/\.\.\/\.\.\/API/g, "from '@/API"],
  [/from ['"]\.\.\/\.\.\/API/g, "from '@/API"],
  [/from ['"]\.\.\/API/g, "from '@/API"],

  // layouts
  [/from ['"]@?\.\.\/.*layouts\/DashboardLayout['"]/g, "from '@/components/DefaultLayout/DashboardLayout'"],
  [/from ['"]@?\.\.\/.*layouts\//g, "from '@/components/DefaultLayout/"],

  // providers / router entry
  [/from ['"]\.\.\/features\/auth['"]/g, "from '@/components/auth'"],
  [/from ['"]\.\.\/\.\.\/features\/auth['"]/g, "from '@/components/auth'"],
  [/from ['"]\.\.\/store\/store['"]/g, "from '@/store/store'"],
  [/from ['"]\.\.\/\.\.\/store\/store['"]/g, "from '@/store/store'"],

  // slice selectors RootState
  [/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/store\/types\/RootState['"]/g, "from '@/store/types/RootState'"],
  [/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/store\/types\/RootState['"]/g, "from '@/store/types/RootState'"],

  // re-export shims
  [/from ['"]\.\.\/\.\.\/\.\.\/app\//g, "from '@/"],
  [/from ['"]\.\.\/\.\.\/app\//g, "from '@/"],
  [/from ['"]\.\.\/app\//g, "from '@/"],

  // Dashboard workspace relative
  [/from ['"]\.\.\/\.\.\/\.\.\/features\/workspace\/pages\//g, "from './workspaces/"],
  [/from ['"]\.\.\/\.\.\/\.\.\/\.\.\/features\/workspace\/pages\//g, "from './workspaces/"],
  [/from ['"]\.\.\/\.\.\/\.\.\/features\/candidate\/pages\/CandidateDashboardPage['"]/g, "from '@/pages/Candidate/Dashboard'"],
];

const files = [
  ...walk(APP),
  path.join(ROOT, 'main.tsx'),
  path.join(ROOT, 'App.tsx'),
].filter(exists);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const [re, rep] of replacements) {
    const next = content.replace(re, rep);
    if (next !== content) {
      content = next;
      changed = true;
    }
  }
  // page-local components
  if (file.includes('pages/Recruitment/Screening/index')) {
    content = content
      .replace(/from '@\/pages\/Recruitment\/Screening\/components\//g, "from './components/")
      .replace(/from '@\/pages\/Recruitment\/Screening\/types\//g, "from './types/");
  }
  if (changed) fs.writeFileSync(file, content);
}

console.log('consolidation complete');
