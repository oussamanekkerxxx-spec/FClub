import fs from 'fs';
import path from 'path';

const viewsDir = 'src/components/club/student/views';
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filepath = path.join(viewsDir, file);
  let content = fs.readFileSync(filepath, 'utf8');
  const body = content.replace(/import[\s\S]*?from\s+['"][^'"]+['"];?\n?/g, '');

  // Process each import line
  const importRegex = /import\s+(type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const isType = match[1];
    const namesStr = match[2];
    const source = match[3];
    const fullMatch = match[0];

    const names = namesStr.split(',').map(s => s.trim()).filter(Boolean);
    const usedNames = names.filter(name => {
      const cleanName = name.replace(/^type\s+/, '').trim();
      const regex = new RegExp('\\b' + cleanName + '\\b');
      return regex.test(body);
    });

    if (usedNames.length === 0) {
      content = content.replace(fullMatch, '');
    } else if (usedNames.length !== names.length) {
      const newImport = `import ${isType || ''}{ ${usedNames.join(', ')} } from '${source}';`;
      content = content.replace(fullMatch, newImport);
    }
  }

  // Also handle default imports
  const defaultImportRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?/g;
  while ((match = defaultImportRegex.exec(content)) !== null) {
    const name = match[1];
    const fullMatch = match[0];
    if (name === 'React') continue; // Keep React imports
    const regex = new RegExp('\\b' + name + '\\b');
    if (!regex.test(body)) {
      content = content.replace(fullMatch, '');
    }
  }

  fs.writeFileSync(filepath, content);
  console.log('Cleaned up', file);
}

// Fix missing RoomCard import in VoiceRoomsView
const voiceRoomsPath = path.join(viewsDir, 'VoiceRoomsView.tsx');
let voiceRoomsContent = fs.readFileSync(voiceRoomsPath, 'utf8');
if (!voiceRoomsContent.includes('RoomCard')) {
  voiceRoomsContent = voiceRoomsContent.replace(
    /(import\s+StartRoomModal)/,
    "import { RoomCard } from './RoomCard';\n$1"
  );
  fs.writeFileSync(voiceRoomsPath, voiceRoomsContent);
  console.log('Added RoomCard import to VoiceRoomsView.tsx');
}
