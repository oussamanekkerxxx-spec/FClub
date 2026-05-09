import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Battle, BattleSubmission } from '@/types/battles';

export function useBattles(clubId: string | undefined) {
  return useQuery<Battle[]>({
    queryKey: ['battles', clubId],
    queryFn: async () => {
      if (!clubId) return [];
      const { data, error } = await supabase
        .from('battles')
        .select(`
          *,
          challenger:profiles!battles_challenger_id_fkey(id, first_name, last_name, avatar_url),
          opponent:profiles!battles_opponent_id_fkey(id, first_name, last_name, avatar_url)
        `)
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as Battle[];
    },
    enabled: !!clubId,
  });
}

export function useBattleSubmissions(battleId: string | undefined) {
  return useQuery<BattleSubmission[]>({
    queryKey: ['battles', battleId, 'submissions'],
    queryFn: async () => {
      if (!battleId) return [];
      const { data, error } = await supabase
        .from('battle_submissions')
        .select(`
          *,
          participant:profiles(id, first_name, last_name, avatar_url)
        `)
        .eq('battle_id', battleId);

      if (error) throw error;
      return (data ?? []) as BattleSubmission[];
    },
    enabled: !!battleId,
  });
}

export function useCreateBattle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (battle: Omit<Battle, 'id' | 'created_at' | 'status' | 'ended_at'>) => {
      const { data, error } = await supabase.from('battles').insert(battle).select().single();
      if (error) throw error;
      return data as Battle;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['battles', variables.club_id] });
    },
  });
}

export function useCloseBattle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ battleId, winnerId }: { battleId: string; winnerId: string }) => {
      const { data, error } = await supabase
        .from('battles')
        .update({ status: 'closed', winner_id: winnerId, ended_at: new Date().toISOString() })
        .eq('id', battleId)
        .select()
        .single();
      if (error) throw error;
      return data as Battle;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['battles', data.club_id] });
    },
  });
}
