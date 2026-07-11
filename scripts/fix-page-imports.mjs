import fs from 'fs';
import path from 'path';

const pagesRoot = path.resolve('src/app/pages');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name === 'index.tsx') files.push(full);
  }
  return files;
}

for (const file of walk(pagesRoot)) {
  let content = fs.readFileSync(file, 'utf8');
  const depth = file.split(path.sep).indexOf('pages');
  const segments = file.split(path.sep).slice(depth + 1, -1);
  const levels = segments.length + 2;
  const toSrc = '../'.repeat(levels);

  content = content.replace(/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\//g, `${toSrc}`);
  content = content.replace(/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\//g, `${toSrc}`);
  content = content.replace(/\.\.\/\.\.\/\.\.\/\.\.\//g, `${toSrc}`);

  content = content.replace(
    /from ['"]\.\.\/types\/([^'"]+)['"]/g,
    `from '${toSrc}features/screening/types/$1'`,
  );
  content = content.replace(
    /from ['"]\.\.\/types['"]/g,
    `from '${toSrc}features/candidate/types'`,
  );

  content = content.replace(
    /from ['"][^'"]*features\/(\w[\w-]*)\/components\/common\/Toast['"]/g,
    `from '${toSrc}components/common/Toast'`,
  );
  content = content.replace(
    /from ['"][^'"]*features\/(\w[\w-]*)\/components\/shared\/FilterToolbar['"]/g,
    `from '${toSrc}components/shared/FilterToolbar'`,
  );
  content = content.replace(
    /from ['"][^'"]*features\/vacancy\/components\/OdooViewHeader\/OdooViewHeader['"]/g,
    `from '${toSrc}components/OdooViewHeader/OdooViewHeader'`,
  );
  content = content.replace(
    /from ['"][^'"]*features\/(\w[\w-]*)\/components\/OdooViewHeader\/?['"]/g,
    `from '${toSrc}components/OdooViewHeader/OdooViewHeader'`,
  );

  content = content.replace(
    /from ['"]\.\/CandidateProfile\.css['"]/g,
    `from '${toSrc}features/candidate/pages/CandidateProfile.css'`,
  );

  fs.writeFileSync(file, content);
  console.log('fixed', path.relative(process.cwd(), file));
}

console.log('done');
