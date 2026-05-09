import { Trophy } from 'lucide-react';
import { useTournamentMatches } from '@/hooks/useTournaments';
import type { Tournament } from '@/types/battles';

interface TournamentBracketProps {
  tournament: Tournament;
}

export function TournamentBracket({ tournament }: TournamentBracketProps) {
  const { data: matches = [], isLoading } = useTournamentMatches(tournament.id);

  if (isLoading) {
    return (
      <div className="sc-card p-8 text-center">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const rounds = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => a - b);

  return (
    <div className="sc-card p-5 overflow-x-auto">
      <h3 className="font-heading font-semibold text-navy mb-4 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-sc" />
        Bracket
      </h3>

      <div className="flex gap-8 min-w-max">
        {rounds.map((round) => {
          const roundMatches = matches.filter((m) => m.round === round);
          return (
            <div key={round} className="flex flex-col justify-center gap-4">
              <div className="text-xs font-semibold text-[var(--color-text-muted)] text-center uppercase tracking-wider">
                {round === rounds.length ? 'Final' : `Round ${round}`}
              </div>
              {roundMatches.map((match) => (
                <div
                  key={match.id}
                  className="w-40 p-2 rounded-lg border border-[var(--color-border)] bg-white"
                >
                  <div
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${
                      match.winner_id === match.participant_a_id
                        ? 'bg-green-50 text-green-700 font-semibold'
                        : 'text-navy'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-parchment-dark flex items-center justify-center text-[10px] font-bold">
                      {match.participant_a?.first_name?.[0] ?? '?'}
                    </div>
                    <span className="truncate">
                      {match.participant_a?.first_name ?? 'TBD'}
                    </span>
                  </div>
                  <div className="h-px bg-[var(--color-border)] my-1" />
                  <div
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${
                      match.winner_id === match.participant_b_id
                        ? 'bg-green-50 text-green-700 font-semibold'
                        : 'text-navy'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-parchment-dark flex items-center justify-center text-[10px] font-bold">
                      {match.participant_b?.first_name?.[0] ?? '?'}
                    </div>
                    <span className="truncate">
                      {match.participant_b?.first_name ?? 'TBD'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
