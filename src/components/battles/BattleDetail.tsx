import { useState } from 'react';
import { Swords, ThumbsUp, Trophy, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useBattleSubmissions } from '@/hooks/useBattles';
import { useCastBattleVote } from '@/hooks/useBattleVotes';
import type { Battle } from '@/types/battles';
import { toast } from 'sonner';

interface BattleDetailProps {
  battle: Battle;
}

export function BattleDetail({ battle }: BattleDetailProps) {
  const { user } = useAuth();
  const { data: submissions = [], isLoading } = useBattleSubmissions(battle.id);
  const castVote = useCastBattleVote();
  const [votedFor, setVotedFor] = useState<string | null>(null);

  const handleVote = (submissionId: string) => {
    if (votedFor) return;
    castVote.mutate(
      { battleId: battle.id, submissionId },
      {
        onSuccess: () => {
          setVotedFor(submissionId);
          toast.success('Vote cast!');
        },
      }
    );
  };

  const isParticipant = user?.id === battle.challenger_id || user?.id === battle.opponent_id;
  const canVote = battle.status === 'voting' && !isParticipant && !votedFor;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sc-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center">
            <Swords className="w-5 h-5 text-navy" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-navy">{battle.title}</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">{battle.topic}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {battle.deadline
              ? formatDistanceToNow(new Date(battle.deadline), { addSuffix: true })
              : 'No deadline'}
          </span>
          <span className="capitalize">{battle.format}</span>
          <span className="capitalize">{battle.judge_type.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Winner announcement */}
      {battle.winner_id && (
        <div className="sc-card p-4 bg-amber-50/50 border-amber-200">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-sc" />
            <div>
              <p className="font-semibold text-sm text-navy">Battle Complete</p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Winner: {battle.winner_id === battle.challenger_id
                  ? battle.challenger?.first_name
                  : battle.opponent?.first_name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submissions */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="sc-card p-4 animate-pulse">
              <div className="h-40 bg-gray-200 rounded-lg mb-3" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="sc-card p-8 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            No submissions yet. Check back later!
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {submissions.map((sub) => (
            <div key={sub.id} className="sc-card p-4">
              {sub.content_url && (
                <div className="rounded-lg overflow-hidden mb-3 bg-parchment-dark">
                  {sub.content_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img
                      src={sub.content_url}
                      alt="Submission"
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="h-48 flex items-center justify-center text-sm text-[var(--color-text-muted)]">
                      {sub.content_url}
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-navy">
                  {sub.participant?.first_name} {sub.participant?.last_name}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {sub.votes_count} votes
                </span>
              </div>
              {sub.description && (
                <p className="text-xs text-[var(--color-text-secondary)] mb-3">{sub.description}</p>
              )}
              {canVote && (
                <button
                  onClick={() => handleVote(sub.id)}
                  disabled={castVote.isPending}
                  className="w-full py-2 rounded-lg bg-navy/5 text-navy text-xs font-semibold hover:bg-navy/10 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Vote for this
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
