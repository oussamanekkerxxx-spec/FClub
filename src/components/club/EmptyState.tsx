import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="sc-card p-10 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: 'var(--color-bg-secondary)' }}>
          {icon}
        </div>
      )}
      <p className="font-semibold text-navy text-sm mb-1">{title}</p>
      {subtitle && (
        <p className="text-xs text-[var(--color-text-secondary)]">{subtitle}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}