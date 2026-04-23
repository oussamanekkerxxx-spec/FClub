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
    <div className="group relative overflow-hidden rounded-[28px] border border-[rgba(196,135,58,0.12)] bg-white shadow-[0_16px_38px_rgba(27,42,74,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(27,42,74,0.1)]">
      {onDismiss ? (
        <button
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDismiss(skill.id);
          }}
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-white/90 text-[var(--color-text-muted)] opacity-0 transition hover:text-[var(--color-navy)] group-hover:opacity-100"
          aria-label="Hide skill"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      <Link to={`/app/skill/${skill.slug}`} className="block">
        <div className={`relative h-36 overflow-hidden ${!skill.cover_image_url ? `bg-gradient-to-br ${skill.cover_gradient}` : 'bg-[#EBDCC9]'}`}>
          {skill.cover_image_url ? (
            <img src={skill.cover_image_url} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(18,30,51,0.45)] via-transparent to-transparent" />

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {skill.relevance && skill.relevance > 0 ? (
              <span className="rounded-full bg-white/88 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-amber)]">
                For you
              </span>
            ) : null}
            <span className="rounded-full bg-[rgba(255,255,255,0.16)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
              {skill.category}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
            <Avatar className="h-11 w-11 border-2 border-white/80">
              <AvatarImage src={skill.teacher.avatar} alt={`${skill.teacher.firstName} ${skill.teacher.lastName}`} />
              <AvatarFallback className="bg-[var(--color-amber)] text-sm font-semibold text-white">
                {initials(skill.teacher.firstName, skill.teacher.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">
                {skill.teacher.firstName} {skill.teacher.lastName}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-white/78">
                <MapPin className="h-3 w-3" />
                {skill.teacher.city || skill.location || 'Morocco'}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-navy)] transition group-hover:text-[var(--color-amber)]">
              {skill.title}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              {skill.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {skill.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[rgba(244,240,232,0.95)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-secondary)]"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
            <div className="flex items-center gap-1.5 text-sm text-[var(--color-navy)]">
              <Star className="h-4 w-4 fill-[var(--color-amber)] text-[var(--color-amber)]" />
              <span className="font-semibold">{skill.avg_rating}</span>
              <span className="text-[var(--color-text-muted)]">({skill.reviews_count})</span>
            </div>
            <div className="text-sm font-semibold text-[var(--color-amber)]">
              {skill.is_free ? 'Free' : `${skill.price_per_hour} ${skill.currency}/hr`}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
