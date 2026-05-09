import fs from 'fs';
import path from 'path';

const viewsDir = 'src/components/club/student/views';
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.tsx') && f !== 'StudentViewShared.tsx');

for (const file of files) {
  const filepath = path.join(viewsDir, file);
  let content = fs.readFileSync(filepath, 'utf8');

  // Fix relative import paths
  content = content.replace(/from ['"]\.\/StudentClubConstants['"]/g, "from '../StudentClubConstants'");
  content = content.replace(/from ['"]\.\/views\/StudentViewShared['"]/g, "from './StudentViewShared'");

  // Add export to the main function/const
  const funcName = file.replace('.tsx', '');
  const funcPattern = new RegExp('^(function|const)\\s+' + funcName + '\\s*[\\({]', 'm');
  content = content.replace(funcPattern, (match) => 'export ' + match);

  fs.writeFileSync(filepath, content);
  console.log('Fixed exports in', file);
}
