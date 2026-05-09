import { Link } from 'react-router-dom';
import { TRUST_TIERS, type TrustTierLevel } from '@/config/app';
import { TRUST_TIER_LABELS } from '@/contexts/AuthContext';

interface TrustBadgeProps {
  trustTier: TrustTierLevel;
  trustScore: number;
}

export function TrustBadge({ trustTier, trustScore }: TrustBadgeProps) {
  const tier = TRUST_TIERS[trustTier];
  const nextTier = (trustTier < 4 ? trustTier + 1 : null) as TrustTierLevel | null;
  const nextThreshold = nextTier !== null ? TRUST_TIERS[nextTier].minScore : null;
  const pointsNeeded = nextThreshold !== null ? Math.max(nextThreshold - trustScore, 0) : 0;

  return (
    <Link
      to="/app/profile"
      className="group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-transform hover:scale-105"
      style={{ background: tier.bg, color: tier.text }}
    >
      <span>{tier.label}</span>
      <span className="opacity-60">★ {trustScore}</span>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 rounded-xl bg-navy text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-floating">
        <div className="font-semibold mb-1">{tier.label} Member</div>
        <div className="text-white/70 mb-2">{tier.description}</div>
        {pointsNeeded > 0 ? (
          <div className="text-amber-300">
            {pointsNeeded} pts to {TRUST_TIER_LABELS[nextTier!]}
          </div>
        ) : (
          <div className="text-green-300">Max tier reached!</div>
        )}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-navy rotate-45" />
      </div>
    </Link>
  );
}
