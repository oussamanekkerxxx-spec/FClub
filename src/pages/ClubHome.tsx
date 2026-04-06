import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Users, MessageSquare, Sword, Mic2, BookOpen, CalendarDays,
  Lock, Globe, MapPin, Clock,
  ArrowLeft, Settings,
  FolderKanban, Trophy, UserCheck, PlaySquare, Pin, Loader2,
} from 'lucide-react';
import { useClubActions } from '@/hooks/useClubActions';
import { useClubData } from '@/hooks/useClubData';
import { queryKeys } from '@/lib/queryKeys';
import { CATEGORY_COLORS_WITH_GRADIENT } from '@/constants/categories';
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
import { format } from 'date-fns';

const CATEGORY_COLORS = CATEGORY_COLORS_WITH_GRADIENT;

type Tab = 'feed' | 'members' | 'quests' | 'rooms' | 'resources' | 'playlists' | 'events' | 'projects' | 'leaderboard' | 'requests';

const VALID_TABS: Tab[] = ['feed', 'members', 'quests', 'rooms', 'resources', 'playlists', 'events', 'projects', 'leaderboard', 'requests'];

export default function ClubHome() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    club, membership, joinRequestPending, pendingRequestCount,
    pinnedPosts: posts, upcomingEvents: events, loading,
    setClub, setMembership, setJoinRequestPending, setPendingRequestCount,
  } = useClubData({ id, userId: user?.id });

  const tabFromQuery = useMemo(() => {
    const value = new URLSearchParams(location.search).get('tab');
    return value && VALID_TABS.includes(value as Tab) ? (value as Tab) : null;
  }, [location.search]);
  const focusedEventId = useMemo(
    () => new URLSearchParams(location.search).get('event'),
    [location.search]
  );

  const [activeTab, setActiveTab] = useState<Tab>(tabFromQuery ?? 'feed');
  const [showSettings, setShowSettings] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  const clubId = club?.id ?? '';
  const catColors = club ? (CATEGORY_COLORS[club.category] ?? CATEGORY_COLORS.music) : CATEGORY_COLORS.music;

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
          handleJoin, handleLeave, handleCancelRequest, handleRequestRoom } = useClubActions({
    club,
    membership,
    userId: user?.id,
    joinRequestPending,
    hasActiveRoom,
    onMembershipChange: (m) => { setMembership(m); },
    onClubCountChange: (delta) => { setClub(c => c ? { ...c, member_count: Math.max(0, c.member_count + delta) } : c); },
    onJoinRequestChange: (pending) => { setJoinRequestPending(pending); },
  });

  const isMember    = canPost;
  const isModOrAdmin = canModerate;
  const isAdmin     = joinState === 'admin';

  useEffect(() => {
    if (!tabFromQuery) return;
    if (tabFromQuery === 'requests' && !isModOrAdmin) {
      setActiveTab('feed');
      return;
    }
    setActiveTab(tabFromQuery);
  }, [tabFromQuery, isModOrAdmin]);

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

  const TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }>; modOnly?: boolean }[] = [
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

  return (
    <div className="max-w-6xl mx-auto">

      {/* ── Back ── */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-navy mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* ── Header / Banner ── */}
      <div className="relative rounded-2xl overflow-hidden mb-6" style={{ minHeight: '200px' }}>
        {club.cover_image_url
          ? <img src={club.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          : <div className={`absolute inset-0 bg-gradient-to-br ${club.cover_gradient ?? catColors.gradient}`} />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="relative p-6 flex flex-col sm:flex-row items-end sm:items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0 border-2 border-white/30"
            style={{ background: catColors.bg }}>
            {club.avatar_url
              ? <img src={club.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
              : <span>{club.category === 'music' ? '🎵' : club.category === 'technology' ? '💻' : club.category === 'art' ? '🎨' : club.category === 'cooking' ? '🍳' : club.category === 'fitness' ? '💪' : '✨'}</span>}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                style={{ background: catColors.bg, color: catColors.text }}>
                {club.category}
              </span>
              {club.is_private
                ? <span className="text-xs font-semibold text-white/70 flex items-center gap-1"><Lock className="w-3 h-3" /> Private</span>
                : <span className="text-xs font-semibold text-white/70 flex items-center gap-1"><Globe className="w-3 h-3" /> Public</span>}
            </div>
            <h1 className="font-heading text-2xl text-white font-bold">{club.name}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-white/70 flex-wrap">
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
              <div className="mt-4 pt-3 border-t border-white/20">
                <div className="flex flex-col gap-1.5">
                  {posts.filter(p => p.is_pinned).slice(0, 2).map(p => (
                    <button key={p.id} onClick={() => setActiveTab('feed')}
                      className="text-left text-[13px] text-white/80 hover:text-white transition-colors line-clamp-1 flex items-start gap-1.5">
                      <Pin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[var(--color-amber)]" />
                      <span className="leading-tight">{p.content}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button onClick={() => setShowSettings(true)}
                className="p-2 rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                title="Club Settings">
                <Settings className="w-4 h-4" />
              </button>
            )}
            {isMember && (
              <button
                onClick={() => navigate(`/app/club/${club.id}/chat`, { state: { clubName: club.name, clubCategory: club.category } })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 text-white hover:bg-white hover:text-[var(--color-navy)] transition-colors backdrop-blur-sm">
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
                  <button key={ev.id} onClick={() => setActiveTab('events')} className="w-full text-left group">
                    <div className="font-semibold text-sm text-navy group-hover:text-[var(--color-amber)] transition-colors line-clamp-1">{ev.title}</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {format(new Date(ev.starts_at), 'MMM d, HH:mm')}
                    </div>
                  </button>
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
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </span>
                  <span className="font-bold text-sm text-navy">{value}</span>
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

          {/* Tab bar */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-5 scrollbar-none">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold flex-shrink-0 transition-all ${
                    activeTab === tab.id ? 'text-white' : 'text-[var(--color-text-secondary)] hover:bg-white hover:text-navy'
                  }`}
                  style={activeTab === tab.id ? { background: 'var(--color-navy)' } : {}}>
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.id === 'requests' && pendingRequestCount > 0 && (
                    <span className="ml-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                      {pendingRequestCount}
                    </span>
                  )}
                </button>
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
          onClose={() => setShowSettings(false)}
          onUpdated={(updated) => { setClub(updated); setShowSettings(false); }}
          onDeleted={() => navigate('/app/discover')}
        />
      )}
    </div>
  );
}
