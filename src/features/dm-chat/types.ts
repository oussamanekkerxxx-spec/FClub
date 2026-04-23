/**
 * Types for the DM (personal chat) feature.
 * Mirrors the club-chat types but targets the `messages` / `conversations` / `dm_reactions` schema.
 */

export interface DmReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

export interface DmMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  image_url?: string | null;
  video_url?: string | null;
  pdf_url?: string | null;
  voice_url?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  caption?: string | null;
  reply_to_id?: string | null;
  is_edited?: boolean;
  deleted_at?: string | null;
  created_at: string;
  /** Populated client-side after fetch */
  sender?: { first_name: string; last_name: string; avatar_url: string };
  /** Populated client-side for quote-reply rendering */
  reply_to_message?: DmMessage | null;
  reactions?: DmReaction[];
}

export type ChatAttachType = 'image' | 'video' | 'pdf' | 'voice';

export interface ChatAttachment {
  file: File;
  type: ChatAttachType;
  previewUrl: string;
}

export interface TypingUser {
  user_id: string;
  name: string;
}
