import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Star, X } from 'lucide-react';
import type { Skill } from '@/types/skills';

type SpotlightSkill = Skill & { relevance?: number };

interface FeedSkillSpotlightCardProps {
  skill: SpotlightSkill;
  onDismiss?: (skillId: string) => void;
}

function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.trim().toUpperCase() || '?';
}

export default function FeedSkillSpotlightCard({
  skill,
  onDismiss,
}: FeedSkillSpotlightCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[rgba(196,135,58,0.12)] bg-white shadow-[0_8px_20px_rgba(27,42,74,0.05)] transition duration-300 md:rounded-[28px] md:shadow-[0_16px_38px_rgba(27,42,74,0.06)] md:hover:-translate-y-1 md:hover:shadow-[0_22px_50px_rgba(27,42,74,0.1)]">
      {onDismiss ? (
        <button
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDismiss(skill.id);
          }}
          className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/60 bg-white/90 text-[var(--color-text-muted)] opacity-100 transition hover:text-[var(--color-navy)] md:right-3 md:top-3 md:h-8 md:w-8 md:opacity-0 md:group-hover:opacity-100"
          aria-label="Hide skill"
        >
          <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </button>
      ) : null}

      <Link to={`/app/skill/${skill.slug}`} className="block">
        <div className={`relative h-28 overflow-hidden md:h-36 ${!skill.cover_image_url ? `bg-gradient-to-br ${skill.cover_gradient}` : 'bg-[#EBDCC9]'}`}>
          {skill.cover_image_url ? (
            <img src={skill.cover_image_url} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(18,30,51,0.45)] via-transparent to-transparent" />

          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 md:left-4 md:top-4 md:gap-2">
            {skill.relevance && skill.relevance > 0 ? (
              <span className="rounded-full bg-white/88 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--color-amber)] md:px-3 md:py-1 md:text-[10px]">
                For you
              </span>
            ) : null}
            <span className="rounded-full bg-[rgba(255,255,255,0.16)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white md:px-3 md:py-1 md:text-[10px]">
              {skill.category}
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 md:bottom-4 md:left-4 md:right-4 md:gap-3">
            <Avatar className="h-9 w-9 border-2 border-white/80 md:h-11 md:w-11">
              <AvatarImage src={skill.teacher.avatar} alt={`${skill.teacher.firstName} ${skill.teacher.lastName}`} />
              <AvatarFallback className="bg-[var(--color-amber)] text-xs font-semibold text-white md:text-sm">
                {initials(skill.teacher.firstName, skill.teacher.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-white md:text-sm">
                {skill.teacher.firstName} {skill.teacher.lastName}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-white/78 md:text-[11px]">
                <MapPin className="h-3 w-3" />
                {skill.teacher.city || skill.location || 'Morocco'}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-3.5 md:space-y-4 md:p-5">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-navy)] transition group-hover:text-[var(--color-amber)] md:text-base">
              {skill.title}
            </h3>
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-secondary)] md:mt-2 md:text-sm md:leading-6">
              {skill.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {skill.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[rgba(244,240,232,0.95)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-secondary)] md:px-2.5 md:py-1 md:text-[11px]"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3 md:pt-4">
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-navy)] md:text-sm">
              <Star className="h-3.5 w-3.5 fill-[var(--color-amber)] text-[var(--color-amber)] md:h-4 md:w-4" />
              <span className="font-semibold">{skill.avg_rating}</span>
              <span className="text-[var(--color-text-muted)]">({skill.reviews_count})</span>
            </div>
            <div className="text-xs font-semibold text-[var(--color-amber)] md:text-sm">
              {skill.is_free ? 'Free' : `${skill.price_per_hour} ${skill.currency}/hr`}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
