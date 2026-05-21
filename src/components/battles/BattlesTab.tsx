import { useState } from 'react';
import { Swords, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBattles } from '@/hooks/useBattles';
import { BattleCard } from './BattleCard';
import { CreateBattleModal } from './CreateBattleModal';

interface BattlesTabProps {
  clubId: string;
  isMember: boolean;
}

export default function BattlesTab({ clubId, isMember }: BattlesTabProps) {
  useAuth();
  const { data: battles = [], isLoading } = useBattles(clubId);
  const [showCreate, setShowCreate] = useState(false);

  const openBattles = battles.filter((b) => b.status === 'open');
  const votingBattles = battles.filter((b) => b.status === 'voting');
  const closedBattles = battles.filter((b) => b.status === 'closed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-semibold text-navy flex items-center gap-2">
          <Swords className="w-5 h-5 text-amber-sc" />
          Battles
        </h2>
        {isMember && (
          <button
            onClick={() => setShowCreate(true)}
            className="btn-amber text-xs inline-flex items-center gap-1.5 py-2 px-3"
          >
            <Plus className="w-3.5 h-3.5" />
            Start Battle
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="sc-card p-4 animate-pulse">
              <div className="h-24 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      ) : battles.length === 0 ? (
        <div className="sc-card p-8 text-center">
          <Swords className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-muted)]" />
          <h3 className="font-semibold text-navy mb-1">No battles yet</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Challenge another member to a skill showcase!
          </p>
          {isMember && (
            <button
              onClick={() => setShowCreate(true)}
              className="btn-amber text-sm inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Start First Battle
            </button>
          )}
        </div>
      ) : (
        <>
          {openBattles.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                Open
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {openBattles.map((battle) => (
                  <BattleCard key={battle.id} battle={battle} />
                ))}
              </div>
            </section>
          )}

          {votingBattles.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                Voting
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {votingBattles.map((battle) => (
                  <BattleCard key={battle.id} battle={battle} />
                ))}
              </div>
            </section>
          )}

          {closedBattles.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                Completed
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {closedBattles.map((battle) => (
                  <BattleCard key={battle.id} battle={battle} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <CreateBattleModal
        clubId={clubId}
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  );
}
