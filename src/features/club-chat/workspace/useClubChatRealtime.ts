import { useCallback, useEffect } from 'react';
import { reportError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import {
  MESSAGE_SELECT_CANDIDATES,
  isSchemaMismatchError,
  normaliseEvent,
  normaliseMessageRow,
} from '@/features/club-chat/workspace/messageData';
import type { ChannelRead, Message, Reaction, SelectError } from '@/features/club-chat/workspace/types';
import type { PollVote } from '@/types/messaging';

export function useClubChatRealtime(ctx: any) {
  const {
    clubId,
    user,
    focusChannelId,
    focusMessageId,
    activeChannelId,
    channels,
    messages,
    loadingMore,
    hasMore,
    newMessage,
    setIsAdminOrMod,
    setPreferences,
    setChannels,
    setUserChannelPrefs,
    setActiveChannelId,
    setChannelUnreads,
    setLoading,
    setMessages,
    setHasMore,
    setPinnedMessage,
    setChannelReads,
    setTypingUsers,
    setPlaylists,
    setLoadingMore,
    setShowScrollBottom,
    didFocusMessageRef,
    messagesEndRef,
    messagesAreaRef,
    textareaRef,
    typingTimerRef,
  } = ctx;

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
      setIsAdminOrMod(isMod);

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

        const unreads: Record<string, number> = {};
        await Promise.all(chans.map(async (chan: any) => {
          const read = reads?.find((r: any) => r.channel_id === chan.id);
          const { count } = await supabase
            .from('club_messages')
            .select('id', { count: 'exact', head: true })
            .eq('channel_id', chan.id)
            .is('deleted_at', null)
            .gt('created_at', read?.last_read_at ?? '1970-01-01');
          unreads[chan.id] = count ?? 0;
        }));
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
      setLoading(false);
    };

    init();
  }, [clubId, user, focusChannelId, setActiveChannelId, setChannelUnreads, setChannels, setIsAdminOrMod, setLoading, setPreferences]);

  useEffect(() => {
    if (!activeChannelId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      let selectedData: Record<string, unknown>[] | null = null;
      let lastError: SelectError = null;

      for (const selectClause of MESSAGE_SELECT_CANDIDATES) {
        const response = await supabase
          .from('club_messages')
          .select(selectClause)
          .eq('channel_id', activeChannelId)
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
        setMessages([]);
        setHasMore(false);
        return;
      }

      const msgs = selectedData.reverse().map(normaliseMessageRow);
      setMessages(msgs);
      setHasMore(selectedData.length === 50);
    };

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

    loadMessages();

    const channel = supabase
      .channel(`chat-${activeChannelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'club_messages', filter: `channel_id=eq.${activeChannelId}` },
        payload => {
          const msg = payload.new as Message;
          setMessages((prev: Message[]) => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          supabase.from('profiles').select('first_name, last_name, avatar_url').eq('id', msg.sender_id).single()
            .then(({ data: p }) => {
              if (p) setMessages((prev: Message[]) => prev.map(m => (m.id === msg.id ? { ...m, sender: p } : m)));
            });

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
                  setMessages((prev: Message[]) => prev.map(m => (m.id === msg.id ? { ...m, event: normalizedEvent } : m)));
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
            setMessages((prev: Message[]) => prev.map(m => {
              if (m.id === react.message_id) {
                const existing = m.reactions || [];
                if (!existing.find(r => r.id === react.id)) {
                  return { ...m, reactions: [...existing, react] };
                }
              }
              return m;
            }));
          } else if (payload.eventType === 'DELETE' && oldReact) {
            setMessages((prev: Message[]) => prev.map(m => {
              if (m.reactions?.some(r => r.id === oldReact.id)) {
                return { ...m, reactions: m.reactions.filter(r => r.id !== oldReact.id) };
              }
              return m;
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'poll_votes' },
        payload => {
          const vote = (payload.new ?? payload.old) as PollVote | null;
          if (!vote?.option_id) return;
          setMessages((prev: Message[]) => prev.map(m => {
            if (!m.poll?.options) return m;
            const hasOption = m.poll.options.some(o => o.id === vote.option_id);
            if (!hasOption) return m;
            const updatedOptions = m.poll.options.map(o => {
              if (o.id !== vote.option_id) return o;
              const existing = o.votes || [];
              if (payload.eventType === 'INSERT') {
                if (existing.some(v => v.id === (payload.new as PollVote).id)) return o;
                return { ...o, votes: [...existing, payload.new as PollVote] };
              }
              if (payload.eventType === 'DELETE') {
                return { ...o, votes: existing.filter(v => v.id !== (payload.old as PollVote).id) };
              }
              return o;
            });
            return { ...m, poll: { ...m.poll, options: updatedOptions } };
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'channel_reads', filter: `channel_id=eq.${activeChannelId}` },
        payload => {
          const cr = (payload.new ?? payload.old) as ChannelRead;
          if (!cr || cr.user_id === user?.id) return;
          setChannelReads((prev: ChannelRead[]) => {
            const idx = prev.findIndex(r => r.user_id === cr.user_id);
            if (payload.eventType === 'DELETE') return prev.filter(r => r.user_id !== cr.user_id);
            if (idx >= 0) { const u = [...prev]; u[idx] = cr; return u; }
            return [...prev, cr];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'club_typing', filter: `channel_id=eq.${activeChannelId}` },
        payload => {
          if (payload.eventType === 'DELETE') {
            const gone = payload.old as { user_id: string };
            setTypingUsers((prev: any[]) => prev.filter(t => t.user_id !== gone.user_id));
          } else {
            const typer = payload.new as { user_id: string; channel_id: string };
            if (typer.user_id === user?.id) return;
            supabase.from('profiles').select('first_name').eq('id', typer.user_id).single()
              .then(({ data: p }) => {
                if (!p) return;
                setTypingUsers((prev: any[]) => {
                  if (prev.some((t: any) => t.user_id === typer.user_id)) return prev;
                  return [...prev, { user_id: typer.user_id, name: p.first_name }];
                });
                setTimeout(() => setTypingUsers((prev: any[]) => prev.filter((t: any) => t.user_id !== typer.user_id)), 5000);
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
      setTypingUsers([]);
    };
  }, [activeChannelId, channels, setChannelReads, setChannelUnreads, setHasMore, setMessages, setPinnedMessage, setTypingUsers, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messagesEndRef]);

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

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const capped = Math.min(el.scrollHeight, 160);
    el.style.height = `${capped}px`;
    el.style.overflowY = el.scrollHeight > 160 ? 'auto' : 'hidden';
  }, [newMessage, textareaRef]);

  useEffect(() => {
    if (!clubId) return;
    supabase.from('club_playlists').select('id, title').eq('club_id', clubId).order('order_index')
      .then(({ data }) => setPlaylists(data ?? []));
  }, [clubId, setPlaylists]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0 || !activeChannelId) return;
    setLoadingMore(true);
    const oldest = messages[0]?.created_at;
    const area = messagesAreaRef.current;
    const prevHeight = area?.scrollHeight ?? 0;

    let selectedData: Record<string, unknown>[] | null = null;

    for (const selectClause of MESSAGE_SELECT_CANDIDATES) {
      const response = await supabase
        .from('club_messages')
        .select(selectClause)
        .eq('channel_id', activeChannelId)
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
      setMessages((prev: Message[]) => [...older, ...prev]);
      setHasMore(selectedData.length === 50);
      requestAnimationFrame(() => {
        if (area) area.scrollTop = area.scrollHeight - prevHeight;
      });
    }
    setLoadingMore(false);
  }, [loadingMore, hasMore, messages, activeChannelId, messagesAreaRef, setHasMore, setLoadingMore, setMessages]);

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
    loadMore,
    handleTypingStart,
    setShowScrollBottom,
  };
}
