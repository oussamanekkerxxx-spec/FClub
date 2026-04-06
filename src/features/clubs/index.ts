/**
 * Clubs feature public API.
 *
 * Consumers (pages, other features) import from here — NOT from the internal
 * module paths. This gives us the freedom to restructure internals without
 * touching call sites.
 *
 * Types: re-exported from src/types/clubs.ts (single source of truth).
 * Hooks: re-exported from src/hooks/.
 * Query keys: imported from src/lib/queryKeys (shared across all features).
 */

// ── Domain types ──────────────────────────────────────────────────────────────
export type {
  Club,
  ClubMembership,
  ClubPost,
  ClubPostComment,
  ClubEvent,
  ClubResource,
  Quest,
  QuestStep,
  QuestParticipant,
  VoiceRoom,
} from '@/types/clubs';

// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useClubData } from '@/hooks/useClubData';
export { useClubActions } from '@/hooks/useClubActions';

// ── Query keys (club namespace only) ─────────────────────────────────────────
export { queryKeys } from '@/lib/queryKeys';
