import { Link } from 'react-router-dom';
import { Users, MapPin, Plus } from 'lucide-react';
import type { Club } from '@/types/clubs';

interface SuggestedClubsProps {
  clubs: Club[];
}

export function SuggestedClubs({ clubs }: SuggestedClubsProps) {
  if (clubs.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-heading font-semibold text-navy mb-4">Suggested for You</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clubs.map((club) => (
          <div
            key={club.id}
            className="sc-card overflow-hidden hover:shadow-card-hover transition-shadow"
          >
            <div className="h-24 relative overflow-hidden">
              {club.cover_image_url ? (
                <img
                  src={club.cover_image_url}
                  alt={club.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: club.cover_gradient || 'var(--color-navy)' }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-sm text-navy truncate">{club.name}</h3>
              <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mt-1 mb-3">
                {club.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {club.member_count}
                  </span>
                  {club.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {club.city}
                    </span>
                  )}
                </div>
                <Link
                  to={`/club/${club.slug || club.id}/feed`}
                  className="p-1.5 rounded-lg bg-amber-sc/10 text-amber-sc hover:bg-amber-sc hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
