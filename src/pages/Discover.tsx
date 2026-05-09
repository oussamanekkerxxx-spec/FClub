import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { queryKeys } from '@/lib/queryKeys';
import { CATEGORIES } from '@/constants/categories';
import { useT } from '@/lib/t';
import { Plus, RefreshCw, Search } from 'lucide-react';
import CreateClubModal from '@/components/club/CreateClubModal';
import ClubDirectoryCard from '@/components/club/ClubDirectoryCard';
import type { Club } from '@/types/fightclub';
import { useStories } from '@/hooks/useStories';
import type { UserStoryGroup } from '@/types/stories';
import StoryViewerModal from '@/components/stories/StoryViewerModal';
import StoryComposerModal from '@/components/stories/StoryComposerModal';

type PrivacyFilter = 'all' | 'public' | 'private';

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function DirectorySkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[26px] border border-[rgba(196,135,58,0.14)] bg-white animate-pulse shadow-[0_16px_42px_rgba(196,135,58,0.08)]"
        >
          <div className="h-32 bg-[rgba(244,240,232,0.95)]" />
          <div className="space-y-4 px-4 pb-4 pt-6">
            <div className="h-4 w-2/3 rounded-full bg-[rgba(244,240,232,0.95)]" />
            <div className="space-y-2">
              <div className="h-3 rounded-full bg-[rgba(244,240,232,0.8)]" />
              <div className="h-3 w-5/6 rounded-full bg-[rgba(244,240,232,0.8)]" />
            </div>
            <div className="h-10 rounded-2xl bg-[rgba(244,240,232,0.8)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Discover() {
  const { user } = useAuth();
  const { t } = useT();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [privacyFilter, setPrivacyFilter] = useState<PrivacyFilter>('all');
  const [isCreateClubModalOpen, setIsCreateClubModalOpen] = useState(false);
  const [activeClubPopup, setActiveClubPopup] = useState<{
    id: string;
    title: string;
    description: string;
    color: string;
    link?: string;
    linkText?: string;
  } | null>(null);
  const [activeStoryViewer, setActiveStoryViewer] = useState<{
    groups: UserStoryGroup[];
    initialIndex: number;
  } | null>(null);
  const [isStoryComposerOpen, setIsStoryComposerOpen] = useState(false);

  const { storyGroups, isLoading: storiesLoading } = useStories();

  const textStoryGroups = useMemo(
    () => storyGroups.filter((g) => g.stories[0]?.media_type === 'text'),
    [storyGroups]
  );

  const { data: clubs, loading: clubsLoading, error: clubsError, refetch } = useSupabaseQuery<Club>(
    queryKeys.clubs.list(),
    () => supabase.from('clubs').select('*').order('member_count', { ascending: false }),
    { errorMessage: 'Failed to load clubs' }
  );

  const { data: membershipRows, loading: membershipsLoading } = useSupabaseQuery<{ club_id: string }>(
    queryKeys.memberships.mine(user?.id ?? ''),
    () => supabase.from('club_memberships').select('club_id').eq('user_id', user!.id).eq('status', 'active'),
    { enabled: !!user, errorMessage: false }
  );

  const myMembershipIds = useMemo(
    () => new Set(membershipRows.map((membership) => membership.club_id)),
    [membershipRows]
  );

  const filteredClubs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return clubs.filter((club) => {
      const matchesSearch =
        !normalizedSearch ||
        club.name.toLowerCase().includes(normalizedSearch) ||
        (club.description ?? '').toLowerCase().includes(normalizedSearch) ||
        club.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch)) ||
        club.category.toLowerCase().includes(normalizedSearch);

      const matchesCategory = selectedCategory === 'all' || club.category === selectedCategory;
      const matchesPrivacy =
        privacyFilter === 'all' ||
        (privacyFilter === 'public' ? !club.is_private : club.is_private);

      return matchesSearch && matchesCategory && matchesPrivacy;
    });
  }, [clubs, privacyFilter, search, selectedCategory]);

  const joinedClubs = useMemo(
    () => filteredClubs.filter((club) => myMembershipIds.has(club.id)),
    [filteredClubs, myMembershipIds]
  );

  const exploreClubs = useMemo(() => {
    const base = filteredClubs.filter((club) => !myMembershipIds.has(club.id));
    if (!user) return base;

    const interests = user.what_i_learn.map((item) => item.toLowerCase());

    return [...base].sort((left, right) => {
      const leftScore = interests.some(
        (interest) =>
          left.category.toLowerCase().includes(interest) ||
          left.tags.some((tag) => tag.toLowerCase().includes(interest))
      )
        ? 1
        : 0;
      const rightScore = interests.some(
        (interest) =>
          right.category.toLowerCase().includes(interest) ||
          right.tags.some((tag) => tag.toLowerCase().includes(interest))
      )
        ? 1
        : 0;

      if (rightScore !== leftScore) return rightScore - leftScore;
      return right.member_count - left.member_count;
    });
  }, [filteredClubs, myMembershipIds, user]);

  const hasActiveFilters =
    search.trim().length > 0 || selectedCategory !== 'all' || privacyFilter !== 'all';
  const loading = clubsLoading || membershipsLoading;

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Hero: story-strip on mobile, full card on desktop ── */}
      <div className="relative overflow-hidden rounded-[18px] md:rounded-[34px] border border-[rgba(196,135,58,0.14)] bg-[linear-gradient(135deg,#FFF8F1_0%,#F7ECDE_52%,#F9F0EA_100%)] shadow-[0_24px_70px_rgba(196,135,58,0.12)]">
        {/* Decorative blurs — hidden on mobile to keep card slim */}
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[rgba(225,107,59,0.13)] blur-[110px] hidden md:block" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[rgba(92,61,143,0.2)] blur-[130px] hidden md:block" />

        {/* ── MOBILE STRIP (< md) ── */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-[0.28em] text-[var(--color-text-muted)] leading-none mb-0.5">FightClub Directory</div>
            <div className="font-heading text-[18px] text-[var(--color-navy)] leading-tight">
              My <span className="bg-[linear-gradient(135deg,#C4873A_0%,#E16B3B_100%)] bg-clip-text text-transparent">Clubs</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={refetch}
              aria-label="Refresh clubs"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(196,135,58,0.18)] bg-white/90 text-[var(--color-text-secondary)] transition hover:text-[var(--color-navy)]"
              title="Refresh clubs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setIsCreateClubModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#C4873A_0%,#E16B3B_100%)] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_6px_20px_rgba(225,107,59,0.35)] transition"
            >
              <Plus className="h-3 w-3" />
              {t('New Club')}
            </button>
          </div>
        </div>

        {/* Search + Filters — always visible, compact on mobile */}
        <div className="md:hidden px-4 pb-3 space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('Search clubs...')}
              aria-label="Search clubs"
              className="h-9 w-full rounded-xl border border-[rgba(196,135,58,0.14)] bg-white/88 pl-9 pr-3 text-sm text-[var(--color-navy)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[rgba(196,135,58,0.4)] focus:ring-2 focus:ring-[rgba(196,135,58,0.1)]"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {(['all', ...CATEGORIES.map(c => c.id)] as string[]).map((catId) => {
              const cat = CATEGORIES.find(c => c.id === catId) as any;
              const active = selectedCategory === catId;
              return (
                <button
                  key={catId}
                  onClick={() => setSelectedCategory(catId)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition ${
                    active
                      ? 'bg-[linear-gradient(135deg,#C4873A_0%,#E16B3B_100%)] text-white'
                      : 'border border-[rgba(196,135,58,0.14)] bg-white/72 text-[var(--color-text-secondary)]'
                  }`}
                >
                  {catId === 'all' ? t('All') : (cat?.emoji ? `${cat.emoji} ${cat.label}` : cat?.label)}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── DESKTOP FULL LAYOUT (≥ md) ── */}
        <div className="hidden md:block relative px-5 py-6 md:px-5 md:py-6 lg:px-8 lg:py-8">
          <div className="relative space-y-8">
            <div className="space-y-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--color-text-muted)]">
                    {t('FightClub Directory')}
                  </div>
                  <div>
                    <h1 className="font-heading text-4xl text-[var(--color-navy)] sm:text-5xl">
                      My <span className="bg-[linear-gradient(135deg,#C4873A_0%,#E16B3B_100%)] bg-clip-text text-transparent">Clubs</span>
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-[15px]">
                      {t('Browse the communities you already belong to, discover new ones, and launch your own club without changing any of the existing club flows behind the scenes.')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <button
                    onClick={refetch}
                    aria-label="Refresh clubs"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(196,135,58,0.14)] bg-white/80 text-[var(--color-text-secondary)] transition hover:border-[rgba(196,135,58,0.28)] hover:bg-white hover:text-[var(--color-navy)]"
                    title="Refresh clubs"
                  >
                    <RefreshCw className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={() => setIsStoryComposerOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(196,135,58,0.14)] bg-white/80 px-4 py-3 text-sm font-semibold text-[var(--color-navy)] shadow-[0_4px_16px_rgba(196,135,58,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(196,135,58,0.14)] hover:bg-white"
                  >
                    <Plus className="h-4 w-4" />
                    {t('Post story')}
                  </button>
                  <button
                    onClick={() => setIsCreateClubModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#C4873A_0%,#E16B3B_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(225,107,59,0.32)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(225,107,59,0.4)]"
                  >
                    <Plus className="h-4 w-4" />
                    {t('Create club')}
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('Search clubs, topics, communities...')}
                  aria-label="Search clubs"
                  className="h-12 w-full rounded-2xl border border-[rgba(196,135,58,0.14)] bg-white/88 pl-11 pr-4 text-sm text-[var(--color-navy)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[rgba(196,135,58,0.4)] focus:bg-white focus:ring-4 focus:ring-[rgba(196,135,58,0.12)]"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  aria-pressed={selectedCategory === 'all'}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    selectedCategory === 'all'
                      ? 'bg-[linear-gradient(135deg,#C4873A_0%,#E16B3B_100%)] text-white'
                      : 'border border-[rgba(196,135,58,0.14)] bg-white/72 text-[var(--color-text-secondary)] hover:bg-white hover:text-[var(--color-navy)]'
                  }`}
                >
                  {t('All')}
                </button>
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    aria-pressed={selectedCategory === category.id}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      selectedCategory === category.id
                        ? 'bg-[linear-gradient(135deg,#C4873A_0%,#E16B3B_100%)] text-white'
                        : 'border border-[rgba(196,135,58,0.14)] bg-white/72 text-[var(--color-text-secondary)] hover:bg-white hover:text-[var(--color-navy)]'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
                <div className="mx-1 hidden w-px bg-[rgba(196,135,58,0.14)] sm:block" />
                {(['all', 'public', 'private'] as PrivacyFilter[]).map((value) => (
                  <button
                    key={value}
                    onClick={() => setPrivacyFilter(value)}
                    aria-pressed={privacyFilter === value}
                    className={`rounded-full px-4 py-2 text-xs font-semibold capitalize transition ${
                      privacyFilter === value
                        ? 'bg-[linear-gradient(135deg,#C4873A_0%,#E16B3B_100%)] text-white'
                        : 'border border-[rgba(196,135,58,0.14)] bg-white/72 text-[var(--color-text-secondary)] hover:bg-white hover:text-[var(--color-navy)]'
                    }`}
                  >
                    {value === 'all' ? t('Any privacy') : value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-6 mt-6">
          {clubsError && !loading ? (
            <div className="rounded-[26px] border border-red-300/30 bg-[rgba(255,255,255,0.72)] px-6 py-10 text-center">
              <p className="text-lg font-semibold text-[var(--color-navy)]">{t('Could not load clubs')}</p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{clubsError.message}</p>
              <button
                onClick={refetch}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(196,135,58,0.14)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-navy)] transition hover:border-[rgba(196,135,58,0.28)]"
              >
                <RefreshCw className="h-4 w-4" />
                {t('Try again')}
              </button>
            </div>
          ) : loading ? (
            <DirectorySkeleton />
          ) : (
            <div className="space-y-8">
              {/* ── MOBILE STORIES ROW (< md) ── */}
              <div className="md:hidden pt-2">
                <div className="flex gap-4 overflow-x-auto scrollbar-none px-4 pb-4">
                  {storiesLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div className="w-14 h-14 rounded-full bg-slate-200 animate-pulse" />
                        <div className="w-10 h-2.5 rounded-full bg-slate-200 animate-pulse" />
                      </div>
                    ))
                  ) : textStoryGroups.length > 0 ? (
                    textStoryGroups.map((group, idx) => (
                      <button
                        key={group.author_id}
                        onClick={() => setActiveStoryViewer({ groups: textStoryGroups, initialIndex: idx })}
                        className="flex flex-col items-center gap-1.5 flex-shrink-0"
                      >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl shadow-md border-2 border-white ring-2 ring-offset-1 transition active:scale-95 ${group.has_unread ? 'ring-[var(--color-plum)]' : 'ring-[var(--color-navy)]'}`}>
                          {group.author.avatar_url ? (
                            <img src={group.author.avatar_url} alt={group.author.first_name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span>{group.author.first_name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-[var(--color-navy)] truncate w-14 text-center">{group.author.first_name}</span>
                      </button>
                    ))
                  ) : null}

                  {/* Joined Clubs as Stories */}
                  {joinedClubs.map((club) => (
                    <button
                      key={club.id}
                      onClick={() => setActiveClubPopup({
                        id: club.id, title: club.name, description: club.description || 'Community space for people who share this club\'s interests.', color: 'var(--color-navy)', link: `/club/${club.slug || club.id}`, linkText: 'Enter Club'
                      })}
                      className="flex flex-col items-center gap-1.5 flex-shrink-0"
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-white text-xl shadow-md border-2 border-white ring-2 ring-[rgba(196,135,58,0.4)] ring-offset-1 transition active:scale-95 bg-slate-100">
                        {club.avatar_url ? (
                          <img src={club.avatar_url} alt={club.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${club.cover_gradient || 'from-amber-200 to-rose-200'}`} />
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-[var(--color-navy)] truncate w-14 text-center">{club.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {joinedClubs.length > 0 ? (
                <section className="space-y-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-[var(--color-navy)]">{t('Joined')}</h2>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        {countLabel(joinedClubs.length, t('club'), t('clubs'))}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {joinedClubs.map((club) => (
                      <ClubDirectoryCard key={club.id} club={club} isMember />
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--color-navy)]">{t('Explore')}</h2>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                      {countLabel(exploreClubs.length, t('community'), t('communities'))} {t('available')}
                    </p>
                  </div>
                </div>

                {exploreClubs.length === 0 ? (
                  <div className="rounded-[26px] border border-[rgba(196,135,58,0.14)] bg-white/70 px-6 py-12 text-center">
                    <Search className="mx-auto h-8 w-8 text-[#f6c27f]" />
                    <h3 className="mt-4 text-lg font-semibold text-[var(--color-navy)]">
                      {hasActiveFilters ? t('No clubs match your filters') : t('No clubs to explore yet')}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                      {hasActiveFilters
                        ? t('Try broadening your search or clearing a filter.')
                        : t('Create the first club and start gathering your community.')}
                    </p>
                    {hasActiveFilters ? (
                      <button
                        onClick={() => {
                          setSearch('');
                          setSelectedCategory('all');
                          setPrivacyFilter('all');
                        }}
                        className="mt-5 inline-flex items-center rounded-full border border-[rgba(196,135,58,0.14)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-navy)] transition hover:border-[rgba(196,135,58,0.28)]"
                      >
                        {t('Clear filters')}
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {exploreClubs.map((club) => (
                      <ClubDirectoryCard key={club.id} club={club} isMember={false} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
      </div>

      {isCreateClubModalOpen ? <CreateClubModal onClose={() => setIsCreateClubModalOpen(false)} /> : null}
      {isStoryComposerOpen && (
        <StoryComposerModal isOpen={isStoryComposerOpen} onClose={() => setIsStoryComposerOpen(false)} />
      )}

      {activeClubPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 md:hidden" onClick={() => setActiveClubPopup(null)}>
          <div className="sc-card w-full max-w-sm p-5 space-y-4 animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ background: activeClubPopup.color }}>
                {activeClubPopup.title.charAt(0)}
              </div>
              <h3 className="font-heading text-lg text-navy flex-1">{activeClubPopup.title}</h3>
            </div>
            <div className="bg-parchment rounded-xl p-3 border border-[var(--color-border)] relative">
              <div className="absolute -top-2 left-6 w-4 h-4 bg-parchment border-t border-l border-[var(--color-border)] rotate-45" />
              <p className="font-body text-sm text-[var(--color-text-secondary)] relative z-10 leading-relaxed">
                {activeClubPopup.description}
              </p>
            </div>
            {activeClubPopup.link ? (
              <a href={activeClubPopup.link} className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 shadow-sm" style={{ background: activeClubPopup.color }}>
                {activeClubPopup.linkText}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeStoryViewer ? (
        <StoryViewerModal
          groups={activeStoryViewer.groups}
          initialGroupIndex={activeStoryViewer.initialIndex}
          onClose={() => setActiveStoryViewer(null)}
        />
      ) : null}
    </div>
  );
}
