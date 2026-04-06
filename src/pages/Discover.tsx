import { useState, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Club } from '@/types/fightclub';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { queryKeys } from '@/lib/queryKeys';
import { CATEGORIES, CATEGORY_GRADIENTS, CATEGORY_COLORS } from '@/constants/categories';
import {
  Users, MapPin, Lock, Globe, Flame,
  TrendingUp, Sparkles, AlertCircle, RefreshCw,
} from 'lucide-react';
import CreateClubModal from '@/components/club/CreateClubModal';
import { SearchBar } from '@/components/ui/search-bar';
import { CardSkeletonGrid } from '@/components/ui/card-skeleton';

const ClubCard = memo(function ClubCard({ club, myMembershipIds }: { club: Club; myMembershipIds: Set<string> }) {
  const gradient = club.cover_gradient ?? CATEGORY_GRADIENTS[club.category] ?? 'from-blue-500 to-purple-600';
  const catColor = CATEGORY_COLORS[club.category] ?? { bg: '#F4F0E8', text: '#5C3D8F' };
  const isMember = myMembershipIds.has(club.id);

  return (
    <Link to={`/club/${club.slug ?? club.id}`} className="group block bg-white rounded-2xl overflow-hidden border border-[var(--color-border)] hover:shadow-floating transition-all">
      {/* Cover */}
      <div className={`h-28 relative bg-gradient-to-br ${gradient}`}>
        {club.cover_image_url && (
          <img src={club.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute top-2.5 right-2.5">
          {club.is_private ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/40 text-white flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Private
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/30 text-white flex items-center gap-1">
              <Globe className="w-2.5 h-2.5" /> Public
            </span>
          )}
        </div>
        {isMember && (
          <div className="absolute top-2.5 left-2.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--color-amber)' }}>
              Joined
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 -mt-7 border-2 border-white shadow-sm" style={{ background: catColor.bg }}>
            {club.avatar_url
              ? <img src={club.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
              : CATEGORIES.find(c => c.id === club.category)?.emoji ?? '✨'}
          </div>
          <div className="flex-1 min-w-0 mt-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: catColor.text }}>
              {club.category}
            </span>
          </div>
        </div>

        <h3 className="font-semibold text-navy text-sm mt-2 group-hover:text-[var(--color-amber)] transition-colors line-clamp-1">
          {club.name}
        </h3>
        {club.description && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2 leading-relaxed">
            {club.description}
          </p>
        )}

        {/* Tags */}
        {club.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {club.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#F4F0E8', color: 'var(--color-text-secondary)' }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {club.member_count}
            </span>
            {club.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {club.city}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold" style={{ color: 'var(--color-amber)' }}>
            View →
          </span>
        </div>
      </div>
    </Link>
  );
});

export default function Discover() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPrivate, setShowPrivate] = useState<'all' | 'public' | 'private'>('all');
  const [isCreateClubModalOpen, setIsCreateClubModalOpen] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const { data: clubs, loading: clubsLoading, error: clubsError, refetch } = useSupabaseQuery<Club>(
    queryKeys.clubs.list(),
    () => supabase.from('clubs').select('*').order('member_count', { ascending: false }),
    { errorMessage: 'Failed to load clubs' }
  );

  const { data: membershipRows, loading: memLoading } = useSupabaseQuery<{ club_id: string }>(
    queryKeys.memberships.mine(user?.id ?? ''),
    () => supabase.from('club_memberships').select('club_id').eq('user_id', user!.id).eq('status', 'active'),
    { enabled: !!user, errorMessage: false }
  );

  const loading = clubsLoading || memLoading;
  const error = clubsError;

  const myMembershipIds = useMemo(
    () => new Set(membershipRows.map(m => m.club_id)),
    [membershipRows]
  );

  const filtered = useMemo(() => {
    return clubs.filter(c => {
      const matchSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
        c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchCat = selectedCategory === 'all' || c.category === selectedCategory;
      const matchPrivacy = showPrivate === 'all' || (showPrivate === 'public' ? !c.is_private : c.is_private);
      return matchSearch && matchCat && matchPrivacy;
    });
  }, [clubs, search, selectedCategory, showPrivate]);

  // Personalized recommendations: joined categories first
  const recommended = useMemo(() => {
    if (!user) return filtered;
    const interests = user.what_i_learn?.map((s: string) => s.toLowerCase()) ?? [];
    return [...filtered].sort((a, b) => {
      const aScore = interests.some(i => a.category.includes(i) || a.tags.some(t => t.includes(i))) ? 1 : 0;
      const bScore = interests.some(i => b.category.includes(i) || b.tags.some(t => t.includes(i))) ? 1 : 0;
      if (bScore !== aScore) return bScore - aScore;
      return b.member_count - a.member_count;
    });
  }, [filtered, user]);

  const myClubs = clubs.filter(c => myMembershipIds.has(c.id));
  const hasActiveFilters = search || selectedCategory !== 'all' || showPrivate !== 'all';

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl text-navy">
          {user ? `${greeting}, ${user.firstName}. ✦` : 'Discover clubs'}
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1 font-body">
          {recommended.length} club{recommended.length !== 1 ? 's' : ''} across Morocco — find your people.
        </p>
      </div>

      {/* My Clubs strip */}
      {myClubs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-navy" style={{ fontSize: '1.05rem' }}>
              Your clubs
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {myClubs.map(c => {
              const gradient = c.cover_gradient ?? CATEGORY_GRADIENTS[c.category] ?? 'from-blue-500 to-purple-600';
              return (
                <Link
                  key={c.id}
                  to={`/club/${c.slug ?? c.id}`}
                  className="flex-shrink-0 w-40 rounded-xl overflow-hidden border border-[var(--color-border)] hover:shadow-md transition-all group"
                >
                  <div className={`h-16 bg-gradient-to-br ${gradient}`} />
                  <div className="p-2.5">
                    <div className="font-semibold text-xs text-navy truncate group-hover:text-[var(--color-amber)] transition-colors">
                      {c.name}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1">
                      <Users className="w-2.5 h-2.5" /> {c.member_count}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search clubs, topics, tags…"
      />

      {/* Category chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mt-4">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
            selectedCategory === 'all' ? 'text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-amber)]'
          }`}
          style={selectedCategory === 'all' ? { background: 'var(--color-navy)' } : {}}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
              selectedCategory === cat.id ? 'text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-amber)]'
            }`}
            style={selectedCategory === cat.id ? { background: 'var(--color-amber)' } : {}}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
        <div className="w-px h-5 bg-[var(--color-border)] flex-shrink-0" />
        {(['all', 'public', 'private'] as const).map(v => (
          <button
            key={v}
            onClick={() => setShowPrivate(v)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all capitalize ${
              showPrivate === v ? 'text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-amber)]'
            }`}
            style={showPrivate === v ? { background: 'var(--color-plum)' } : {}}
          >
            {v === 'all' ? 'Any' : v === 'public' ? '🌐 Public' : '🔒 Private'}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="sc-card p-8 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-red-400" />
          <p className="text-sm font-semibold text-navy mb-1">Could not load clubs</p>
          <p className="text-xs text-[var(--color-text-secondary)] mb-4">{error?.message}</p>
          <button onClick={refetch} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-amber)] hover:underline">
            <RefreshCw className="w-3.5 h-3.5" /> Try again
          </button>
        </div>
      )}

      {/* Results */}
      {!error && loading ? (
        <CardSkeletonGrid count={6} variant="club" />
      ) : !error && recommended.length === 0 ? (
        <div className="sc-card p-12 text-center">
          <Sparkles className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-amber)' }} />
          <div className="font-heading text-navy text-lg mb-2">
            {hasActiveFilters ? 'No clubs match your filters' : 'No clubs yet'}
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {hasActiveFilters ? 'Try adjusting your search or filters.' : 'Be the first to start one!'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(''); setSelectedCategory('all'); setShowPrivate('all'); }}
              className="mt-4 text-sm font-semibold text-[var(--color-amber)] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Recommended section heading */}
          {user && !hasActiveFilters && (
            <div className="flex items-center gap-2 -mb-4">
              <Flame className="w-4 h-4" style={{ color: 'var(--color-amber)' }} />
              <h2 className="font-heading text-navy" style={{ fontSize: '1.05rem' }}>
                Recommended for you
              </h2>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map(club => (
              <ClubCard key={club.id} club={club} myMembershipIds={myMembershipIds} />
            ))}
          </div>
        </>
      )}

      {/* Bottom CTA */}
      {!loading && clubs.length > 0 && (
        <div className="p-6 rounded-2xl text-center" style={{ background: 'var(--color-navy)' }}>
          <div className="font-heading text-white text-lg mb-2">
            Can't find your club?
          </div>
          <p className="text-white/50 text-sm font-body mb-4">
            Start your own and invite your people.
          </p>
          <button
            onClick={() => setIsCreateClubModalOpen(true)}
            className="inline-flex items-center gap-2 btn-amber text-sm"
            style={{ padding: '0.625rem 1.25rem' }}
          >
            <TrendingUp className="w-4 h-4" />
            Start a Club
          </button>
        </div>
      )}

      {isCreateClubModalOpen && (
        <CreateClubModal onClose={() => setIsCreateClubModalOpen(false)} />
      )}
    </div>
  );
}
