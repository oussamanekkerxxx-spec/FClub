import { Trophy, Calendar, Users, Swords } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Tournament } from '@/types/battles';

interface TournamentCardProps {
  tournament: Tournament;
}

const statusLabels: Record<string, { text: string; color: string }> = {
  registering: { text: 'Registering', color: 'bg-blue-50 text-blue-700' },
  active: { text: 'Active', color: 'bg-green-50 text-green-700' },
  completed: { text: 'Completed', color: 'bg-gray-100 text-gray-600' },
  cancelled: { text: 'Cancelled', color: 'bg-red-50 text-red-700' },
};

export function TournamentCard({ tournament }: TournamentCardProps) {
  const status = statusLabels[tournament.status] || statusLabels.registering;

  return (
    <div className="sc-card p-4 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-amber-sc" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-navy">{tournament.name}</h3>
            <p className="text-xs text-[var(--color-text-muted)] capitalize">
              {tournament.format.replace('_', ' ')}
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
          {status.text}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {tournament.start_date
            ? formatDistanceToNow(new Date(tournament.start_date), { addSuffix: true })
            : 'TBD'}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          Max {tournament.max_participants}
        </span>
        <span className="flex items-center gap-1">
          <Swords className="w-3.5 h-3.5" />
          Club vs Club
        </span>
      </div>
    </div>
  );
}
