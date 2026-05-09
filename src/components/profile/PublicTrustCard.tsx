import { Shield, Star, Check, X } from 'lucide-react';
import { TRUST_TIERS, type TrustTierLevel } from '@/config/app';
import { TRUST_TIER_LABELS } from '@/contexts/AuthContext';
import { useTrustReport } from '@/hooks/useTrustReport';

interface Props {
  userId: string;
  sessionsCompleted: number;
  reviewsCount: number;
  trustScore: number;
  trustTier: number;
  idVerified: boolean;
}

export default function PublicTrustCard({
  userId,
  sessionsCompleted,
  reviewsCount,
  trustScore,
  trustTier,
  idVerified,
}: Props) {
  const { data: report } = useTrustReport(userId);
  const tier = trustTier as TrustTierLevel;
  const tierConfig = TRUST_TIERS[tier];
  const breakdown = report?.breakdown ?? [];

  const phoneDone = breakdown.find((b) => b.key === 'phone')?.points ?? 0;
  const idDone = idVerified;
  const photoDone = breakdown.find((b) => b.key === 'photo')?.points ?? 0;

  const verifications = [
    { label: 'Photo', done: photoDone > 0 },
    { label: 'Phone', done: phoneDone > 0 },
    { label: 'Government ID', done: idDone },
  ];

  return (
    <div className="sc-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-navy" style={{ fontSize: '1.05rem' }}>
          Trust Summary
        </h3>
        <span
          className="text-xs font-semibold font-body px-2.5 py-1 rounded-full"
          style={{ background: tierConfig.bg, color: tierConfig.text }}
        >
          {TRUST_TIER_LABELS[tier]}
        </span>
      </div>

      {/* Score */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: tierConfig.bg }}
        >
          <Star className="w-6 h-6" style={{ color: tierConfig.text, fill: tierConfig.text, opacity: 0.3 }} />
          <span
            className="absolute font-heading font-bold text-lg"
            style={{ color: tierConfig.text }}
          >
            {trustScore}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-body text-[var(--color-text-muted)]">
              Trust score
            </span>
            <span className="text-xs font-body font-semibold text-[var(--color-navy)]">
              {trustScore} / 100
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-parchment-dark)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${trustScore}%`, background: tierConfig.text }}
            />
          </div>
        </div>
      </div>

      {/* Verification badges */}
      <div className="flex gap-2 flex-wrap mb-4">
        {verifications.map((v) => (
          <div
            key={v.label}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-body font-medium ${
              v.done
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            {v.done ? (
              <Check className="w-3 h-3" />
            ) : (
              <X className="w-3 h-3 opacity-50" />
            )}
            {v.label}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[var(--color-border)]">
        <div className="text-center">
          <div className="font-bold font-heading text-lg text-navy">{sessionsCompleted}</div>
          <div className="text-[10px] font-body text-[var(--color-text-muted)]">Sessions</div>
        </div>
        <div className="text-center">
          <div className="font-bold font-heading text-lg text-navy">{reviewsCount}</div>
          <div className="text-[10px] font-body text-[var(--color-text-muted)]">Reviews</div>
        </div>
        <div className="text-center">
          <div className="font-bold font-heading text-lg text-navy">
            {breakdown.find((b) => b.key === 'vouches')?.current ?? 0}
          </div>
          <div className="text-[10px] font-body text-[var(--color-text-muted)]">Vouches</div>
        </div>
      </div>

      {idVerified && (
        <div className="mt-4 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[11px] font-body font-semibold text-emerald-700">
            Government ID verified
          </span>
        </div>
      )}
    </div>
  );
}
