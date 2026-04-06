/**
 * Messaging feature public API.
 *
 * Import from here, not from internal module paths or from page files.
 * This is what broke the architecture before (Poll was imported from ClubChat.tsx
 * into MessageItem.tsx — that dependency no longer exists).
 */

// ── Domain types ──────────────────────────────────────────────────────────────
export type { Conversation, Poll, PollOption, PollVote } from '@/types/messaging';

// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useConversations } from '@/hooks/useConversations';

// ── Query keys (conversations + messages namespaces) ─────────────────────────
export { queryKeys } from '@/lib/queryKeys';
