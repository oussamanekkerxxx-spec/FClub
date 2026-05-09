import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Club } from '@/types/clubs';

interface SuggestedClubsOptions {
  userId: string | undefined;
  interests: string[];
  city: string | undefined;
  excludeIds: string[];
}

export function useSuggestedClubs({ userId, interests, city, excludeIds }: SuggestedClubsOptions) {
  return useQuery<Club[]>({
    queryKey: ['home', 'suggested', userId, interests, city],
    queryFn: async () => {
      if (!userId) return [];

      let query = supabase
        .from('clubs')
        .select('*')
        .eq('is_private', false)
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .order('member_count', { ascending: false })
        .limit(6);

      if (interests.length > 0) {
        query = query.in('category', interests);
      }

      if (city) {
        query = query.or(`city.eq.${city},region.eq.${city}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data ?? []) as Club[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
