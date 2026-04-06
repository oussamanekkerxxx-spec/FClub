/**
 * Skills feature public API.
 *
 * Import from here, not from internal module paths.
 */

// ── Domain types ──────────────────────────────────────────────────────────────
export type { Skill, SkillTeacher, SkillStatus } from '@/types/skills';

// ── Mapper (boundary cast — only src/mappers/ does this) ─────────────────────
export { mapSkillRow, type SkillRow } from '@/mappers/skills';

// ── Query keys (skills namespace) ────────────────────────────────────────────
export { queryKeys } from '@/lib/queryKeys';
