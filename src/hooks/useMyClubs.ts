import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import type { Club } from '@/types/clubs';

interface MyClub extends Club {
  last_activity_at?: string | null;
}

export function useMyClubs(userId: string | undefined) {
  return useQuery<MyClub[]>({
    queryKey: ['home', 'my-clubs', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('club_memberships')
        .select(`
          club_id,
          clubs!inner(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        ...row.clubs,
        my_membership: {
          club_id: row.club_id,
          user_id: userId,
          role: row.clubs?.my_membership?.role ?? 'member',
          status: 'active',
          joined_at: row.joined_at,
        },
      })) as MyClub[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
