import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ProfileTagTone = 'amber' | 'plum' | 'slate' | 'forest';

const TONE_STYLES: Record<ProfileTagTone, string> = {
  amber: 'border-amber-200/80 bg-amber-50 text-amber-700',
  plum: 'border-violet-200/80 bg-violet-50 text-violet-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
  forest: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
};

interface ProfileTagGroupProps {
  label: string;
  items: string[];
  icon?: ReactNode;
  emptyLabel?: string;
  tone?: ProfileTagTone;
  className?: string;
}

export default function ProfileTagGroup({
  label,
  items,
  icon,
  emptyLabel = 'Nothing added yet',
  tone = 'amber',
  className,
}: ProfileTagGroupProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
        {icon}
        <span>{label}</span>
      </div>

      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium',
                TONE_STYLES[tone]
              )}
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm italic text-[var(--color-text-muted)]">{emptyLabel}</p>
      )}
    </div>
  );
}
