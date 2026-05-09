import fs from 'fs';
import path from 'path';

const viewsDir = 'src/components/club/student/views';
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filepath = path.join(viewsDir, file);
  let content = fs.readFileSync(filepath, 'utf8');

  // Split into lines
  const lines = content.split('\n');
  const importLines = [];
  const otherLines = [];

  for (const line of lines) {
    if (line.trim().startsWith('import ')) {
      importLines.push(line);
    } else {
      otherLines.push(line);
    }
  }

  const body = otherLines.join('\n');
  const keptImports = [];

  for (const line of importLines) {
    const trimmed = line.trim();

    // Skip import type lines - keep them all for safety
    if (trimmed.startsWith('import type')) {
      keptImports.push(line);
      continue;
    }

    // Parse named imports: import { X, Y } from '...'
    const namedMatch = trimmed.match(/import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"];?/);
    if (namedMatch) {
      const names = namedMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      const source = namedMatch[2];
      const usedNames = names.filter(name => {
        // Handle "type" prefix
        const cleanName = name.replace(/^type\s+/, '').trim();
        const regex = new RegExp('\\b' + cleanName + '\\b');
        return regex.test(body);
      });

      if (usedNames.length > 0) {
        keptImports.push(`import { ${usedNames.join(', ')} } from '${source}';`);
      }
      continue;
    }

    // Parse default imports: import X from '...'
    const defaultMatch = trimmed.match(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?/);
    if (defaultMatch) {
      const name = defaultMatch[1];
      const source = defaultMatch[2];
      const regex = new RegExp('\\b' + name + '\\b');
      if (regex.test(body)) {
        keptImports.push(line);
      }
      continue;
    }

    // Keep anything we can't parse
    keptImports.push(line);
  }

  const newContent = keptImports.join('\n') + '\n' + body;
  fs.writeFileSync(filepath, newContent);
  console.log('Pruned imports in', file, '- kept', keptImports.length, 'imports');
}
