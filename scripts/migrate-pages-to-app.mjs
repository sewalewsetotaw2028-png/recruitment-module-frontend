import fs from 'fs';
import path from 'path';

const root = path.resolve('src');

const pages = [
  {
    src: 'features/auth/pages/LoginPage.tsx',
    dest: 'app/pages/Authentication/Login',
    slice: 'authenticationLogin',
    feature: 'features/auth',
  },
  {
    src: 'features/auth/pages/SignupPage.tsx',
    dest: 'app/pages/Authentication/Signup',
    slice: 'authenticationSignup',
    feature: 'features/auth',
  },
  {
    src: 'features/workspace/pages/DashboardHomePage.tsx',
    dest: 'app/pages/Recruitment/Dashboard',
    slice: 'recruitmentDashboard',
    feature: 'features/workspace',
  },
  {
    src: 'features/workspace/pages/HRSettingsPage.tsx',
    dest: 'app/pages/Recruitment/Settings',
    slice: 'recruitmentSettings',
    feature: 'features/workspace',
  },
  {
    src: 'features/workforce-planning/pages/WorkforcePlanningListPage.tsx',
    dest: 'app/pages/Recruitment/WorkforcePlanning',
    slice: 'workforcePlanning',
    feature: 'features/workforce-planning',
  },
  {
    src: 'features/workforce-planning/pages/WorkforcePlanningCreatePage.tsx',
    dest: 'app/pages/Recruitment/WorkforcePlanningCreate',
    slice: 'workforcePlanningCreate',
    feature: 'features/workforce-planning',
  },
  {
    src: 'features/recruitment-requests/pages/RecruitmentRequestListPage.tsx',
    dest: 'app/pages/Recruitment/RecruitmentRequests',
    slice: 'recruitmentRequests',
    feature: 'features/recruitment-requests',
  },
  {
    src: 'features/recruitment-requests/pages/RecruitmentRequestCreatePage.tsx',
    dest: 'app/pages/Recruitment/RecruitmentRequestCreate',
    slice: 'recruitmentRequestCreate',
    feature: 'features/recruitment-requests',
  },
  {
    src: 'features/vacancy/pages/VacancyHub.tsx',
    dest: 'app/pages/Recruitment/Vacancies',
    slice: 'vacancies',
    feature: 'features/vacancy',
  },
  {
    src: 'features/screening/pages/ScreeningPage.tsx',
    dest: 'app/pages/Recruitment/Screening',
    slice: 'screening',
    feature: 'features/screening',
  },
  {
    src: 'features/interviews/pages/InterviewListPage.tsx',
    dest: 'app/pages/Recruitment/Interviews',
    slice: 'interviews',
    feature: 'features/interviews',
  },
  {
    src: 'features/applications/pages/ShortlistedPage.tsx',
    dest: 'app/pages/Recruitment/Shortlisted',
    slice: 'shortlisted',
    feature: 'features/applications',
  },
  {
    src: 'features/applications/pages/KanbanPipelinePage.tsx',
    dest: 'app/pages/Recruitment/Kanban',
    slice: 'kanban',
    feature: 'features/applications',
  },
  {
    src: 'features/question-bank/pages/QuestionBankPage.tsx',
    dest: 'app/pages/Recruitment/QuestionBank',
    slice: 'questionBank',
    feature: 'features/question-bank',
  },
  {
    src: 'features/offers/pages/OfferListPage.tsx',
    dest: 'app/pages/Recruitment/Offers',
    slice: 'offers',
    feature: 'features/offers',
  },
  {
    src: 'features/talent-roster/pages/TalentPoolPage.tsx',
    dest: 'app/pages/Recruitment/TalentPool',
    slice: 'talentPool',
    feature: 'features/talent-roster',
  },
  {
    src: 'features/candidate/pages/CandidateApplicationsPage.tsx',
    dest: 'app/pages/Candidate/Applications',
    slice: 'candidateApplications',
    feature: 'features/candidate',
  },
  {
    src: 'features/candidate/pages/CandidateJobSearchPage.tsx',
    dest: 'app/pages/Candidate/JobSearch',
    slice: 'candidateJobSearch',
    feature: 'features/candidate',
  },
  {
    src: 'features/candidate/pages/CandidateProfile.tsx',
    dest: 'app/pages/Candidate/Profile',
    slice: 'candidateProfile',
    feature: 'features/candidate',
  },
];

function pascalCase(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function hookName(slice) {
  return `use${pascalCase(slice)}Slice`;
}

function fixImports(content, feature) {
  let out = content;
  out = out.replace(/\.\.\/\.\.\/\.\.\/app\/state/g, '../../../state');
  out = out.replace(/\.\.\/\.\.\/\.\.\/app\//g, '../../../');
  out = out.replace(/\.\.\/\.\.\/\.\.\/components\//g, '../../../../components/');
  out = out.replace(/\.\.\/\.\.\/\.\.\/features\//g, '../../../../features/');
  out = out.replace(/\.\.\/\.\.\/\.\.\/hooks\//g, '../../../../hooks/');
  out = out.replace(/\.\.\/\.\.\/\.\.\/types/g, '../../../../types');
  out = out.replace(/\.\.\/\.\.\/\.\.\/data\//g, '../../../../data/');
  out = out.replace(/\.\.\/\.\.\/\.\.\/services\//g, '../../../../services/');
  out = out.replace(/\.\.\/components\//g, `../../../../${feature}/components/`);
  out = out.replace(
    /\.\.\/\.\.\/\.\.\/features\/auth\/hooks\/useAuth/g,
    '../../../../hooks/useAuth',
  );
  return out;
}

function generateSliceFiles(destDir, slice) {
  const hook = hookName(slice);
  const sliceDir = path.join(destDir, 'slice');
  fs.mkdirSync(sliceDir, { recursive: true });

  fs.writeFileSync(
    path.join(sliceDir, 'types.ts'),
    `export interface ${pascalCase(slice)}State {
  loading: boolean;
  error: string | null;
}
`,
  );

  fs.writeFileSync(
    path.join(sliceDir, 'index.ts'),
    `import { createSlice } from '@reduxjs/toolkit';
import { useInjectReducer, useInjectSaga } from 'redux-injectors';
import { ${slice}Saga } from './saga';
import type { ${pascalCase(slice)}State } from './types';

export const initialState: ${pascalCase(slice)}State = {
  loading: false,
  error: null,
};

const slice = createSlice({
  name: '${slice}',
  initialState,
  reducers: {
    reset(state) {
      Object.assign(state, initialState);
    },
  },
});

export const ${slice}Actions = slice.actions;

export const ${hook} = () => {
  useInjectReducer({ key: slice.name, reducer: slice.reducer });
  useInjectSaga({ key: slice.name, saga: ${slice}Saga });
  return { actions: slice.actions };
};

export default slice.reducer;
`,
  );

  fs.writeFileSync(
    path.join(sliceDir, 'selectors.ts'),
    `import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../store/types/RootState';
import { initialState } from './index';

const selectDomain = (state: RootState) =>
  (state as RootState & { ${slice}?: typeof initialState }).${slice} ??
  initialState;

export const select${pascalCase(slice)}Loading = createSelector(
  [selectDomain],
  (s) => s.loading,
);

export const select${pascalCase(slice)}Error = createSelector(
  [selectDomain],
  (s) => s.error,
);
`,
  );

  fs.writeFileSync(
    path.join(sliceDir, 'saga.ts'),
    `export function* ${slice}Saga() {
  /* Page-specific async flows */
}
`,
  );
}

function injectSliceHook(content, slice) {
  const hook = hookName(slice);
  if (content.includes(hook)) return content;

  let updated = content;
  if (!updated.includes(`from './slice'`)) {
    updated = `import { ${hook} } from './slice';\n${updated}`;
  }

  const exportMatch = updated.match(
    /export const (\w+): React\.FC(?:<[^>]*>)? = \(\) => \{/,
  );
  if (exportMatch) {
    const name = exportMatch[1];
    updated = updated.replace(
      exportMatch[0],
      `export const ${name}: React.FC = () => {\n  ${hook}();`,
    );
    return updated;
  }

  const defaultMatch = updated.match(/export default function (\w+)\(\) \{/);
  if (defaultMatch) {
    updated = updated.replace(
      defaultMatch[0],
      `${defaultMatch[0]}\n  ${hook}();`,
    );
    return updated;
  }

  return updated;
}

for (const page of pages) {
  const srcPath = path.join(root, page.src);
  const destDir = path.join(root, page.dest);
  const destPath = path.join(destDir, 'index.tsx');

  if (!fs.existsSync(srcPath)) {
    console.warn('skip missing', page.src);
    continue;
  }

  fs.mkdirSync(destDir, { recursive: true });
  generateSliceFiles(destDir, page.slice);

  let content = fs.readFileSync(srcPath, 'utf8');
  content = fixImports(content, page.feature);
  content = injectSliceHook(content, page.slice);
  fs.writeFileSync(destPath, content);

  const exportName = path.basename(page.src, '.tsx');
  const reexport = `export { ${exportName.includes('Page') || exportName.includes('Hub') ? exportName : exportName} } from '../../../${page.dest}/index';\nexport { default } from '../../../${page.dest}/index';\n`;

  fs.writeFileSync(
    srcPath,
    `/** @deprecated Import from app/pages — re-export for compatibility */\nexport * from '../../../${page.dest}/index';\n`,
  );

  console.log('migrated', page.dest);
}

console.log('done');
