/**
 * ClubJoinButton
 *
 * Renders the correct button for every combination of auth + membership state.
 *
 * State machine:
 *   visitor     → "Join Club"       → onClick: navigate('/signup')
 *   not-member  → "Join Club"       → onClick: immediate join (public)
 *   not-member  → "Request to Join" → onClick: submit request (private)
 *   pending     → "Pending…"        → disabled + cancel option
 *   active      → "Joined ✓"        → leave option in dropdown
 *   moderator   → "Moderator"       → role badge
 *   admin       → "Admin"           → role badge
 */
import { useState } from 'react';
import { Loader2, Check, Clock, Crown, Shield, Plus, ChevronDown, Lock, Globe } from 'lucide-react';
import type { JoinState } from '@/hooks/useClubActions';

interface ClubJoinButtonProps {
  joinState: JoinState;
  isPrivate: boolean;
  clubId: string;
  onJoin: () => Promise<void>;
  onLeave: () => Promise<void>;
  onCancelRequest: (clubId: string) => Promise<void>;
  /** compact mode for cards / lists */
  size?: 'sm' | 'md';
}

export default function ClubJoinButton({
  joinState,
  isPrivate,
  clubId,
  onJoin,
  onLeave,
  onCancelRequest,
  size = 'md',
}: ClubJoinButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showLeaveMenu, setShowLeaveMenu] = useState(false);

  const isSm = size === 'sm';
  const px   = isSm ? 'px-3 py-1.5' : 'px-5 py-2';
  const text = isSm ? 'text-xs' : 'text-sm';

  const wrap = async (fn: () => Promise<void>) => {
    setLoading(true);
    await fn();
    setLoading(false);
  };

  // ── visitor ────────────────────────────────────────────────
  if (joinState === 'visitor') {
    return (
      <button
        onClick={() => wrap(onJoin)}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 ${px} ${text} font-semibold rounded-xl text-white transition-all hover:scale-105 disabled:opacity-60`}
        style={{ background: 'linear-gradient(135deg, #C4873A 0%, #E16B3B 100%)' }}
      >
        {loading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : isPrivate
            ? <><Lock className="w-3.5 h-3.5" /> Request to Join</>
            : <><Plus className="w-3.5 h-3.5" /> Join Club</>
        }
      </button>
    );
  }

  // ── not-member ─────────────────────────────────────────────
  if (joinState === 'not-member') {
    return (
      <button
        onClick={() => wrap(onJoin)}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 ${px} ${text} font-semibold rounded-xl text-white transition-all hover:scale-105 disabled:opacity-60`}
        style={{ background: 'linear-gradient(135deg, #C4873A 0%, #E16B3B 100%)' }}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isPrivate ? (
          <><Lock className="w-3.5 h-3.5" /> Request to Join</>
        ) : (
          <><Globe className="w-3.5 h-3.5" /> Join Club</>
        )}
      </button>
    );
  }

  // ── pending ─────────────────────────────────────────────────
  if (joinState === 'pending') {
    return (
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 ${px} ${text} font-semibold rounded-xl border-2`}
          style={{
            borderColor: 'var(--color-amber)',
            color: 'var(--color-amber)',
            background: '#FFF8EE',
          }}
        >
          <Clock className="w-3.5 h-3.5" />
          Pending…
        </span>
        <button
          onClick={() => wrap(() => onCancelRequest(clubId))}
          disabled={loading}
          className={`${text} font-medium text-[var(--color-text-muted)] hover:text-red-500 transition-colors`}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Cancel'}
        </button>
      </div>
    );
  }

  // ── active ────────────────────────────────────────────────
  if (joinState === 'active') {
    return (
      <div className="relative">
        <button
          onClick={() => setShowLeaveMenu(v => !v)}
          className={`inline-flex items-center gap-1.5 ${px} ${text} font-semibold rounded-xl border border-[rgba(196,135,58,0.2)] bg-white/85 text-[var(--color-navy)] hover:border-[rgba(196,135,58,0.35)] hover:bg-white transition-colors shadow-sm`}
        >
          <Check className="w-3.5 h-3.5" />
          Joined
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
        {showLeaveMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowLeaveMenu(false)} />
            <div
              className="absolute right-0 top-full mt-1.5 z-20 bg-white rounded-xl shadow-floating border border-[var(--color-border)] overflow-hidden"
              style={{ minWidth: '140px' }}
            >
              <button
                onClick={() => { setShowLeaveMenu(false); wrap(onLeave); }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
              >
                Leave club
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── moderator ─────────────────────────────────────────────
  if (joinState === 'moderator') {
    return (
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 ${px} ${text} font-semibold rounded-xl border border-[rgba(92,61,143,0.18)] bg-[rgba(92,61,143,0.08)] text-[var(--color-plum)]`}
        >
          <Shield className="w-3.5 h-3.5" />
          Moderator
        </span>
        {/* Leave still available */}
        <button
          onClick={() => wrap(onLeave)}
          disabled={loading}
          className={`${text} text-[var(--color-text-muted)] hover:text-red-500 transition-colors`}
          title="Leave club"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : '✕'}
        </button>
      </div>
    );
  }

  // ── admin ─────────────────────────────────────────────────
  if (joinState === 'admin') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${px} ${text} font-semibold rounded-xl border`}
        style={{
          borderColor: 'rgba(196,135,58,0.28)',
          background: 'rgba(196,135,58,0.12)',
          color: 'var(--color-amber)',
        }}
      >
        <Crown className="w-3.5 h-3.5" style={{ color: 'var(--color-amber)' }} />
        <span style={{ color: 'var(--color-amber)' }}>Admin</span>
      </span>
    );
  }

  return null;
}
