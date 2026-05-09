import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDays } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { reportError } from '@/lib/errors';
import { unwrapRelation } from '@/lib/utils';
import type { ProfileMini } from '@/types/clubs';

type ChannelRow = { id: string; name: string | null };

type MessageRow = {
  id: string;
  channel_id: string;
  content: string | null;
  created_at: string;
  sender_id: string;
  sender?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | Array<{
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  }> | null;
  channel?: {
    name: string | null;
  } | Array<{
    name: string | null;
  }> | null;
};

type EventRow = {
  id: string;
  title: string;
  location: string | null;
  starts_at: string;
};

type JoinRequestRow = {
  id: string;
  user_id: string;
  created_at: string;
  profile?: ProfileMini | ProfileMini[] | null;
};

export type StudentClubNotificationItem = {
  id: string;
  kind: 'mention' | 'event' | 'join_request';
  createdAt: string;
  title: string;
  description: string;
  icon: string;
  iconBg: string;
  tag: string;
  tagColor: string;
};

interface UseStudentClubNotificationsOptions {
  clubId: string | undefined;
  enabled?: boolean;
  canModerate?: boolean;
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function buildMentionTokens(firstName?: string, lastName?: string) {
  const first = compactWhitespace(firstName ?? '');
  const last = compactWhitespace(lastName ?? '');
  const full = compactWhitespace(`${firstName ?? ''} ${lastName ?? ''}`);

  return Array.from(
    new Set(
      [
        first ? `@${first}` : null,
        full ? `@${full}` : null,
        full ? `@${full.replace(/\s+/g, '')}` : null,
        full ? `@${full.replace(/\s+/g, '_')}` : null,
        first && last ? `@${first}-${last}` : null,
      ].filter((token): token is string => Boolean(token))
    )
  );
}

function truncateMessage(value: string, max = 100) {
  const next = value.trim().replace(/\s+/g, ' ');
  if (next.length <= max) return next;
  return `${next.slice(0, max - 1).trimEnd()}…`;
}

export function useStudentClubNotifications({
  clubId,
  enabled = true,
  canModerate = false,
}: UseStudentClubNotificationsOptions) {
  const { user } = useAuth();
  const [items, setItems] = useState<StudentClubNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const relevantChannelIdsRef = useRef<string[]>([]);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const mentionTokens = useMemo(
    () => buildMentionTokens(user?.firstName, user?.lastName),
    [user?.firstName, user?.lastName]
  );

  const loadNotifications = useCallback(async () => {
    if (!clubId || !enabled || !user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data: channels, error: channelsError } = await supabase
        .from('club_channels')
        .select('id, name')
        .eq('club_id', clubId);

      if (channelsError) throw channelsError;

      const safeChannels = (channels ?? []) as ChannelRow[];
      const channelIds = safeChannels.map((channel) => channel.id);
      relevantChannelIdsRef.current = channelIds;

      const nowIso = new Date().toISOString();
      const reminderCutoffIso = addDays(new Date(), 3).toISOString();

      const [messagesResult, eventsResult, joinRequestsResult] = await Promise.all([
        channelIds.length > 0
          ? supabase
              .from('club_messages')
              .select(`
                id,
                channel_id,
                content,
                created_at,
                sender_id,
                sender:profiles!club_messages_sender_id_fkey(first_name, last_name, avatar_url),
                channel:club_channels!club_messages_channel_id_fkey(name)
              `)
              .in('channel_id', channelIds)
              .neq('sender_id', user.id)
              .order('created_at', { ascending: false })
              .limit(80)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from('club_events')
          .select('id, title, location, starts_at')
          .eq('club_id', clubId)
          .gte('starts_at', nowIso)
          .lte('starts_at', reminderCutoffIso)
          .order('starts_at', { ascending: true })
          .limit(5),
        canModerate
          ? supabase
              .from('join_requests')
              .select(`
                id,
                user_id,
                created_at,
                profile:profiles!join_requests_user_id_fkey(first_name, last_name, avatar_url, city)
              `)
              .eq('club_id', clubId)
              .eq('status', 'pending')
              .order('created_at', { ascending: false })
              .limit(5)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (messagesResult.error) throw messagesResult.error;
      if (eventsResult.error) throw eventsResult.error;
      if (joinRequestsResult.error) throw joinRequestsResult.error;

      const mentionItems: StudentClubNotificationItem[] = ((messagesResult.data ?? []) as MessageRow[])
        .filter((message) => {
          const content = compactWhitespace(message.content ?? '');
          return mentionTokens.some((token) => content.includes(token));
        })
        .slice(0, 6)
        .map((message) => {
          const sender = unwrapRelation(message.sender);
          const channel = unwrapRelation(message.channel);
          const senderName = [sender?.first_name, sender?.last_name].filter(Boolean).join(' ').trim() || 'Someone';

          return {
            id: `mention:${message.id}`,
            kind: 'mention',
            createdAt: message.created_at,
            title: `${senderName} mentioned you`,
            description: channel?.name
              ? `In #${channel.name}: "${truncateMessage(message.content ?? '')}"`
              : `"${truncateMessage(message.content ?? '')}"`,
            icon: '🔔',
            iconBg: 'bg-orange-100/50',
            tag: 'Mention',
            tagColor: 'bg-orange-100 text-[var(--color-amber)]',
          };
        });

      const eventItems: StudentClubNotificationItem[] = ((eventsResult.data ?? []) as EventRow[]).map((event) => ({
        id: `event:${event.id}`,
        kind: 'event',
        createdAt: event.starts_at,
        title: `Event reminder: ${event.title}`,
        description: event.location
          ? `${new Date(event.starts_at).toLocaleString()} · ${event.location}`
          : new Date(event.starts_at).toLocaleString(),
        icon: '📅',
        iconBg: 'bg-red-100/50',
        tag: 'Event',
        tagColor: 'bg-red-100 text-red-600',
      }));

      const joinRequestItems: StudentClubNotificationItem[] = ((joinRequestsResult.data ?? []) as JoinRequestRow[]).map((request) => {
        const profile = unwrapRelation(request.profile);
        const requesterName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() || 'A member';
        const extra = profile?.city ? ` · ${profile.city}` : '';

        return {
          id: `join:${request.id}`,
          kind: 'join_request',
          createdAt: request.created_at,
          title: `${requesterName} requested to join`,
          description: `Pending admin review${extra}`,
          icon: '👤',
          iconBg: 'bg-blue-100/50',
          tag: 'Request',
          tagColor: 'bg-blue-100 text-blue-600',
        };
      });

      const nextItems = [...mentionItems, ...eventItems, ...joinRequestItems]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setItems(nextItems);
    } catch (error) {
      reportError('useStudentClubNotifications:load', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [canModerate, clubId, enabled, mentionTokens, user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!clubId || !enabled || !user?.id) return;

    const channel = supabase
      .channel(`student-club-notifications:${clubId}:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'club_messages' },
        (payload) => {
          const channelId = (payload.new as { channel_id?: string }).channel_id;
          if (channelId && relevantChannelIdsRef.current.includes(channelId)) {
            loadNotifications();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'club_events', filter: `club_id=eq.${clubId}` },
        () => loadNotifications()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'join_requests', filter: `club_id=eq.${clubId}` },
        () => {
          if (canModerate) loadNotifications();
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          reportError('useStudentClubNotifications:realtime', new Error(`Realtime ${status}`), { status });
        }
      });

    realtimeRef.current = channel;

    return () => {
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
    };
  }, [canModerate, clubId, enabled, loadNotifications, user?.id]);

  return { items, loading, refetch: loadNotifications };
}
