import { Link } from 'react-router-dom';
import { Swords, Clock, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Battle } from '@/types/battles';

interface BattleCardProps {
  battle: Battle;
}

const statusLabels: Record<string, { text: string; color: string }> = {
  open: { text: 'Open', color: 'bg-green-50 text-green-700' },
  voting: { text: 'Voting', color: 'bg-amber-50 text-amber-700' },
  closed: { text: 'Closed', color: 'bg-gray-100 text-gray-600' },
  cancelled: { text: 'Cancelled', color: 'bg-red-50 text-red-700' },
};

export function BattleCard({ battle }: BattleCardProps) {
  const status = statusLabels[battle.status] || statusLabels.open;

  return (
    <div className="sc-card p-4 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-navy/5 flex items-center justify-center">
            <Swords className="w-4 h-4 text-navy" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-navy">{battle.title}</h3>
            <p className="text-xs text-[var(--color-text-muted)]">{battle.topic}</p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
          {status.text}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1 text-center">
          <div className="w-10 h-10 mx-auto rounded-full bg-parchment-dark flex items-center justify-center text-xs font-bold text-navy">
            {battle.challenger?.first_name?.[0] ?? '?'}
          </div>
          <p className="text-[11px] text-navy mt-1 truncate">
            {battle.challenger?.first_name ?? 'TBD'}
          </p>
        </div>
        <div className="text-xs font-bold text-[var(--color-text-muted)]">VS</div>
        <div className="flex-1 text-center">
          <div className="w-10 h-10 mx-auto rounded-full bg-parchment-dark flex items-center justify-center text-xs font-bold text-navy">
            {battle.opponent?.first_name?.[0] ?? '?'}
          </div>
          <p className="text-[11px] text-navy mt-1 truncate">
            {battle.opponent?.first_name ?? 'TBD'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {battle.deadline
            ? formatDistanceToNow(new Date(battle.deadline), { addSuffix: true })
            : 'No deadline'}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {battle.judge_type === 'community_vote' ? 'Community vote' : 'Panel'}
        </span>
      </div>
    </div>
  );
}
