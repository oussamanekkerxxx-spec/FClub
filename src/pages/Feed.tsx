import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useT } from '@/lib/t';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CreateClubModal from '@/components/club/CreateClubModal';
import FeedActivityCard from '@/components/feed/FeedActivityCard';
import FeedSkillSpotlightCard from '@/components/feed/FeedSkillSpotlightCard';
import FeedStoryStrip from '@/components/feed/FeedStoryStrip';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { useFeedData } from '@/hooks/useFeedData';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import type { Club } from '@/types/fightclub';
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Compass,
  Flame,
  Globe,
  MapPin,
  Plus,
  Search,
  Users,
} from 'lucide-react';

type FeedTab = 'for-you' | 'activity' | 'skills';

function buildTopics(skills: ReturnType<typeof useFeedData>['skills']) {
  const counts = new Map<string, number>();

  skills.forEach((skill) => {
    if (skill.tags.length > 0) {
      skill.tags.forEach((tag) => {
        counts.set(`#${tag}`, (counts.get(`#${tag}`) ?? 0) + 1);
      });
      return;
    }

    counts.set(`#${skill.category}`, (counts.get(`#${skill.category}`) ?? 0) + 1);
  });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([label, count]) => ({ label, count }));
}

// ── Virtualized Activity List ──
function FeedActivityList({ events }: { events: any[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 3,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  return (
    <div ref={parentRef} className="space-y-3 md:space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            ref={virtualizer.measureElement}
            data-index={item.index}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${item.start}px)` }}
          >
            <FeedActivityCard event={events[item.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Virtualized Skills Grid (2-col rows) ──
function FeedSkillsVirtualGrid({ skills, onDismiss }: { skills: any[]; onDismiss?: (skillId: string) => void }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rows = useMemo(() => {
    const result: [any, any | null][] = [];
    for (let i = 0; i < skills.length; i += 2) {
      result.push([skills[i], skills[i + 1] ?? null]);
    }
    return result;
  }, [skills]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280,
    overscan: 2,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  return (
    <div ref={parentRef} className="max-h-[70vh] overflow-y-auto pr-2">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((item) => {
          const [left, right] = rows[item.index];
          return (
            <div
              key={item.key}
              ref={virtualizer.measureElement}
              data-index={item.index}
              className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 px-0.5"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${item.start}px)` }}
            >
              <FeedSkillSpotlightCard skill={left} onDismiss={onDismiss} />
              {right && <FeedSkillSpotlightCard skill={right} onDismiss={onDismiss} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Feed() {
  const { user } = useAuth();
  const { t } = useT();
  const [activeTab, setActiveTab] = useState<FeedTab>('for-you');
  const [isCreateClubModalOpen, setIsCreateClubModalOpen] = useState(false);

  const feedUser = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      isDemo: user.isDemo,
      what_i_learn: user.what_i_learn,
      location: user.location,
      languages: user.languages,
    };
  }, [user]);

  const { skills, feedEvents, loading, skillCount, dismissSkill } = useFeedData(feedUser);

  const { data: clubs } = useSupabaseQuery<Club>(
    queryKeys.clubs.list(),
    () => supabase.from('clubs').select('*').order('member_count', { ascending: false }),
    { errorMessage: false }
  );

  const { data: membershipRows } = useSupabaseQuery<{ club_id: string }>(
    queryKeys.memberships.mine(user?.id ?? ''),
    () => supabase.from('club_memberships').select('club_id').eq('user_id', user!.id).eq('status', 'active'),
    { enabled: !!user, errorMessage: false }
  );

  const joinedClubIds = useMemo(
    () => new Set(membershipRows.map((membership) => membership.club_id)),
    [membershipRows]
  );

  const suggestedClubs = useMemo(
    () => clubs.filter((club) => !joinedClubIds.has(club.id)).slice(0, 3),
    [clubs, joinedClubIds]
  );

  const trendingTopics = useMemo(() => buildTopics(skills), [skills]);



  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('Good morning') : hour < 18 ? t('Good afternoon') : t('Good evening');

  const handleDismiss = async (skillId: string) => {
    if (user?.isDemo) return;
    try {
      await dismissSkill(skillId);
      toast('Skill hidden from your feed');
    } catch {
      toast.error('Could not hide this skill right now');
    }
  };

  const stats = [
    { label: 'Skills nearby', value: skillCount || '—', tone: 'bg-[#FFF1E2] text-[#B85A3B]' },
    { label: 'Community pulses', value: feedEvents.length || '—', tone: 'bg-[#F2E9FF] text-[#6B44A5]' },
    { label: 'Joined clubs', value: joinedClubIds.size || 0, tone: 'bg-[#E7F6EE] text-[#2D7A4F]' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-3 md:space-y-6">
      {/* ── Desktop: Big greeting card ── */}
      <section className="relative overflow-hidden rounded-[18px] border border-[rgba(196,135,58,0.16)] bg-[linear-gradient(135deg,#FFF8F1_0%,#F8EBD9_48%,#FCE6DB_100%)] px-4 py-4 shadow-[0_24px_65px_rgba(196,135,58,0.12)] md:rounded-[32px] md:px-6 md:py-6 sm:px-7 sm:py-7 hidden md:block">
        <div className="pointer-events-none absolute -left-16 top-0 h-48 w-48 rounded-full bg-[rgba(225,107,59,0.12)] blur-[80px] hidden md:block" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 rounded-full bg-[rgba(92,61,143,0.14)] blur-[90px] hidden md:block" />

        <div className="relative flex flex-col gap-4 md:gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2 md:space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[rgba(27,42,74,0.46)] md:text-[11px]">
              Community feed
            </div>
            <div>
              <h1 className="font-heading text-xl text-[var(--color-navy)] md:text-3xl sm:text-4xl">
                {greeting}, {user?.firstName}.
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:grid-cols-3 md:gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="min-w-[90px] rounded-[16px] border border-white/60 bg-white/80 px-2 py-3 text-center shadow-sm backdrop-blur-sm md:min-w-[110px] md:rounded-[22px] md:px-4 md:py-4">
                <div className={`mx-auto inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold md:text-[11px] md:px-3 md:py-1 ${stat.tone}`}>
                  {stat.label}
                </div>
                <div className="mt-2 text-lg font-semibold text-[var(--color-navy)] md:mt-3 md:text-2xl">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mobile: Stories first ── */}
      <div className="md:hidden">
        <FeedStoryStrip />
      </div>

      {/* ── Mobile: Compact greeting + stats ── */}
      <div className="md:hidden flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-[var(--color-text-muted)]">{greeting}</p>
          <p className="text-sm font-semibold text-navy truncate">{user?.firstName}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {stats.map((stat) => (
            <div key={stat.label} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${stat.tone}`}>
              {stat.value}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3 md:space-y-6">
          {/* ── Desktop: Stories (hidden on mobile) ── */}
          <div className="hidden md:block">
            <FeedStoryStrip />
          </div>

          {/* ── Desktop: Full composer card ── */}
          <section className="hidden md:block rounded-[28px] border border-[rgba(196,135,58,0.12)] bg-white p-5 shadow-[0_16px_38px_rgba(27,42,74,0.06)]">
            <div className="flex items-start gap-3">
              <Avatar className="h-11 w-11 border-2 border-[rgba(244,240,232,0.92)] flex-shrink-0">
                <AvatarImage src={user?.avatar} alt={user?.firstName} />
                <AvatarFallback className="bg-[var(--color-amber)] text-sm font-semibold text-white">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="rounded-[18px] border border-[rgba(196,135,58,0.12)] bg-[linear-gradient(180deg,#FFF9F3_0%,#FFF4E9_100%)] px-4 py-4">
                  <div className="text-sm font-medium text-[var(--color-text-secondary)]">
                    {t('What do you want to put into the community today?')}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to="/app/teach"
                    className="inline-flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,#C4873A_0%,#E16B3B_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(225,107,59,0.22)]"
                  >
                    <BookOpen className="h-4 w-4" />
                    {t('Teach a skill')}
                  </Link>
                  <Link
                    to="/app/board"
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[rgba(244,240,232,0.72)] px-4 py-2.5 text-sm font-semibold text-[var(--color-navy)] transition hover:border-[var(--color-amber)]"
                  >
                    <Search className="h-4 w-4" />
                    {t('Browse sessions')}
                  </Link>
                  <button
                    onClick={() => setIsCreateClubModalOpen(true)}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[rgba(244,240,232,0.72)] px-4 py-2.5 text-sm font-semibold text-[var(--color-navy)] transition hover:border-[var(--color-amber)]"
                  >
                    <Plus className="h-4 w-4" />
                    {t('Start a club')}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ── Mobile: Compact composer row ── */}
          <section className="md:hidden rounded-2xl border border-[rgba(196,135,58,0.12)] bg-white p-3 shadow-[0_8px_20px_rgba(27,42,74,0.05)]">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8 border-2 border-[rgba(244,240,232,0.92)] flex-shrink-0">
                <AvatarImage src={user?.avatar} alt={user?.firstName} />
                <AvatarFallback className="bg-[var(--color-amber)] text-[10px] font-semibold text-white">
                  {user?.firstName?.[0]}
                </AvatarFallback>
              </Avatar>
              <Link
                to="/app/teach"
                className="flex-1 rounded-full border border-[rgba(196,135,58,0.15)] bg-[linear-gradient(180deg,#FFF9F3_0%,#FFF4E9_100%)] px-3.5 py-2 text-xs font-medium text-[var(--color-text-secondary)]"
              >
                {t("What's on your mind?")}
              </Link>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Link
                  to="/app/board"
                  className="p-2 rounded-full bg-parchment/60 text-navy hover:bg-parchment transition-colors"
                >
                  <Search className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={() => setIsCreateClubModalOpen(true)}
                  className="p-2 rounded-full bg-parchment/60 text-navy hover:bg-parchment transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[rgba(196,135,58,0.12)] bg-white p-2 shadow-[0_16px_38px_rgba(27,42,74,0.06)] md:p-2">
            <div className="flex flex-wrap gap-1 md:gap-2">
              {([
                { id: 'for-you', label: t('For You') },
                { id: 'activity', label: t('Activity') },
                { id: 'skills', label: t('Skills') },
              ] as { id: FeedTab; label: string }[]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition hidden md:inline-block ${
                    activeTab === tab.id
                      ? 'bg-[var(--color-navy)] text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:bg-[rgba(244,240,232,0.7)] hover:text-[var(--color-navy)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              {/* Mobile: compact text-only segmented control */}
              {([
                { id: 'for-you', label: 'For You' },
                { id: 'activity', label: 'Activity' },
                { id: 'skills', label: 'Skills' },
              ] as { id: FeedTab; label: string }[]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`md:hidden rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-[var(--color-navy)] text-white'
                      : 'text-[var(--color-text-secondary)] hover:bg-[rgba(244,240,232,0.7)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          {activeTab === 'for-you' ? (
            <div className="space-y-4 md:space-y-6">
              <section className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--color-navy)] md:text-xl">{t`Recent sparks`}</h2>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)] md:text-sm hidden md:block">
                      {t('Fresh activity from people publishing and learning nearby.')}
                    </p>
                  </div>
                </div>

                {feedEvents.length > 0 ? (
                  <div className="space-y-3 md:space-y-4">
                    {feedEvents.slice(0, 3).map((event) => (
                      <FeedActivityCard key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[28px] border border-[rgba(196,135,58,0.12)] bg-white px-4 py-8 text-center shadow-[0_16px_38px_rgba(27,42,74,0.06)] md:px-6 md:py-10">
                    <Flame className="mx-auto h-8 w-8 text-[var(--color-amber)]" />
                    <h3 className="mt-4 text-lg font-semibold text-[var(--color-navy)]">{t`No activity yet`}</h3>
                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                      {t('As people publish skills and sessions, this area will light up.')}
                    </p>
                  </div>
                )}
              </section>

              <section className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--color-navy)] md:text-xl">{t`Skill spotlights`}</h2>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)] md:text-sm hidden md:block">
                      {t('The strongest matches for what you might want to learn next.')}
                    </p>
                  </div>
                  <Link
                    to="/app/board"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-amber)] md:text-sm"
                  >
                    {t('Browse all')}
                    <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
                  </Link>
                </div>

                {loading ? (
                  <div className="grid gap-3 md:grid-cols-2 md:gap-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="overflow-hidden rounded-[28px] border border-[rgba(196,135,58,0.12)] bg-white animate-pulse">
                        <div className="h-36 bg-[rgba(244,240,232,0.95)]" />
                        <div className="space-y-3 p-3.5 md:p-5">
                          <div className="h-4 w-3/4 rounded-full bg-[rgba(244,240,232,0.95)]" />
                          <div className="h-3 rounded-full bg-[rgba(244,240,232,0.8)]" />
                          <div className="h-3 w-5/6 rounded-full bg-[rgba(244,240,232,0.8)]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : skills.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2 md:gap-4">
                    {skills.slice(0, 4).map((skill) => (
                      <FeedSkillSpotlightCard
                        key={skill.id}
                        skill={skill}
                        onDismiss={user?.isDemo ? undefined : handleDismiss}
                      />
                    ))}
                  </div>
                ) : null}
              </section>
            </div>
          ) : null}

          {activeTab === 'activity' ? (
            <section className="space-y-3 md:space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-navy)] md:text-xl">{t`Community activity`}</h2>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)] md:text-sm hidden md:block">
                  {t('Updates, new sessions, and publishing moments from the network.')}
                </p>
              </div>

              {feedEvents.length > 0 ? (
                <FeedActivityList events={feedEvents} />
              ) : (
                <div className="rounded-[28px] border border-[rgba(196,135,58,0.12)] bg-white px-4 py-8 text-center shadow-[0_16px_38px_rgba(27,42,74,0.06)] md:px-6 md:py-10">
                  <Clock3 className="mx-auto h-8 w-8 text-[var(--color-amber)]" />
                  <h3 className="mt-4 text-lg font-semibold text-[var(--color-navy)]">{t`The feed is quiet right now`}</h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    {t('Check back soon or browse skills to kick off your next conversation.')}
                  </p>
                </div>
              )}
            </section>
          ) : null}

          {activeTab === 'skills' ? (
            <section className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--color-navy)] md:text-xl">{t`Skills worth discovering`}</h2>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)] md:text-sm hidden md:block">
                    {t('A warmer, card-based browse of the live skill inventory.')}
                  </p>
                </div>
                <Link
                  to="/app/board"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-amber)] md:text-sm"
                >
                  {t('Open browse')}
                  <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
                </Link>
              </div>

              {loading ? (
                <div className="grid gap-3 md:grid-cols-2 md:gap-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="overflow-hidden rounded-[28px] border border-[rgba(196,135,58,0.12)] bg-white animate-pulse">
                      <div className="h-36 bg-[rgba(244,240,232,0.95)]" />
                      <div className="space-y-3 p-3.5 md:p-5">
                        <div className="h-4 w-3/4 rounded-full bg-[rgba(244,240,232,0.95)]" />
                        <div className="h-3 rounded-full bg-[rgba(244,240,232,0.8)]" />
                        <div className="h-3 w-5/6 rounded-full bg-[rgba(244,240,232,0.8)]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : skills.length > 0 ? (
                <FeedSkillsVirtualGrid skills={skills} onDismiss={user?.isDemo ? undefined : handleDismiss} />
              ) : (
                <div className="rounded-[28px] border border-[rgba(196,135,58,0.12)] bg-white px-4 py-8 text-center shadow-[0_16px_38px_rgba(27,42,74,0.06)] md:px-6 md:py-10">
                  <BookOpen className="mx-auto h-8 w-8 text-[var(--color-amber)]" />
                  <h3 className="mt-4 text-lg font-semibold text-[var(--color-navy)]">{t`No skills published yet`}</h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    {t('Be the first to teach something and light up the feed.')}
                  </p>
                  <Link
                    to="/app/teach"
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#C4873A_0%,#E16B3B_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(225,107,59,0.22)]"
                  >
                    <BookOpen className="h-4 w-4" />
                    {t('Start teaching')}
                  </Link>
                </div>
              )}
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <section className="rounded-[28px] border border-[rgba(196,135,58,0.12)] bg-white p-5 shadow-[0_16px_38px_rgba(27,42,74,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-navy)]">Trending now</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Topics rising inside the current skill pool.
                </p>
              </div>
              <Flame className="h-5 w-5 text-[var(--color-amber)]" />
            </div>

            <div className="mt-4 space-y-3">
              {trendingTopics.length > 0 ? (
                trendingTopics.map((topic, index) => (
                  <div
                    key={topic.label}
                    className="flex items-center gap-3 rounded-[20px] bg-[rgba(244,240,232,0.75)] px-4 py-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-[var(--color-amber)]">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-[var(--color-navy)]">{topic.label}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{topic.count} mentions</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] bg-[rgba(244,240,232,0.75)] px-4 py-4 text-sm text-[var(--color-text-secondary)]">
                  Trends will appear as more skills and tags are added.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-[rgba(196,135,58,0.12)] bg-white p-5 shadow-[0_16px_38px_rgba(27,42,74,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-navy)]">Suggested clubs</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Communities you might want to step into next.
                </p>
              </div>
              <Users className="h-5 w-5 text-[var(--color-amber)]" />
            </div>

            <div className="mt-4 space-y-3">
              {suggestedClubs.length > 0 ? (
                suggestedClubs.map((club) => (
                  <Link
                    key={club.id}
                    to={`/club/${club.slug ?? club.id}`}
                    className="flex items-center gap-3 rounded-[20px] bg-[rgba(244,240,232,0.75)] px-4 py-3 transition hover:bg-[rgba(244,240,232,0.95)]"
                  >
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[rgba(196,135,58,0.12)] text-sm font-semibold text-[var(--color-amber)]">
                      {club.avatar_url ? (
                        <img src={club.avatar_url} alt={club.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      ) : (
                        club.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-[var(--color-navy)]">{club.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                        <span>{club.member_count} members</span>
                        {club.city ? (
                          <>
                            <span>•</span>
                            <span>{club.city}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-[var(--color-text-muted)]" />
                  </Link>
                ))
              ) : (
                <div className="rounded-[20px] bg-[rgba(244,240,232,0.75)] px-4 py-4 text-sm text-[var(--color-text-secondary)]">
                  No club suggestions yet. Start one from the composer above.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-[rgba(196,135,58,0.12)] bg-[linear-gradient(180deg,#FFF9F3_0%,#FFF2E4_100%)] p-5 shadow-[0_16px_38px_rgba(27,42,74,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-navy)]">Your learning pulse</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Signals the feed is already using to personalize recommendations.
                </p>
              </div>
              <Compass className="h-5 w-5 text-[var(--color-amber)]" />
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-[20px] bg-white/80 px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                  Learning interests
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {user?.what_i_learn.length ? (
                    user.what_i_learn.slice(0, 4).map((interest) => (
                      <span
                        key={interest}
                        className="rounded-full bg-[rgba(196,135,58,0.12)] px-3 py-1.5 text-xs font-semibold text-[var(--color-amber)]"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      Add learning goals on your profile to improve recommendations.
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-[20px] bg-white/80 px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                  Context
                </div>
                <div className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[var(--color-amber)]" />
                    <span>{user?.location || 'Location not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[var(--color-amber)]" />
                    <span>
                      {user?.languages.length
                        ? `${user.languages.slice(0, 3).join(', ')}`
                        : 'Languages not added yet'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {isCreateClubModalOpen ? <CreateClubModal onClose={() => setIsCreateClubModalOpen(false)} /> : null}
    </div>
  );
}
