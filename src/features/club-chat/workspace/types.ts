import type { ClubProject } from '@/components/chat/ProjectBubble';
import type { ClubEvent } from '@/types/fightclub';
import type { Poll } from '@/types/messaging';

export type EventMessagePayload = Pick<
  ClubEvent,
  | 'id'
  | 'title'
  | 'description'
  | 'starts_at'
  | 'format'
  | 'event_style'
  | 'meeting_link'
  | 'location'
  | 'duration_mins'
  | 'rsvp_count'
  | 'attendee_count'
  | 'host_label'
  | 'outcomes'
>;

export interface Channel {
  id: string;
  club_id: string;
  name: string;
  description: string | null;
  is_announcement_only: boolean;
  order_index: number;
  slow_mode_delay?: number;
  pinned_message_id?: string | null;
}

export interface ChannelRead {
  channel_id: string;
  user_id: string;
  last_read_at: string;
}

export interface TypingUser {
  user_id: string;
  name: string;
}

export type ChatAttachType = 'image' | 'video' | 'pdf' | 'document';

export interface ChatAttachment {
  file: File;
  type: ChatAttachType;
  previewUrl: string;
}

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  wallpaper_class: string;
  is_dark_mode: boolean;
}

export interface UserChannelPreference {
  user_id: string;
  channel_id: string;
  is_pinned: boolean;
  is_archived: boolean;
}

export interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  image_url?: string | null;
  image_width?: number | null;
  image_height?: number | null;
  video_url?: string | null;
  video_width?: number | null;
  video_height?: number | null;
  pdf_url?: string | null;
  voice_url?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  created_at: string;
  reply_to_id?: string | null;
  is_edited?: boolean;
  deleted_at?: string | null;
  caption?: string | null;
  sender?: { first_name: string; last_name: string; avatar_url: string };
  reply_to_message?: Message | null;
  reactions?: Reaction[];
  poll?: Poll | null;
  project?: ClubProject | null;
  event_id?: string | null;
  event?: EventMessagePayload | null;
  forwarded_from_id?: string | null;
  forwarded_from_name?: string | null;
}

export type SelectError = { code?: string; message?: string } | null;
