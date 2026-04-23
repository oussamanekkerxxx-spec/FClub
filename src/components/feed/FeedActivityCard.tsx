import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { FeedEvent } from '@/hooks/useFeedData';

interface FeedActivityCardProps {
  event: FeedEvent;
}

function initials(firstName?: string | null, lastName?: string | null) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.trim().toUpperCase() || '?';
}

export default function FeedActivityCard({ event }: FeedActivityCardProps) {
  const personName = `${event.profiles?.first_name ?? 'Community'} ${event.profiles?.last_name ?? ''}`.trim();
  const skillLink = event.skills?.slug ? `/app/skill/${event.skills.slug}` : '/app/browse';

  return (
    <article className="rounded-[28px] border border-[rgba(196,135,58,0.12)] bg-white p-5 shadow-[0_16px_38px_rgba(27,42,74,0.06)]">
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 border-2 border-[rgba(244,240,232,0.92)]">
          <AvatarImage src={event.profiles?.avatar_url ?? undefined} alt={personName} />
          <AvatarFallback className="bg-[var(--color-plum)] text-sm font-semibold text-white">
            {initials(event.profiles?.first_name, event.profiles?.last_name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[var(--color-navy)]">{personName}</span>
            <span className="rounded-full bg-[rgba(232,136,99,0.12)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B85A3B]">
              {event.skills?.slug ? 'Skill update' : 'Community pulse'}
            </span>
          </div>
          <div className="mt-1 text-xs text-[var(--color-text-muted)]">
            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-[rgba(196,135,58,0.1)] bg-[linear-gradient(180deg,#FFF9F3_0%,#FFF5EA_100%)] p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-base font-semibold leading-6 text-[var(--color-navy)]">
              {event.title}
            </h3>
            {event.subtitle ? (
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                {event.subtitle}
              </p>
            ) : null}
          </div>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[rgba(196,135,58,0.12)] text-[var(--color-amber)]">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
        </div>

        <Link
          to={skillLink}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-amber)]"
        >
          {event.skills?.slug ? 'View skill' : 'Browse more'}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
