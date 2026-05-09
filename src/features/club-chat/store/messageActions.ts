import { supabase } from '@/lib/supabase';
import { reportError } from '@/lib/errors';
import {
  MESSAGE_SELECT_CANDIDATES,
  isSchemaMismatchError,
  normaliseMessageRow,
} from '@/features/club-chat/workspace/messageData';
import type { Message, Reaction, ChannelRead, SelectError } from '@/features/club-chat/workspace/types';
import type { PollVote } from '@/types/messaging';
import type { ChatStoreState } from './types';

const MAX_MESSAGES = 200;

function capMessagesAppend(msgs: Message[]): Message[] {
  if (msgs.length <= MAX_MESSAGES) return msgs;
  return msgs.slice(msgs.length - MAX_MESSAGES);
}

function capMessagesPrepend(older: Message[], existing: Message[]): Message[] {
  const combined = [...older, ...existing];
  if (combined.length <= MAX_MESSAGES) return combined;
  return combined.slice(0, MAX_MESSAGES);
}

export function createMessageActions(
  set: (fn: (draft: ChatStoreState) => void) => void,
  get: () => ChatStoreState
) {
  return {
    // ── Load messages for active channel ──
    loadMessages: async (channelId: string) => {
      let selectedData: Record<string, unknown>[] | null = null;
      let lastError: SelectError = null;

      for (const selectClause of MESSAGE_SELECT_CANDIDATES) {
        const response = await supabase
          .from('club_messages')
          .select(selectClause)
          .eq('channel_id', channelId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!response.error) {
          selectedData = (response.data ?? []) as unknown as Record<string, unknown>[];
          break;
        }
        lastError = response.error;
        if (!isSchemaMismatchError(response.error)) break;
      }

      if (!selectedData) {
        if (lastError) reportError('clubchat.load_messages', lastError);
        set((draft) => {
          draft.messages = [];
          draft.hasMore = false;
        });
        return;
      }

      const msgs = selectedData.reverse().map(normaliseMessageRow);
      set((draft) => {
        draft.messages = msgs;
        draft.hasMore = selectedData!.length === 50;
      });
    },

    // ── Load older messages (pagination) ──
    loadMore: async (messagesAreaRef: React.RefObject<HTMLDivElement | null>) => {
      const state = get();
      if (state.loadingMore || !state.hasMore || state.messages.length === 0 || !state.activeChannelId) return;

      set((draft) => { draft.loadingMore = true; });
      const oldest = state.messages[0]?.created_at;
      const area = messagesAreaRef.current;
      const prevHeight = area?.scrollHeight ?? 0;

      let selectedData: Record<string, unknown>[] | null = null;

      for (const selectClause of MESSAGE_SELECT_CANDIDATES) {
        const response = await supabase
          .from('club_messages')
          .select(selectClause)
          .eq('channel_id', state.activeChannelId)
          .lt('created_at', oldest)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!response.error) {
          selectedData = (response.data ?? []) as unknown as Record<string, unknown>[];
          break;
        }
        if (!isSchemaMismatchError(response.error)) {
          reportError('clubchat.load_older_messages', response.error);
          break;
        }
      }

      if (selectedData) {
        const older = selectedData.reverse().map(normaliseMessageRow);
        set((draft) => {
          draft.messages = capMessagesPrepend(older, draft.messages);
          draft.hasMore = selectedData!.length === 50;
        });
        requestAnimationFrame(() => {
          if (area) area.scrollTop = area.scrollHeight - prevHeight;
        });
      }
      set((draft) => { draft.loadingMore = false; });
    },

    // ── Realtime: new message INSERT ──
    appendRealtimeMessage: (msg: Message) => {
      set((draft) => {
        if (draft.messages.some((m) => m.id === msg.id)) return;
        const tempIdx = draft.messages.findIndex(
          (m) =>
            String(m.id).startsWith('temp-audio-') &&
            m.sender_id === msg.sender_id &&
            m.voice_url === msg.voice_url
        );
        if (tempIdx >= 0) {
          draft.messages[tempIdx] = msg;
        } else {
          draft.messages = capMessagesAppend([...draft.messages, msg]);
        }
      });
    },

    // ── Enrich message sender after realtime insert ──
    replaceMessageSender: (messageId: string, sender: { first_name: string; last_name: string; avatar_url: string }) => {
      set((draft) => {
        const idx = draft.messages.findIndex((m) => m.id === messageId);
        if (idx >= 0) draft.messages[idx].sender = sender;
      });
    },

    // ── Attach event to message after realtime insert ──
    setMessageEvent: (messageId: string, event: any) => {
      set((draft) => {
        const idx = draft.messages.findIndex((m) => m.id === messageId);
        if (idx >= 0) draft.messages[idx].event = event;
      });
    },

    // ── Realtime: reaction INSERT ──
    addMessageReaction: (react: Reaction) => {
      set((draft) => {
        const idx = draft.messages.findIndex((m) => m.id === react.message_id);
        if (idx === -1) return;
        const existing = draft.messages[idx].reactions || [];
        if (existing.find((r) => r.id === react.id)) return;
        draft.messages[idx].reactions = [...existing, react];
      });
    },

    // ── Realtime: reaction DELETE ──
    removeMessageReaction: (reactionId: string) => {
      set((draft) => {
        const idx = draft.messages.findIndex((m) => m.reactions?.some((r) => r.id === reactionId));
        if (idx === -1) return;
        draft.messages[idx].reactions = draft.messages[idx].reactions!.filter((r) => r.id !== reactionId);
      });
    },

    // ── Realtime: poll vote INSERT/DELETE ──
    updatePollVote: (vote: PollVote, eventType: 'INSERT' | 'DELETE') => {
      if (!vote.option_id) return;
      set((draft) => {
        const msgIdx = draft.messages.findIndex((m) => m.poll?.options?.some((o) => o.id === vote.option_id));
        if (msgIdx === -1) return;
        const m = draft.messages[msgIdx];
        if (!m.poll?.options) return;
        m.poll.options = m.poll.options.map((o) => {
          if (o.id !== vote.option_id) return o;
          const existing = o.votes || [];
          if (eventType === 'INSERT') {
            if (existing.some((v) => v.id === vote.id)) return o;
            return { ...o, votes: [...existing, vote] };
          }
          if (eventType === 'DELETE') {
            return { ...o, votes: existing.filter((v) => v.id !== vote.id) };
          }
          return o;
        });
      });
    },

    // ── Realtime: channel read INSERT/UPDATE/DELETE ──
    updateChannelRead: (cr: ChannelRead, eventType: string) => {
      set((draft) => {
        if (eventType === 'DELETE') {
          draft.channelReads = draft.channelReads.filter((r) => r.user_id !== cr.user_id);
          return;
        }
        const idx = draft.channelReads.findIndex((r) => r.user_id === cr.user_id);
        if (idx >= 0) {
          draft.channelReads[idx] = cr;
        } else {
          draft.channelReads.push(cr);
        }
      });
    },

    // ── Realtime: typing indicator ──
    addTypingUser: (userId: string, name: string) => {
      set((draft) => {
        if (draft.typingUsers.some((t) => t.user_id === userId)) return;
        draft.typingUsers.push({ user_id: userId, name });
      });
    },

    removeTypingUser: (userId: string) => {
      set((draft) => {
        draft.typingUsers = draft.typingUsers.filter((t) => t.user_id !== userId);
      });
    },

    clearTypingUsers: () => {
      set((draft) => {
        draft.typingUsers = [];
      });
    },
  };
}
