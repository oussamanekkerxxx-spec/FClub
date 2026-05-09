import type {
  ClubCategory, MemberRole, MemberStatus,
  QuestStatus, QuestDifficulty, RoomStatus,
  ResourceType, EventFormat, EventStyle, JoinRequestStatus,
} from './shared';

import type { Poll } from './messaging';
import type { ClubProject } from '@/components/chat/ProjectBubble';
export type { Poll } from './messaging';
export type { ClubProject } from '@/components/chat/ProjectBubble';

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

// ── Reused across club components ────────────────────────────────────────────

export interface ProfileMini {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  city: string | null;
}

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

// ── Join Requests ────────────────────────────────────────────────────────────

export interface JoinRequest {
  id: string;
  user_id: string;
  status: JoinRequestStatus;
  created_at: string;
  profile?: ProfileMini | ProfileMini[] | null;
}

// ── Club Channels ────────────────────────────────────────────────────────────

export interface ClubChannel {
  id: string;
  club_id: string;
  name: string;
  description: string | null;
  is_announcement_only: boolean;
  order_index: number;
  slow_mode_delay?: number;
  pinned_message_id?: string | null;
}

// ── Club Messages ──────────────────────────────────────────────────────────

export interface ClubMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  image_width?: number | null;
  image_height?: number | null;
  video_url: string | null;
  video_width?: number | null;
  video_height?: number | null;
  pdf_url: string | null;
  voice_url: string | null;
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
  reply_to_id: string | null;
  is_edited: boolean;
  deleted_at: string | null;
  caption: string | null;
  event_id: string | null;
  forwarded_from_id: string | null;
  forwarded_from_name: string | null;
  sender?: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
  reactions?: Reaction[];
  poll?: Poll | null;
  project?: ClubProject | null;
}

export interface ClubMessageWithAttachments extends ClubMessage {
  /** Overrides poll from ClubMessage base to carry full options from the activity feed query */
  poll: Poll | null;
}

// ── Channel Preferences ──────────────────────────────────────────────────────────

export interface ChannelRead {
  channel_id: string;
  user_id: string;
  last_read_at: string;
}

// ── Club Bans & Mutes ──────────────────────────────────────────────────────────

export interface ClubBan {
  id: string;
  club_id: string;
  user_id: string;
  reason?: string;
  banned_by: string;
  expires_at?: string;
  created_at: string;
}

export interface ClubMute {
  id: string;
  club_id: string;
  user_id: string;
  reason?: string;
  muted_by: string;
  expires_at?: string;
  created_at: string;
}

export type FileKind = 'video' | 'pdf' | 'document' | 'slides' | 'spreadsheet' | 'image' | 'audio' | 'other';
export type SharedFileSource = 'chat' | 'course' | 'lesson';
export type MathField = 'math' | 'physics' | 'biology' | 'chemistry';

export interface ClubCourse {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  math_field: MathField | null;
  position: number;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClubLesson {
  id: string;
  course_id: string;
  club_id: string;
  title: string;
  description: string | null;
  position: number;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClubSharedFile {
  id: string;
  club_id: string;
  course_id: string;
  lesson_id: string | null;
  message_id: string | null;
  channel_id: string | null;
  uploaded_by: string;
  title: string;
  description: string | null;
  category: string | null;
  math_field: MathField | null;
  file_url: string;
  file_name: string;
  mime_type: string | null;
  file_kind: FileKind;
  storage_provider: string;
  storage_public_id: string | null;
  source: SharedFileSource;
  created_at: string;
  updated_at: string;
}
