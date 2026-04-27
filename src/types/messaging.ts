// Messaging domain types — direct messages and club chat.
// Keeping these separate prevents page-level files (ClubChat.tsx) from
// being imported by components just to get a type.

// ── Direct messages ──────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  skill_id: string | null;
  participant_ids: string[];
  updated_at: string;
  skill_title?: string;
  other_user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

// ── Club chat polls ──────────────────────────────────────────────────────────

export interface PollOption {
  id: string;
  poll_id?: string;
  text?: string;
  votes?: PollVote[];
}

export interface PollVote {
  id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

export interface Poll {
  id: string;
  message_id?: string;
  question: string;
  is_anonymous?: boolean;
  multiple_answers?: boolean;
  options?: PollOption[];
}
