const fs = require('fs');
const path = require('path');

const srcPath = 'src';
const folders = [
  'app/API',
  'app/state',
  'assets/images',
  'assets/icons',
  'assets/fonts',
  'lib',
  'routes',
  'layouts/components',
  'components/ui',
  'components/common',
  'features/auth/api',
  'features/auth/store',
  'features/auth/hooks',
  'features/auth/types',
  'features/auth/components',
  'features/auth/pages',
  'features/workforce-planning/api',
  'features/workforce-planning/store',
  'features/workforce-planning/hooks',
  'features/workforce-planning/types',
  'features/recruitment-requests/api',
  'features/recruitment-requests/store',
  'features/recruitment-requests/hooks',
  'features/recruitment-requests/types',
  'features/vacancy/api',
  'features/vacancy/store',
  'features/vacancy/hooks',
  'features/vacancy/types',
  'features/vacancy/components/job-posting',
  'features/screening/api',
  'features/screening/store',
  'features/screening/hooks',
  'features/applications/api',
  'features/applications/store',
  'features/applications/hooks',
  'features/interviews/api',
  'features/interviews/store',
  'features/interviews/hooks',
  'features/offers/api',
  'features/offers/store',
  'features/offers/hooks',
  'features/talent-roster/api',
  'features/talent-roster/store',
  'features/talent-roster/hooks',
  'features/question-bank/api',
  'features/question-bank/store',
  'features/question-bank/hooks',
  'features/candidate/api',
  'features/candidate/store',
  'features/candidate/hooks',
  'features/workspace/store',
  'features/workspace/hooks',
];

folders.forEach((folder) => {
  const fullPath = path.join(srcPath, folder);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created: ${fullPath}`);
  }
});

console.log('✓ Feature folders ready');
