/** Reusable skeleton for card-grid loading states */

interface CardSkeletonGridProps {
  count?: number;
  variant?: 'club' | 'skill' | 'member';
}

function ClubCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[var(--color-border)]">
      <div className="h-28 shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-3 shimmer rounded w-3/4" />
        <div className="h-2 shimmer rounded w-full" />
        <div className="h-2 shimmer rounded w-full" />
      </div>
    </div>
  );
}

function SkillCardSkeleton() {
  return (
    <div className="skill-card bg-white rounded-xl overflow-hidden">
      <div className="h-28 shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-4 shimmer rounded w-3/4" />
        <div className="h-3 shimmer rounded w-full" />
        <div className="h-3 shimmer rounded w-full" />
        <div className="flex justify-between pt-2">
          <div className="h-4 shimmer rounded w-1/4" />
          <div className="h-4 shimmer rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

function MemberCardSkeleton() {
  return (
    <div className="sc-card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full shimmer flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 shimmer rounded w-2/3" />
        <div className="h-2 shimmer rounded w-1/3" />
      </div>
    </div>
  );
}

export function CardSkeletonGrid({ count = 6, variant = 'club' }: CardSkeletonGridProps) {
  const SkeletonComponent =
    variant === 'skill' ? SkillCardSkeleton :
    variant === 'member' ? MemberCardSkeleton :
    ClubCardSkeleton;

  const gridClass =
    variant === 'member'
      ? 'grid sm:grid-cols-2 gap-3'
      : 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4';

  return (
    <div className={gridClass}>
      {[...Array(count)].map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}
