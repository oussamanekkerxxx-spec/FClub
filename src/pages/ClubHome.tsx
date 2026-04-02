import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import type {
  Club, ClubMembership, ClubPost, Quest, VoiceRoom, ClubResource, ClubEvent,
} from '@/types/fightclub';
import {
  Users, MessageSquare, Sword, Mic2, BookOpen, CalendarDays,
  Lock, Globe, Flame, ChevronRight, MapPin, Clock,
  ExternalLink, FileText, Video, Image, Check, Loader2,
  Trash2, Pin, Mic, MicOff, ArrowLeft, Link as LinkIcon,
  Settings, UserCheck, UserX, UserMinus, Shield,
  Code2, BarChart2, Tag, ImageIcon, X, Plus, PlusCircle, Upload, Film, Paperclip,
  FolderKanban, Trophy, Mail, UserPlus, UserMinus as UserMinusIcon, PlaySquare,
} from 'lucide-react';
import { useClubActions } from '@/hooks/useClubActions';
import { uploadToCloudinary } from '@/lib/cloudinary';
import ClubJoinButton from '@/components/clubs/ClubJoinButton';
import StartRoomModal from '@/components/clubs/StartRoomModal';
import RequestRoundButton from '@/components/clubs/RequestRoundButton';
import ClubSettingsModal from '@/components/clubs/ClubSettingsModal';
import ProjectsTab from '@/components/clubs/ProjectsTab';
import LeaderboardTab from '@/components/clubs/LeaderboardTab';
import PlaylistsTab from '@/components/clubs/PlaylistsTab';
import { formatDistanceToNow, format } from 'date-fns';

const POST_TOPIC_TAGS = [
  'AI', 'Web Dev', 'Cybersecurity', 'Mobile', 'DevOps',
  'Design', 'Data Science', 'Open Source', 'Career', 'Tutorial',
];

const DRAFT_KEY = (clubId: string) => `club_post_draft_${clubId}`;

// ─── helpers ────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, { bg: string; text: string; gradient: string }> = {
  music:       { bg: '#F3E8FF', text: '#7C3AED', gradient: 'from-purple-600 to-pink-500' },
  languages:   { bg: '#E0F2FE', text: '#0369A1', gradient: 'from-blue-500 to-cyan-400' },
  technology:  { bg: '#EEF2FF', text: '#4338CA', gradient: 'from-indigo-600 to-blue-500' },
  cooking:     { bg: '#FEF3C7', text: '#D97706', gradient: 'from-orange-400 to-red-500' },
  art:         { bg: '#FFF0F0', text: '#DC2626', gradient: 'from-amber-500 to-orange-600' },
  fitness:     { bg: '#DCFCE7', text: '#16A34A', gradient: 'from-green-500 to-teal-400' },
  photography: { bg: '#F1F5F9', text: '#475569', gradient: 'from-slate-600 to-gray-700' },
  business:    { bg: '#FEF9C3', text: '#CA8A04', gradient: 'from-yellow-500 to-amber-500' },
  writing:     { bg: '#EDE9FE', text: '#6D28D9', gradient: 'from-violet-500 to-purple-600' },
  crafts:      { bg: '#FDF2F8', text: '#BE185D', gradient: 'from-pink-500 to-rose-500' },
};

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  beginner:     { bg: '#DCFCE7', text: '#16A34A' },
  intermediate: { bg: '#FEF9C3', text: '#CA8A04' },
  advanced:     { bg: '#FEE2E2', text: '#DC2626' },
};

const RESOURCE_ICONS: Record<string, React.FC<any>> = {
  link: LinkIcon, document: FileText, video: Video, image: Image,
};

type Tab = 'feed' | 'members' | 'quests' | 'rooms' | 'resources' | 'playlists' | 'events' | 'projects' | 'leaderboard' | 'requests';
type PostType = 'text' | 'code' | 'poll';
type AttachmentType = 'image' | 'video' | 'pdf';
interface PostAttachment { file: File; type: AttachmentType; previewUrl: string; }

// ─── gate overlay ────────────────────────────────────────────
function MemberGate({ isPrivate }: { isPrivate: boolean }) {
  return (
    <div className="sc-card p-10 text-center">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
        style={{ background: '#F4F0E8' }}>
        {isPrivate ? <Lock className="w-6 h-6 text-[var(--color-text-muted)]" /> : <Users className="w-6 h-6 text-[var(--color-text-muted)]" />}
      </div>
      <p className="font-semibold text-navy text-sm mb-1">Members only</p>
      <p className="text-xs text-[var(--color-text-secondary)]">
        {isPrivate ? 'Request to join to access this content.' : 'Join the club to access this content.'}
      </p>
    </div>
  );
}

// ─── sub-components ─────────────────────────────────────────

function PostCard({
  post, currentUserId, isMember, canModerate, onReact, onDelete, onPin,
}: {
  post: ClubPost;
  currentUserId: string | undefined;
  isMember: boolean;
  canModerate: boolean;
  onReact: (postId: string) => void;
  onDelete: (postId: string) => void;
  onPin: (postId: string, current: boolean) => void;
}) {
  const isOwn = post.author_id === currentUserId;
  const reacted = !!post.my_reaction;

  return (
    <div className={`sc-card p-5 ${post.is_pinned ? 'border-l-4 border-l-[var(--color-amber)]' : ''}`}>
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 text-[var(--color-amber)] text-xs font-semibold mb-3">
          <Pin className="w-3 h-3" /> Pinned
        </div>
      )}
      <div className="flex items-start gap-3">
        <Avatar className="w-9 h-9 flex-shrink-0">
          <AvatarImage src={post.author?.avatar_url ?? undefined} />
          <AvatarFallback style={{ background: 'var(--color-plum)', color: 'white', fontSize: '13px' }}>
            {post.author?.first_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-sm text-navy">
                {post.author?.first_name} {post.author?.last_name}
              </span>
              <span className="text-xs text-[var(--color-text-muted)] ml-2">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {canModerate && (
                <button
                  onClick={() => onPin(post.id, post.is_pinned)}
                  title={post.is_pinned ? 'Unpin' : 'Pin post'}
                  className={`p-1.5 rounded-lg transition-colors ${post.is_pinned ? 'text-[var(--color-amber)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-amber)]'} hover:bg-amber-50`}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
              )}
              {(isOwn || canModerate) && (
                <button
                  onClick={() => onDelete(post.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
          {post.image_url && (
            <img
              src={post.image_url}
              alt=""
              className="mt-3 rounded-xl max-h-64 object-cover w-full"
            />
          )}
          {post.video_url && (
            <video
              src={post.video_url}
              controls
              className="mt-3 rounded-xl w-full max-h-72 bg-black"
            />
          )}
          {post.pdf_url && (
            <a
              href={post.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[var(--color-border)] hover:bg-parchment transition-colors text-sm font-medium text-navy"
            >
              <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="truncate">{decodeURIComponent(post.pdf_url.split('/').pop() ?? 'document.pdf')}</span>
              <ExternalLink className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-[var(--color-text-muted)]" />
            </a>
          )}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--color-border)]">
            <button
              disabled={!isMember}
              onClick={() => onReact(post.id)}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                reacted ? 'text-[var(--color-amber)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-amber)]'
              } disabled:opacity-40`}
            >
              <Flame className="w-4 h-4" />
              {post.reaction_count}
            </button>
            <span className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
              <MessageSquare className="w-4 h-4" />
              {post.comment_count}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestCard({
  quest, isMember, onJoin, onLeave, onStepToggle,
}: {
  quest: Quest;
  isMember: boolean;
  onJoin: (questId: string) => void;
  onLeave: (questId: string) => void;
  onStepToggle: (stepId: string, questId: string, current: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const diff = DIFFICULTY_COLORS[quest.difficulty] ?? DIFFICULTY_COLORS.beginner;
  const completedSteps = quest.steps?.filter(s => s.is_completed).length ?? 0;
  const totalSteps = quest.steps?.length ?? quest.step_count;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const statusColor: Record<string, string> = {
    open: 'var(--color-forest)', in_progress: 'var(--color-amber)',
    completed: 'var(--color-plum)', cancelled: '#9CA3AF',
  };

  return (
    <div className="sc-card overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: diff.bg, color: diff.text }}
              >
                {quest.difficulty}
              </span>
              <span className="text-[10px] font-semibold" style={{ color: statusColor[quest.status] }}>
                ● {quest.status.replace('_', ' ')}
              </span>
            </div>
            <h3 className="font-semibold text-navy text-sm">{quest.title}</h3>
            {quest.description && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">{quest.description}</p>
            )}
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg hover:bg-parchment transition-colors flex-shrink-0"
          >
            <ChevronRight className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {totalSteps > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--color-text-muted)]">{completedSteps}/{totalSteps} steps</span>
              <span className="font-semibold" style={{ color: 'var(--color-amber)' }}>{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, background: 'var(--color-amber)' }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <Users className="w-3.5 h-3.5" />
            {quest.participant_count} participant{quest.participant_count !== 1 ? 's' : ''}
            {quest.max_participants && ` / ${quest.max_participants}`}
          </div>
          {isMember && quest.status !== 'completed' && quest.status !== 'cancelled' && (
            quest.i_am_participant ? (
              <button
                onClick={() => onLeave(quest.id)}
                className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
              >
                Leave
              </button>
            ) : (
              <button
                onClick={() => onJoin(quest.id)}
                className="text-xs font-semibold btn-amber px-3 py-1"
                style={{ padding: '4px 12px', fontSize: '12px' }}
              >
                Join Quest
              </button>
            )
          )}
        </div>
      </div>

      {expanded && quest.steps && quest.steps.length > 0 && (
        <div className="border-t border-[var(--color-border)] px-5 py-3 space-y-2 bg-[#FAFAF8]">
          {quest.steps.map(step => (
            <div key={step.id} className="flex items-center gap-3">
              <button
                disabled={!quest.i_am_participant}
                onClick={() => onStepToggle(step.id, quest.id, step.is_completed)}
                className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                  step.is_completed
                    ? 'bg-[var(--color-forest)] border-[var(--color-forest)]'
                    : 'border-gray-300 hover:border-[var(--color-forest)]'
                } disabled:opacity-40`}
              >
                {step.is_completed && <Check className="w-3 h-3 text-white" />}
              </button>
              <span className={`text-sm ${step.is_completed ? 'line-through text-[var(--color-text-muted)]' : 'text-navy'}`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── main page ──────────────────────────────────────────────
export default function ClubHome() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [club, setClub] = useState<Club | null>(null);
  const [membership, setMembership] = useState<ClubMembership | null>(null);
  const [joinRequestPending, setJoinRequestPending] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [loading, setLoading] = useState(true);
  const [showRoomModal, setShowRoomModal] = useState(false);

  // rich post composer
  const [posts, setPosts] = useState<ClubPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [postType, setPostType] = useState<PostType>('text');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [postCodeLang, setPostCodeLang] = useState('typescript');
  const [postTopicTags, setPostTopicTags] = useState<string[]>([]);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [postingPost, setPostingPost] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [postAttachment, setPostAttachment] = useState<PostAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingAttachTypeRef = useRef<AttachmentType>('image');

  // active presence
  const [onlineCount, setOnlineCount] = useState(0);

  // members
  const [members, setMembers] = useState<ClubMembership[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);

  // quests
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questsLoaded, setQuestsLoaded] = useState(false);

  // voice rooms
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [roomsLoaded, setRoomsLoaded] = useState(false);

  // resources
  const [resources, setResources] = useState<ClubResource[]>([]);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [addingResource, setAddingResource] = useState(false);

  // events + create form
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('18:00');
  const [eventDuration, setEventDuration] = useState('60');
  const [eventDesc, setEventDesc] = useState('');
  const [eventIsOnline, setEventIsOnline] = useState(true);
  const [eventLink, setEventLink] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [myRsvpIds, setMyRsvpIds] = useState<Set<string>>(new Set());

  // join requests (mod/admin only)
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsLoaded, setRequestsLoaded] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  // settings modal
  const [showSettings, setShowSettings] = useState(false);

  const hasActiveRoom = rooms.some(r => r.status === 'active');
  const { joinState, canPost, canModerate, canStartRoom, canRequestRoom,
          handleJoin, handleLeave, handleCancelRequest, handleRequestRoom } = useClubActions({
    club,
    membership,
    userId: user?.id,
    joinRequestPending,
    hasActiveRoom,
    onMembershipChange: (m) => { setMembership(m); },
    onClubCountChange: (delta) => {
      setClub(c => c ? { ...c, member_count: Math.max(0, c.member_count + delta) } : c);
    },
    onJoinRequestChange: (pending) => { setJoinRequestPending(pending); },
  });

  const isMember    = canPost;
  const isModOrAdmin = canModerate;
  const isAdmin     = joinState === 'admin';
  const catColors   = club ? (CATEGORY_COLORS[club.category] ?? CATEGORY_COLORS.music) : CATEGORY_COLORS.music;

  // ── load club + my membership ──
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const lookup = id.includes('-') && !id.match(/^[0-9a-f-]{36}$/)
      ? supabase.from('clubs').select('*').eq('slug', id).single()
      : supabase.from('clubs').select('*').eq('id', id).single();

    lookup.then(async ({ data: clubData, error }) => {
      if (error || !clubData) { navigate('/discover'); return; }
      setClub(clubData);

      if (user) {
        const [{ data: mem }, { data: req }] = await Promise.all([
          supabase.from('club_memberships').select('*').eq('club_id', clubData.id).eq('user_id', user.id).maybeSingle(),
          supabase.from('join_requests').select('id').eq('club_id', clubData.id).eq('user_id', user.id).eq('status', 'pending').maybeSingle(),
        ]);
        setMembership(mem ?? null);
        setJoinRequestPending(!!req);

        // Pre-load pending request count for mods/admins
        const isMod = mem?.role === 'moderator' || mem?.role === 'admin';
        if (isMod) {
          const { count } = await supabase
            .from('join_requests')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', clubData.id)
            .eq('status', 'pending');
          setPendingRequestCount(count ?? 0);
        }

        // Load draft from localStorage
        const saved = localStorage.getItem(DRAFT_KEY(clubData.id));
        if (saved) setNewPostContent(saved);
      }
      setLoading(false);
    });
  }, [id, user, navigate]);

  // ── realtime presence for active-now indicator ──
  useEffect(() => {
    if (!club || !user) return;
    const channel = supabase.channel(`presence:club:${club.id}`, { config: { presence: { key: user.id } } });
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, joined_at: new Date().toISOString() });
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [club, user]);

  // ── auto-save draft ──
  useEffect(() => {
    if (!club) return;
    if (newPostContent.trim()) {
      localStorage.setItem(DRAFT_KEY(club.id), newPostContent);
    } else {
      localStorage.removeItem(DRAFT_KEY(club.id));
    }
  }, [newPostContent, club]);

  // ── load my RSVPs when events load ──
  const rsvpsLoadedRef = useRef(false);
  useEffect(() => {
    if (!user || events.length === 0 || rsvpsLoadedRef.current) return;
    rsvpsLoadedRef.current = true;
    supabase
      .from('event_rsvps')
      .select('event_id')
      .eq('user_id', user.id)
      .in('event_id', events.map(e => e.id))
      .then(({ data }) => {
        if (data) setMyRsvpIds(new Set(data.map((r: any) => r.event_id)));
      });
  }, [events, user]);

  // ── load feed ──
  useEffect(() => {
    if (!club) return;
    supabase
      .from('club_posts')
      .select('*, author:profiles!club_posts_author_id_fkey(id, first_name, last_name, avatar_url, trust_tier)')
      .eq('club_id', club.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30)
      .then(async ({ data }) => {
        if (!data) return;
        // fetch my reactions
        if (user) {
          const postIds = data.map(p => p.id);
          const { data: reactions } = await supabase
            .from('club_post_reactions')
            .select('post_id, emoji')
            .eq('user_id', user.id)
            .in('post_id', postIds);
          const reactionMap = Object.fromEntries((reactions ?? []).map(r => [r.post_id, { emoji: r.emoji }]));
          setPosts(data.map(p => ({ ...p, my_reaction: reactionMap[p.id] ?? null })));
        } else {
          setPosts(data.map(p => ({ ...p, my_reaction: null })));
        }
      });
  }, [club, user]);

  // ── real-time feed subscription ──
  useEffect(() => {
    if (!club) return;
    const channel = supabase
      .channel(`club_posts:${club.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'club_posts', filter: `club_id=eq.${club.id}` },
        (payload) => {
          if (payload.new) {
            setPosts(prev => [{ ...payload.new, my_reaction: null } as any, ...prev]);
          }
        }
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'club_posts', filter: `club_id=eq.${club.id}` },
        (payload) => setPosts(prev => prev.filter(p => p.id !== payload.old.id))
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [club]);

  // ── realtime join requests (mod/admin only) ──
  useEffect(() => {
    if (!club || !isModOrAdmin) return;
    const channel = supabase
      .channel(`join_requests:${club.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'join_requests', filter: `club_id=eq.${club.id}` },
        async (payload) => {
          setPendingRequestCount(prev => prev + 1);
          toast.info('New join request received!', {
            action: { label: 'View', onClick: () => setActiveTab('requests') },
          });
          // If the Requests tab is already open/loaded, fetch the full row and prepend it
          if (requestsLoaded) {
            const { data } = await supabase
              .from('join_requests')
              .select('*, profile:profiles!join_requests_user_id_fkey(id, first_name, last_name, avatar_url, city)')
              .eq('id', payload.new.id)
              .single();
            if (data) setRequests(prev => [data, ...prev]);
          } else {
            setRequestsLoaded(false); // force re-fetch next time tab is opened
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club, isModOrAdmin, requestsLoaded]);

  // ── lazy load tabs ──
  useEffect(() => {
    if (!club) return;
    if (activeTab === 'members' && !membersLoaded) {
      supabase
        .from('club_memberships')
        .select('*, profile:profiles!club_memberships_user_id_fkey(id, first_name, last_name, avatar_url, trust_tier, city)')
        .eq('club_id', club.id)
        .eq('status', 'active')
        .order('role')
        .limit(50)
        .then(({ data }) => { if (data) setMembers(data); setMembersLoaded(true); });
    }
    if (activeTab === 'quests' && !questsLoaded) {
      supabase
        .from('quests')
        .select('*, steps:quest_steps(*), participants:quest_participants(user_id)')
        .eq('club_id', club.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) {
            setQuests(data.map(q => ({
              ...q,
              steps: q.steps?.sort((a: any, b: any) => a.order_index - b.order_index),
              i_am_participant: user ? q.participants?.some((p: any) => p.user_id === user.id) : false,
            })));
          }
          setQuestsLoaded(true);
        });
    }
    if (activeTab === 'rooms' && !roomsLoaded) {
      supabase
        .from('voice_rooms')
        .select('*, host:profiles!voice_rooms_host_id_fkey(first_name, last_name, avatar_url)')
        .eq('club_id', club.id)
        .neq('status', 'ended')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setRooms(data.map(r => ({ ...r, i_am_participant: false })));
          setRoomsLoaded(true);
        });
    }
    if (activeTab === 'resources' && !resourcesLoaded) {
      supabase
        .from('club_resources')
        .select('*, adder:profiles!club_resources_added_by_fkey(first_name, last_name, avatar_url)')
        .eq('club_id', club.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => { if (data) setResources(data); setResourcesLoaded(true); });
    }
    if (activeTab === 'events' && !eventsLoaded) {
      supabase
        .from('club_events')
        .select('*')
        .eq('club_id', club.id)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at')
        .then(({ data }) => { if (data) setEvents(data); setEventsLoaded(true); });
    }
    if (activeTab === 'requests' && !requestsLoaded) {
      supabase
        .from('join_requests')
        .select('*, profile:profiles!join_requests_user_id_fkey(id, first_name, last_name, avatar_url, city)')
        .eq('club_id', club.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) {
            setRequests(data);
            setPendingRequestCount(data.length); // sync badge with actual DB count
          }
          setRequestsLoaded(true);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, club]);

  // ── actions ──
  const handlePost = async () => {
    if (!user || !club || !newPostContent.trim()) return;
    setPostingPost(true);

    // Upload attachment to Cloudinary if present
    let uploadedImageUrl = postImageUrl.trim() || null;
    let uploadedVideoUrl: string | null = null;
    let uploadedPdfUrl: string | null = null;

    if (postAttachment) {
      const MAX_BYTES = 100 * 1024 * 1024; // 100 MB
      if (postAttachment.file.size > MAX_BYTES) {
        toast.error('File is too large. Maximum size is 100 MB.');
        setPostingPost(false);
        return;
      }
      try {
        setUploadProgress(1);
        const result = await uploadToCloudinary(postAttachment.file, setUploadProgress);
        setUploadProgress(0);
        if (postAttachment.type === 'image') uploadedImageUrl = result.url;
        else if (postAttachment.type === 'video') uploadedVideoUrl = result.url;
        else if (postAttachment.type === 'pdf') uploadedPdfUrl = result.url;
      } catch (err: any) {
        toast.error('Upload failed: ' + (err?.message ?? 'unknown error'));
        setUploadProgress(0);
        setPostingPost(false);
        return;
      }
    }

    // Full payload (requires migration 22/23 to have been applied)
    const richPayload: any = {
      club_id: club.id,
      author_id: user.id,
      content: newPostContent.trim(),
      post_type: postType,
      topic_tags: postTopicTags,
    };
    if (postType === 'code') richPayload.code_lang = postCodeLang;
    if (postType === 'poll') richPayload.poll_options = pollOptions.filter(o => o.trim()).map(text => ({ text, votes: 0 }));
    if (uploadedImageUrl) richPayload.image_url = uploadedImageUrl;
    if (uploadedVideoUrl) richPayload.video_url = uploadedVideoUrl;
    if (uploadedPdfUrl) richPayload.pdf_url = uploadedPdfUrl;

    let { error } = await supabase.from('club_posts').insert(richPayload);

    // Fallback: if new columns don't exist yet, retry with just the core fields
    if (error?.code === '42703' || error?.message?.includes('column') || error?.message?.includes('400')) {
      const fallback = await supabase.from('club_posts').insert({
        club_id: club.id,
        author_id: user.id,
        content: newPostContent.trim(),
        ...(uploadedImageUrl ? { image_url: uploadedImageUrl } : {}),
      });
      error = fallback.error;
    }

    if (!error) {
      setNewPostContent('');
      setPostImageUrl('');
      setPostTopicTags([]);
      setPostType('text');
      setPollOptions(['', '']);
      setPostAttachment(null);
      localStorage.removeItem(DRAFT_KEY(club.id));
    } else {
      toast.error('Could not post. Make sure you have applied the latest DB migrations.');
      console.error('[handlePost]', error);
    }
    setPostingPost(false);
  };

  const handleCreateEvent = async () => {
    if (!user || !club || !eventTitle.trim() || !eventDate) return;
    setCreatingEvent(true);
    const starts_at = new Date(`${eventDate}T${eventTime}`).toISOString();

    // Try rich payload first (needs migration 22/23)
    let result = await supabase.from('club_events').insert({
      club_id: club.id,
      title: eventTitle.trim(),
      description: eventDesc.trim() || null,
      starts_at,
      duration_mins: parseInt(eventDuration) || 60,
      is_online: eventIsOnline,
      meeting_link: eventLink.trim() || null,
      location: !eventIsOnline ? eventLocation.trim() || null : null,
      format: eventIsOnline ? 'online' : 'in_person',
      created_by: user.id,
    }).select().single();

    // Fallback: core columns only if new columns don't exist yet
    if (result.error?.code === '42703' || result.error?.message?.includes('column')) {
      result = await supabase.from('club_events').insert({
        club_id: club.id,
        title: eventTitle.trim(),
        description: eventDesc.trim() || null,
        starts_at,
        format: eventIsOnline ? 'online' : 'in_person',
        location: !eventIsOnline ? eventLocation.trim() || null : null,
        created_by: user.id,
      }).select().single();
    }

    const { data, error } = result;
    if (error) {
      toast.error('Could not create event. Check DB migrations are applied.');
      console.error('[handleCreateEvent]', error);
    } else {
      setEvents(prev => [data, ...prev].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()));
      setShowCreateEvent(false);
      setEventTitle(''); setEventDesc(''); setEventDate(''); setEventLink(''); setEventLocation('');
      toast.success('Event created!');
    }
    setCreatingEvent(false);
  };

  const handleRsvp = async (eventId: string) => {
    if (!user) return;
    const already = myRsvpIds.has(eventId);
    if (already) {
      await supabase.from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', user.id);
      setMyRsvpIds(prev => { const s = new Set(prev); s.delete(eventId); return s; });
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, rsvp_count: Math.max(0, (e as any).rsvp_count - 1) } : e));
    } else {
      await supabase.from('event_rsvps').insert({ event_id: eventId, user_id: user.id });
      setMyRsvpIds(prev => new Set([...prev, eventId]));
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, rsvp_count: ((e as any).rsvp_count ?? 0) + 1 } : e));
    }
  };

  const handleReact = async (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    if (post.my_reaction) {
      await supabase.from('club_post_reactions').delete().eq('post_id', postId).eq('user_id', user.id);
      setPosts(prev => prev.map(p => p.id === postId
        ? { ...p, reaction_count: p.reaction_count - 1, my_reaction: null }
        : p));
    } else {
      await supabase.from('club_post_reactions').insert({ post_id: postId, user_id: user.id, emoji: '🔥' });
      setPosts(prev => prev.map(p => p.id === postId
        ? { ...p, reaction_count: p.reaction_count + 1, my_reaction: { emoji: '🔥' } }
        : p));
    }
  };

  const handleDeletePost = async (postId: string) => {
    await supabase.from('club_posts').delete().eq('id', postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleJoinQuest = async (questId: string) => {
    if (!user) return;
    const { error } = await supabase.from('quest_participants').insert({ quest_id: questId, user_id: user.id });
    if (!error) {
      setQuests(prev => prev.map(q => q.id === questId
        ? { ...q, participant_count: q.participant_count + 1, i_am_participant: true }
        : q));
      toast.success('You joined this quest!');
    }
  };

  const handleLeaveQuest = async (questId: string) => {
    if (!user) return;
    await supabase.from('quest_participants').delete().eq('quest_id', questId).eq('user_id', user.id);
    setQuests(prev => prev.map(q => q.id === questId
      ? { ...q, participant_count: Math.max(0, q.participant_count - 1), i_am_participant: false }
      : q));
  };

  const handleStepToggle = async (stepId: string, questId: string, current: boolean) => {
    if (!user) return;
    await supabase.from('quest_steps').update({
      is_completed: !current,
      completed_by: !current ? user.id : null,
      completed_at: !current ? new Date().toISOString() : null,
    }).eq('id', stepId);
    setQuests(prev => prev.map(q => q.id === questId ? {
      ...q,
      steps: q.steps?.map(s => s.id === stepId ? { ...s, is_completed: !current } : s),
    } : q));
  };

  const handleAddResource = async () => {
    if (!user || !club || !newResourceTitle.trim()) return;
    setAddingResource(true);
    const { data, error } = await supabase
      .from('club_resources')
      .insert({ club_id: club.id, title: newResourceTitle.trim(), url: newResourceUrl.trim() || null, added_by: user.id })
      .select('*, adder:profiles!club_resources_added_by_fkey(first_name, last_name, avatar_url)')
      .single();
    if (!error && data) {
      setResources(prev => [data, ...prev]);
      setNewResourceTitle('');
      setNewResourceUrl('');
      toast.success('Resource added!');
    }
    setAddingResource(false);
  };

  const handleDeleteResource = async (resourceId: string) => {
    await supabase.from('club_resources').delete().eq('id', resourceId);
    setResources(prev => prev.filter(r => r.id !== resourceId));
  };

  const handlePin = async (postId: string, current: boolean) => {
    await supabase.from('club_posts').update({ is_pinned: !current }).eq('id', postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_pinned: !current } : p));
  };

  const handleApproveRequest = async (requestId: string, userId: string) => {
    if (!club) return;

    // Try updating an existing (pending) membership row first
    const { data: existing } = await supabase
      .from('club_memberships')
      .select('id')
      .eq('club_id', club.id)
      .eq('user_id', userId)
      .maybeSingle();

    let error;
    if (existing) {
      // Row exists (e.g. status = 'pending') → promote to active
      ({ error } = await supabase
        .from('club_memberships')
        .update({ role: 'member', status: 'active' })
        .eq('id', existing.id));
    } else {
      // No row yet → fresh insert
      ({ error } = await supabase
        .from('club_memberships')
        .insert({ club_id: club.id, user_id: userId, role: 'member', status: 'active' }));
    }

    if (error) {
      toast.error('Could not approve request.');
      console.error('[handleApproveRequest]', error);
      return;
    }

    await supabase.from('join_requests').update({ status: 'approved' }).eq('id', requestId);

    // Notify the approved user — fire and forget
    supabase.from('notifications').insert({
      user_id: userId,
      type: 'join_approved',
      title: 'Request approved!',
      body: `You've been approved to join ${club.name}.`,
      link: `/club/${club.slug ?? club.id}`,
    });

    setRequests(prev => prev.filter(r => r.id !== requestId));
    setPendingRequestCount(prev => Math.max(0, prev - 1));
    setClub(c => c ? { ...c, member_count: c.member_count + 1 } : c);
    toast.success('Request approved!');
  };

  const handleDenyRequest = async (requestId: string, userId: string) => {
    const { error } = await supabase
      .from('join_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);
    if (error) { toast.error('Could not deny request.'); return; }
    setRequests(prev => prev.filter(r => r.id !== requestId));
    setPendingRequestCount(prev => Math.max(0, prev - 1));
    toast('Request denied.');
  };

  const handleChangeMemberRole = async (membershipId: string, newRole: 'member' | 'moderator') => {
    const { error } = await supabase
      .from('club_memberships').update({ role: newRole }).eq('id', membershipId);
    if (!error) {
      setMembers(prev => prev.map(m => m.id === membershipId ? { ...m, role: newRole } : m));
      toast.success(`Role updated to ${newRole}.`);
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    await supabase.from('club_memberships').delete().eq('id', membershipId);
    setMembers(prev => prev.filter(m => m.id !== membershipId));
    setClub(c => c ? { ...c, member_count: Math.max(0, c.member_count - 1) } : c);
    toast('Member removed.');
  };

  // ── loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-amber)' }} />
      </div>
    );
  }
  if (!club) return null;

  const TABS: { id: Tab; label: string; icon: React.FC<any>; modOnly?: boolean }[] = [
    { id: 'feed',        label: 'Feed',        icon: MessageSquare },
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
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-navy mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* ── Header / Banner ── */}
      <div
        className="relative rounded-2xl overflow-hidden mb-6"
        style={{ minHeight: '200px' }}
      >
        {club.cover_image_url ? (
          <img src={club.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${club.cover_gradient ?? catColors.gradient}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="relative p-6 flex flex-col sm:flex-row items-end sm:items-center gap-4">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0 border-2 border-white/30"
            style={{ background: catColors.bg }}
          >
            {club.avatar_url
              ? <img src={club.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
              : <span>{club.category === 'music' ? '🎵' : club.category === 'technology' ? '💻' : club.category === 'art' ? '🎨' : club.category === 'cooking' ? '🍳' : club.category === 'fitness' ? '💪' : '✨'}</span>
            }
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                style={{ background: catColors.bg, color: catColors.text }}
              >
                {club.category}
              </span>
              {club.is_private ? (
                <span className="text-xs font-semibold text-white/70 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Private
                </span>
              ) : (
                <span className="text-xs font-semibold text-white/70 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Public
                </span>
              )}
            </div>
            <h1 className="font-heading text-2xl text-white font-bold">{club.name}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-white/70 flex-wrap">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {club.member_count} members
              </span>
              {onlineCount > 0 && (
                <span className="flex items-center gap-1.5 font-semibold" style={{ color: '#4ade80' }}>
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  {onlineCount} online now
                </span>
              )}
              {club.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {club.city}
                </span>
              )}
            </div>

            {/* Embedded Announcements in Header */}
            {posts.filter(p => p.is_pinned).length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/20">
                <div className="flex flex-col gap-1.5">
                  {posts.filter(p => p.is_pinned).slice(0, 2).map(p => (
                    <button
                      key={p.id}
                      onClick={() => setActiveTab('feed')}
                      className="text-left text-[13px] text-white/80 hover:text-white transition-colors line-clamp-1 flex items-start gap-1.5"
                    >
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
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                title="Club Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            
            {/* Live Chat Button */}
            {isMember && (
              <button
                onClick={() => navigate(`/app/club/${club.id}/chat`, { state: { clubName: club.name } })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 text-white hover:bg-white hover:text-[var(--color-navy)] transition-colors backdrop-blur-sm"
              >
                <MessageSquare className="w-4 h-4" />
                Live Chat
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
          {/* Description */}
          {club.description && (
            <div className="sc-card p-4">
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{club.description}</p>
            </div>
          )}

          {/* Upcoming Events */}
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
                      <Clock className="w-3 h-3" />
                      {format(new Date(ev.starts_at), 'MMM d, HH:mm')}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="sc-card p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Stats</h3>
            <div className="space-y-2">
              {[
                { label: 'Members', value: club.member_count, icon: Users },
                { label: 'Posts', value: club.post_count, icon: MessageSquare },
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

          {/* Tags */}
          {club.tags.length > 0 && (
            <div className="sc-card p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {club.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#F4F0E8', color: 'var(--color-text-secondary)' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
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

          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-5 scrollbar-none">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold flex-shrink-0 transition-all ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-[var(--color-text-secondary)] hover:bg-white hover:text-navy'
                  }`}
                  style={activeTab === tab.id ? { background: 'var(--color-navy)' } : {}}
                >
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

          {/* ── FEED tab ── */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              {/* Rich Compose Box */}
              {isMember && (
                <div className="sc-card p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback style={{ background: 'var(--color-amber)', color: 'white', fontSize: '11px' }}>
                        {user?.firstName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      {/* Type switcher */}
                      <div className="flex items-center gap-1 mb-2">
                        {([['text', 'Text', MessageSquare], ['code', 'Code', Code2], ['poll', 'Poll', BarChart2]] as const).map(([t, label, Icon]) => (
                          <button
                            key={t}
                            onClick={() => setPostType(t)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                              postType === t ? 'text-white' : 'text-[var(--color-text-muted)] hover:bg-parchment'
                            }`}
                            style={postType === t ? { background: 'var(--color-navy)' } : {}}
                          >
                            <Icon className="w-3 h-3" /> {label}
                          </button>
                        ))}
                      </div>

                      {/* Main textarea */}
                      <textarea
                        value={newPostContent}
                        onChange={e => setNewPostContent(e.target.value)}
                        placeholder={postType === 'code' ? 'Paste your code here…' : postType === 'poll' ? 'Ask a question for your poll…' : 'Share something with the club…'}
                        className={`w-full resize-none text-sm text-navy placeholder:text-[var(--color-text-muted)] bg-transparent outline-none ${
                          postType === 'code' ? 'font-mono min-h-[100px] bg-gray-50 rounded-lg p-2 border border-[var(--color-border)]' : 'min-h-[60px]'
                        }`}
                        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost(); }}
                      />

                      {/* Code lang picker */}
                      {postType === 'code' && (
                        <select
                          value={postCodeLang}
                          onChange={e => setPostCodeLang(e.target.value)}
                          className="input-sc text-xs mt-2 py-1"
                        >
                          {['typescript', 'javascript', 'python', 'rust', 'go', 'html', 'css', 'sql', 'bash'].map(l => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      )}

                      {/* Poll options */}
                      {postType === 'poll' && (
                        <div className="mt-2 space-y-2">
                          {pollOptions.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input
                                value={opt}
                                onChange={e => setPollOptions(prev => prev.map((o, idx) => idx === i ? e.target.value : o))}
                                placeholder={`Option ${i + 1}`}
                                className="input-sc text-sm flex-1"
                              />
                              {pollOptions.length > 2 && (
                                <button onClick={() => setPollOptions(prev => prev.filter((_, idx) => idx !== i))} className="p-1 text-[var(--color-text-muted)] hover:text-red-500">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                          {pollOptions.length < 4 && (
                            <button onClick={() => setPollOptions(prev => [...prev, ''])} className="text-xs text-[var(--color-amber)] font-semibold flex items-center gap-1 hover:underline">
                              <Plus className="w-3 h-3" /> Add option
                            </button>
                          )}
                        </div>
                      )}

                      {/* File attachment (text posts only) */}
                      {postType === 'text' && (
                        <div className="mt-2">
                          {/* Hidden file input */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*,video/*,.pdf,application/pdf"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const type = pendingAttachTypeRef.current;
                              const previewUrl = URL.createObjectURL(file);
                              setPostAttachment({ file, type, previewUrl });
                              e.target.value = '';
                            }}
                          />

                          {/* Attachment preview */}
                          {postAttachment ? (
                            <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)]">
                              {postAttachment.type === 'image' && (
                                <img src={postAttachment.previewUrl} alt="" className="max-h-48 w-full object-cover" />
                              )}
                              {postAttachment.type === 'video' && (
                                <video src={postAttachment.previewUrl} controls className="max-h-48 w-full bg-black" />
                              )}
                              {postAttachment.type === 'pdf' && (
                                <div className="flex items-center gap-2.5 px-3 py-3 bg-parchment">
                                  <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                                  <span className="text-sm font-medium text-navy truncate">{postAttachment.file.name}</span>
                                </div>
                              )}
                              <button
                                onClick={() => setPostAttachment(null)}
                                className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-[var(--color-text-muted)] mr-1">Attach:</span>
                              {([
                                { type: 'image' as AttachmentType, icon: ImageIcon, label: 'Image', accept: 'image/*' },
                                { type: 'video' as AttachmentType, icon: Film, label: 'Video', accept: 'video/*' },
                                { type: 'pdf' as AttachmentType, icon: Paperclip, label: 'PDF', accept: '.pdf,application/pdf' },
                              ]).map(({ type, icon: Icon, label }) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => {
                                    pendingAttachTypeRef.current = type;
                                    fileInputRef.current?.click();
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-[var(--color-text-muted)] hover:bg-parchment hover:text-navy transition-colors"
                                >
                                  <Icon className="w-3.5 h-3.5" /> {label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Topic tags */}
                      <div className="mt-2">
                        <div className="flex items-center gap-1 flex-wrap">
                          <Tag className="w-3 h-3 text-[var(--color-text-muted)]" />
                          {POST_TOPIC_TAGS.map(tag => (
                            <button
                              key={tag}
                              onClick={() => setPostTopicTags(prev =>
                                prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                              )}
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-all ${
                                postTopicTags.includes(tag)
                                  ? 'text-white'
                                  : 'bg-gray-100 text-[var(--color-text-muted)] hover:bg-gray-200'
                              }`}
                              style={postTopicTags.includes(tag) ? { background: 'var(--color-amber)' } : {}}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Upload progress bar */}
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-[var(--color-text-muted)]">Uploading…</span>
                            <span className="text-[10px] font-semibold text-[var(--color-amber)]">{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all duration-150"
                              style={{ width: `${uploadProgress}%`, background: 'var(--color-amber)' }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Actions row */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--color-border)]">
                        {newPostContent.trim() && (
                          <span className="text-[10px] text-[var(--color-text-muted)]">Draft saved</span>
                        )}
                        <div className="flex items-center gap-2 ml-auto">
                          {(newPostContent.trim() || postAttachment) && (
                            <button
                              onClick={() => { setNewPostContent(''); setPostImageUrl(''); setPostTopicTags([]); setPostType('text'); setPollOptions(['', '']); setPostAttachment(null); }}
                              className="text-xs text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
                            >
                              Discard
                            </button>
                          )}
                          <button
                            onClick={handlePost}
                            disabled={postingPost || (!newPostContent.trim() && !postAttachment)}
                            className="btn-amber text-sm disabled:opacity-50"
                            style={{ padding: '6px 16px' }}
                          >
                            {postingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Non-member gate */}
              {!isMember ? (
                <MemberGate isPrivate={club.is_private} />
              ) : (
                <>
                  {posts.length === 0 ? (
                    <div className="sc-card p-10 text-center">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-muted)]" />
                      <p className="text-[var(--color-text-secondary)] text-sm">No posts yet. Start the conversation!</p>
                    </div>
                  ) : (
                    posts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={user?.id}
                        isMember={isMember}
                        canModerate={canModerate}
                        onReact={handleReact}
                        onDelete={handleDeletePost}
                        onPin={handlePin}
                      />
                    ))
                  )}
                </>
              )}
            </div>
          )}

          {/* ── MEMBERS tab ── */}
          {activeTab === 'members' && (
            <div>
              {!isMember ? (
                <MemberGate isPrivate={club.is_private} />
              ) : !membersLoaded ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="sc-card p-4 flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                        <div className="h-2 bg-gray-100 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : members.length === 0 ? (
                <div className="sc-card p-10 text-center text-sm text-[var(--color-text-secondary)]">
                  No members yet.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {members.map(m => (
                    <div key={m.id} className="sc-card p-4 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <Link to={`/app/member/${m.user_id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarImage src={m.profile?.avatar_url ?? undefined} />
                            <AvatarFallback style={{ background: 'var(--color-plum)', color: 'white', fontSize: '13px' }}>
                              {m.profile?.first_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-navy truncate">
                              {m.profile?.first_name} {m.profile?.last_name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {m.role !== 'member' && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                  style={m.role === 'admin' ? { background: '#FFF3E0', color: 'var(--color-amber)' } : { background: '#E8EFF5', color: 'var(--color-navy)' }}>
                                  {m.role}
                                </span>
                              )}
                              {m.profile?.city && (
                                <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-0.5">
                                  <MapPin className="w-2.5 h-2.5" /> {m.profile.city}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                        {/* Admin role management */}
                        {isAdmin && m.user_id !== user?.id && m.role !== 'admin' && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {m.role === 'member' ? (
                              <button
                                onClick={() => handleChangeMemberRole(m.id, 'moderator')}
                                title="Promote to moderator"
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-[var(--color-text-muted)] hover:text-blue-600 transition-colors"
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleChangeMemberRole(m.id, 'member')}
                                title="Remove moderator role"
                                className="p-1.5 rounded-lg hover:bg-amber-50 text-[var(--color-amber)] hover:text-amber-700 transition-colors"
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveMember(m.id)}
                              title="Remove from club"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      {/* Skills & actions row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {(m.profile as any)?.what_i_teach?.slice(0, 3).map((skill: string) => (
                          <span key={skill}
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
                            {skill}
                          </span>
                        ))}
                        <div className="ml-auto flex items-center gap-1.5">
                          {m.user_id !== user?.id && (
                            <button
                              onClick={() => navigate(`/app/messages?to=${m.user_id}`)}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-semibold
                                bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]
                                hover:bg-[var(--color-navy)] hover:text-white transition-colors"
                              title="Message this member"
                            >
                              <Mail className="w-3 h-3" /> Message
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── QUESTS tab ── */}
          {activeTab === 'quests' && (
            <div className="space-y-4">
              {!isMember ? (
                <MemberGate isPrivate={club.is_private} />
              ) : !questsLoaded ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="sc-card p-5 animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-2 bg-gray-100 rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : quests.length === 0 ? (
                <div className="sc-card p-10 text-center">
                  <Sword className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-muted)]" />
                  <p className="text-[var(--color-text-secondary)] text-sm">No quests yet. Check back soon!</p>
                </div>
              ) : (
                <>
                  {/* Group by status */}
                  {(['open', 'in_progress', 'completed'] as const).map(status => {
                    const statusQuests = quests.filter(q => q.status === status);
                    if (statusQuests.length === 0) return null;
                    return (
                      <div key={status}>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                          {status === 'open' ? 'Open' : status === 'in_progress' ? 'In Progress' : 'Completed'}
                        </h3>
                        <div className="space-y-3">
                          {statusQuests.map(quest => (
                            <QuestCard
                              key={quest.id}
                              quest={quest}
                              isMember={isMember}
                              onJoin={handleJoinQuest}
                              onLeave={handleLeaveQuest}
                              onStepToggle={handleStepToggle}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* ── VOICE ROOMS tab ── */}
          {activeTab === 'rooms' && (
            <div className="space-y-3">
              {!isMember ? (
                <MemberGate isPrivate={club.is_private} />
              ) : (
              <>
              {/* Mod/Admin: start room */}
              {canStartRoom && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowRoomModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                    style={{ background: 'var(--color-forest)' }}
                  >
                    <Mic2 className="w-4 h-4" /> Start a Room
                  </button>
                </div>
              )}
              {/* Member: request a room */}
              {canRequestRoom && (
                <RequestRoundButton
                  clubId={club.id}
                  onRequest={handleRequestRoom}
                />
              )}

              {!roomsLoaded ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="sc-card p-5 animate-pulse flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-200 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : rooms.length === 0 ? (
                <div className="sc-card p-10 text-center">
                  <Mic2 className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-muted)]" />
                  <p className="text-[var(--color-text-secondary)] text-sm">No voice rooms open right now.</p>
                </div>
              ) : (
                rooms.map(room => {
                  const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
                    active:    { label: 'Live',      color: 'var(--color-forest)', bg: '#DCFCE7', dot: 'bg-green-500 animate-pulse' },
                    waiting:   { label: 'Waiting',   color: 'var(--color-amber)',  bg: '#FFF3E0', dot: 'bg-amber-400' },
                    scheduled: { label: 'Scheduled', color: 'var(--color-plum)',   bg: '#F3E8FF', dot: 'bg-purple-400' },
                    ended:     { label: 'Ended',     color: '#9CA3AF',             bg: '#F3F4F6', dot: 'bg-gray-300' },
                  };
                  const cfg = statusConfig[room.status];
                  return (
                    <div key={room.id} className="sc-card p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                          {room.status === 'active' ? <Mic className="w-5 h-5" style={{ color: cfg.color }} /> : <MicOff className="w-5 h-5" style={{ color: cfg.color }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-navy">{room.name}</h3>
                            <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: cfg.color }}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                          </div>
                          {room.topic && (
                            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{room.topic}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--color-text-muted)]">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> {room.participant_count}/{room.max_participants}
                            </span>
                            {room.host && (
                              <span>Host: {room.host.first_name} {room.host.last_name}</span>
                            )}
                            {room.scheduled_at && room.status === 'scheduled' && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {format(new Date(room.scheduled_at), 'MMM d, HH:mm')}
                              </span>
                            )}
                          </div>
                        </div>
                        {isMember && room.status === 'active' && (
                          <button
                            className="text-sm font-semibold px-4 py-1.5 rounded-xl text-white flex-shrink-0 transition-all hover:scale-105"
                            style={{ background: 'var(--color-forest)' }}
                            onClick={() => toast.info('Voice rooms require WebRTC — coming in Phase 4!')}
                          >
                            Join
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              </>
              )}
            </div>
          )}

          {/* ── RESOURCES tab ── */}
          {activeTab === 'resources' && (
            <div className="space-y-4">
              {/* Add resource form */}
              {isMember && (
                <div className="sc-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-navy">Add a resource</h3>
                  <input
                    type="text"
                    value={newResourceTitle}
                    onChange={e => setNewResourceTitle(e.target.value)}
                    placeholder="Title"
                    className="input-sc text-sm"
                  />
                  <input
                    type="url"
                    value={newResourceUrl}
                    onChange={e => setNewResourceUrl(e.target.value)}
                    placeholder="URL (optional)"
                    className="input-sc text-sm"
                  />
                  <button
                    onClick={handleAddResource}
                    disabled={addingResource || !newResourceTitle.trim()}
                    className="btn-amber text-sm disabled:opacity-50"
                    style={{ padding: '6px 16px' }}
                  >
                    {addingResource ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Resource'}
                  </button>
                </div>
              )}

              {!resourcesLoaded ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="sc-card p-4 animate-pulse flex gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-200 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                        <div className="h-2 bg-gray-100 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : resources.length === 0 ? (
                <div className="sc-card p-10 text-center">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-muted)]" />
                  <p className="text-[var(--color-text-secondary)] text-sm">No resources shared yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {resources.map(res => {
                    const Icon = RESOURCE_ICONS[res.type] ?? LinkIcon;
                    return (
                      <div key={res.id} className="sc-card p-4 flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F4F0E8' }}>
                          <Icon className="w-4 h-4 text-[var(--color-amber)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-navy truncate">{res.title}</div>
                          {res.adder && (
                            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                              Added by {res.adder.first_name} · {formatDistanceToNow(new Date(res.created_at), { addSuffix: true })}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {res.url && (
                            <a href={res.url} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-lg hover:bg-parchment transition-colors">
                              <ExternalLink className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                            </a>
                          )}
                          {(res.added_by === user?.id || isModOrAdmin) && (
                            <button onClick={() => handleDeleteResource(res.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                              <Trash2 className="w-3.5 h-3.5 text-[var(--color-text-muted)] hover:text-red-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}


          {/* ── PLAYLISTS tab ── */}
          {activeTab === 'playlists' && (
            <PlaylistsTab
              clubId={club.id}
              userId={user?.id}
              canManage={isModOrAdmin}
              isMember={isMember}
            />
          )}

          {/* ── REQUESTS tab (mod/admin only) ── */}

          {activeTab === 'requests' && isModOrAdmin && (
            <div className="space-y-3">
              {!requestsLoaded ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="sc-card p-4 flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                        <div className="h-2 bg-gray-100 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : requests.length === 0 ? (
                <div className="sc-card p-10 text-center">
                  <UserCheck className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-muted)]" />
                  <p className="text-[var(--color-text-secondary)] text-sm">No pending join requests.</p>
                </div>
              ) : (
                requests.map(req => (
                  <div key={req.id} className="sc-card p-4 flex items-center gap-3">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={req.profile?.avatar_url ?? undefined} />
                      <AvatarFallback style={{ background: 'var(--color-plum)', color: 'white', fontSize: '13px' }}>
                        {req.profile?.first_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-navy">
                        {req.profile?.first_name} {req.profile?.last_name}
                      </div>
                      {req.profile?.city && (
                        <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" /> {req.profile.city}
                        </div>
                      )}
                      <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApproveRequest(req.id, req.user_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105"
                        style={{ background: 'var(--color-forest)' }}
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleDenyRequest(req.id, req.user_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
                      >
                        <UserX className="w-3.5 h-3.5" /> Deny
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── EVENTS tab ── */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              {/* Create event button / form */}
              {isModOrAdmin && (
                <div className="sc-card p-4">
                  {!showCreateEvent ? (
                    <button
                      onClick={() => setShowCreateEvent(true)}
                      className="flex items-center gap-2 text-sm font-semibold w-full justify-center py-2 rounded-xl border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-amber)] hover:text-[var(--color-amber)] transition-all"
                    >
                      <PlusCircle className="w-4 h-4" /> Create Event
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-navy text-sm">New Event</h3>
                        <button onClick={() => setShowCreateEvent(false)} className="text-[var(--color-text-muted)] hover:text-navy"><X className="w-4 h-4" /></button>
                      </div>
                      <input
                        value={eventTitle}
                        onChange={e => setEventTitle(e.target.value)}
                        placeholder="Event title *"
                        className="input-sc text-sm w-full"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Date *</label>
                          <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="input-sc text-sm w-full" />
                        </div>
                        <div>
                          <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Time</label>
                          <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} className="input-sc text-sm w-full" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Duration (minutes)</label>
                        <input type="number" value={eventDuration} min="15" step="15" onChange={e => setEventDuration(e.target.value)} className="input-sc text-sm w-full" />
                      </div>
                      <textarea
                        value={eventDesc}
                        onChange={e => setEventDesc(e.target.value)}
                        placeholder="Description (optional)"
                        rows={2}
                        className="input-sc text-sm w-full resize-none"
                      />
                      <div>
                        <label className="text-xs text-[var(--color-text-muted)] mb-2 block">Format</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setEventIsOnline(true)}
                            className={`p-2.5 rounded-xl border-2 text-sm font-semibold transition-all text-left ${
                              eventIsOnline ? 'border-[var(--color-amber)] bg-amber-50 text-[var(--color-amber)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-300'
                            }`}
                          >
                            💻 Online
                          </button>
                          <button
                            onClick={() => setEventIsOnline(false)}
                            className={`p-2.5 rounded-xl border-2 text-sm font-semibold transition-all text-left ${
                              !eventIsOnline ? 'border-[var(--color-amber)] bg-amber-50 text-[var(--color-amber)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-300'
                            }`}
                          >
                            📍 In-person
                          </button>
                        </div>
                      </div>
                      {eventIsOnline ? (
                        <input
                          value={eventLink}
                          onChange={e => setEventLink(e.target.value)}
                          placeholder="Meeting link (Zoom, Google Meet…)"
                          className="input-sc text-sm w-full"
                        />
                      ) : (
                        <input
                          value={eventLocation}
                          onChange={e => setEventLocation(e.target.value)}
                          placeholder="Location address"
                          className="input-sc text-sm w-full"
                        />
                      )}
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => setShowCreateEvent(false)} className="flex-1 py-2 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-gray-50 transition-colors">
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateEvent}
                          disabled={creatingEvent || !eventTitle.trim() || !eventDate}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:scale-[1.02]"
                          style={{ background: 'var(--color-navy)' }}
                        >
                          {creatingEvent ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Event'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!eventsLoaded ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="sc-card p-5 animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="sc-card p-10 text-center">
                  <CalendarDays className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-muted)]" />
                  <p className="text-[var(--color-text-secondary)] text-sm">No upcoming events scheduled.</p>
                  {isModOrAdmin && !showCreateEvent && (
                    <button onClick={() => setShowCreateEvent(true)} className="mt-3 text-sm font-semibold text-[var(--color-amber)] hover:underline">Create the first one →</button>
                  )}
                </div>
              ) : (
                events.map(event => {
                  const rsvped = myRsvpIds.has(event.id);
                  return (
                    <div key={event.id} className="sc-card p-5">
                      <div className="flex items-start gap-4">
                        {/* Date block */}
                        <div className="flex-shrink-0 w-12 text-center rounded-xl overflow-hidden border border-[var(--color-border)]">
                          <div className="text-xs font-bold uppercase py-1" style={{ background: 'var(--color-navy)', color: 'white' }}>
                            {format(new Date(event.starts_at), 'MMM')}
                          </div>
                          <div className="font-heading font-bold text-xl text-navy py-1">
                            {format(new Date(event.starts_at), 'd')}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-navy">{event.title}</h3>
                          {event.description && (
                            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">{event.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-text-muted)] flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {format(new Date(event.starts_at), 'HH:mm')}
                              {(event as any).duration_mins && ` · ${(event as any).duration_mins}min`}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {event.location}
                              </span>
                            )}
                            {(event as any).meeting_link && (
                              <a
                                href={(event as any).meeting_link}
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[var(--color-amber)] font-semibold hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" /> Join link
                              </a>
                            )}
                            <span className="font-medium">
                              {event.format === 'online' ? '💻 Online' : event.format === 'both' ? '🌐 Both' : '📍 In-person'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {(event as any).rsvp_count ?? event.attendee_count ?? 0} going
                          </span>
                          {isMember && (
                            <button
                              onClick={() => handleRsvp(event.id)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                                rsvped
                                  ? 'bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-500'
                                  : 'btn-amber'
                              }`}
                              style={!rsvped ? { padding: '6px 12px' } : {}}
                            >
                              {rsvped ? '✓ Going' : 'RSVP'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── PROJECTS tab ── */}
          {activeTab === 'projects' && (
            isMember ? (
              <ProjectsTab
                clubId={club.id}
                userId={user?.id}
                isActiveMember={isMember}
                canModerate={isModOrAdmin}
              />
            ) : <MemberGate isPrivate={club.is_private} />
          )}

          {/* ── LEADERBOARD tab ── */}
          {activeTab === 'leaderboard' && (
            <LeaderboardTab clubId={club.id} currentUserId={user?.id} />
          )}


        </div>
      </div>

      {/* ── ClubSettingsModal ── */}
      {showSettings && club && (
        <ClubSettingsModal
          club={club}
          onClose={() => setShowSettings(false)}
          onUpdated={(updated) => { setClub(updated); setShowSettings(false); }}
          onDeleted={() => navigate('/app/discover')}
        />
      )}

      {/* ── StartRoomModal ── */}
      {showRoomModal && user && club && (
        <StartRoomModal
          clubId={club.id}
          hostId={user.id}
          onClose={() => setShowRoomModal(false)}
          onCreated={(room) => {
            setRooms(prev => [room, ...prev]);
            setActiveTab('rooms');
          }}
        />
      )}
    </div>
  );
}
