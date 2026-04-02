// Shared domain types for Lumina — derived from the Supabase schema.

export type Category =
  | 'music' | 'languages' | 'technology' | 'cooking' | 'art'
  | 'fitness' | 'crafts' | 'writing' | 'photography' | 'business';

export type Format = 'online' | 'in-person' | 'both';

export type SkillLevel = 'all levels' | 'beginner' | 'intermediate' | 'advanced';

export type SkillStatus = 'active' | 'paused';

export interface SkillTeacher {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  bio: string;
  location: string;
  city: string;
  trust_tier: 0 | 1 | 2 | 3 | 4;
  trust_score: number;
  archetype: 'giver' | 'seeker' | 'connector' | 'mixed';
  what_i_teach: string[];
  what_i_learn: string[];
  languages: string[];
  sessions_completed: number;
  reviews_count: number;
  joined_at: string;
}

// ============================================================
// CLUB SYSTEM TYPES
// ============================================================

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
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

export interface Club {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: ClubCategory;
  cover_image_url: string | null;
  cover_gradient: string;
  avatar_url: string | null;
  is_private: boolean;
  rules: string[];
  tags: string[];
  city: string | null;
  region: string | null;
  member_count: number;
  post_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined via query
  my_membership?: ClubMembership | null;
}

export interface ClubMembership {
  id: string;
  club_id: string;
  user_id: string;
  role: MemberRole;
  status: MemberStatus;
  joined_at: string;
  // joined via query
  profile?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    trust_tier: number;
    city: string | null;
  };
}

export interface ClubPost {
  id: string;
  club_id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  pdf_url: string | null;
  is_pinned: boolean;
  reaction_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  // joined via query
  author?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    trust_tier: number;
  };
  my_reaction?: { emoji: string } | null;
  comments?: ClubPostComment[];
}

export interface ClubPostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export interface Quest {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  status: QuestStatus;
  difficulty: QuestDifficulty;
  max_participants: number | null;
  participant_count: number;
  step_count: number;
  deadline: string | null;
  created_by: string | null;
  created_at: string;
  steps?: QuestStep[];
  participants?: QuestParticipant[];
  i_am_participant?: boolean;
}

export interface QuestStep {
  id: string;
  quest_id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
}

export interface QuestParticipant {
  id: string;
  quest_id: string;
  user_id: string;
  joined_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export interface VoiceRoom {
  id: string;
  club_id: string;
  name: string;
  status: RoomStatus;
  host_id: string | null;
  participant_count: number;
  max_participants: number;
  topic: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  host?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  i_am_participant?: boolean;
}

export interface ClubResource {
  id: string;
  club_id: string;
  title: string;
  url: string | null;
  type: ResourceType;
  added_by: string | null;
  created_at: string;
  adder?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export interface ClubEvent {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  format: EventFormat;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  max_attendees: number | null;
  attendee_count: number;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
}

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

export interface Skill {
  id: string;
  slug: string;
  teacher_id: string;
  title: string;
  category: Category;
  description: string;
  philosophy: string;
  who_for: string;
  what_session_looks_like: string;
  price_per_hour: number;
  currency: string;
  format: Format;
  location: string;
  neighborhood: string;
  languages: string[];
  level: SkillLevel;
  avg_rating: number;
  reviews_count: number;
  tags: string[];
  cover_gradient: string;
  is_group: boolean;
  max_headcount: number | null;
  current_headcount: number;
  availability_note: string | null;
  status: SkillStatus;
  created_at: string;
  teacher: SkillTeacher;
}

// ============================================================
// TRUST LEDGER TYPES
// ============================================================

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
  teacher?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  learner?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  skill?: {
    title: string;
  };
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
