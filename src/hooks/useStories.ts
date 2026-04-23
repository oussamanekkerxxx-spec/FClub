import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/contexts/AuthContext';
import type { StoryWithAuthor, UserStoryGroup } from '@/types/stories';

export function useStories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: rawStories, isLoading, error } = useQuery({
    queryKey: queryKeys.stories.active(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          author:profiles!stories_author_id_fkey(first_name, last_name, avatar_url),
          views:story_views(viewer_id)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  // Group stories by author_id
  const storyGroups = useMemo(() => {
    if (!rawStories || !user) return [];

    const groupsMap = new Map<string, UserStoryGroup>();

    rawStories.forEach((row) => {
      // Normalize author response (in case it returns array or single obj depending on relationship)
      const author = Array.isArray(row.author) ? row.author[0] : row.author;
      
      const has_viewed = row.views?.some((v: any) => v.viewer_id === user.id) ?? false;

      const story: StoryWithAuthor = {
        id: row.id,
        author_id: row.author_id,
        club_id: row.club_id,
        media_type: row.media_type,
        media_url: row.media_url,
        caption: row.caption,
        background_gradient: row.background_gradient,
        created_at: row.created_at,
        expires_at: row.expires_at,
        author: {
          first_name: author?.first_name || 'Unknown',
          last_name: author?.last_name || null,
          avatar_url: author?.avatar_url || '',
        },
        has_viewed,
      };

      if (!groupsMap.has(story.author_id)) {
        groupsMap.set(story.author_id, {
          author_id: story.author_id,
          author: story.author,
          stories: [],
          has_unread: false,
        });
      }

      const group = groupsMap.get(story.author_id)!;
      group.stories.push(story);
      if (!story.has_viewed && story.author_id !== user.id) {
        group.has_unread = true;
      }
    });

    // Sort groups: Current user first, then users with unread stories, then read stories
    const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => {
      if (a.author_id === user.id) return -1;
      if (b.author_id === user.id) return 1;
      if (a.has_unread && !b.has_unread) return -1;
      if (!a.has_unread && b.has_unread) return 1;
      
      // Secondary sort: most recent story
      const lastStoryA = a.stories[a.stories.length - 1];
      const lastStoryB = b.stories[b.stories.length - 1];
      return new Date(lastStoryB.created_at).getTime() - new Date(lastStoryA.created_at).getTime();
    });

    return sortedGroups;
  }, [rawStories, user]);

  const recordViewMutation = useMutation({
    mutationFn: async (storyId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from('story_views')
        .upsert(
          { story_id: storyId, viewer_id: user.id, viewed_at: new Date().toISOString() },
          { onConflict: 'story_id,viewer_id' }
        );
      if (error) throw error;
    },
    onMutate: async (storyId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.stories.active() });
      const previous = queryClient.getQueryData<any[]>(queryKeys.stories.active());
      
      if (previous && user) {
        queryClient.setQueryData(
          queryKeys.stories.active(),
          previous.map((story) => 
            story.id === storyId 
              ? { ...story, views: [...(story.views || []), { viewer_id: user.id }] }
              : story
          )
        );
      }
      return { previous };
    },
    onError: (_err, _newTodo, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.stories.active(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stories.active() });
    },
  });

  const reactToStoryMutation = useMutation({
    mutationFn: async ({ storyId, emoji }: { storyId: string; emoji: string }) => {
      if (!user) return;
      const { error } = await supabase
        .from('story_reactions')
        .insert({ story_id: storyId, user_id: user.id, emoji });
      if (error) throw error;
    },
  });

  return {
    storyGroups,
    isLoading,
    error,
    recordView: (storyId: string) => recordViewMutation.mutate(storyId),
    reactToStory: (storyId: string, emoji: string) => reactToStoryMutation.mutate({ storyId, emoji }),
  };
}
