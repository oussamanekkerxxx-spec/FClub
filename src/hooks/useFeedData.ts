import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Skill } from '@/types/skills';
import type { User } from '@/contexts/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { fetchActiveSkills } from '@/features/skills/api';

type FeedUser = Pick<User, 'id' | 'isDemo' | 'what_i_learn' | 'location' | 'languages'>;
type FeedSkill = Skill & { relevance: number };

export interface FeedEvent {
  id: string;
  title: string;
  subtitle?: string | null;
  created_at: string;
  profiles?: {
    id: string;
    avatar_url: string | null;
    first_name: string;
    last_name?: string | null;
  } | null;
  skills?: { id: string; slug: string | null } | null;
}

interface UseFeedDataResult {
  skills: FeedSkill[];
  feedEvents: FeedEvent[];
  loading: boolean;
  skillCount: number;
  dismissSkill: (skillId: string) => Promise<void>;
}

function calculateRelevance(skill: Skill, user: FeedUser | null): number {
  if (!user) return 0;

  const userInterests = (user.what_i_learn ?? []).map((s) => s.toLowerCase());
  const userNeighborhood = (user.location ?? '').toLowerCase();
  const userLanguages = (user.languages ?? []).map((s) => s.toLowerCase());

  const category = skill.category.toLowerCase();
  const tags = skill.tags.map((tag) => tag.toLowerCase());
  const neighborhood = (skill.neighborhood || skill.location || '').toLowerCase();
  const skillLangs = skill.languages.map((language) => language.toLowerCase());

  let relevance = 0;

  if (
    userInterests.some(
      (interest) =>
        category.includes(interest) ||
        interest.includes(category) ||
        tags.some((tag) => tag.includes(interest) || interest.includes(tag))
    )
  ) {
    relevance += 2;
  }

  if (userNeighborhood && neighborhood && neighborhood === userNeighborhood) {
    relevance += 1;
  }

  if (userLanguages.some((language) => skillLangs.includes(language))) {
    relevance += 1;
  }

  return relevance;
}

/**
 * Feed page data model:
 * - active skills personalized by relevance
 * - latest feed events
 * - dismissed skills persisted per user
 */
export function useFeedData(user: FeedUser | null): UseFeedDataResult {
  const qc = useQueryClient();
  const dismissedKey = user ? queryKeys.skills.dismissedByUser(user.id) : ['skills', 'dismissed', '__disabled__'];

  const skillsQuery = useQuery({
    queryKey: queryKeys.skills.active(),
    queryFn: fetchActiveSkills,
    staleTime: 5 * 60 * 1000,
    meta: { errorMessage: 'Failed to load skills' },
  });

  const feedEventsQuery = useQuery({
    queryKey: queryKeys.feed.events(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feed_events')
        .select('*, profiles!feed_events_member_id_fkey(id, first_name, last_name, avatar_url), skills!feed_events_skill_id_fkey(id, slug)')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as FeedEvent[];
    },
    staleTime: 30 * 1000,
    meta: { errorMessage: false },
  });

  const dismissedQuery = useQuery({
    queryKey: dismissedKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dismissed_skills')
        .select('skill_id')
        .eq('user_id', user!.id);
      if (error) throw error;
      return (data ?? []).map((row) => row.skill_id as string);
    },
    enabled: !!user && !user.isDemo,
    staleTime: 60 * 1000,
    meta: { errorMessage: false },
  });

  const dismissedSet = useMemo(() => new Set(dismissedQuery.data ?? []), [dismissedQuery.data]);
  const skillCount = skillsQuery.data?.length ?? 0;

  const skills = useMemo(() => {
    const baseSkills = skillsQuery.data ?? [];
    const scored = baseSkills
      .filter((skill) => !dismissedSet.has(skill.id))
      .map((skill) => ({ ...skill, relevance: calculateRelevance(skill, user) }));

    scored.sort((a, b) => {
      if (b.relevance !== a.relevance) return b.relevance - a.relevance;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return scored;
  }, [dismissedSet, skillsQuery.data, user]);

  const dismissMutation = useMutation({
    mutationFn: async (skillId: string) => {
      if (!user || user.isDemo) return;
      const { error } = await supabase
        .from('dismissed_skills')
        .insert({ user_id: user.id, skill_id: skillId });
      // Unique conflict means the row already exists; treat it as success.
      if (error && error.code !== '23505') throw error;
    },
    onMutate: async (skillId) => {
      if (!user || user.isDemo) return undefined;
      await qc.cancelQueries({ queryKey: dismissedKey });
      const previous = qc.getQueryData<string[]>(dismissedKey) ?? [];
      if (!previous.includes(skillId)) {
        qc.setQueryData<string[]>(dismissedKey, [...previous, skillId]);
      }
      return { previous };
    },
    onError: (_error, _skillId, context) => {
      if (!context) return;
      qc.setQueryData<string[]>(dismissedKey, context.previous);
    },
  });

  return {
    skills,
    feedEvents: feedEventsQuery.data ?? [],
    loading: skillsQuery.isPending || feedEventsQuery.isPending || dismissedQuery.isPending,
    skillCount,
    dismissSkill: async (skillId: string) => {
      await dismissMutation.mutateAsync(skillId);
    },
  };
}
