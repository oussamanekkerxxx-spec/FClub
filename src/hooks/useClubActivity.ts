import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';
import { unwrapRelation } from '@/lib/utils';
import { extractFileNameFromUrl, normalizeHttpUrl } from '@/lib/safeUrl';
import type { ClubMessageWithAttachments } from '@/types/clubs';

export type ActivityType = 'project' | 'poll' | 'event' | 'resource' | 'video' | 'message';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  body: string;
  createdAt: string;
  channelName: string;
  sender?: { first_name: string; last_name: string; avatar_url: string | null };
  projectId?: string;
  href?: string;
}

interface UseClubActivityOptions {
  clubId: string | undefined;
  enabled: boolean;
}

interface UseClubActivityResult {
  items: ActivityItem[];
  loading: boolean;
}

function toActivityItem(
  row: ClubMessageWithAttachments,
  channelMap: Map<string, string>
): ActivityItem | null {
  const sender = row.sender ? unwrapRelation(row.sender) : undefined;
  const poll = row.poll ? unwrapRelation(row.poll) : null;
  const project = row.project ? unwrapRelation(row.project) : null;
  const content = row.content?.trim() ?? '';
  const lowerContent = content.toLowerCase();

  if (project) {
    return {
      id: row.id,
      type: 'project',
      title: project.title,
      body: project.pitch?.trim() || 'A new project was shared in chat.',
      createdAt: row.created_at,
      channelName: channelMap.get(row.channel_id) ?? 'general',
      sender,
      projectId: project.id,
    };
  }

  if (poll) {
    const optionsCount = poll.options?.length ?? 0;
    return {
      id: row.id,
      type: 'poll',
      title: poll.question,
      body: optionsCount > 0 ? `${optionsCount} options ready for voting.` : 'A poll was shared in chat.',
      createdAt: row.created_at,
      channelName: channelMap.get(row.channel_id) ?? 'general',
      sender,
    };
  }

  if (lowerContent.includes('created an event')) {
    return {
      id: row.id,
      type: 'event',
      title: 'New event announced',
      body: content,
      createdAt: row.created_at,
      channelName: channelMap.get(row.channel_id) ?? 'general',
      sender,
    };
  }

  if (row.video_url) {
    const safeVideoUrl = normalizeHttpUrl(row.video_url);
    if (!safeVideoUrl) return null;
    return {
      id: row.id,
      type: 'video',
      title: content || 'Video shared in chat',
      body: extractFileNameFromUrl(safeVideoUrl, 'video'),
      createdAt: row.created_at,
      channelName: channelMap.get(row.channel_id) ?? 'general',
      sender,
      href: safeVideoUrl,
    };
  }

  if (row.pdf_url) {
    const safePdfUrl = normalizeHttpUrl(row.pdf_url);
    if (!safePdfUrl) return null;
    return {
      id: row.id,
      type: 'resource',
      title: content || 'Document shared in chat',
      body: extractFileNameFromUrl(safePdfUrl, 'document'),
      createdAt: row.created_at,
      channelName: channelMap.get(row.channel_id) ?? 'general',
      sender,
      href: safePdfUrl,
    };
  }

  if (row.image_url) {
    const safeImageUrl = normalizeHttpUrl(row.image_url);
    if (!safeImageUrl) return null;
    return {
      id: row.id,
      type: 'message',
      title: content || 'Image shared in chat',
      body: 'Media update from the club chat.',
      createdAt: row.created_at,
      channelName: channelMap.get(row.channel_id) ?? 'general',
      sender,
      href: safeImageUrl,
    };
  }

  return null;
}

async function fetchClubActivity(clubId: string): Promise<{ items: ActivityItem[]; channelIds: string[]; channelMap: Map<string, string> }> {
  const { data: channels, error: channelsError } = await supabase
    .from('club_channels')
    .select('id, name')
    .eq('club_id', clubId);

  if (channelsError) {
    toast.error('Could not load club activity');
    return { items: [], channelIds: [], channelMap: new Map() };
  }

  const channelMap = new Map(
    (channels ?? []).map((c: { id: string; name: string }) => [c.id, c.name])
  );
  const channelIds = channelMap.size > 0 ? Array.from(channelMap.keys()) : [];

  if (channelIds.length === 0) return { items: [], channelIds: [], channelMap };

  const { data: rows, error: messagesError } = await supabase
    .from('club_messages')
    .select(`
      id,
      channel_id,
      content,
      image_url,
      video_url,
      pdf_url,
      created_at,
      sender:profiles!club_messages_sender_id_fkey(first_name, last_name, avatar_url),
      poll:polls(id, question, options:poll_options(id, votes:poll_votes(id))),
      project:club_projects(id, title, pitch, visibility, status)
    `)
    .in('channel_id', channelIds)
    .order('created_at', { ascending: false })
    .limit(120);

  if (messagesError) {
    toast.error('Could not load club activity');
    return { items: [], channelIds, channelMap };
  }

  const items = ((rows ?? []) as ClubMessageWithAttachments[])
    .map((row) => toActivityItem(row, channelMap))
    .filter((item): item is ActivityItem => item !== null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 24);

  return { items, channelIds, channelMap };
}

export function useClubActivity({
  clubId,
  enabled,
}: UseClubActivityOptions): UseClubActivityResult {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const channelMapRef = useRef<Map<string, string>>(new Map());
  const channelIdsRef = useRef<string[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const query = useQuery({
    queryKey: clubId ? queryKeys.clubs.activity(clubId) : ['activity', '__disabled__'],
    queryFn: () => fetchClubActivity(clubId!),
    enabled: !!clubId && enabled,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data !== undefined) {
      const { items: fetchedItems, channelIds, channelMap } = query.data;
      setItems(fetchedItems);
      channelMapRef.current = channelMap;
      channelIdsRef.current = channelIds;
      setLoading(query.isLoading);
    }
  }, [query.data, query.isLoading]);

  useEffect(() => {
    if (!clubId || !enabled || channelIdsRef.current.length === 0) return;

    const ch = supabase
      .channel(`feed:${clubId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'club_messages',
      }, (payload) => {
        const msg = payload.new as ClubMessageWithAttachments & { sender?: unknown; poll?: unknown; project?: unknown };
        const channelId = msg.channel_id;
        if (!channelId || !channelIdsRef.current.includes(channelId)) return;
        const item = toActivityItem(msg as ClubMessageWithAttachments, channelMapRef.current);
        if (!item) return;
        setItems(prev => {
          if (prev.some(i => i.id === item.id)) return prev;
          return [item, ...prev].slice(0, 24);
        });
      });
    ch.subscribe();
    channelRef.current = ch;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [clubId, enabled]);

  return { items, loading };
}