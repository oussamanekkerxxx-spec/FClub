import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Globe, Lock, MapPin, Users } from 'lucide-react';
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_GRADIENTS } from '@/constants/categories';
import type { Club } from '@/types/fightclub';

interface ClubDirectoryCardProps {
  club: Club;
  isMember: boolean;
}

const ClubDirectoryCard = memo(function ClubDirectoryCard({
  club,
  isMember,
}: ClubDirectoryCardProps) {
  const category = CATEGORIES.find((item) => item.id === club.category);
  const gradient = club.cover_gradient ?? CATEGORY_GRADIENTS[club.category] ?? 'from-amber-200 via-orange-200 to-rose-200';
  const colors = CATEGORY_COLORS[club.category] ?? { bg: '#F3F4F6', text: '#1F2937' };

  return (
    <Link
      to={`/club/${club.slug ?? club.id}`}
      className="group relative block overflow-hidden rounded-[20px] md:rounded-[26px] border border-[rgba(196,135,58,0.14)] bg-white transition duration-300 hover:-translate-y-1 hover:border-[rgba(196,135,58,0.28)] hover:shadow-[0_22px_60px_rgba(196,135,58,0.14)]"
    >
      <div className={`relative h-24 md:h-32 bg-gradient-to-br ${gradient}`}>
        {club.cover_image_url ? (
          <img
            src={club.cover_image_url}
            alt={`${club.name} cover`}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(255,249,243,0.95)] via-[rgba(255,249,243,0.35)] to-transparent" />

        <div className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-navy)] backdrop-blur-sm">
          {category?.label ?? club.category}
        </div>

        <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/75 px-2.5 py-1 text-[10px] font-semibold text-[var(--color-text-secondary)] backdrop-blur-sm">
          {club.is_private ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
          {club.is_private ? 'Private' : 'Public'}
        </div>
      </div>

      <div className="relative px-3 pb-3 pt-4 md:px-4 md:pb-4 md:pt-6">
        <div
          className="absolute -top-5 md:-top-6 left-3 md:left-4 flex h-10 w-10 md:h-14 md:w-14 items-center justify-center overflow-hidden rounded-xl md:rounded-2xl border-[2px] md:border-[3px] border-white text-lg md:text-xl shadow-lg"
          style={{ background: colors.bg, color: colors.text }}
        >
          {club.avatar_url ? (
            <img src={club.avatar_url} alt={`${club.name} avatar`} className="h-full w-full object-cover" />
          ) : (
            <span>{category?.emoji ?? 'SC'}</span>
          )}
        </div>

        <div className="space-y-3 pt-2">
            <h3 className="truncate text-sm md:text-base font-semibold text-[var(--color-navy)] transition group-hover:text-[var(--color-amber)]">
              {club.name}
            </h3>
            {club.description ? (
              <p className="mt-1 md:mt-2 line-clamp-2 text-[12px] md:text-sm leading-5 md:leading-6 text-[var(--color-text-secondary)]">
                {club.description}
              </p>
            ) : (
              <p className="mt-1 md:mt-2 text-[12px] md:text-sm leading-5 md:leading-6 text-[var(--color-text-muted)]">
                Community space for people who share this club's interests.
              </p>
            )}

          {club.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {club.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[rgba(196,135,58,0.14)] bg-[rgba(244,240,232,0.9)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-secondary)]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-between border-t border-[rgba(196,135,58,0.1)] pt-3 md:pt-4">
            <div className="space-y-1 text-xs text-[var(--color-text-muted)]">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-[#f6c27f]" />
                <span>{club.member_count} members</span>
              </div>
              {club.city ? (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#f6c27f]" />
                  <span>{club.city}</span>
                </div>
              ) : null}
            </div>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
                isMember
                  ? 'border border-[rgba(196,135,58,0.14)] bg-[rgba(244,240,232,0.85)] text-[var(--color-text-secondary)]'
                  : 'bg-[linear-gradient(135deg,#C4873A_0%,#E16B3B_100%)] text-white shadow-[0_6px_18px_rgba(225,107,59,0.28)]'
              }`}
            >
              {isMember ? 'Joined' : 'Explore'}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
});

export default ClubDirectoryCard;
