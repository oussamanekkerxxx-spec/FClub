// Primitive union types and cross-cutting domain models shared across features.

// ── Skill primitives ─────────────────────────────────────────────────────────
export type Category =
  | 'music' | 'languages' | 'technology' | 'cooking' | 'art'
  | 'fitness' | 'crafts' | 'writing' | 'photography' | 'business';

export type Format = 'online' | 'in-person' | 'both';
export type SkillLevel = 'all levels' | 'beginner' | 'intermediate' | 'advanced';
export type SkillStatus = 'active' | 'paused';

// ── Club primitives ──────────────────────────────────────────────────────────
export type ClubCategory =
  | 'music' | 'languages' | 'technology' | 'cooking' | 'art'
  | 'fitness' | 'crafts' | 'writing' | 'photography' | 'business';

export type MemberRole = 'member' | 'moderator' | 'admin';
export type MemberStatus = 'active' | 'pending' | 'banned';
export type QuestStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type QuestDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type RoomStatus = 'active' | 'waiting' | 'scheduled' | 'ended';
export type ResourceType = 'link' | 'document' | 'video' | 'image';
export type EventFormat = 'online' | 'in-person' | 'both';
export type EventStyle = 'workshop' | 'sprint' | 'showcase';
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

// ── Cross-cutting domain models ───────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  link: string | null;
  actor_id: string | null;
  created_at: string;
  actor?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export interface SessionLedger {
  id: string;
  teacher_id: string;
  learner_id: string;
  skill_id: string | null;
  completed_at: string;
  duration_hours: number;
  price_paid: number;
  currency: string;
  review_given: boolean;
  created_at: string;
  teacher?: { first_name: string; last_name: string; avatar_url: string | null };
  learner?: { first_name: string; last_name: string; avatar_url: string | null };
  skill?: { title: string };
}

export interface Vouch {
  id: string;
  voucher_id: string;
  recipient_id: string;
  skill_tag: string;
  vouch_text: string | null;
  created_at: string;
  voucher?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    trust_tier: number;
  };
}
