import { Link } from 'react-router-dom';
import { Check, ArrowRight, Camera, FileText, Phone, Shield, Calendar, Star, Users, Flame, Trophy } from 'lucide-react';
import { TRUST_TIERS, type TrustTierLevel } from '@/config/app';
import { TRUST_TIER_LABELS } from '@/contexts/AuthContext';
import { useTrustReport } from '@/hooks/useTrustReport';
import type { User } from '@/contexts/AuthContext';

interface Props {
  user: User;
  onActionClick?: (actionKey: string) => void;
}

const TIER_COLORS: Record<TrustTierLevel, { bar: string; text: string; badge: string; dot: string }> = {
  0: { bar: '#4C6EF5', text: '#4C6EF5', badge: '#EDF2FF', dot: '#4C6EF5' },
  1: { bar: '#1976D2', text: '#1976D2', badge: '#E3F2FD', dot: '#1976D2' },
  2: { bar: '#2D7A4F', text: '#2D7A4F', badge: '#E8F5EE', dot: '#2D7A4F' },
  3: { bar: '#C4873A', text: '#C4873A', badge: '#FFF3E0', dot: '#C4873A' },
  4: { bar: '#5C3D8F', text: '#5C3D8F', badge: '#EDE8F7', dot: '#5C3D8F' },
};

const COMPONENT_ICONS: Record<string, React.ReactNode> = {
  photo: <Camera className="w-3.5 h-3.5" />,
  bio: <FileText className="w-3.5 h-3.5" />,
  phone: <Phone className="w-3.5 h-3.5" />,
  id: <Shield className="w-3.5 h-3.5" />,
  sessions: <Calendar className="w-3.5 h-3.5" />,
  vouches: <Users className="w-3.5 h-3.5" />,
  streak: <Flame className="w-3.5 h-3.5" />,
};

export default function TrustProgress({ user }: Props) {
  const { data: report } = useTrustReport(user.id);
  const score = report?.score ?? user.trust_score ?? 0;
  const tier = (report?.tier ?? user.trust_tier ?? 0) as TrustTierLevel;
  const colors = TIER_COLORS[tier];
  const breakdown = report?.breakdown ?? [];
  const nextTier = report?.nextTier ?? (tier < 4 ? tier + 1 : null);
  const nextThreshold = report?.nextThreshold ?? null;
  const pointsToNext = report?.pointsToNext ?? 0;
  const fastestPath = report?.fastestPath ?? [];

  const progressToNext = nextThreshold !== null && nextThreshold > 0
    ? Math.min((score / nextThreshold) * 100, 100)
    : 100;

  return (
    <div className="space-y-4">
      {/* Main Trust Report Card */}
      <div className="sc-card p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-navy" style={{ fontSize: '1.05rem' }}>
            Trust Report
          </h3>
          <span
            className="text-xs font-semibold font-body px-2.5 py-1 rounded-full"
            style={{ background: colors.badge, color: colors.text }}
          >
            {TRUST_TIER_LABELS[tier]}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-end gap-2 mb-2">
          <span className="font-heading font-bold text-3xl leading-none" style={{ color: colors.text }}>
            {score}
          </span>
          <span className="font-body text-sm mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
            / 100 pts
          </span>
          {nextThreshold !== null && (
            <span className="font-body text-xs mb-0.5 ml-auto" style={{ color: 'var(--color-text-muted)' }}>
              {pointsToNext > 0
                ? `${pointsToNext} pts to ${TRUST_TIER_LABELS[nextTier as TrustTierLevel]}`
                : `${TRUST_TIER_LABELS[nextTier as TrustTierLevel]} unlocked`}
            </span>
          )}
        </div>

        {/* Progress bar to next tier */}
        <div className="h-2.5 rounded-full mb-5 overflow-hidden" style={{ background: 'var(--color-parchment-dark)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progressToNext}%`, background: colors.bar }}
          />
        </div>

        {/* Tier milestones */}
        <div className="flex justify-between mb-6 relative">
          <div className="absolute top-2 left-0 right-0 h-0.5" style={{ background: 'var(--color-parchment-dark)', zIndex: 0 }} />
          {([0, 1, 2, 3, 4] as TrustTierLevel[]).map((t) => {
            const reached = tier >= t;
            const tc = TIER_COLORS[t];
            const config = TRUST_TIERS[t];
            return (
              <div key={t} className="flex flex-col items-center gap-1 relative z-10">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center"
                  style={{ background: reached ? tc.dot : 'var(--color-parchment-dark)' }}
                  title={`${config.label}: ${config.minScore}+ pts`}
                >
                  {reached && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </div>
                <span
                  className="text-[9px] font-body font-semibold"
                  style={{ color: reached ? tc.text : 'var(--color-text-muted)' }}
                >
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Score Breakdown */}
        {breakdown.length > 0 && (
          <div className="space-y-3">
            <div
              className="text-[11px] font-semibold uppercase tracking-wider font-body"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Score Breakdown
            </div>
            {breakdown.map((item) => {
              const percent = item.maxPoints > 0 ? (item.points / item.maxPoints) * 100 : 0;
              const isComplete = item.points >= item.maxPoints;
              return (
                <div key={item.key} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                          isComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {COMPONENT_ICONS[item.key] ?? <Star className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-body font-medium text-[var(--color-navy)]">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-body font-semibold ${isComplete ? 'text-emerald-600' : 'text-[var(--color-text-secondary)]'}`}>
                        +{item.points}
                      </span>
                      <span className="text-[10px] font-body text-[var(--color-text-muted)]">
                        / {item.maxPoints}
                      </span>
                      {isComplete && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-parchment-dark)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        background: isComplete ? '#2D7A4F' : colors.bar,
                      }}
                    />
                  </div>
                  {item.action && !isComplete && (
                    <Link
                      to={item.action.path}
                      className="flex items-center gap-1 mt-1 text-[10px] font-body text-[var(--color-amber)] hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {item.action.label}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fastest Path to Next Tier */}
      {pointsToNext > 0 && fastestPath.length > 0 && (
        <div className="sc-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4" style={{ color: 'var(--color-amber)' }} />
            <h3 className="font-heading text-navy" style={{ fontSize: '1.05rem' }}>
              Fastest path to {TRUST_TIER_LABELS[nextTier as TrustTierLevel]}
            </h3>
          </div>
          <p className="text-xs font-body text-[var(--color-text-muted)] mb-3">
            You need {pointsToNext} more point{pointsToNext !== 1 ? 's' : ''}. Here is the quickest way:
          </p>
          <div className="space-y-2">
            {fastestPath.map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--color-amber)] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <span className="text-xs font-body text-[var(--color-navy)]">
                    {step.action}
                  </span>
                  <span className="text-[10px] font-body text-[var(--color-text-muted)] ml-1">
                    ({step.label})
                  </span>
                </div>
                <span className="text-xs font-body font-semibold text-emerald-600">
                  +{step.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fully Complete State */}
      {pointsToNext === 0 && tier === 4 && (
        <div className="sc-card p-5 text-center">
          <div className="text-3xl mb-2">🏆</div>
          <div className="font-body text-sm font-semibold" style={{ color: 'var(--color-forest)' }}>
            Maximum trust reached!
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            You are a {TRUST_TIER_LABELS[4]} with {score} trust points. Keep mentoring others.
          </p>
        </div>
      )}
    </div>
  );
}
