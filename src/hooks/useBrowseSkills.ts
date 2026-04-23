import { useQuery } from '@tanstack/react-query';
import type { Skill } from '@/types/skills';
import { queryKeys } from '@/lib/queryKeys';
import { fetchActiveSkills } from '@/features/skills/api';

interface UseBrowseSkillsResult {
  skills: Skill[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Browse page data model: active skills mapped to UI shape.
 * Kept as a dedicated hook so page components stay presentation-focused.
 */
export function useBrowseSkills(): UseBrowseSkillsResult {
  const query = useQuery<Skill[]>({
    queryKey: queryKeys.skills.active(),
    queryFn: fetchActiveSkills,
    staleTime: 5 * 60 * 1000,
    meta: { errorMessage: 'Failed to load skills' },
  });

  return {
    skills: query.data ?? [],
    loading: query.isPending,
    error: query.error as Error | null,
    refetch: () => { void query.refetch(); },
  };
}
