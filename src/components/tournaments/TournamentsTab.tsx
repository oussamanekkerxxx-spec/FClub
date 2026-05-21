import { Trophy, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTournaments } from '@/hooks/useTournaments';
import { TournamentCard } from './TournamentCard';

interface TournamentsTabProps {
  clubId: string;
  isMember: boolean;
}

export default function TournamentsTab({ clubId, isMember }: TournamentsTabProps) {
  const { data: tournaments = [], isLoading } = useTournaments(clubId);
  const [_showCreate, _setShowCreate] = useState(false);

  const active = tournaments.filter((t) => t.status === 'registering' || t.status === 'active');
  const completed = tournaments.filter((t) => t.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-semibold text-navy flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-sc" />
          Tournaments
        </h2>
        {isMember && (
          <button
            onClick={() => _setShowCreate(true)}
            className="btn-amber text-xs inline-flex items-center gap-1.5 py-2 px-3"
          >
            <Plus className="w-3.5 h-3.5" />
            New Tournament
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="sc-card p-4 animate-pulse">
              <div className="h-24 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="sc-card p-8 text-center">
          <Trophy className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-muted)]" />
          <h3 className="font-semibold text-navy mb-1">No tournaments yet</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Club vs club competitions will appear here.
          </p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                Active
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {active.map((t) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            </section>
          )}
          {completed.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                Completed
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {completed.map((t) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
