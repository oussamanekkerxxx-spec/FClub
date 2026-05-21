import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { DmMessage, DmReaction, TypingUser } from '@/features/dm-chat/types';
import type { Conversation } from '@/types/messaging';

const FULL_SELECT = `
  id, conversation_id, sender_id, content, image_url, video_url, pdf_url, voice_url,
  location_lat, location_lng, caption, reply_to_id, is_edited, deleted_at, created_at,
  sender:profiles!messages_sender_id_fkey(first_name, last_name, avatar_url),
  reactions:dm_reactions(id, user_id, emoji)
`;
const FALLBACK_SELECT = `
  id, conversation_id, sender_id, content, image_url, video_url, pdf_url, voice_url,
  location_lat, location_lng, caption, reply_to_id, is_edited, deleted_at, created_at,
  sender:profiles!messages_sender_id_fkey(first_name, last_name, avatar_url)
`;
const MAX_MESSAGES = 200;

const MINIMAL_SELECT = `
  id, conversation_id, sender_id, content, created_at,
  sender:profiles!messages_sender_id_fkey(first_name, last_name, avatar_url)
`;

function isSchemaMiss(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === '42703' ||
    error.code === 'PGRST200' ||
    /column|relation|does not exist/i.test(error.message ?? '')
  );
}

/** Fetch messages for a conversation, newest-first then reversed.
 *  Accepts an optional `before` ISO timestamp for pagination. */
async function fetchDmMessages(
  conversationId: string,
  before?: string
): Promise<DmMessage[]> {
  for (const sel of [FULL_SELECT, FALLBACK_SELECT, MINIMAL_SELECT]) {
    let query = supabase
      .from('messages')
      .select(sel)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(60);

    if (before) query = query.lt('created_at', before);

    const { data, error } = await query;

    if (!error && data) {
      return (data as any[])
        .reverse()
        .map((row) => ({
          ...row,
          sender: Array.isArray(row.sender) ? row.sender[0] : row.sender,
          reactions: row.reactions ?? [],
        })) as DmMessage[];
    }

    if (!isSchemaMiss(error)) break;
  }

  return [];
}

function getMessagePreview(msg: DmMessage): string {
  if (msg.image_url) return '📷 Photo';
  if (msg.video_url) return '🎬 Video';
  if (msg.pdf_url) return '📄 File';
  if (msg.voice_url) return '🎙️ Voice Message';
  if (msg.location_lat != null) return '📍 Location';
  return msg.content || '';
}

function sortConversations(convs: Conversation[]): Conversation[] {
  return [...convs].sort((a, b) => {
    const aTime = a.last_message_at || a.updated_at || '';
    const bTime = b.last_message_at || b.updated_at || '';
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

export function useDMRealtime(ctx: any) {
  const {
    user,
    selectedConvId,
    messages,
    newMessage,
    textareaRef,
    typingTimerRef,
    setMessages,
    setHasMore,
    setLoadingMore,
    setLoading,
    setTypingUsers,
    setConversations,
    messagesEndRef,
    messagesAreaRef,
    hasMore,
    loadingMore,
  } = ctx;

  // Presence channel ref — lives here so handleTypingStart can reach it
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Load messages when conversation changes ──────────────────────────────────
  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      setHasMore(false);
      return;
    }

    setLoading(true);

    fetchDmMessages(selectedConvId).then((msgs) => {
      setMessages(msgs);
      setHasMore(msgs.length === 60);
      setLoading(false);
    });

    // Realtime subscription — messages + reactions
    const channel = supabase
      .channel(`dm-${selectedConvId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConvId}` },
        (payload) => {
          const msg = payload.new as DmMessage;
          setMessages((prev: DmMessage[]) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            if (prev.length >= MAX_MESSAGES) return [...prev.slice(1), msg];
            return [...prev, msg];
          });
          // Enrich with sender profile (eliminates the brief "unknown sender" flicker)
          supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', msg.sender_id)
            .single()
            .then(({ data: p }) => {
              if (p)
                setMessages((prev: DmMessage[]) =>
                  prev.map((m) => (m.id === msg.id ? { ...m, sender: p } : m))
                );
            });
          // Bump sidebar for messages from the other participant
          if (msg.sender_id !== user?.id) {
            const preview = getMessagePreview(msg);
            const msgTime = msg.created_at || new Date().toISOString();
            setConversations((prev: Conversation[]) =>
              sortConversations(
                prev.map((c) =>
                  c.id === selectedConvId
                    ? { ...c, last_message: preview, last_message_at: msgTime, unread_count: (c.unread_count || 0) + 1 }
                    : c
                )
              )
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConvId}` },
        (payload) => {
          const updated = payload.new as DmMessage;
          setMessages((prev: DmMessage[]) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dm_reactions' },
        (payload) => {
          const react = payload.new as DmReaction | null;
          const oldReact = payload.old as DmReaction | null;

          if (payload.eventType === 'INSERT' && react) {
            setMessages((prev: DmMessage[]) =>
              prev.map((m) => {
                if (m.id !== react.message_id) return m;
                const existing = m.reactions || [];
                if (existing.find((r) => r.id === react.id)) return m;
                return { ...m, reactions: [...existing, react] };
              })
            );
          } else if (payload.eventType === 'DELETE' && oldReact) {
            setMessages((prev: DmMessage[]) =>
              prev.map((m) => {
                if (!m.reactions?.some((r) => r.id === oldReact.id)) return m;
                return { ...m, reactions: m.reactions.filter((r) => r.id !== oldReact.id) };
              })
            );
          }
        }
      )
      .subscribe();

    // Presence channel — typing indicators
    const presChannel = supabase
      .channel(`dm-presence-${selectedConvId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presChannel.presenceState<{ typing: boolean; user_id: string; name: string }>();
        const typingList: TypingUser[] = [];
        for (const presences of Object.values(state)) {
          for (const p of presences) {
            if (p.typing && p.user_id !== user?.id) {
              typingList.push({ user_id: p.user_id, name: p.name });
            }
          }
        }
        setTypingUsers(typingList);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          await presChannel.track({ typing: false, user_id: user.id, name: user.firstName || '' });
        }
      });

    presenceChannelRef.current = presChannel;

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presChannel);
      presenceChannelRef.current = null;
      setTypingUsers([]);
    };
  }, [selectedConvId, user?.id, setConversations, setHasMore, setLoading, setMessages, setTypingUsers]);
  // NOTE: Passing the full `user` object caused subscription churn when the auth
  // context re-rendered, silently dropping realtime INSERT events.
  // user?.id is a stable string — sufficient to detect account changes.


  // ── Auto-scroll to newest message ───────────────────────────────────────────
  const lastMessageIdRef = useRef<string | null>(null);
  useEffect(() => {
    const lastId = messages[messages.length - 1]?.id ?? null;
    if (lastId && lastId !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastId;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, messagesEndRef]);

  // ── Auto-resize composer ─────────────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const capped = Math.min(el.scrollHeight, 160);
    el.style.height = `${capped}px`;
    el.style.overflowY = el.scrollHeight > 160 ? 'auto' : 'hidden';
  }, [newMessage, textareaRef]);

  // ── Load more (pagination) ──────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0 || !selectedConvId) return;
    setLoadingMore(true);
    const oldest = messages[0]?.created_at;
    const area = messagesAreaRef.current;
    const prevHeight = area?.scrollHeight ?? 0;

    const older = await fetchDmMessages(selectedConvId, oldest);

    if (older.length > 0) {
      setMessages((prev: DmMessage[]) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const deduped = older.filter((m) => !existingIds.has(m.id));
        const combined = [...deduped, ...prev];
        if (combined.length <= MAX_MESSAGES) return combined;
        return combined.slice(0, MAX_MESSAGES);
      });
      setHasMore(older.length === 60);
      requestAnimationFrame(() => {
        if (area) area.scrollTop = area.scrollHeight - prevHeight;
      });
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  }, [loadingMore, hasMore, messages, selectedConvId, messagesAreaRef, setHasMore, setLoadingMore, setMessages]);

  // ── Typing indicator via Supabase Presence ──────────────────────────────────
  const handleTypingStart = useCallback(() => {
    if (!selectedConvId || !user) return;
    const presChannel = presenceChannelRef.current;
    if (presChannel) {
      presChannel.track({ typing: true, user_id: user.id, name: user.firstName || '' });
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      presenceChannelRef.current?.track({ typing: false, user_id: user.id, name: user.firstName || '' });
    }, 3000);
  }, [selectedConvId, user, typingTimerRef]);

  return { loadMore, handleTypingStart };
}
