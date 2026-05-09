import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Tournament, TournamentMatch } from '@/types/battles';

export function useTournaments(clubId: string | undefined) {
  return useQuery<Tournament[]>({
    queryKey: ['tournaments', clubId],
    queryFn: async () => {
      if (!clubId) return [];
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .or(`host_club_id.eq.${clubId},opponent_club_id.eq.${clubId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as Tournament[];
    },
    enabled: !!clubId,
  });
}

export function useTournamentMatches(tournamentId: string | undefined) {
  return useQuery<TournamentMatch[]>({
    queryKey: ['tournaments', tournamentId, 'matches'],
    queryFn: async () => {
      if (!tournamentId) return [];
      const { data, error } = await supabase
        .from('tournament_matches')
        .select(`
          *,
          participant_a:profiles!tournament_matches_participant_a_id_fkey(id, first_name, last_name, avatar_url),
          participant_b:profiles!tournament_matches_participant_b_id_fkey(id, first_name, last_name, avatar_url)
        `)
        .eq('tournament_id', tournamentId)
        .order('round', { ascending: true })
        .order('match_number', { ascending: true });

      if (error) throw error;
      return (data ?? []) as TournamentMatch[];
    },
    enabled: !!tournamentId,
  });
}

export function useCreateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tournament: Omit<Tournament, 'id' | 'created_at' | 'status'>) => {
      const { data, error } = await supabase.from('tournaments').insert(tournament).select().single();
      if (error) throw error;
      return data as Tournament;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['tournaments', variables.host_club_id] });
    },
  });
}
