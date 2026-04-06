import { Lock, Users } from 'lucide-react';

export default function MemberGate({ isPrivate }: { isPrivate: boolean }) {
  return (
    <div className="sc-card p-10 text-center">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#F4F0E8' }}>
        {isPrivate
          ? <Lock className="w-6 h-6 text-[var(--color-text-muted)]" />
          : <Users className="w-6 h-6 text-[var(--color-text-muted)]" />}
      </div>
      <p className="font-semibold text-navy text-sm mb-1">Members only</p>
      <p className="text-xs text-[var(--color-text-secondary)]">
        {isPrivate ? 'Request to join to access this content.' : 'Join the club to access this content.'}
      </p>
    </div>
  );
}
