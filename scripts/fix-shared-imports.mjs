import fs from 'fs';
import path from 'path';

const viewsDir = 'src/components/club/student/views';
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.tsx') && f !== 'StudentViewShared.tsx');

for (const file of files) {
  const filepath = path.join(viewsDir, file);
  let content = fs.readFileSync(filepath, 'utf8');

  // Find which shared utilities are used in this file
  const used = [];
  if (/\bSectionLabel\b/.test(content)) used.push('SectionLabel');
  if (/\bFeedItem\b/.test(content)) used.push('FeedItem');
  if (/\bPillNav\b/.test(content)) used.push('PillNav');
  if (/\bMATH_FIELD_LABELS\b/.test(content)) used.push('MATH_FIELD_LABELS');
  if (/\bgroupFilesByMathField\b/.test(content)) used.push('groupFilesByMathField');

  if (used.length === 0) continue;

  // Check if there's already a StudentViewShared import
  const hasSharedImport = content.includes("from './StudentViewShared'");

  if (hasSharedImport) {
    // Add missing names to existing import
    const missing = used.filter(name => !new RegExp('\\b' + name + '\\b').test(content.match(/import\s+\{[^}]*\}\s+from\s+'\.\/StudentViewShared'/)?.[0] || ''));
    if (missing.length > 0) {
      content = content.replace(
        /(import\s+\{[^}]+)(\})(\s+from\s+'\.\/StudentViewShared';)/,
        (match, p1, p2, p3) => {
          const clean = p1.replace(/\s+/g, ' ').trim();
          return clean + ', ' + missing.join(', ') + '}' + p3;
        }
      );
    }
  } else {
    // Add new import line
    const importLine = `import { ${used.join(', ')} } from './StudentViewShared';`;
    const lines = content.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIdx = i;
      }
    }
    if (lastImportIdx >= 0) {
      lines.splice(lastImportIdx + 1, 0, importLine);
    } else {
      lines.unshift(importLine);
    }
    content = lines.join('\n');
  }

  fs.writeFileSync(filepath, content);
  console.log('Fixed shared imports in', file, '- added:', used.join(', '));
}
