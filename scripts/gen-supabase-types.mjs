import { writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const projectId = 'ndqgsemywmooixscgfoc';
const outFile = join(process.cwd(), 'src', 'types', 'db.ts');
const tmpFile = `${outFile}.tmp`;

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const args = [
  'exec',
  '--',
  'supabase',
  'gen',
  'types',
  'typescript',
  '--project-id',
  projectId,
  '--schema',
  'public',
];

const result = spawnSync(npmCmd, args, {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});

if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout || 'Supabase type generation failed.\n');
  process.exit(result.status ?? 1);
}

const output = (result.stdout || '').trim();
if (!output) {
  process.stderr.write('Supabase type generation returned empty output.\n');
  process.exit(1);
}

writeFileSync(tmpFile, `${output}\n`, 'utf8');
renameSync(tmpFile, outFile);
process.stdout.write(`Generated ${outFile}\n`);
