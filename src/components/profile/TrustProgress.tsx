import { Check, ChevronRight } from 'lucide-react';
import { TRUST_TIER_LABELS, type TrustTier, type User } from '@/contexts/AuthContext';

type ActionKey = 'photo' | 'bio' | 'phone' | 'id' | 'skill' | 'session' | 'review';

interface Props {
  user: User;
  onActionClick?: (key: ActionKey) => void;
}

interface Action {
  label: string;
  points: number;
  done: boolean;
  actionKey: ActionKey;
}

const TIER_THRESHOLDS: Record<TrustTier, number> = {
  0: 0,
  1: 20,
  2: 40,
  3: 65,
  4: 85,
};

const TIER_COLORS: Record<TrustTier, { bar: string; text: string; badge: string }> = {
  0: { bar: '#4C6EF5', text: '#4C6EF5', badge: '#EDF2FF' },
  1: { bar: '#1976D2', text: '#1976D2', badge: '#E3F2FD' },
  2: { bar: '#2D7A4F', text: '#2D7A4F', badge: '#E8F5EE' },
  3: { bar: '#C4873A', text: '#C4873A', badge: '#FFF3E0' },
  4: { bar: '#5C3D8F', text: '#5C3D8F', badge: '#EDE8F7' },
};

function computeScore(user: User): number {
  let score = 0;
  if (user.avatar) score += 10;
  if (user.phone) score += 10;
  if (user.id_verified) score += 20;
  if (user.bio) score += 5;
  if (user.what_i_teach.length > 0) score += 10;
  if (user.sessions_completed > 0) score += 15;
  score += Math.min(user.reviews_count * 10, 30);
  return Math.min(score, 100);
}

export default function TrustProgress({ user, onActionClick }: Props) {
  const score = computeScore(user);
  const tier = user.trust_tier;
  const colors = TIER_COLORS[tier];
  const nextTier = (tier < 4 ? tier + 1 : null) as TrustTier | null;
  const nextThreshold = nextTier !== null ? TIER_THRESHOLDS[nextTier] : null;

  const actions: Action[] = [
    { label: 'Upload a profile photo', points: 10, done: !!user.avatar, actionKey: 'photo' },
    { label: 'Add your bio', points: 5, done: !!user.bio, actionKey: 'bio' },
    { label: 'Add your phone number', points: 10, done: !!user.phone, actionKey: 'phone' },
    { label: 'Submit your government ID', points: 20, done: user.id_verified, actionKey: 'id' },
    { label: 'List your first skill', points: 10, done: user.what_i_teach.length > 0, actionKey: 'skill' },
    { label: 'Complete your first session', points: 15, done: user.sessions_completed > 0, actionKey: 'session' },
    { label: 'Receive your first review', points: 10, done: user.reviews_count > 0, actionKey: 'review' },
  ];

  const pending = actions.filter(a => !a.done);

  return (
    <div className="sc-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-navy" style={{ fontSize: '1.05rem' }}>Trust Progress</h3>
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
        <span className="font-body text-sm mb-0.5" style={{ color: 'var(--color-text-muted)' }}>/ 100 pts</span>
        {nextThreshold !== null && (
          <span className="font-body text-xs mb-0.5 ml-auto" style={{ color: 'var(--color-text-muted)' }}>
            {nextThreshold - score > 0 ? `${nextThreshold - score} pts to ${TRUST_TIER_LABELS[nextTier!]}` : `${TRUST_TIER_LABELS[nextTier!]} unlocked`}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full mb-5 overflow-hidden" style={{ background: 'var(--color-parchment-dark)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: colors.bar }}
        />
      </div>

      {/* Tier milestones */}
      <div className="flex justify-between mb-5 relative">
        <div className="absolute top-2 left-0 right-0 h-0.5" style={{ background: 'var(--color-parchment-dark)', zIndex: 0 }} />
        {([0, 1, 2, 3, 4] as TrustTier[]).map(t => {
          const reached = tier >= t;
          const tc = TIER_COLORS[t];
          return (
            <div key={t} className="flex flex-col items-center gap-1 relative z-10">
              <div
                className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center"
                style={{ background: reached ? tc.bar : 'var(--color-parchment-dark)' }}
              >
                {reached && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
              </div>
              <span className="text-[9px] font-body font-semibold" style={{ color: reached ? tc.text : 'var(--color-text-muted)' }}>
                {TRUST_TIER_LABELS[t]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Action checklist */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider font-body mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Earn more points
          </div>
          {pending.slice(0, 4).map(action => {
            const isClickable = !!onActionClick && action.actionKey !== 'review';
            const Inner = (
              <>
                <div className="w-4 h-4 rounded-full border-2 flex-shrink-0" style={{ borderColor: 'var(--color-border)' }} />
                <span className="text-xs font-body flex-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {action.label}
                </span>
                <span className="text-[10px] font-bold font-body" style={{ color: colors.text }}>
                  +{action.points}
                </span>
                {isClickable && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />}
              </>
            );
            return isClickable ? (
              <button
                key={action.label}
                onClick={() => onActionClick(action.actionKey)}
                className="flex w-full items-center gap-2.5 -mx-1 px-1 py-0.5 rounded-lg transition-colors hover:bg-[var(--color-parchment)] text-left"
              >
                {Inner}
              </button>
            ) : (
              <div key={action.label} className="flex items-center gap-2.5">
                {Inner}
              </div>
            );
          })}
        </div>
      )}

      {pending.length === 0 && (
        <div className="text-center py-2">
          <div className="text-xl mb-1">🏆</div>
          <div className="font-body text-xs font-semibold" style={{ color: 'var(--color-forest)' }}>
            Profile fully complete!
          </div>
        </div>
      )}
    </div>
  );
}
