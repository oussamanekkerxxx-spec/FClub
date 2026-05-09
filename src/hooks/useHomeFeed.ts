import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ClubPost, ClubEvent } from '@/types/clubs';

interface FeedItem {
  id: string;
  type: 'post' | 'event';
  club_id: string;
  club_name: string;
  club_avatar_url: string | null;
  created_at: string;
  data: ClubPost | ClubEvent;
}

export function useHomeFeed(userId: string | undefined, clubIds: string[]) {
  return useQuery<FeedItem[]>({
    queryKey: ['home', 'feed', userId, clubIds],
    queryFn: async () => {
      if (!userId || clubIds.length === 0) return [];

      // Fetch recent posts from joined clubs
      const { data: postsData, error: postsError } = await supabase
        .from('club_posts')
        .select(`
          *,
          author:profiles(first_name, last_name, avatar_url, trust_tier),
          club:clubs(id, name, avatar_url)
        `)
        .in('club_id', clubIds)
        .order('created_at', { ascending: false })
        .limit(25);

      if (postsError) throw postsError;

      // Fetch upcoming events from joined clubs
      const { data: eventsData, error: eventsError } = await supabase
        .from('club_events')
        .select(`
          *,
          club:clubs(id, name, avatar_url)
        `)
        .in('club_id', clubIds)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(15);

      if (eventsError) throw eventsError;

      const feedItems: FeedItem[] = [];

      (postsData ?? []).forEach((post: any) => {
        feedItems.push({
          id: `post-${post.id}`,
          type: 'post',
          club_id: post.club_id,
          club_name: post.club?.name ?? 'Unknown Club',
          club_avatar_url: post.club?.avatar_url ?? null,
          created_at: post.created_at,
          data: post as ClubPost,
        });
      });

      (eventsData ?? []).forEach((event: any) => {
        feedItems.push({
          id: `event-${event.id}`,
          type: 'event',
          club_id: event.club_id,
          club_name: event.club?.name ?? 'Unknown Club',
          club_avatar_url: event.club?.avatar_url ?? null,
          created_at: event.created_at,
          data: event as ClubEvent,
        });
      });

      // Sort by created_at descending, limit to 40
      return feedItems
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 40);
    },
    enabled: !!userId && clubIds.length > 0,
    staleTime: 60 * 1000, // 1 minute
  });
}
