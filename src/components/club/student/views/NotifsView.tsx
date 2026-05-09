import { isToday } from 'date-fns';
import { useStudentClubNotifications } from '@/hooks/useStudentClubNotifications';
import { Users } from 'lucide-react';
import EmptyState from '@/components/club/EmptyState';
import SkeletonCard from '@/components/club/SkeletonCard';

import { SectionLabel, FeedItem } from './StudentViewShared';


export function NotifsView({
  clubId,
  isMember,
  canModerate,
}: {
  clubId: string;
  isMember: boolean;
  canModerate: boolean;
}) {
  const { items, loading } = useStudentClubNotifications({
    clubId,
    enabled: isMember,
    canModerate,
  });

  if (!isMember) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Users className="w-6 h-6 text-[var(--color-text-muted)]" />}
          title="Join the club to see notifications"
          subtitle="Mentions, reminders, and club updates appear here for members."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonCard count={4} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Users className="w-6 h-6 text-[var(--color-text-muted)]" />}
          title="No notifications yet"
          subtitle="Mentions, event reminders, and admin requests will show up here."
        />
      </div>
    );
  }

  const todayItems = items.filter((item) => isToday(new Date(item.createdAt)));
  const earlierItems = items.filter((item) => !isToday(new Date(item.createdAt)));

  return (
    <div className="p-6">
      {todayItems.length > 0 ? (
        <>
          <SectionLabel>Today</SectionLabel>
          {todayItems.map((item) => (
            <FeedItem
              key={item.id}
              icon={item.icon}
              iconBg={item.iconBg}
              title={item.title}
              desc={item.description}
              tag={item.tag}
              tagColor={item.tagColor}
            />
          ))}
        </>
      ) : null}

      {earlierItems.length > 0 ? (
        <>
          <div className={todayItems.length > 0 ? 'mt-8' : ''}>
            <SectionLabel>Earlier</SectionLabel>
          </div>
          {earlierItems.map((item) => (
            <FeedItem
              key={item.id}
              icon={item.icon}
              iconBg={item.iconBg}
              title={item.title}
              desc={item.description}
              tag={item.tag}
              tagColor={item.tagColor}
            />
          ))}
        </>
      ) : null}
    </div>
  );
}
