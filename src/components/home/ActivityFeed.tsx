import { Link } from 'react-router-dom';
import { Calendar, MessageSquare, Heart, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { ClubPost, ClubEvent } from '@/types/clubs';

interface FeedItem {
  id: string;
  type: 'post' | 'event';
  club_id: string;
  club_name: string;
  club_avatar_url: string | null;
  created_at: string;
  data: ClubPost | ClubEvent;
}

interface ActivityFeedProps {
  items: FeedItem[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="sc-card p-8 text-center">
        <MessageSquare className="w-8 h-8 mx-auto mb-3 text-[var(--color-text-muted)]" />
        <p className="text-sm text-[var(--color-text-secondary)]">
          No recent activity from your clubs.
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Join more clubs to see activity here.
        </p>
      </div>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-heading font-semibold text-navy mb-4">Activity</h2>
      <div className="space-y-3">
        {items.map((item) =>
          item.type === 'post' ? (
            <PostFeedCard key={item.id} item={item} post={item.data as ClubPost} />
          ) : (
            <EventFeedCard key={item.id} item={item} event={item.data as ClubEvent} />
          )
        )}
      </div>
    </section>
  );
}

function PostFeedCard({ item, post }: { item: FeedItem; post: ClubPost }) {
  return (
    <Link
      to={`/club/${item.club_id}/feed`}
      className="sc-card p-4 block hover:shadow-card-hover transition-shadow"
    >
      <div className="flex items-start gap-3">
        <Avatar className="w-9 h-9 flex-shrink-0">
          <AvatarImage src={post.author?.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs bg-navy text-white">
            {post.author?.first_name?.[0]}
            {post.author?.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-navy">
              {post.author?.first_name} {post.author?.last_name}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">in</span>
            <span className="text-xs font-medium text-amber-sc">{item.club_name}</span>
            <span className="text-xs text-[var(--color-text-muted)] ml-auto">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
            {post.content}
          </p>
          {post.image_url && (
            <img
              src={post.image_url}
              alt="Post attachment"
              className="mt-2 rounded-lg max-h-48 object-cover w-full"
            />
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              {post.reaction_count}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              {post.comment_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EventFeedCard({ item, event }: { item: FeedItem; event: ClubEvent }) {
  return (
    <Link
      to={`/club/${item.club_id}/events`}
      className="sc-card p-4 block hover:shadow-card-hover transition-shadow border-l-4 border-l-amber-sc"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-5 h-5 text-amber-sc" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-navy truncate">{event.title}</span>
            <span className="text-xs text-[var(--color-text-muted)]">in</span>
            <span className="text-xs font-medium text-amber-sc">{item.club_name}</span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {formatDistanceToNow(new Date(event.starts_at), { addSuffix: true })}
            {event.location ? ` · ${event.location}` : ''}
          </p>
          <div className="flex items-center gap-1 mt-1 text-xs text-[var(--color-text-muted)]">
            <Users className="w-3 h-3" />
            <span>{event.attendee_count} attending</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
