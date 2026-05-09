import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import type { Club } from '@/types/clubs';

interface MyClubsStripProps {
  clubs: Club[];
}

export function MyClubsStrip({ clubs }: MyClubsStripProps) {
  if (clubs.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-heading font-semibold text-navy">My Clubs</h2>
        <Link
          to="/app/clubs"
          className="text-sm font-medium text-amber-sc hover:text-amber-600 transition-colors"
        >
          See all
        </Link>
      </div>

      {/* Mobile: horizontal scroll with story-style avatars */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 lg:hidden scrollbar-hide">
        {clubs.map((club) => (
          <Link
            key={club.id}
            to={`/club/${club.slug || club.id}/feed`}
            className="flex flex-col items-center gap-2 flex-shrink-0 w-16"
          >
            <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-amber-sc/30 ring-offset-2 ring-offset-parchment">
              {club.avatar_url ? (
                <img
                  src={club.avatar_url}
                  alt={club.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: club.cover_gradient || 'var(--color-navy)' }}
                >
                  {club.name[0]}
                </div>
              )}
            </div>
            <span className="text-[11px] font-medium text-navy text-center leading-tight line-clamp-2">
              {club.name}
            </span>
          </Link>
        ))}
      </div>

      {/* Desktop: grid cards */}
      <div className="hidden lg:grid grid-cols-2 xl:grid-cols-3 gap-4">
        {clubs.slice(0, 6).map((club) => (
          <Link
            key={club.id}
            to={`/club/${club.slug || club.id}/feed`}
            className="sc-card p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow"
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
              {club.avatar_url ? (
                <img
                  src={club.avatar_url}
                  alt={club.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white font-bold"
                  style={{ background: club.cover_gradient || 'var(--color-navy)' }}
                >
                  {club.name[0]}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-navy truncate">{club.name}</h3>
              <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] mt-0.5">
                <Users className="w-3 h-3" />
                <span>{club.member_count} members</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
