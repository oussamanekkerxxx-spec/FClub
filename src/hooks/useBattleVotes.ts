import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useCastBattleVote() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ battleId, submissionId }: { battleId: string; submissionId: string }) => {
      const { data, error } = await supabase
        .from('battle_votes')
        .insert({ battle_id: battleId, submission_id: submissionId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['battles', variables.battleId, 'submissions'] });
      qc.invalidateQueries({ queryKey: ['battles', variables.battleId] });
    },
  });
}

export function useSubmitBattleEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      battleId,
      participantId,
      contentUrl,
      description,
    }: {
      battleId: string;
      participantId: string;
      contentUrl: string;
      description: string;
    }) => {
      const { data, error } = await supabase
        .from('battle_submissions')
        .insert({
          battle_id: battleId,
          participant_id: participantId,
          content_url: contentUrl,
          description,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['battles', variables.battleId, 'submissions'] });
    },
  });
}
