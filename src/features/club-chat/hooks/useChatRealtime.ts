import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

import { isSchemaMismatchError, normaliseEvent } from '@/features/club-chat/workspace/messageData';
import type { ChannelRead, Message, Reaction } from '@/features/club-chat/workspace/types';
import type { PollVote } from '@/types/messaging';
import { useChatStore } from '@/features/club-chat/store/chatStore';

const MAX_UNREAD_CHANNELS = 20;

interface UseChatRealtimeProps {
  focusChannelId?: string;
  focusMessageId?: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  typingTimerRef: React.RefObject<ReturnType<typeof setTimeout> | null>;
  didFocusMessageRef: React.RefObject<boolean>;
}

export function useChatRealtime({
  focusChannelId,
  focusMessageId,
  messagesEndRef,
  textareaRef,
  typingTimerRef,
  didFocusMessageRef,
}: UseChatRealtimeProps) {
  // ── Store selectors ──
  const clubId = useChatStore((s) => s.clubId);
  const user = useChatStore((s) => s.user);
  const activeChannelId = useChatStore((s) => s.activeChannelId);
  const channels = useChatStore((s) => s.channels);
  const messages = useChatStore((s) => s.messages);
  const newMessage = useChatStore((s) => s.composer.text);

  // ── Store action references (stable, no re-render) ──
  const loadMessages = useChatStore((s) => s.loadMessages);
  const appendRealtimeMessage = useChatStore((s) => s.appendRealtimeMessage);
  const replaceMessageSender = useChatStore((s) => s.replaceMessageSender);
  const setMessageEvent = useChatStore((s) => s.setMessageEvent);
  const addMessageReaction = useChatStore((s) => s.addMessageReaction);
  const removeMessageReaction = useChatStore((s) => s.removeMessageReaction);
  const updatePollVote = useChatStore((s) => s.updatePollVote);
  const updateChannelRead = useChatStore((s) => s.updateChannelRead);
  const addTypingUser = useChatStore((s) => s.addTypingUser);
  const removeTypingUser = useChatStore((s) => s.removeTypingUser);
  const clearTypingUsers = useChatStore((s) => s.clearTypingUsers);
  const setUi = useChatStore((s) => s.setUi);
  const setPreferences = useChatStore((s) => s.setPreferences);
  const setChannels = useChatStore((s) => s.setChannels);
  const setUserChannelPrefs = useChatStore((s) => s.setUserChannelPrefs);
  const setActiveChannelId = useChatStore((s) => s.setActiveChannelId);
  const setChannelUnreads = useChatStore((s) => s.setChannelUnreads);

  const setMessages = useChatStore((s) => s.setMessages);
  const setPinnedMessage = useChatStore((s) => s.setPinnedMessage);
  const setChannelReads = useChatStore((s) => s.setChannelReads);
  const setPlaylists = useChatStore((s) => s.setPlaylists);


  const lastMessageIdRef = useRef<string | null>(null);

  // ── Init effect: membership, preferences, channels, unreads ──
  useEffect(() => {
    if (!clubId || !user) return;

    const init = async () => {
      const { data: mem } = await supabase
        .from('club_memberships')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      const isMod = mem?.role === 'admin' || mem?.role === 'moderator';
      setUi({ isAdminOrMod: isMod });

      const { data: prefData } = await supabase.from('user_chat_preferences').select('*').eq('user_id', user.id).single();
      if (prefData) {
        setPreferences(prefData);
      } else {
        const { data: newPref } = await supabase.from('user_chat_preferences').insert({ user_id: user.id }).select().single();
        if (newPref) setPreferences(newPref);
      }

      const { data: chans } = await supabase
        .from('club_channels')
        .select('*')
        .eq('club_id', clubId)
        .order('order_index', { ascending: true });

      if (chans && chans.length > 0) {
        setChannels(chans);
        const preferredChannel = focusChannelId && chans.some((c: any) => c.id === focusChannelId)
          ? focusChannelId
          : chans[0].id;
        setActiveChannelId(preferredChannel);

        const { data: reads } = await supabase
          .from('channel_reads')
          .select('channel_id, last_read_at')
          .eq('user_id', user.id);

        // P0 Fix: Limit unread count to first 20 channels to avoid N+1 explosion
        const channelsToCheck = chans.slice(0, MAX_UNREAD_CHANNELS);
        const unreads: Record<string, number> = {};
        await Promise.all(channelsToCheck.map(async (chan: any) => {
          const read = reads?.find((r: any) => r.channel_id === chan.id);
          const { count } = await supabase
            .from('club_messages')
            .select('id', { count: 'exact', head: true })
            .eq('channel_id', chan.id)
            .is('deleted_at', null)
            .gt('created_at', read?.last_read_at ?? '1970-01-01');
          unreads[chan.id] = count ?? 0;
        }));
        // Mark channels beyond the limit as 0 unreads (lazy-load on channel switch)
        chans.slice(MAX_UNREAD_CHANNELS).forEach((chan: any) => {
          unreads[chan.id] = 0;
        });
        setChannelUnreads(unreads);

        const { data: prefs, error: prefsError } = await supabase
          .from('user_channel_preferences')
          .select('*')
          .eq('user_id', user.id)
          .in('channel_id', chans.map((c: any) => c.id));
        // Silently ignore 404 — table may not exist yet (migration pending)
        if (prefs && !prefsError) setUserChannelPrefs(prefs);

      } else if (isMod) {
        const { data: seeded } = await supabase
          .from('club_channels')
          .insert([
            { club_id: clubId, name: 'general', description: 'General chat', is_announcement_only: false, order_index: 0 },
            { club_id: clubId, name: 'announcements', description: 'Important updates', is_announcement_only: true, order_index: 1 },
            { club_id: clubId, name: 'projects', description: 'Project discussions', is_announcement_only: false, order_index: 2 },
          ])
          .select();
        if (seeded) {
          setChannels(seeded);
          const preferredSeeded = focusChannelId && seeded.some((c: any) => c.id === focusChannelId)
            ? focusChannelId
            : seeded[0].id;
          setActiveChannelId(preferredSeeded);
        }
      }
      setUi({ loading: false });
    };

    init();
  }, [clubId, user, focusChannelId, setActiveChannelId, setChannelUnreads, setChannels, setUi, setPreferences, setUserChannelPrefs]);

  // ── Active channel effect: messages, pinned, reads, subscriptions ──
  useEffect(() => {
    if (!activeChannelId) {
      setMessages([]);
      return;
    }

    loadMessages(activeChannelId);

    const activeChan = channels.find((c: any) => c.id === activeChannelId);
    if (activeChan?.pinned_message_id) {
      supabase
        .from('club_messages')
        .select('id, content, sender:profiles!club_messages_sender_id_fkey(first_name)')
        .eq('id', activeChan.pinned_message_id)
        .single()
        .then(({ data: p }) => {
          if (p) setPinnedMessage({ ...p, sender: Array.isArray(p.sender) ? p.sender[0] : p.sender } as any);
        });
    } else {
      setPinnedMessage(null);
    }

    supabase
      .from('channel_reads')
      .select('channel_id, user_id, last_read_at')
      .eq('channel_id', activeChannelId)
      .neq('user_id', user?.id ?? '')
      .then(({ data: cr }) => { if (cr) setChannelReads(cr as ChannelRead[]); });

    // ── Supabase realtime subscriptions ──
    const channel = supabase
      .channel(`chat-${activeChannelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'club_messages', filter: `channel_id=eq.${activeChannelId}` },
        payload => {
          const msg = payload.new as Message;
          appendRealtimeMessage(msg);

          // Enrich with profile data (needed for messages from *other* users)
          supabase.from('profiles').select('first_name, last_name, avatar_url').eq('id', msg.sender_id).single()
            .then(({ data: p }) => {
              if (p) replaceMessageSender(msg.id, p);
            });

          // Enrich with event data if applicable
          if (msg.event_id) {
            const eventSelects = [
              'id, title, description, starts_at, format, event_style, meeting_link, location, duration_mins, rsvp_count, attendee_count, host_label, outcomes',
              'id, title, description, starts_at, format, meeting_link, location, duration_mins, rsvp_count, attendee_count',
            ];

            (async () => {
              for (const eventSelect of eventSelects) {
                const eventResponse = await supabase
                  .from('club_events')
                  .select(eventSelect)
                  .eq('id', msg.event_id)
                  .maybeSingle();

                if (!eventResponse.error && eventResponse.data) {
                  const normalizedEvent = normaliseEvent(eventResponse.data as unknown as Record<string, unknown>);
                  if (!normalizedEvent) return;
                  setMessageEvent(msg.id, normalizedEvent);
                  return;
                }

                if (!isSchemaMismatchError(eventResponse.error)) return;
              }
            })();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        payload => {
          const react = payload.new as Reaction | null;
          const oldReact = payload.old as Reaction | null;

          if (payload.eventType === 'INSERT' && react) {
            addMessageReaction(react);
          } else if (payload.eventType === 'DELETE' && oldReact) {
            removeMessageReaction(oldReact.id);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'poll_votes' },
        payload => {
          const vote = (payload.new ?? payload.old) as PollVote | null;
          if (!vote?.option_id) return;
          updatePollVote(vote, payload.eventType as 'INSERT' | 'DELETE');
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'channel_reads', filter: `channel_id=eq.${activeChannelId}` },
        payload => {
          const cr = (payload.new ?? payload.old) as ChannelRead;
          if (!cr || cr.user_id === user?.id) return;
          updateChannelRead(cr, payload.eventType);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'club_typing', filter: `channel_id=eq.${activeChannelId}` },
        payload => {
          if (payload.eventType === 'DELETE') {
            const gone = payload.old as { user_id: string };
            removeTypingUser(gone.user_id);
          } else {
            const typer = payload.new as { user_id: string; channel_id: string };
            if (typer.user_id === user?.id) return;
            supabase.from('profiles').select('first_name').eq('id', typer.user_id).single()
              .then(({ data: p }) => {
                if (!p) return;
                addTypingUser(typer.user_id, p.first_name);
                setTimeout(() => removeTypingUser(typer.user_id), 5000);
              });
          }
        }
      )
      .subscribe();

    if (user?.id && activeChannelId) {
      supabase.from('channel_reads').upsert({ channel_id: activeChannelId, user_id: user.id, last_read_at: new Date().toISOString() }).then();
      setChannelUnreads((prev: Record<string, number>) => ({ ...prev, [activeChannelId]: 0 }));
    }

    return () => {
      supabase.removeChannel(channel);
      clearTypingUsers();
    };
  // NOTE: setter functions are stable React dispatch references and do NOT need to be deps.
  // user?.id is sufficient. Passing the full `user` object caused subscription churn.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannelId, channels, user?.id]);

  // ── Auto-scroll to bottom when last message ID changes ──
  useEffect(() => {
    const lastId = messages[messages.length - 1]?.id ?? null;
    if (lastId && lastId !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastId;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, messagesEndRef]);

  // ── Focus message on mount / nav ──
  useEffect(() => {
    if (!focusMessageId || didFocusMessageRef.current || messages.length === 0) return;
    const target = document.querySelector(`[data-message-id="${focusMessageId}"]`) as HTMLElement | null;
    if (!target) return;

    didFocusMessageRef.current = true;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('ring-2', 'ring-amber-300', 'rounded-2xl');
    setTimeout(() => {
      target.classList.remove('ring-2', 'ring-amber-300', 'rounded-2xl');
    }, 1400);
  }, [focusMessageId, messages, didFocusMessageRef]);

  // ── Textarea auto-resize ──
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const capped = Math.min(el.scrollHeight, 160);
    el.style.height = `${capped}px`;
    el.style.overflowY = el.scrollHeight > 160 ? 'auto' : 'hidden';
  }, [newMessage, textareaRef]);

  // ── Fetch playlists ──
  useEffect(() => {
    if (!clubId) return;
    supabase.from('club_playlists').select('id, title').eq('club_id', clubId).order('order_index')
      .then(({ data }) => setPlaylists(data ?? []));
  }, [clubId, setPlaylists]);

  // ── Typing indicator ──
  const handleTypingStart = useCallback(() => {
    if (!activeChannelId || !user) return;
    supabase.from('club_typing')
      .upsert({ channel_id: activeChannelId, user_id: user.id, updated_at: new Date().toISOString() })
      .then();
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      supabase.from('club_typing').delete()
        .eq('channel_id', activeChannelId).eq('user_id', user.id).then();
    }, 4000);
  }, [activeChannelId, user, typingTimerRef]);

  return {
    handleTypingStart,
  };
}
