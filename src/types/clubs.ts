import type {
  ClubCategory, MemberRole, MemberStatus,
  QuestStatus, QuestDifficulty, RoomStatus,
  ResourceType, EventFormat, EventStyle, JoinRequestStatus,
} from './shared';

export type {
  ClubCategory, MemberRole, MemberStatus,
  QuestStatus, QuestDifficulty, RoomStatus,
  ResourceType, EventFormat, EventStyle, JoinRequestStatus,
};

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
  my_membership?: ClubMembership | null;
}

export interface ClubMembership {
  id: string;
  club_id: string;
  user_id: string;
  role: MemberRole;
  status: MemberStatus;
  joined_at: string;
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
  event_style?: EventStyle | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  max_attendees: number | null;
  attendee_count: number;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
  /** Duration in minutes — set at creation time */
  duration_mins?: number | null;
  /** Video call link for online events */
  meeting_link?: string | null;
  /** Whether the event is online (computed from format) */
  is_online?: boolean;
  /** Live RSVP count from event_rsvps table */
  rsvp_count?: number;
  /** Optional host label for event card presentation */
  host_label?: string | null;
  /** Optional expected outcomes shown in cards/details */
  outcomes?: string | null;
}
