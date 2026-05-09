import { useAuth } from '@/contexts/AuthContext';
import { useMyClubs } from '@/hooks/useMyClubs';
import { useHomeFeed } from '@/hooks/useHomeFeed';
import { useSuggestedClubs } from '@/hooks/useSuggestedClubs';
import { MyClubsStrip, ActivityFeed, SuggestedClubs } from '@/components/home';
import { CardSkeletonGrid } from '@/components/ui/card-skeleton';
import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useT } from '@/lib/t';

export default function Home() {
  const { user } = useAuth();
  const { t } = useT();
  const userId = user?.id;
  const interests = user?.what_i_learn ?? [];
  const city = user?.city;

  const { data: myClubs = [], isLoading: clubsLoading } = useMyClubs(userId);
  const clubIds = myClubs.map((c) => c.id);

  const { data: feedItems = [], isLoading: feedLoading } = useHomeFeed(userId, clubIds);
  const { data: suggested = [], isLoading: suggestedLoading } = useSuggestedClubs({
    userId,
    interests,
    city,
    excludeIds: clubIds,
  });

  const hasJoinedClubs = myClubs.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-navy">
            {t('Welcome back')}, {user?.firstName ?? t('Fighter')}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {t("Here's what's happening in your communities.")}
          </p>
        </div>
      </div>

      {/* My Clubs */}
      {clubsLoading ? (
        <CardSkeletonGrid count={3} variant="club" />
      ) : hasJoinedClubs ? (
        <MyClubsStrip clubs={myClubs} />
      ) : (
        <div className="sc-card p-8 text-center">
          <Compass className="w-10 h-10 mx-auto mb-3 text-amber-sc" />
          <h3 className="font-semibold text-navy mb-1">{t("You haven't joined any clubs yet")}</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            {t('Discover communities that match your interests and start connecting.')}
          </p>
          <Link
            to="/app/clubs"
            className="btn-amber inline-flex items-center gap-2 text-sm"
          >
            {t('Explore Clubs')}
          </Link>
        </div>
      )}

      {/* Activity Feed */}
      {feedLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="sc-card p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-2 bg-gray-100 rounded w-full" />
                  <div className="h-2 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ActivityFeed items={feedItems} />
      )}

      {/* Suggested Clubs */}
      {suggestedLoading ? (
        <CardSkeletonGrid count={3} variant="club" />
      ) : (
        <SuggestedClubs clubs={suggested} />
      )}
    </div>
  );
}
