import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Users, MessageSquare, Sword, Mic2, BookOpen, CalendarDays,
  Lock, Globe, MapPin, Clock,
  ArrowLeft, Settings,
  FolderKanban, Trophy, UserCheck, PlaySquare, Pin, Loader2,
  ShieldOff,
} from 'lucide-react';
import { useClubActions } from '@/hooks/useClubActions';
import { useClubData } from '@/hooks/useClubData';
import { queryKeys } from '@/lib/queryKeys';
import { CATEGORIES, CATEGORY_COLORS_WITH_GRADIENT } from '@/constants/categories';
import { getClubTemplate } from '@/constants/clubTemplates';
import type { Tab } from '@/constants/clubTemplates';
import StudentClubHome from '@/components/club/student/StudentClubHome';
import ClubJoinButton from '@/components/club/ClubJoinButton';
import ClubSettingsModal from '@/components/club/ClubSettingsModal';
import ProjectsTab from '@/components/club/ProjectsTab';
import LeaderboardTab from '@/components/club/LeaderboardTab';
import PlaylistsTab from '@/components/club/PlaylistsTab';
import FeedTab from '@/components/club/FeedTab';
import EventsTab from '@/components/club/EventsTab';
import MembersTab from '@/components/club/MembersTab';
import QuestsTab from '@/components/club/QuestsTab';
import RoomsTab from '@/components/club/RoomsTab';
import ResourcesTab from '@/components/club/ResourcesTab';
import RequestsTab from '@/components/club/RequestsTab';
import MemberGate from '@/components/club/MemberGate';
import { TabErrorBoundary } from '@/components/errors/TabErrorBoundary';
import ClubStoriesStrip from '@/components/club/ClubStoriesStrip';
import { format } from 'date-fns';

const CATEGORY_COLORS = CATEGORY_COLORS_WITH_GRADIENT;

// Emoji lookup built from CATEGORIES — covers all known IDs from the DB,
// with fallbacks from the full gradients/colors map for legacy categories.
const CATEGORY_EMOJI: Record<string, string> = {
  // Current platform categories
  technology: '💻',
  student:    '🎓',
  // Legacy (DB backward-compat)
  music: '🎵', languages: '🌍', cooking: '🍳', art: '🎨', fitness: '💪',
  photography: '📷', business: '📊', writing: '✍️', crafts: '🧵',
  events: '📅', club_lounge: '🛋️', deve_sandbox: '🛠️',
  wellness_support: '🧘', connection_lounge: '🤝',
  ...Object.fromEntries(CATEGORIES.map(c => [c.id, c.emoji])),
};

const VALID_TABS: Tab[] = ['feed', 'members', 'quests', 'rooms', 'resources', 'playlists', 'events', 'projects', 'leaderboard', 'requests'];


export default function ClubHome({ tab: initialTab }: { tab?: Tab }) {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    club, membership, joinRequestPending, pendingRequestCount,
    pinnedPosts: posts, upcomingEvents: events, loading,
    setClub, setMembership, setJoinRequestPending, setPendingRequestCount,
  } = useClubData({ id, userId: user?.id });

  const tabFromUrl = useMemo(() => {
    const parts = location.pathname.split('/');
    const last = parts[parts.length - 1];
    return VALID_TABS.includes(last as Tab) ? (last as Tab) : null;
  }, [location.pathname]);

  const activeTab = tabFromUrl ?? initialTab ?? 'feed';
  const [showSettings, setShowSettings] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  const clubId = club?.id ?? '';
  const catColors = club ? (CATEGORY_COLORS[club.category] ?? CATEGORY_COLORS.music) : CATEGORY_COLORS.music;
  const template  = useMemo(() => getClubTemplate(club?.category ?? ''), [club?.category]);

  const { data: hasActiveRoom = false } = useQuery({
    queryKey: queryKeys.clubs.hasActiveRoom(clubId),
    queryFn: async () => {
      const { count } = await supabase
        .from('voice_rooms')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId)
        .eq('status', 'active');
      return (count ?? 0) > 0;
    },
    enabled: !!clubId && !!membership,
    staleTime: 30_000,
  });
  const { joinState, canPost, canModerate, canStartRoom, canRequestRoom,
          canCreateQuestsEvents, canPromoteModerator, canPromoteAdmin,
          canMute, canBan, isBanned, isMuted,
          handleJoin, handleLeave, handleCancelRequest, handleRequestRoom,
          handleBan, handleMute, handleUnmute } = useClubActions({
    club,
    membership,
    userId: user?.id,
    trustTier: user?.trust_tier,
    joinRequestPending,
    hasActiveRoom,
    onMembershipChange: (m) => { setMembership(m); },
    onClubCountChange: (delta) => { setClub(c => c ? { ...c, member_count: Math.max(0, c.member_count + delta) } : c); },
    onJoinRequestChange: (pending) => { setJoinRequestPending(pending); },
  });

  const isMember    = canPost;
  const isModOrAdmin = canModerate;
  const isAdmin     = joinState === 'admin';

  // ── realtime presence ──
  useEffect(() => {
    if (!club || !user) return;
    const channel = supabase.channel(`presence:club:${club.id}`, { config: { presence: { key: user.id } } });
    channel
      .on('presence', { event: 'sync' }, () => setOnlineCount(Object.keys(channel.presenceState()).length))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ user_id: user.id, joined_at: new Date().toISOString() });
      });
    return () => { supabase.removeChannel(channel); };
  }, [club, user]);

  // ── realtime inbox requests (mod/admin only) ──
  useEffect(() => {
    if (!club || !isModOrAdmin) return;
    const channel = supabase
      .channel(`club_requests:${club.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'join_requests', filter: `club_id=eq.${club.id}` },
        () => {
          setPendingRequestCount(prev => prev + 1);
          toast.info('New join request received!', {
            action: { label: 'View', onClick: () => setActiveTab('requests') },
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'club_requests', filter: `club_id=eq.${club.id}` },
        () => {
          setPendingRequestCount(prev => prev + 1);
          toast.info('New request in inbox.', {
            action: { label: 'View', onClick: () => setActiveTab('requests') },
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'project_applications' },
        async (payload) => {
          const projectId = (payload.new as { project_id?: string }).project_id;
          if (!projectId) return;
          const { data } = await supabase
            .from('club_projects')
            .select('club_id')
            .eq('id', projectId)
            .maybeSingle();
          if (data?.club_id !== club.id) return;

          setPendingRequestCount(prev => prev + 1);
          toast.info('New project application.', {
            action: { label: 'View', onClick: () => setActiveTab('requests') },
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [club, isModOrAdmin, setPendingRequestCount]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-amber)' }} />
      </div>
    );
  }
  if (!club) return null;
  if (isBanned) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <ShieldOff className="w-12 h-12 text-red-400" />
        <h2 className="text-xl font-semibold text-navy">You are banned from this club</h2>
        <p className="text-sm text-[var(--color-text-muted)] max-w-sm">
          Contact a club admin if you believe this was a mistake.
        </p>
      </div>
    );
  }

  // Render the new specialized immersive layout for student clubs
  if (club.category === 'student') {
    return (
      <StudentClubHome
        club={club}
        user={user}
        isMember={isMember}
        canModerate={canModerate}
      />
    );
  }

  // ── Build tab list based on category template ──────────────────────────────
  const ALL_TAB_DEFS: { id: Tab; label: string; icon: React.FC<{ className?: string }>; modOnly?: boolean }[] = [
    { id: 'feed',        label: 'Activity',    icon: MessageSquare },
    { id: 'members',     label: 'Members',     icon: Users },
    { id: 'projects',    label: 'Projects',    icon: FolderKanban },
    { id: 'quests',      label: 'Quests',      icon: Sword },
    { id: 'rooms',       label: 'Voice Rooms', icon: Mic2 },
    { id: 'resources',   label: 'Resources',   icon: BookOpen },
    { id: 'playlists',   label: 'Playlists',   icon: PlaySquare },
    { id: 'events',      label: 'Events',      icon: CalendarDays },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    ...(isModOrAdmin ? [{ id: 'requests' as Tab, label: 'Requests', icon: UserCheck, modOnly: true }] : []),
  ];

  const hiddenSet = new Set<Tab>(template.hiddenTabs ?? []);

  // Build ordered list: template order first, then any remaining tabs not in order and not hidden
  const orderedIds = [
    ...template.tabOrder,
    ...ALL_TAB_DEFS.map(t => t.id).filter(id => !template.tabOrder.includes(id)),
  ];

  const TABS = orderedIds
    .filter(id => !hiddenSet.has(id))
    .map(id => ALL_TAB_DEFS.find(t => t.id === id))
    .filter((t): t is typeof ALL_TAB_DEFS[number] => !!t);


  return (
    <div className="max-w-6xl mx-auto">

      {/* ── Back ── */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-navy mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* ── Header / Banner ── */}
      <div
        className="relative mb-6 overflow-hidden rounded-[30px] border border-[rgba(196,135,58,0.16)] shadow-[0_22px_60px_rgba(196,135,58,0.14)]"
        style={{ minHeight: '220px' }}
      >
        {club.cover_image_url
          ? <img src={club.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          : <div className={`absolute inset-0 bg-gradient-to-br ${club.cover_gradient ?? catColors.gradient}`} />}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,248,241,0.16)_0%,rgba(244,240,232,0.72)_50%,rgba(255,249,243,0.96)_100%)]" />

        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-[rgba(255,249,243,0.82)] p-5 shadow-[0_18px_40px_rgba(196,135,58,0.12)] backdrop-blur-md sm:flex-row sm:items-center">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0 border-2 border-white/80"
            style={{ background: catColors.bg }}>
            {club.avatar_url
              ? <img src={club.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
              : <span>{CATEGORY_EMOJI[club.category] ?? '✨'}</span>}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                style={{ background: catColors.bg, color: catColors.text }}>
                {club.category}
              </span>
              {club.is_private
                ? <span className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-1"><Lock className="w-3 h-3" /> Private</span>
                : <span className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-1"><Globe className="w-3 h-3" /> Public</span>}
            </div>
            <h1 className="font-heading text-2xl text-[var(--color-navy)] font-bold">{club.name}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-[var(--color-text-secondary)] flex-wrap">
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {club.member_count} members</span>
              {onlineCount > 0 && (
                <span className="flex items-center gap-1.5 font-semibold" style={{ color: '#4ade80' }}>
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  {onlineCount} online now
                </span>
              )}
              {club.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {club.city}</span>}
            </div>

            {posts.filter(p => p.is_pinned).length > 0 && (
              <div className="mt-4 pt-3 border-t border-[rgba(196,135,58,0.16)]">
                <div className="flex flex-col gap-1.5">
                  {posts.filter(p => p.is_pinned).slice(0, 2).map(p => (
                    <Link key={p.id} to={`/club/${club.id}/feed`}
                      className="text-left text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-navy)] transition-colors line-clamp-1 flex items-start gap-1.5">
                      <Pin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[var(--color-amber)]" />
                      <span className="leading-tight">{p.content}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button onClick={() => setShowSettings(true)}
                className="p-2 rounded-xl bg-white/78 text-[var(--color-text-secondary)] hover:text-[var(--color-navy)] hover:bg-white transition-colors shadow-sm"
                title="Club Settings">
                <Settings className="w-4 h-4" />
              </button>
            )}
            {isMember && (
              <button
                onClick={() => navigate(`/app/club/${club.id}/chat`, { state: { clubName: club.name, clubCategory: club.category } })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[linear-gradient(135deg,#C4873A_0%,#E16B3B_100%)] text-white hover:opacity-95 transition-colors shadow-[0_8px_22px_rgba(225,107,59,0.2)]">
                <MessageSquare className="w-4 h-4" /> Live Chat
              </button>
            )}
            <ClubJoinButton
              joinState={joinState}
              isPrivate={club.is_private}
              clubId={club.id}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onCancelRequest={handleCancelRequest}
            />
          </div>
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + tabs ── */}
      <div className="flex gap-6 items-start">

        {/* ── Sidebar ── */}
        <aside className="hidden lg:flex flex-col gap-4 w-64 flex-shrink-0">
          {club.description && (
            <div className="sc-card p-4">
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{club.description}</p>
            </div>
          )}

          {events.slice(0, 2).length > 0 && (
            <div className="sc-card p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3 flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3 text-[var(--color-amber)]" /> Upcoming
              </h3>
              <div className="space-y-3">
{events.slice(0, 2).map(ev => (
                    <Link key={ev.id} to={`/club/${club.id}/events`} className="w-full text-left group">
                      <div className="font-semibold text-sm text-navy group-hover:text-[var(--color-amber)] transition-colors line-clamp-1">{ev.title}</div>
                      <div className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {format(new Date(ev.starts_at), 'MMM d, HH:mm')}
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          )}

          <div className="sc-card p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Stats</h3>
            <div className="space-y-2">
              {[
                { label: 'Members', value: club.member_count, icon: Users },
                { label: 'Posts',   value: club.post_count,   icon: MessageSquare },
                ...(onlineCount > 0 ? [{ label: 'Online', value: onlineCount, icon: Users, highlight: true }] : []),
              ].map(({ label, value, icon: Icon, highlight }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </span>
                  <span className={`font-bold text-sm ${highlight ? 'text-green-600' : 'text-navy'}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {club.tags.length > 0 && (
            <div className="sc-card p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {club.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: '#F4F0E8', color: 'var(--color-text-secondary)' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {club.rules.length > 0 && (
            <div className="sc-card p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Club Rules</h3>
              <ol className="space-y-2">
                {club.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                    <span className="font-bold text-[var(--color-amber)] flex-shrink-0">{i + 1}.</span>
                    {rule}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">

          {isMember && (
            <div className="mb-5">
              <ClubStoriesStrip clubId={club.id} clubName={club.name} isMember={isMember} />
            </div>
          )}

          {/* Tab bar */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-5 scrollbar-none">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const to = `/club/${club.id}/${tab.id}`;
              return (
                <Link key={tab.id} to={to}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold flex-shrink-0 transition-all no-underline ${
                    activeTab === tab.id ? 'text-white' : 'text-[var(--color-text-secondary)] hover:bg-white hover:text-navy'
                  }`}
                  style={activeTab === tab.id ? { background: 'linear-gradient(135deg, #C4873A 0%, #E16B3B 100%)' } : {}}>
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.id === 'requests' && pendingRequestCount > 0 && (
                    <span className="ml-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                      {pendingRequestCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Tab content */}
          {activeTab === 'feed' && (
            <TabErrorBoundary tabName="Feed">
              <FeedTab
                clubId={club.id}
                isMember={isMember}
                isPrivate={club.is_private}
              />
            </TabErrorBoundary>
          )}

          {activeTab === 'members' && (
            <MembersTab
              clubId={clubId}
              isMember={isMember}
              isPrivate={club.is_private}
              isAdmin={isAdmin}
              currentUserId={user?.id}
              canPromoteModerator={canPromoteModerator}
              canPromoteAdmin={canPromoteAdmin}
              canMute={canMute}
              canBan={canBan}
              handleBan={handleBan}
              handleMute={handleMute}
              handleUnmute={handleUnmute}
              onMemberRemoved={() => setClub(c => c ? { ...c, member_count: Math.max(0, c.member_count - 1) } : c)}
            />
          )}

          {activeTab === 'quests' && (
            <QuestsTab
              clubId={clubId}
              isMember={isMember}
              isPrivate={club.is_private}
              userId={user?.id}
              isModOrAdmin={isModOrAdmin}
              canCreateQuestsEvents={canCreateQuestsEvents}
              isMuted={isMuted}
            />
          )}

          {activeTab === 'rooms' && (
            <RoomsTab
              clubId={clubId}
              isMember={isMember}
              isPrivate={club.is_private}
              canStartRoom={canStartRoom}
              canRequestRoom={canRequestRoom}
              userId={user?.id}
              onRequestRoom={handleRequestRoom}
            />
          )}

          {activeTab === 'resources' && (
            <ResourcesTab clubId={clubId} userId={user?.id} isMember={isMember} isModOrAdmin={isModOrAdmin} />
          )}

          {activeTab === 'playlists' && (
            <PlaylistsTab clubId={club.id} userId={user?.id} canManage={isModOrAdmin} isMember={isMember} />
          )}

          {activeTab === 'events' && (
            <TabErrorBoundary tabName="Events">
              <EventsTab
                clubId={club.id}
                userId={user?.id}
                isMember={isMember}
                isModOrAdmin={isModOrAdmin}
                canCreateQuestsEvents={canCreateQuestsEvents}
                isMuted={isMuted}
                focusEventId={focusedEventId}
              />
            </TabErrorBoundary>
          )}

          {activeTab === 'projects' && (
            isMember
              ? <ProjectsTab clubId={club.id} userId={user?.id} isActiveMember={isMember} canModerate={isModOrAdmin} />
              : <MemberGate isPrivate={club.is_private} />
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardTab clubId={club.id} currentUserId={user?.id} />
          )}

          {activeTab === 'requests' && isModOrAdmin && (
            <RequestsTab
              clubId={clubId}
              club={club}
              onResolved={({ memberDelta } = {}) => {
                setPendingRequestCount(prev => Math.max(0, prev - 1));
                if (memberDelta) {
                  setClub(c => c ? { ...c, member_count: c.member_count + memberDelta } : c);
                }
              }}
            />
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showSettings && (
        <ClubSettingsModal
          club={club}
          canBan={canBan}
          onClose={() => setShowSettings(false)}
          onUpdated={(updated) => { setClub(updated); setShowSettings(false); }}
          onDeleted={() => navigate('/app/discover')}
        />
      )}
    </div>
  );
}
