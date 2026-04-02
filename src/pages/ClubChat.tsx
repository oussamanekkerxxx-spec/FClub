import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Send, ArrowLeft, MessageSquare, Loader2, Hash, Megaphone,
  Plus, X, AlertCircle, Paperclip, Image as ImageIcon, FileText, BarChart2, Mic, Film, ExternalLink,
  Phone, Video, Search, MoreVertical, Pin, CheckCheck, BellOff, Info,
  Download, Share2, Calendar, Code2, PlayCircle, Trash2, Layers,
  Reply, Edit2, CornerUpLeft, ArrowDown, ChevronDown, Check, MoreHorizontal,
  Smile, PanelRightClose, PanelRightOpen, Users, MapPin, StopCircle, Settings, Clock,
  CornerDownRight, ChevronUp
} from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { toast } from 'sonner';
import AudioPlayerBubble from '@/components/AudioPlayerBubble';
import { ProjectBubble, type ClubProject } from '@/components/chat/ProjectBubble';
import { ProjectWizard, type ProjectWizardPayload } from '@/components/chat/ProjectWizard';
import { ProjectApplicationForm, type ProjectApplicationPayload } from '@/components/chat/ProjectApplicationForm';
import { ProjectApplicantsDashboard } from '@/components/chat/ProjectApplicantsDashboard';

// ─── Types ──────────────────────────────────────────────────────────────────
export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  votes?: PollVote[];
}

export interface PollVote {
  id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

export interface Poll {
  id: string;
  message_id: string;
  question: string;
  is_anonymous: boolean;
  multiple_answers: boolean;
  options?: PollOption[];
}

interface Channel {
  id: string;
  club_id: string;
  name: string;
  description: string | null;
  is_announcement_only: boolean;
  order_index: number;
  slow_mode_delay?: number;
  pinned_message_id?: string | null;
}

interface ChannelRead {
  channel_id: string;
  user_id: string;
  last_read_at: string;
}

interface TypingUser {
  user_id: string;
  name: string;
}

type ChatAttachType = 'image' | 'video' | 'pdf';
interface ChatAttachment { file: File; type: ChatAttachType; previewUrl: string; }

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

interface UserPreferences {
  id: string;
  user_id: string;
  wallpaper_class: string;
  is_dark_mode: boolean;
}

interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  image_url?: string | null;
  video_url?: string | null;
  pdf_url?: string | null;
  voice_url?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  created_at: string;
  reply_to_id?: string | null;
  is_edited?: boolean;
  deleted_at?: string | null;
  caption?: string | null;
  sender?: { first_name: string; last_name: string; avatar_url: string };
  reply_to_message?: Message | null;
  reactions?: Reaction[];
  poll?: Poll | null;
  project?: ClubProject | null;
  forwarded_from_id?: string | null;
  forwarded_from_name?: string | null;
}

export default function ClubChat() {
  const { id: clubId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const clubName = (location.state as any)?.clubName || 'Club Chat';

  const [loading, setLoading] = useState(true);
  const [isAdminOrMod, setIsAdminOrMod] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [chatAttachment, setChatAttachment] = useState<ChatAttachment | null>(null);
  const [attachmentCaption, setAttachmentCaption] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingAttachTypeRef = useRef<ChatAttachType>('image');

  const [viewingImageMsg, setViewingImageMsg] = useState<any | null>(null);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // ── Shared Media Panel ───────────────────────────────────────────────────
  const [showSharedMedia, setShowSharedMedia] = useState(false);
  const [sharedMediaTab, setSharedMediaTab] = useState<'images' | 'videos' | 'files'>('images');

  // ── Video Wizard ─────────────────────────────────────────────────────────
  const [showVideoWizard, setShowVideoWizard] = useState(false);
  const [videoWizardFile, setVideoWizardFile] = useState<File | null>(null);
  const [videoWizardPreview, setVideoWizardPreview] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoPlaylistId, setVideoPlaylistId] = useState('');
  const [videoNewPlaylistName, setVideoNewPlaylistName] = useState('');
  const [videoDuration, setVideoDuration] = useState('');
  const [playlists, setPlaylists] = useState<{ id: string; title: string }[]>([]);
  const [savingVideo, setSavingVideo] = useState(false);

  // ── Poll Wizard ──────────────────────────────────────────────────────────
  const [showPollWizard, setShowPollWizard] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollIsAnonymous, setPollIsAnonymous] = useState(false);
  const [pollMultipleAnswers, setPollMultipleAnswers] = useState(false);
  const [savingPoll, setSavingPoll] = useState(false);

  // ── Voice Recording State ────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Unread Counts ────────────────────────────────────────────────────────
  const [channelUnreads, setChannelUnreads] = useState<Record<string, number>>({});

  // ── Typing Indicators ────────────────────────────────────────────────────
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Pinned Message ───────────────────────────────────────────────────────
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);

  // ── Channel Reads (for read receipts) ───────────────────────────────────
  const [channelReads, setChannelReads] = useState<ChannelRead[]>([]);

  // ── Forward Modal ────────────────────────────────────────────────────────
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);

  // ── Pagination ───────────────────────────────────────────────────────────
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesAreaRef = useRef<HTMLDivElement>(null);

  // ── Composer Focus (for formatting toolbar) ──────────────────────────────
  const [composerFocused, setComposerFocused] = useState(false);

  // ── Details Panel ────────────────────────────────────────────────────────
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);

  // ── Settings & Customization ─────────────────────────────────────────────
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSilentSend, setIsSilentSend] = useState(false);
  
  // ── Long Press Logic ─────────────────────────────────────────────────────
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressFiredRef = useRef(false);

  // ── Slow Mode tracking ───────────────────────────────────────────────────
  const lastSentAtRef = useRef<number>(0);

  // ── Project Wizard ───────────────────────────────────────────────────────
  const [showProjectWizard, setShowProjectWizard] = useState(false);
  const [savingProject, setSavingProject] = useState(false);

  // ── Project Application / Applicants ─────────────────────────────────────
  const [applyingToProject, setApplyingToProject] = useState<ClubProject | null>(null);
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [viewingApplicants, setViewingApplicants] = useState<ClubProject | null>(null);

  // ── Event Wizard ─────────────────────────────────────────────────────────
  const [showEventWizard, setShowEventWizard] = useState(false);
  const [evtTitle, setEvtTitle] = useState('');
  const [evtDesc, setEvtDesc] = useState('');
  const [evtDate, setEvtDate] = useState('');
  const [evtOnline, setEvtOnline] = useState(true);
  const [evtLink, setEvtLink] = useState('');
  const [evtDuration, setEvtDuration] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);

  // ── Search helper ────────────────────────────────────────────────────────
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(m => m.content?.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  function parseMessageContent(text: string, query: string) {
    if (!text) return null;
    let escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    if (query.trim()) {
      const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      escaped = escaped.replace(new RegExp(`(${q})`, 'gi'), '<mark class="bg-amber-200 text-navy rounded px-0.5">$1</mark>');
    }
    
    escaped = escaped.replace(/(?:\r\n|\r|\n)/g, '<br/>');
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    escaped = escaped.replace(/\*(.*?)\*/g, '<i>$1</i>');
    escaped = escaped.replace(/__(.*?)__/g, '<u>$1</u>');
    escaped = escaped.replace(/~~(.*?)~~/g, '<del>$1</del>');
    escaped = escaped.replace(/`(.*?)`/g, '<code class="font-mono text-[13px] bg-black/10 px-1 rounded">$1</code>');
    escaped = escaped.replace(/\|\|(.*?)\|\|/g, '<span class="spoiler blur-sm hover:blur-none transition-all cursor-pointer select-none" title="Click to reveal">$1</span>');
    escaped = escaped.replace(/^&gt;\s(.+)$/gm, '<blockquote class="border-l-2 border-current opacity-70 pl-2 my-0.5 italic">$1</blockquote>');
    escaped = escaped.replace(/((?:https?:\/\/)[^\s<]+)/g, '<a href="$1" target="_blank" class="text-blue-500 hover:underline break-all">$1</a>');

    return <span dangerouslySetInnerHTML={{ __html: escaped }} />;
  }

  const [mobileView, setMobileView] = useState<'channels' | 'chat'>('channels');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add channel form
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [isAnnouncements, setIsAnnouncements] = useState(false);
  const [addingChannel, setAddingChannel] = useState(false);

  const activeChannel = channels.find(c => c.id === activeChannelId);

  // ─── 1. Load initial data (channels + roles) ──────────────────────────────
  useEffect(() => {
    if (!clubId || !user) return;

    const init = async () => {
      // 1a. Check role
      const { data: mem } = await supabase
        .from('club_memberships')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      const isMod = mem?.role === 'admin' || mem?.role === 'moderator';
      setIsAdminOrMod(isMod);

      // 1c. Load user preferences
      const { data: prefData } = await supabase.from('user_chat_preferences').select('*').eq('user_id', user.id).single();
      if (prefData) {
        setPreferences(prefData);
      } else {
        const { data: newPref } = await supabase.from('user_chat_preferences').insert({ user_id: user.id }).select().single();
        if (newPref) setPreferences(newPref);
      }

      // 1b. Load channels
      const { data: chans } = await supabase
        .from('club_channels')
        .select('*')
        .eq('club_id', clubId)
        .order('order_index', { ascending: true });

      if (chans && chans.length > 0) {
        setChannels(chans);
        setActiveChannelId(chans[0].id);

        // Fetch unread counts for all channels in one pass
        const { data: reads } = await supabase
          .from('channel_reads')
          .select('channel_id, last_read_at')
          .eq('user_id', user.id);

        const unreads: Record<string, number> = {};
        await Promise.all(chans.map(async (chan) => {
          const read = reads?.find(r => r.channel_id === chan.id);
          const { count } = await supabase
            .from('club_messages')
            .select('id', { count: 'exact', head: true })
            .eq('channel_id', chan.id)
            .is('deleted_at', null)
            .gt('created_at', read?.last_read_at ?? '1970-01-01');
          unreads[chan.id] = count ?? 0;
        }));
        setChannelUnreads(unreads);
      } else {
        // Auto-seed channels if none exist (first visitor!)
        if (isMod) {
          const { data: seeded } = await supabase
            .from('club_channels')
            .insert([
              { club_id: clubId, name: 'general', description: 'General chat', is_announcement_only: false, order_index: 0 },
              { club_id: clubId, name: 'announcements', description: 'Important updates', is_announcement_only: true, order_index: 1 },
              { club_id: clubId, name: 'projects', description: 'Project discussions', is_announcement_only: false, order_index: 2 },
            ])
            .select();
          if (seeded) {
            setChannels(seeded);
            setActiveChannelId(seeded[0].id);
          }
        }
      }
      setLoading(false);
    };

    init();
  }, [clubId, user]);

  // ─── 2. Load messages when channel changes ────────────────────────────────
  useEffect(() => {
    if (!activeChannelId) {
      setMessages([]);
      return;
    }

    const MSG_SELECT = `
      id, channel_id, sender_id, content, image_url, video_url, pdf_url, voice_url, location_lat, location_lng,
      created_at, reply_to_id, is_edited, deleted_at, caption, forwarded_from_id, forwarded_from_name,
      sender:profiles!club_messages_sender_id_fkey(first_name, last_name, avatar_url),
      reactions:message_reactions(id, user_id, emoji),
      poll:polls(id, question, is_anonymous, multiple_answers, options:poll_options(id, text, votes:poll_votes(id, user_id))),
      project:club_projects(
        id, club_id, title, pitch, description, start_date, duration_weeks, hours_per_week, visibility, status, creator_id,
        roles:project_roles(id, title, slots_needed),
        skills:project_skills(id, skill_name),
        applications:project_applications(id, user_id, role_id, experience, availability_hours, status),
        meetings:project_meetings(id, scheduled_at, agenda, meeting_url, notes, status)
      )
    `;

    const normalise = (m: any): Message => ({
      ...m,
      sender: Array.isArray(m.sender) ? m.sender[0] : m.sender,
      poll: Array.isArray(m.poll) ? m.poll[0] : m.poll,
      project: Array.isArray(m.project) ? m.project[0] : m.project,
    });

    const loadMessages = async () => {
      const { data } = await supabase
        .from('club_messages')
        .select(MSG_SELECT)
        .eq('channel_id', activeChannelId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        const msgs = data.reverse().map(normalise);
        setMessages(msgs);
        setHasMore(data.length === 50);
      }
    };

    // Load pinned message for the active channel
    const activeChan = channels.find(c => c.id === activeChannelId);
    if (activeChan?.pinned_message_id) {
      supabase
        .from('club_messages')
        .select('id, content, sender:profiles!club_messages_sender_id_fkey(first_name)')
        .eq('id', activeChan.pinned_message_id)
        .single()
        .then(({ data: p }) => {
          if (p) setPinnedMessage({ ...p, sender: Array.isArray(p.sender) ? p.sender[0] : p.sender } as any);
        });
    } else {
      setPinnedMessage(null);
    }

    // Fetch other users' channel reads (for read receipts)
    supabase
      .from('channel_reads')
      .select('channel_id, user_id, last_read_at')
      .eq('channel_id', activeChannelId)
      .neq('user_id', user?.id ?? '')
      .then(({ data: cr }) => { if (cr) setChannelReads(cr); });

    loadMessages();

    // Subscribe to realtime messages for this channel
    const channel = supabase
      .channel(`chat-${activeChannelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'club_messages', filter: `channel_id=eq.${activeChannelId}` },
        payload => {
          const msg = payload.new as Message;
          // Avoid duplicate if we just sent it
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          // Fetch sender info separately for realtime message
          supabase.from('profiles').select('first_name, last_name, avatar_url').eq('id', msg.sender_id).single()
            .then(({ data: p }) => {
              if (p) setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, sender: p } : m));
            });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        payload => {
          // If insert, add to the message. If delete, remove from the message.
          const react = payload.new as Reaction | null;
          const oldReact = payload.old as Reaction | null;
          
          if (payload.eventType === 'INSERT' && react) {
            setMessages(prev => prev.map(m => {
              if (m.id === react.message_id) {
                const existing = m.reactions || [];
                if (!existing.find(r => r.id === react.id)) {
                  return { ...m, reactions: [...existing, react] };
                }
              }
              return m;
            }));
          } else if (payload.eventType === 'DELETE' && oldReact) {
            setMessages(prev => prev.map(m => {
              if (m.reactions?.some(r => r.id === oldReact.id)) {
                return { ...m, reactions: m.reactions.filter(r => r.id !== oldReact.id) };
              }
              return m;
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'poll_votes' },
        payload => {
          const vote = (payload.new ?? payload.old) as PollVote | null;
          if (!vote?.option_id) return;
          setMessages(prev => prev.map(m => {
            if (!m.poll?.options) return m;
            const hasOption = m.poll.options.some(o => o.id === vote.option_id);
            if (!hasOption) return m;
            const updatedOptions = m.poll.options.map(o => {
              if (o.id !== vote.option_id) return o;
              const existing = o.votes || [];
              if (payload.eventType === 'INSERT') {
                if (existing.some(v => v.id === (payload.new as PollVote).id)) return o;
                return { ...o, votes: [...existing, payload.new as PollVote] };
              } else if (payload.eventType === 'DELETE') {
                return { ...o, votes: existing.filter(v => v.id !== (payload.old as PollVote).id) };
              }
              return o;
            });
            return { ...m, poll: { ...m.poll, options: updatedOptions } };
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'channel_reads', filter: `channel_id=eq.${activeChannelId}` },
        payload => {
          const cr = (payload.new ?? payload.old) as ChannelRead;
          if (!cr || cr.user_id === user?.id) return;
          setChannelReads(prev => {
            const idx = prev.findIndex(r => r.user_id === cr.user_id);
            if (payload.eventType === 'DELETE') return prev.filter(r => r.user_id !== cr.user_id);
            if (idx >= 0) { const u = [...prev]; u[idx] = cr; return u; }
            return [...prev, cr];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'club_typing', filter: `channel_id=eq.${activeChannelId}` },
        payload => {
          if (payload.eventType === 'DELETE') {
            const gone = payload.old as { user_id: string };
            setTypingUsers(prev => prev.filter(t => t.user_id !== gone.user_id));
          } else {
            const typer = payload.new as { user_id: string; channel_id: string };
            if (typer.user_id === user?.id) return;
            supabase.from('profiles').select('first_name').eq('id', typer.user_id).single()
              .then(({ data: p }) => {
                if (!p) return;
                setTypingUsers(prev => {
                  if (prev.some(t => t.user_id === typer.user_id)) return prev;
                  return [...prev, { user_id: typer.user_id, name: p.first_name }];
                });
                // Auto-remove after 5s in case DELETE fires late
                setTimeout(() => setTypingUsers(prev => prev.filter(t => t.user_id !== typer.user_id)), 5000);
              });
          }
        }
      )
      .subscribe();

    // Mark channel as read + clear unread badge
    if (user?.id && activeChannelId) {
      supabase.from('channel_reads').upsert({ channel_id: activeChannelId, user_id: user.id, last_read_at: new Date().toISOString() }).then();
      setChannelUnreads(prev => ({ ...prev, [activeChannelId]: 0 }));
    }

    return () => {
      supabase.removeChannel(channel);
      setTypingUsers([]);
    };
  }, [activeChannelId, user?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-expand textarea — reset to auto first so shrinking works correctly
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const capped = Math.min(el.scrollHeight, 160);
    el.style.height = `${capped}px`;
    el.style.overflowY = el.scrollHeight > 160 ? 'auto' : 'hidden';
  }, [newMessage]);

  // Load playlists for the Video Wizard dropdown
  useEffect(() => {
    if (!clubId) return;
    supabase.from('club_playlists').select('id, title').eq('club_id', clubId).order('order_index')
      .then(({ data }) => setPlaylists(data ?? []));
  }, [clubId]);

  // ─── 3. Actions ─────────────────────────────────────────────────────────────

  // ── Pagination: load older messages ──────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0 || !activeChannelId) return;
    setLoadingMore(true);
    const oldest = messages[0]?.created_at;
    const area = messagesAreaRef.current;
    const prevHeight = area?.scrollHeight ?? 0;

    const { data } = await supabase
      .from('club_messages')
      .select(`
        id, channel_id, sender_id, content, image_url, video_url, pdf_url, voice_url, location_lat, location_lng,
        created_at, reply_to_id, is_edited, deleted_at, caption, forwarded_from_id, forwarded_from_name,
        sender:profiles!club_messages_sender_id_fkey(first_name, last_name, avatar_url),
        reactions:message_reactions(id, user_id, emoji),
        poll:polls(id, question, is_anonymous, multiple_answers, options:poll_options(id, text, votes:poll_votes(id, user_id))),
        project:club_projects(
          id, club_id, title, pitch, description, start_date, duration_weeks, hours_per_week, visibility, status, creator_id,
          roles:project_roles(id, title, slots_needed),
          skills:project_skills(id, skill_name),
          applications:project_applications(id, user_id, role_id, experience, availability_hours, status),
          meetings:project_meetings(id, scheduled_at, agenda, meeting_url, notes, status)
        )
      `)
      .eq('channel_id', activeChannelId)
      .lt('created_at', oldest)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      const older = data.reverse().map((m: any) => ({
        ...m,
        sender: Array.isArray(m.sender) ? m.sender[0] : m.sender,
        poll: Array.isArray(m.poll) ? m.poll[0] : m.poll,
        project: Array.isArray(m.project) ? m.project[0] : m.project,
      }));
      setMessages(prev => [...older, ...prev]);
      setHasMore(data.length === 50);
      requestAnimationFrame(() => {
        if (area) area.scrollTop = area.scrollHeight - prevHeight;
      });
    }
    setLoadingMore(false);
  }, [loadingMore, hasMore, messages, activeChannelId]);

  // ── Typing indicator ──────────────────────────────────────────────────────
  const handleTypingStart = useCallback(() => {
    if (!activeChannelId || !user) return;
    supabase.from('club_typing')
      .upsert({ channel_id: activeChannelId, user_id: user.id, updated_at: new Date().toISOString() })
      .then();
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      supabase.from('club_typing').delete()
        .eq('channel_id', activeChannelId).eq('user_id', user.id).then();
    }, 4000);
  }, [activeChannelId, user]);

  // ── Pin / Unpin message ───────────────────────────────────────────────────
  const handlePinMessage = async (msg: Message) => {
    if (!activeChannelId) return;
    await supabase.from('club_channels').update({ pinned_message_id: msg.id }).eq('id', activeChannelId);
    setChannels(prev => prev.map(c => c.id === activeChannelId ? { ...c, pinned_message_id: msg.id } : c));
    setPinnedMessage(msg);
    toast.success('Message pinned');
  };

  const handleUnpinMessage = async () => {
    if (!activeChannelId) return;
    await supabase.from('club_channels').update({ pinned_message_id: null }).eq('id', activeChannelId);
    setChannels(prev => prev.map(c => c.id === activeChannelId ? { ...c, pinned_message_id: null } : c));
    setPinnedMessage(null);
    toast.success('Message unpinned');
  };

  // ── Forward message ───────────────────────────────────────────────────────
  const handleForwardMessage = async (targetChannelId: string) => {
    if (!forwardingMessage || !user) return;
    await supabase.from('club_messages').insert({
      channel_id: targetChannelId,
      sender_id: user.id,
      content: forwardingMessage.content || '',
      image_url: forwardingMessage.image_url ?? null,
      video_url: forwardingMessage.video_url ?? null,
      pdf_url: forwardingMessage.pdf_url ?? null,
      forwarded_from_id: forwardingMessage.id,
      forwarded_from_name: forwardingMessage.sender?.first_name
        ? `${forwardingMessage.sender.first_name}${forwardingMessage.sender.last_name ? ' ' + forwardingMessage.sender.last_name : ''}`
        : 'Member',
    });
    toast.success('Message forwarded');
    setForwardingMessage(null);
    setShowForwardModal(false);
  };

  // ── Text formatting helper ────────────────────────────────────────────────
  const applyFormat = useCallback((syntax: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = newMessage.substring(start, end);
    const inner = selected || 'text';
    const formatted = `${syntax}${inner}${syntax}`;
    const next = newMessage.substring(0, start) + formatted + newMessage.substring(end);
    setNewMessage(next);
    setTimeout(() => {
      textarea.focus();
      const cursor = start + syntax.length + inner.length + syntax.length;
      textarea.setSelectionRange(cursor, cursor);
    }, 0);
  }, [newMessage]);

  // ── Video Wizard Submit ───────────────────────────────────────────────────
  const submitVideoWizard = async () => {
    if (!videoWizardFile || !videoTitle.trim()) { toast.error('Title and video are required'); return; }
    if (!activeChannelId || !user || !clubId) return;
    setSavingVideo(true);
    try {
      const result = await uploadToCloudinary(videoWizardFile, () => {});
      const videoUrl = result.url;

      let targetPlaylistId = videoPlaylistId;
      if (!targetPlaylistId && videoNewPlaylistName.trim()) {
        const { data: newPl } = await supabase.from('club_playlists')
          .insert({ club_id: clubId, title: videoNewPlaylistName.trim(), created_by: user.id })
          .select('id').single();
        if (newPl) targetPlaylistId = newPl.id;
      }
      if (!targetPlaylistId) { toast.error('Please select or create a playlist'); setSavingVideo(false); return; }

      await supabase.from('club_playlist_videos').insert({
        playlist_id: targetPlaylistId, title: videoTitle.trim(),
        video_url: videoUrl, duration_label: videoDuration || null, added_by: user.id,
      });
      await supabase.from('club_messages').insert({
        channel_id: activeChannelId, sender_id: user.id,
        content: `🎬 Shared a video: **${videoTitle.trim()}**`,
        video_url: videoUrl,
      });
      const { data: pl } = await supabase.from('club_playlists').select('id,title').eq('club_id', clubId).order('order_index');
      setPlaylists(pl ?? []);
      toast.success('Video saved to playlist!');
      setShowVideoWizard(false);
      setVideoWizardFile(null); setVideoWizardPreview(''); setVideoTitle(''); setVideoPlaylistId(''); setVideoNewPlaylistName(''); setVideoDuration('');
    } catch (e: any) { toast.error('Upload failed: ' + (e?.message ?? 'error')); }
    finally { setSavingVideo(false); }
  };

  // ── Project Wizard Submit ─────────────────────────────────────────────────
  const submitProjectWizard = async (payload: ProjectWizardPayload) => {
    if (!activeChannelId || !user || !clubId) return;
    setSavingProject(true);
    try {
      // 1. Create message first to attach the project
      const { data: messageData, error: msgErr } = await supabase.from('club_messages').insert({
        channel_id: activeChannelId, sender_id: user.id,
        content: `🚀 Created a new project pitch: **${payload.title}**\n\n📌 *${payload.pitch}*`,
      }).select('id').single();
      if (msgErr) throw msgErr;

      // 2. Create the overarching club_project
      const { data: proj, error: projErr } = await supabase.from('club_projects').insert({
        club_id: clubId, channel_id: activeChannelId, creator_id: user.id,
        message_id: messageData.id,
        title: payload.title, pitch: payload.pitch, description: payload.description || '',
        start_date: payload.start_date || null, duration_weeks: payload.duration_weeks,
        hours_per_week: payload.hours_per_week, visibility: payload.visibility, status: 'open'
      }).select('id').single();
      if (projErr) throw projErr;

      // 3. Create relational nodes using standard sequentially awaited inserts
      if (payload.roles.length > 0) {
        await supabase.from('project_roles').insert(
          payload.roles.map(r => ({ project_id: proj.id, title: r.title, slots_needed: r.slots_needed }))
        );
      }
      if (payload.skills.length > 0) {
        await supabase.from('project_skills').insert(
          payload.skills.map(s => ({ project_id: proj.id, skill_name: s }))
        );
      }

      toast.success('Project launched successfully!');
      setShowProjectWizard(false);
    } catch (e: any) { toast.error('Failed to launch project: ' + (e?.message ?? 'error')); }
    finally { setSavingProject(false); }
  };

  // ── Refresh project data in messages after any mutation ──────────────────
  const refreshProjectInMessages = async (projectId: string) => {
    const { data: proj } = await supabase
      .from('club_projects')
      .select(`
        id, club_id, title, pitch, description, start_date, duration_weeks, hours_per_week, visibility, status, creator_id,
        roles:project_roles(id, title, slots_needed),
        skills:project_skills(id, skill_name),
        applications:project_applications(
          id, user_id, role_id, experience, availability_hours, status,
          user:profiles(first_name, last_name, avatar_url)
        ),
        meetings:project_meetings(id, scheduled_at, agenda, meeting_url, notes, status)
      `)
      .eq('id', projectId)
      .single();

    if (proj) {
      setMessages(prev => prev.map(m =>
        m.project?.id === projectId ? { ...m, project: proj as any } : m
      ));
      setViewingApplicants(prev => prev?.id === projectId ? (proj as any) : prev);
    }
  };

  // ── Apply to project ──────────────────────────────────────────────────────
  const handleSubmitApplication = async (project: ClubProject, payload: ProjectApplicationPayload) => {
    if (!user) return;
    setSubmittingApplication(true);
    try {
      const { error } = await supabase.from('project_applications').insert({
        project_id: project.id,
        role_id: payload.role_id,
        user_id: user.id,
        experience: payload.experience,
        availability_hours: payload.availability_hours,
        status: 'pending',
      });
      if (error) {
        if (error.code === '23505') {
          toast.info('You already applied to this project');
        } else {
          throw error;
        }
      } else {
        toast.success('Application submitted!');
        setApplyingToProject(null);
        await refreshProjectInMessages(project.id);
      }
    } catch (e: any) {
      toast.error('Failed to submit: ' + (e?.message ?? 'error'));
    } finally {
      setSubmittingApplication(false);
    }
  };

  // ── Update application status (creator action) ────────────────────────────
  const handleUpdateApplicationStatus = async (applicationId: string, status: 'accepted' | 'waitlisted' | 'rejected') => {
    const { error } = await supabase
      .from('project_applications')
      .update({ status })
      .eq('id', applicationId);
    if (error) {
      toast.error('Update failed');
      return;
    }
    if (viewingApplicants) await refreshProjectInMessages(viewingApplicants.id);
  };

  // ── Event Wizard Submit ───────────────────────────────────────────────────
  const submitEventWizard = async () => {
    if (!evtTitle.trim() || !evtDate) { toast.error('Title and date are required'); return; }
    if (!activeChannelId || !user || !clubId) return;
    setSavingEvent(true);
    try {
      await supabase.from('club_events').insert({
        club_id: clubId, created_by: user.id, title: evtTitle.trim(),
        description: evtDesc.trim() || null, starts_at: new Date(evtDate).toISOString(),
        is_online: evtOnline, meeting_link: evtLink.trim() || null, duration_mins: evtDuration ? parseInt(evtDuration) : null,
      });
      await supabase.from('club_messages').insert({
        channel_id: activeChannelId, sender_id: user.id,
        content: `📅 Created an event: **${evtTitle.trim()}** on ${format(new Date(evtDate), 'MMMM d, yyyy')}${evtOnline && evtLink ? ' · ' + evtLink : ''}`,
      });
      toast.success('Event created and shared!');
      setShowEventWizard(false);
      setEvtTitle(''); setEvtDesc(''); setEvtDate(''); setEvtOnline(true); setEvtLink(''); setEvtDuration('');
    } catch (e: any) { toast.error('Failed: ' + (e?.message ?? 'error')); }
    finally { setSavingEvent(false); }
  };

  const submitPollWizard = async () => {
    if (!pollQuestion.trim() || !activeChannelId || !user) return;
    const validOptions = pollOptions.filter(o => o.trim());
    if (validOptions.length < 2) {
      toast.error('Please provide at least 2 options.');
      return;
    }
    setSavingPoll(true);
    try {
      const { data: msgInfo, error: msgErr } = await supabase.from('club_messages').insert({
        channel_id: activeChannelId,
        sender_id: user.id,
        content: pollQuestion.trim()
      }).select().single();
      if (msgErr) throw msgErr;

      const { data: poll, error: pollErr } = await supabase.from('polls').insert({
        message_id: msgInfo.id,
        question: pollQuestion.trim(),
        is_anonymous: pollIsAnonymous,
        multiple_answers: pollMultipleAnswers
      }).select().single();
      if (pollErr) throw pollErr;

      const { error: optErr } = await supabase.from('poll_options').insert(
        validOptions.map(text => ({ poll_id: poll.id, text: text.trim() }))
      );
      if (optErr) throw optErr;

      toast.success('Poll created!');
      setShowPollWizard(false);
      setPollQuestion(''); setPollOptions(['', '']); setPollIsAnonymous(false); setPollMultipleAnswers(false);
    } catch (e: any) {
      toast.error('Failed to create poll: ' + (e?.message || 'unknown'));
    } finally {
      setSavingPoll(false);
    }
  };

  const handleShareLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    toast.info('Requesting location...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!activeChannelId || !user) return;
        const { latitude, longitude } = position.coords;
        const { error } = await supabase.from('club_messages').insert({
          channel_id: activeChannelId,
          sender_id: user.id,
          content: 'Shared Location',
          location_lat: latitude,
          location_lng: longitude
        });
        if (error) toast.error('Failed to share location.');
        else toast.success('Location shared!');
        setShowAttachMenu(false);
      },
      (error) => toast.error('Location error: ' + error.message)
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      toast.error('Microphone access denied.');
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioBlob(null);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const stopRecordingAndSend = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setTimeout(async () => {
        if (!activeChannelId || !user) return;
        setSending(true);
        try {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const file = new File([blob], 'voice-message.webm', { type: 'audio/webm' });
          setUploadProgress(1);
          const result = await uploadToCloudinary(file, setUploadProgress);
          await supabase.from('club_messages').insert({
            channel_id: activeChannelId,
            sender_id: user.id,
            content: 'Voice Message',
            voice_url: result.url
          });
          setAudioBlob(null);
        } catch (err) {
          toast.error('Failed to send voice message.');
        } finally {
          setSending(false);
          setUploadProgress(0);
        }
      }, 300);
    }
  };

  const handleSend = async (overrides?: any) => {
    if (!newMessage.trim() && !chatAttachment && !editingMessage) return;
    if (!activeChannelId || !user) return;

    // Slow mode enforcement (skip for edits and admins/mods)
    const slowDelay = (activeChannel?.slow_mode_delay ?? 0) * 1000;
    if (!isAdminOrMod && slowDelay > 0 && !editingMessage) {
      const elapsed = Date.now() - lastSentAtRef.current;
      if (elapsed < slowDelay) {
        const remaining = Math.ceil((slowDelay - elapsed) / 1000);
        toast.error(`Slow mode is on. Wait ${remaining}s before sending again.`);
        return;
      }
    }

    setSending(true);

    const text = newMessage.trim();

    if (editingMessage) {
      const { error } = await supabase.from('club_messages').update({
        content: text,
        is_edited: true
      }).eq('id', editingMessage.id);
      
      if (error) toast.error('Could not edit message.');
      else {
        setMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, content: text, is_edited: true } : m));
        setEditingMessage(null);
        setNewMessage('');
      }
      setSending(false);
      return;
    }

    setNewMessage('');

    let imageUrl: string | null = null;
    let videoUrl: string | null = null;
    let pdfUrl: string | null = null;

    if (chatAttachment) {
      if (chatAttachment.file.size > 100 * 1024 * 1024) {
        toast.error('File is too large. Maximum size is 100 MB.');
        setNewMessage(text);
        setSending(false);
        return;
      }
      try {
        setUploadProgress(1);
        const result = await uploadToCloudinary(chatAttachment.file, setUploadProgress);
        setUploadProgress(0);
        if (chatAttachment.type === 'image') imageUrl = result.url;
        else if (chatAttachment.type === 'video') videoUrl = result.url;
        else if (chatAttachment.type === 'pdf') pdfUrl = result.url;
        setChatAttachment(null);
      } catch (err: any) {
        toast.error('Upload failed: ' + (err?.message ?? 'unknown error'));
        setUploadProgress(0);
        setNewMessage(text);
        setSending(false);
        return;
      }
    }

    const payload: any = {
      channel_id: activeChannelId,
      sender_id: user.id,
      content: text || '',
      ...overrides
    };
    if (replyingTo) {
      payload.reply_to_id = replyingTo.id;
    }
    if (imageUrl) payload.image_url = imageUrl;
    if (videoUrl) payload.video_url = videoUrl;
    if (pdfUrl) payload.pdf_url = pdfUrl;
    if (attachmentCaption.trim() && (imageUrl || videoUrl)) {
      payload.caption = attachmentCaption.trim();
    }

    let { error } = await supabase.from('club_messages').insert(payload);

    if (error?.code === '42703' || error?.message?.includes('column')) {
      delete payload.reply_to_id;
      delete payload.is_edited;
      ({ error } = await supabase.from('club_messages').insert(payload));
    }

    if (error) {
      toast.error('Could not send message.');
      setNewMessage(text);
    } else {
      setReplyingTo(null);
      setAttachmentCaption('');
      lastSentAtRef.current = Date.now();
      // Clear typing indicator
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (activeChannelId && user) {
        supabase.from('club_typing').delete().eq('channel_id', activeChannelId).eq('user_id', user.id).then();
      }
    }
    setSending(false);
  };

  const submitScheduledMessage = () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select both a date and time.');
      return;
    }
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    if (new Date(scheduledAt) <= new Date()) {
      toast.error('Scheduled time must be in the future.');
      return;
    }
    
    handleSend({
      scheduled_at: scheduledAt,
      is_silent: isSilentSend
    });
    
    setShowScheduleModal(false);
    setScheduledDate('');
    setScheduledTime('');
    setIsSilentSend(false);
    toast.success(isSilentSend ? 'Message scheduled silently.' : 'Message scheduled.');
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm('Delete this message?')) return;
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deleted_at: new Date().toISOString() } : m));
    await supabase.from('club_messages').update({ deleted_at: new Date().toISOString() }).eq('id', msgId);
  };

  const handleEditMessage = (msg: Message) => {
    setEditingMessage(msg);
    setReplyingTo(null);
    setNewMessage(msg.content || '');
    textareaRef.current?.focus();
  };

  const handleReplyMessage = (msg: Message) => {
    setReplyingTo(msg);
    setEditingMessage(null);
    textareaRef.current?.focus();
  };

  const handleToggleReaction = async (msgId: string, emoji: string) => {
    if (!user) return;
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    const existing = msg.reactions?.find(r => r.user_id === user.id && r.emoji === emoji);
    if (existing) {
      await supabase.from('message_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('message_reactions').insert({ message_id: msgId, user_id: user.id, emoji });
    }
  };

  const handleAddChannel = async () => {
    if (!newChannelName.trim() || !clubId) return;
    setAddingChannel(true);
    const cleanName = newChannelName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    const { data, error } = await supabase.from('club_channels').insert({
      club_id: clubId,
      name: cleanName,
      description: newChannelDesc.trim() || null,
      is_announcement_only: isAnnouncements,
      order_index: channels.length,
    }).select().single();

    if (error) {
      toast.error('Failed to create channel.');
    } else {
      setChannels(prev => [...prev, data]);
      setActiveChannelId(data.id);
      setShowAddChannel(false);
      setNewChannelName(''); setNewChannelDesc(''); setIsAnnouncements(false);
      setMobileView('chat');
    }
    setAddingChannel(false);
  };

  const updatePreference = async (key: string, value: any) => {
    if (!user) return;
    setPreferences(prev => prev ? { ...prev, [key]: value } : prev);
    await supabase.from('user_chat_preferences').update({ [key]: value }).eq('user_id', user.id);
  };

  // ─── 4. Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-amber)]" />
      </div>
    );
  }

  const canPost = activeChannel && (!activeChannel.is_announcement_only || isAdminOrMod);

  return (
    <div className="flex h-[calc(100vh-80px)] max-w-6xl mx-auto overflow-hidden bg-white shadow-sm border border-[var(--color-border)] rounded-2xl">
      
      {/* ─── Left Sidebar: Channels ─── */}
      <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-64 border-r border-[var(--color-border)] bg-[#FAFAFA]`}>
        
        {/* Header */}
        <div className="px-4 py-4 border-b border-[var(--color-border)] bg-white">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-navy mb-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Club
          </button>
          <h2 className="font-heading text-navy text-lg font-bold truncate">{clubName}</h2>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-3 mb-2 flex items-center justify-between">
            <span>Channels</span>
            {isAdminOrMod && (
              <button onClick={() => setShowAddChannel(!showAddChannel)} className="hover:text-[var(--color-amber)] transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Add Channel Inline Form */}
          {showAddChannel && isAdminOrMod && (
            <div className="sc-card p-3 mb-3 bg-white border border-[var(--color-amber)]/30">
              <input value={newChannelName} onChange={e => setNewChannelName(e.target.value)}
                placeholder="channel-name" className="sc-input text-xs px-2 py-1.5 mb-2 w-full"
                onKeyDown={e => { if(e.key==='Enter') handleAddChannel() }} autoFocus />
              <input value={newChannelDesc} onChange={e => setNewChannelDesc(e.target.value)}
                placeholder="Description (optional)" className="sc-input text-xs px-2 py-1.5 mb-2 w-full" />
              <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] mb-3 cursor-pointer">
                <input type="checkbox" checked={isAnnouncements} onChange={e => setIsAnnouncements(e.target.checked)} />
                Announcements only
              </label>
              <div className="flex gap-1.5">
                <button onClick={handleAddChannel} disabled={addingChannel || !newChannelName.trim()}
                  className="btn-amber text-xs py-1.5 px-3 flex-1 disabled:opacity-50">
                  {addingChannel ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Create'}
                </button>
                <button onClick={() => {setShowAddChannel(false); setNewChannelName(''); setNewChannelDesc('');}} 
                  className="btn-ghost text-xs py-1.5 px-2">Cancel</button>
              </div>
            </div>
          )}

          {channels.map(chan => {
            const isActive = chan.id === activeChannelId;
            const Icon = chan.is_announcement_only ? Megaphone : Hash;
            return (
              <button
                key={chan.id}
                onClick={() => { setActiveChannelId(chan.id); setMobileView('chat'); setChannelUnreads(prev => ({ ...prev, [chan.id]: 0 })); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-[var(--color-navy)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[#F0F0F0] hover:text-navy'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white/70' : 'text-[var(--color-text-muted)]'}`} />
                <span className="truncate flex-1 text-left">{chan.name}</span>
                {(channelUnreads[chan.id] ?? 0) > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center flex-shrink-0
                    ${isActive ? 'bg-white/25 text-white' : 'bg-[var(--color-amber)] text-white'}`}>
                    {channelUnreads[chan.id] > 99 ? '99+' : channelUnreads[chan.id]}
                  </span>
                )}
              </button>
            );
          })}

          {channels.length === 0 && (
            <div className="text-center py-6 px-4">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-[var(--color-text-muted)] opacity-50" />
              <p className="text-xs text-[var(--color-text-secondary)]">No channels yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Right Pane: Chat Window ─── */}
      <div className={`${mobileView === 'channels' ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[var(--color-parchment)] relative`}>
        {activeChannel ? (
          <>
            {/* Chat Header */}
            <div className="flex flex-col bg-white border-b border-[var(--color-border)] z-10 shrink-0">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <button className="md:hidden p-1.5 rounded-lg hover:bg-parchment -ml-1.5" onClick={() => setMobileView('channels')}>
                    <ArrowLeft className="w-5 h-5 text-navy" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-navy)] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      {activeChannel.is_announcement_only ? <Megaphone className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-heading font-bold text-navy text-[15px] leading-tight flex items-center gap-1.5">
                        {activeChannel.name}
                      </div>
                      <div className="text-[13px] text-[var(--color-text-secondary)] leading-tight flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        {activeChannel.is_announcement_only ? 'Announcements' : 'Club Channel'}
                        {activeChannel.description && <span className="hidden sm:inline"> • {activeChannel.description}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center text-[var(--color-text-muted)] h-10 relative">
                  {showSearch ? (
                    <div className="flex items-center gap-2 bg-[#F0F2F5] rounded-full px-3 py-1.5 w-48 sm:w-64 animate-in slide-in-from-right-4 relative mr-2">
                      <Search className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                      <input 
                        autoFocus
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search messages..."
                        className="bg-transparent text-[13px] text-navy outline-none w-full placeholder-[var(--color-text-muted)]"
                      />
                      {searchQuery && (
                        <span className="text-[10px] text-[var(--color-text-muted)] flex-shrink-0 whitespace-nowrap">
                          {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="hover:text-navy hover:bg-black/5 p-1 rounded-full transition-colors flex-shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 sm:gap-2 animate-in fade-in duration-200">
                      <button className="p-2 w-10 h-10 rounded-full hover:bg-parchment hover:text-navy transition-colors hidden sm:flex items-center justify-center" onClick={() => toast.info('Calls coming soon')}>
                        <Phone className="w-5 h-5" />
                      </button>
                      <button className="p-2 w-10 h-10 rounded-full hover:bg-parchment hover:text-navy transition-colors hidden sm:flex items-center justify-center" onClick={() => toast.info('Video coming soon')}>
                        <Video className="w-5 h-5" />
                      </button>
                      <button onClick={() => setShowSearch(true)} className="p-2 w-10 h-10 rounded-full hover:bg-parchment hover:text-navy transition-colors flex items-center justify-center">
                        <Search className="w-5 h-5" />
                      </button>
                      <button onClick={() => setShowDetailsPanel(p => !p)} className="p-2 w-10 h-10 rounded-full hover:bg-parchment transition-colors hidden lg:flex items-center justify-center" title="Channel details">
                        {showDetailsPanel ? <PanelRightClose className="w-5 h-5 text-[var(--color-navy)]" /> : <PanelRightOpen className="w-5 h-5" />}
                      </button>
                      <div className="relative">
                        <button onClick={() => setShowOptionsMenu(!showOptionsMenu)} className="p-2 w-10 h-10 rounded-full hover:bg-parchment hover:text-navy transition-colors flex items-center justify-center">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        {/* Options Menu Dropdown */}
                        {showOptionsMenu && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowOptionsMenu(false)} />
                            <div className="absolute top-12 right-2 w-60 bg-white rounded-xl shadow-[var(--shadow-elevated)] border border-[var(--color-border)] py-1.5 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                              <button onClick={() => { setShowOptionsMenu(false); setShowSearch(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-navy font-medium hover:bg-parchment transition-colors text-left">
                                <Search className="w-4 h-4 opacity-70" /> Search Messages
                              </button>
                              <button onClick={() => { setShowOptionsMenu(false); setShowChatSettings(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-navy font-medium hover:bg-parchment transition-colors text-left">
                                <Settings className="w-4 h-4 opacity-70" /> Chat Settings
                              </button>
                              <button onClick={() => { setShowOptionsMenu(false); setShowSharedMedia(true); setSharedMediaTab('images'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-navy font-medium hover:bg-parchment transition-colors text-left">
                                <Layers className="w-4 h-4 opacity-70" /> Shared Media
                              </button>
                              <button onClick={() => { setShowOptionsMenu(false); toast.info('Notifications muted'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-navy font-medium hover:bg-parchment transition-colors text-left">
                                <BellOff className="w-4 h-4 opacity-70" /> Mute Notifications
                              </button>
                              <button onClick={() => { setShowOptionsMenu(false); toast.info('Channel info coming soon'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-navy font-medium hover:bg-parchment transition-colors text-left">
                                <Info className="w-4 h-4 opacity-70" /> Channel Info
                              </button>
                              <div className="h-px bg-[var(--color-border)] my-1.5" />
                              <button onClick={() => { setShowOptionsMenu(false); toast.info('History cleared locally'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 font-medium hover:bg-red-50 transition-colors text-left">
                                <Trash2 className="w-4 h-4 opacity-70" /> Clear History
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pinned Message Banner */}
              {pinnedMessage && (
                <div
                  className="px-5 py-2 border-t border-[var(--color-border)] bg-[#FAFAFA] flex items-center justify-between cursor-pointer hover:bg-[#F0F2F5] transition-colors"
                  onClick={() => {
                    const el = document.querySelector(`[data-message-id="${pinnedMessage.id}"]`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-8 w-1 bg-[var(--color-amber)] rounded-full flex-shrink-0" />
                    <Pin className="w-3 h-3 text-[var(--color-amber)] flex-shrink-0 hidden sm:block" />
                    <div className="flex flex-col truncate">
                      <span className="text-[10px] font-bold text-[var(--color-amber)] uppercase tracking-wider leading-tight">
                        Pinned · {(pinnedMessage.sender as any)?.first_name || 'Message'}
                      </span>
                      <span className="text-sm text-[var(--color-text-secondary)] truncate">
                        {pinnedMessage.content || 'Media message'}
                      </span>
                    </div>
                  </div>
                  {isAdminOrMod && (
                    <button
                      onClick={e => { e.stopPropagation(); handleUnpinMessage(); }}
                      className="p-1 rounded-lg hover:bg-black/5 text-[var(--color-text-muted)] flex-shrink-0 ml-4"
                      title="Unpin"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div
              ref={messagesAreaRef}
              className={`flex-1 overflow-y-auto px-5 py-4 space-y-0 flex flex-col relative ${preferences?.wallpaper_class || 'wall-default'} ${preferences?.is_dark_mode ? 'bg-[#121212]' : 'bg-[#FAFAFA]'}`}
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 300);
              }}
            >
              {/* Load more / pagination */}
              {hasMore && (
                <div className="flex justify-center py-3">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-muted)] hover:text-navy transition-colors px-3 py-1.5 rounded-full hover:bg-black/5 disabled:opacity-40"
                  >
                    {loadingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronUp className="w-3 h-3" />}
                    {loadingMore ? 'Loading…' : 'Load earlier messages'}
                  </button>
                </div>
              )}

              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-50 pt-10">
                  {activeChannel.is_announcement_only ? <Megaphone className="w-10 h-10 mb-3" /> : <MessageSquare className="w-10 h-10 mb-3" />}
                  <h3 className="font-semibold text-navy">Welcome to #{activeChannel.name}</h3>
                  <p className="text-sm font-body text-[var(--color-text-secondary)] max-w-xs mx-auto mt-1">
                    {activeChannel.is_announcement_only 
                      ? 'This is an announcement channel. Only admins and mods can post here.' 
                      : 'This is the start of the channel. Send a message to say hello!'}
                  </p>
                </div>
              )}

              {filteredMessages.map((msg, i) => {
                const isOwn = msg.sender_id === user?.id;
                const prevMsg = i > 0 ? filteredMessages[i - 1] : null;
                const nextMsg = i < filteredMessages.length - 1 ? filteredMessages[i + 1] : null;

                const msgDate  = new Date(msg.created_at);
                const prevDate = prevMsg ? new Date(prevMsg.created_at) : null;
                const nextDate = nextMsg ? new Date(nextMsg.created_at) : null;

                // ── date divider ──
                const showDateDivider = !prevDate || !isSameDay(msgDate, prevDate);
                let dateDividerText = '';
                if (showDateDivider) {
                  if (isToday(msgDate)) dateDividerText = 'Today';
                  else if (isYesterday(msgDate)) dateDividerText = 'Yesterday';
                  else dateDividerText = format(msgDate, 'MMMM d, yyyy');
                }

                // ── group position (5-min window) ──
                const GAP = 5 * 60 * 1000;
                const isGroupFirst =
                  showDateDivider ||
                  !prevMsg ||
                  prevMsg.sender_id !== msg.sender_id ||
                  msgDate.getTime() - prevDate!.getTime() > GAP;

                const isGroupLast =
                  !nextMsg ||
                  nextMsg.sender_id !== msg.sender_id ||
                  !isSameDay(msgDate, nextDate!) ||
                  nextDate!.getTime() - msgDate.getTime() > GAP;

                // ── bubble shape ──
                // Tail = very-small corner on the outer side, only on the last bubble
                let bubbleRadius: string;
                if (isOwn) {
                  if (isGroupFirst && isGroupLast) bubbleRadius = 'rounded-[20px] rounded-br-[5px]';
                  else if (isGroupFirst)           bubbleRadius = 'rounded-[20px] rounded-br-[8px]';
                  else if (isGroupLast)            bubbleRadius = 'rounded-[20px] rounded-tr-[8px] rounded-br-[5px]';
                  else                             bubbleRadius = 'rounded-[20px] rounded-r-[8px]';
                } else {
                  if (isGroupFirst && isGroupLast) bubbleRadius = 'rounded-[20px] rounded-bl-[5px]';
                  else if (isGroupFirst)           bubbleRadius = 'rounded-[20px] rounded-bl-[8px]';
                  else if (isGroupLast)            bubbleRadius = 'rounded-[20px] rounded-tl-[8px] rounded-bl-[5px]';
                  else                             bubbleRadius = 'rounded-[20px] rounded-l-[8px]';
                }

                // ── spacing: tight within a group, open between groups ──
                const marginTopClass = isGroupFirst && i !== 0 ? 'mt-4' : 'mt-[3px]';

                return (
                  <div key={msg.id} data-message-id={msg.id} className="flex flex-col">

                    {/* Date Divider */}
                    {showDateDivider && (
                      <div className="flex justify-center my-5 mb-4">
                        <span className="px-3 py-1 bg-black/5 text-[var(--color-text-secondary)] text-[11px] font-bold uppercase tracking-wider rounded-full">
                          {dateDividerText}
                        </span>
                      </div>
                    )}

                    <div className={`flex gap-2 items-end ${isOwn ? 'flex-row-reverse' : ''} ${marginTopClass}`}>

                      {/* Avatar — anchored to bottom, visible only on last bubble of group */}
                      <div className="w-8 flex-shrink-0">
                        {!isOwn && isGroupLast ? (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={msg.sender?.avatar_url} />
                            <AvatarFallback style={{ background: 'var(--color-navy)', color: 'white', fontSize: '12px' }}>
                              {msg.sender?.first_name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-8 h-8" />
                        )}
                      </div>

                      {/* Bubble Container */}
                      <div className={`max-w-[78%] sm:max-w-[70%] flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>

                        {/* Name header — first bubble of group only, for other users */}
                        {!isOwn && isGroupFirst && (
                          <div className="mb-0.5 px-2">
                            <span className="text-[13px] font-bold text-slate-700 tracking-tight">
                              {msg.sender?.first_name || 'Member'}
                            </span>
                          </div>
                        )}

                        <div className={`flex flex-col gap-1.5 ${isOwn ? 'items-end' : 'items-start'} relative group`}>

                          {/* Actions Menu (Desktop hover) */}
                          {!msg.deleted_at && (
                            <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-[var(--color-border)] rounded-full shadow-sm items-center p-0.5 z-10 hidden md:flex
                              ${isOwn ? '-left-[150px]' : '-right-[150px]'}
                            `}>
                              <div className="relative group/react inline-block">
                                <button title="React" className="p-1.5 hover:bg-black/5 rounded-full text-[var(--color-text-secondary)] hover:text-amber-500"><Smile className="w-4 h-4" /></button>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/react:flex items-center gap-1 bg-white border border-[var(--color-border)] shadow-lg rounded-full p-1 opacity-0 group-hover/react:opacity-100 transition-opacity animate-in fade-in zoom-in-95">
                                  {['👍','❤️','😂','😮','😢','😡'].map(e => (
                                    <button key={e} onClick={() => handleToggleReaction(msg.id, e)} className="hover:bg-black/5 hover:scale-110 transition-transform rounded-full w-7 h-7 flex items-center justify-center text-sm">{e}</button>
                                  ))}
                                </div>
                              </div>

                              <button onClick={() => handleReplyMessage(msg)} title="Reply" className="p-1.5 hover:bg-black/5 rounded-full text-[var(--color-text-secondary)] hover:text-navy"><Reply className="w-4 h-4" /></button>
                              {isOwn && <button onClick={() => handleEditMessage(msg)} title="Edit" className="p-1.5 hover:bg-black/5 rounded-full text-[var(--color-text-secondary)] hover:text-blue-500"><Edit2 className="w-4 h-4" /></button>}
                              <button onClick={() => { setForwardingMessage(msg); setShowForwardModal(true); }} title="Forward" className="p-1.5 hover:bg-black/5 rounded-full text-[var(--color-text-secondary)] hover:text-emerald-500"><CornerUpLeft className="w-4 h-4" style={{ transform: 'scaleX(-1)' }} /></button>
                              {isAdminOrMod && <button onClick={() => handlePinMessage(msg)} title="Pin" className="p-1.5 hover:bg-black/5 rounded-full text-[var(--color-text-secondary)] hover:text-amber-500"><Pin className="w-4 h-4" /></button>}
                              {(isOwn || isAdminOrMod) && <button onClick={() => handleDeleteMessage(msg.id)} title="Delete" className="p-1.5 hover:bg-black/5 rounded-full text-[var(--color-text-secondary)] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
                            </div>
                          )}

                          {/* Deleted State Guard */}
                          {msg.deleted_at ? (
                            <div className={`px-3.5 py-2.5 text-[13px] font-body text-[var(--color-text-muted)] italic bg-white shadow-sm border border-[var(--color-border)] ${bubbleRadius} flex items-center gap-2`}>
                              <Trash2 className="w-3.5 h-3.5 opacity-50" /> This message was deleted.
                            </div>
                          ) : (
                            <>
                              {/* Reactions List */}
                              {msg.reactions && msg.reactions.length > 0 && (() => {
                                const counts = msg.reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {} as Record<string, number>);
                                const userReacts = new Set(msg.reactions.filter(r => r.user_id === user?.id).map(r => r.emoji));
                                return (
                                  <div className={`flex flex-wrap gap-1 mb-1 relative z-0 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                    {Object.entries(counts).map(([emoji, count]) => {
                                      const iReacted = userReacts.has(emoji);
                                      return (
                                        <button 
                                          key={emoji}
                                          onClick={() => handleToggleReaction(msg.id, emoji)}
                                          className={`flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.05)] border transition-colors ${iReacted ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-black/5'}`}
                                        >
                                          <span>{emoji}</span><span>{count}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                );
                              })()}

                              {/* Forwarded label */}
                              {msg.forwarded_from_name && (
                                <div className={`flex items-center gap-1.5 text-[11px] font-medium mb-0.5 ${isOwn ? 'text-white/70' : 'text-[var(--color-text-muted)]'}`}>
                                  <CornerDownRight className="w-3 h-3" />
                                  Forwarded from {msg.forwarded_from_name}
                                </div>
                              )}

                              {/* Reply Quote Block */}
                              {msg.reply_to_id && (() => {
                                const quoted = messages.find(m => m.id === msg.reply_to_id);
                                if (!quoted) return null;
                                return (
                                  <div className={`text-[12px] pl-2.5 py-1 mb-0.5 border-l-2 cursor-pointer max-w-[200px] sm:max-w-[260px] text-left
                                    ${isOwn ? 'border-white/50 text-white' : 'border-[var(--color-amber)] text-navy'}
                                  `} onClick={() => {
                                    const el = document.querySelector(`[data-message-id="${msg.reply_to_id}"]`);
                                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }}>
                                    <div className="font-bold truncate opacity-90">{quoted.sender?.first_name || 'Member'}</div>
                                    <div className="truncate opacity-75">{quoted.content || 'Attachment'}</div>
                                  </div>
                                );
                              })()}

                          {/* Image */}
                          {msg.image_url && (
                            <div
                              className={`relative overflow-hidden shadow-sm cursor-pointer border border-black/5 outline-none select-none ${bubbleRadius} shrink-0`}
                              onClick={(e) => { e.preventDefault(); setViewingImageMsg(msg); }}
                              style={{ WebkitTapHighlightColor: 'transparent', transform: 'translateZ(0)' }}
                            >
                              <img
                                src={msg.image_url}
                                alt=""
                                draggable={false}
                                className="w-full h-auto max-h-60 max-w-[280px] sm:max-w-xs object-cover block"
                              />
                            </div>
                          )}
                          {msg.image_url && msg.caption && (
                            <div className={`px-3.5 py-2 text-[14px] font-body leading-relaxed shadow-sm break-words max-w-[280px] sm:max-w-xs ${bubbleRadius}
                              ${isOwn ? 'bg-gradient-to-br from-[var(--color-navy)] to-slate-800 text-white' : 'bg-white text-[#1E293B] border border-gray-100/50'}`}>
                              {msg.caption}
                            </div>
                          )}

                          {/* Video */}
                          {msg.video_url && (
                            <div
                              className={`relative overflow-hidden shadow-sm bg-black border border-black/5 ${bubbleRadius} shrink-0`}
                              style={{ transform: 'translateZ(0)' }}
                            >
                              <video
                                src={msg.video_url}
                                controls
                                className="w-full h-auto max-h-52 max-w-[280px] sm:max-w-xs object-cover block"
                              />
                            </div>
                          )}
                          {msg.video_url && msg.caption && (
                            <div className={`px-3.5 py-2 text-[14px] font-body leading-relaxed shadow-sm break-words max-w-[280px] sm:max-w-xs ${bubbleRadius}
                              ${isOwn ? 'bg-gradient-to-br from-[var(--color-navy)] to-slate-800 text-white' : 'bg-white text-[#1E293B] border border-gray-100/50'}`}>
                              {msg.caption}
                            </div>
                          )}

                          {/* PDF */}
                          {msg.pdf_url && (
                            <a
                              href={msg.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium shadow-sm max-w-xs ${bubbleRadius}
                                ${isOwn
                                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-indigo-500/10'
                                  : 'bg-white text-navy border border-[var(--color-border)]'
                                }`}
                            >
                              <FileText className={`w-4 h-4 flex-shrink-0 ${isOwn ? 'text-white/80' : 'text-red-400'}`} />
                              <span className="truncate">{decodeURIComponent(msg.pdf_url.split('/').pop() ?? 'document.pdf')}</span>
                              <ExternalLink className="w-3 h-3 opacity-60 flex-shrink-0" />
                            </a>
                          )}

                          {/* Voice */}
                          {msg.voice_url && (
                            <AudioPlayerBubble url={msg.voice_url} isOwn={isOwn} bubbleRadius={bubbleRadius} />
                          )}

                          {/* Location */}
                          {msg.location_lat && msg.location_lng && (
                            <div className={`flex flex-col overflow-hidden shadow-sm w-[240px] ${bubbleRadius} ${isOwn ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white' : 'bg-white text-navy border border-[var(--color-border)]'}`}>
                              <div className="h-28 w-full bg-slate-200 relative">
                                <img src={`https://static-maps.yandex.ru/1.x/?lang=en-US&ll=${msg.location_lng},${msg.location_lat}&z=14&l=map&size=240,112&pt=${msg.location_lng},${msg.location_lat},pm2ntl`} alt="Map" className="w-full h-full object-cover" />
                              </div>
                              <div className="px-3 py-2.5 text-[13px] font-medium flex items-center justify-between">
                                <span className="flex items-center gap-2"><MapPin className={`w-4 h-4 ${isOwn ? 'text-white/80' : 'text-cyan-600'}`} /> Shared Location</span>
                                <ExternalLink className={`w-3.5 h-3.5 opacity-60`} />
                              </div>
                            </div>
                          )}

                          {/* Project Bubble */}
                          {msg.project && (
                            <div className="mt-2 text-left clear-both max-w-full">
                              <ProjectBubble
                                project={msg.project as any}
                                currentUserId={user?.id}
                                onApply={() => {
                                  if (msg.project!.creator_id === user?.id) {
                                    toast.info("You're the project creator");
                                    return;
                                  }
                                  const already = msg.project!.applications?.some(a => a.user_id === user?.id);
                                  if (already) {
                                    const status = msg.project!.applications!.find(a => a.user_id === user?.id)?.status;
                                    toast.info(`Your application is ${status}`);
                                    return;
                                  }
                                  setApplyingToProject(msg.project as any);
                                }}
                                onViewDetails={() => {
                                  if (msg.project!.creator_id === user?.id) {
                                    setViewingApplicants(msg.project as any);
                                  } else {
                                    const already = msg.project!.applications?.some(a => a.user_id === user?.id);
                                    if (already) {
                                      const status = msg.project!.applications!.find(a => a.user_id === user?.id)?.status;
                                      toast.info(`Your application is ${status}`);
                                    } else {
                                      setApplyingToProject(msg.project as any);
                                    }
                                  }
                                }}
                              />
                            </div>
                          )}

                          {/* Poll */}
                          {msg.poll && (
                            <div className={`flex flex-col shadow-sm w-[260px] p-3 ${bubbleRadius} ${isOwn ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white' : 'bg-white text-navy border border-[var(--color-border)]'}`}>
                              <div className="flex items-start gap-2.5 mb-3">
                                <BarChart2 className={`w-5 h-5 flex-shrink-0 ${isOwn ? 'text-white/80' : 'text-orange-500'}`} />
                                <div>
                                  <div className="text-[14px] font-bold leading-tight relative">{msg.poll.question}</div>
                                  <div className={`text-[10px] uppercase font-bold mt-1 ${isOwn ? 'text-white/70' : 'text-orange-500/80'}`}>
                                    {msg.poll.is_anonymous ? 'Anonymous Poll' : 'Public Poll'} {msg.poll.multiple_answers ? '• Multiple' : ''}
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                {msg.poll.options?.map(opt => {
                                  const totalVotes = msg.poll!.options!.reduce((acc, o) => acc + (o.votes?.length || 0), 0);
                                  const optionVotes = opt.votes?.length || 0;
                                  const percent = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                                  const voted = opt.votes?.some(v => v.user_id === user?.id);
                                  return (
                                    <button key={opt.id} className={`w-full relative overflow-hidden rounded-lg border flex items-center justify-between px-3 py-1.5 transition-colors cursor-pointer group
                                      ${isOwn 
                                        ? `border-white/20 hover:bg-white/10 ${voted ? 'bg-white/20' : ''}` 
                                        : `border-[var(--color-border)] hover:bg-[#F0F2F5] ${voted ? 'bg-orange-50 border-orange-200' : ''}`
                                      }`}
                                      onClick={async () => {
                                        if (!user) return;
                                        if (voted) {
                                          const vote = opt.votes!.find(v => v.user_id === user.id);
                                          if (vote) await supabase.from('poll_votes').delete().eq('id', vote.id);
                                        } else {
                                          await supabase.from('poll_votes').insert({ option_id: opt.id, user_id: user.id });
                                        }
                                      }}
                                    >
                                      <div className={`absolute top-0 left-0 h-full transition-all duration-500 z-0 ${isOwn ? 'bg-white/20' : 'bg-orange-100'}`} style={{ width: `${percent}%` }} />
                                      <span className={`text-[13px] font-medium relative z-10 flex items-center gap-1.5 ${isOwn ? 'text-white' : 'text-navy'}`}>
                                        {opt.text}
                                        <div className={`w-1.5 h-1.5 rounded-full ${voted ? (isOwn ? 'bg-white' : 'bg-orange-500') : 'opacity-0'} shadow-sm`} />
                                      </span>
                                      <span className={`text-[11px] font-bold relative z-10 ${isOwn ? 'text-white/80' : 'text-[var(--color-text-secondary)]'}`}>{percent}%</span>
                                    </button>
                                  );
                                })}
                              </div>
                              <div className={`text-[10px] mt-2 text-right ${isOwn ? 'text-white/60' : 'text-[var(--color-text-muted)]'}`}>
                                {msg.poll.options?.reduce((acc, o) => acc + (o.votes?.length || 0), 0) || 0} votes
                              </div>
                            </div>
                          )}

                          {/* Text */}
                          {msg.content && !msg.poll && !msg.project && msg.content !== 'Voice Message' && msg.content !== 'Shared Location' && (
                            <div
                              className={`px-3.5 py-2 text-[15px] font-body leading-[1.45] shadow-sm break-words ${bubbleRadius}
                                ${isOwn
                                  ? 'bg-gradient-to-br from-[var(--color-navy)] to-slate-800 text-white shadow-slate-800/10'
                                  : 'bg-white text-[#1E293B] border border-gray-100/50'
                                }
                              `}
                              style={{ minWidth: '80px' }}
                            >
                              <span className="whitespace-pre-wrap leading-relaxed">{parseMessageContent(msg.content, searchQuery)}</span>
                              <span className={`float-right flex items-center gap-1 text-[10px] select-none ml-3 mt-2 ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                                {msg.is_edited && <span className="opacity-70 italic mr-0.5">edited</span>}
                                {format(msgDate, 'h:mm a')}
                                {isOwn && (
                                  channelReads.some(r => new Date(r.last_read_at) >= new Date(msg.created_at))
                                    ? <CheckCheck className="w-[14px] h-[14px] text-blue-300" />
                                    : <Check className="w-[14px] h-[14px] opacity-60" />
                                )}
                              </span>
                              <div className="clear-both" />
                            </div>
                          )}

                          {/* Media-only / project timestamp */}
                          {(!msg.content || msg.poll || msg.project || msg.content === 'Voice Message' || msg.content === 'Shared Location' || msg.image_url || msg.video_url || msg.pdf_url) && (!msg.content || msg.poll || msg.project || msg.content === 'Voice Message' || msg.content === 'Shared Location') && (
                            <div className={`flex items-center gap-1 text-[10px] select-none px-1 mt-0.5 justify-end w-full ${isOwn ? 'text-[var(--color-text-muted)]' : 'text-gray-400'}`}>
                              {msg.is_edited && <span className="opacity-70 italic mr-0.5">edited</span>}
                              {format(msgDate, 'h:mm a')}
                              {isOwn && (
                                channelReads.some(r => new Date(r.last_read_at) >= new Date(msg.created_at))
                                  ? <CheckCheck className="w-[14px] h-[14px] text-blue-400" />
                                  : <Check className="w-[14px] h-[14px] opacity-50" />
                              )}
                            </div>
                          )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Scroll to Bottom FAB */}
            {showScrollBottom && (
              <button 
                onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="absolute right-6 bottom-24 p-3 bg-white border border-[var(--color-border)] rounded-full text-navy shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all z-20 animate-in fade-in slide-in-from-bottom-5 hidden sm:flex"
              >
                <ArrowDown className="w-5 h-5 opacity-70" />
              </button>
            )}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="px-5 py-1.5 flex items-center gap-2.5 text-[12px] text-[var(--color-text-muted)] bg-white border-t border-[var(--color-border)]/50 animate-in fade-in duration-200">
                <div className="flex gap-0.5 items-end h-3">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
                <span>
                  {typingUsers.length === 1
                    ? `${typingUsers[0].name} is typing…`
                    : typingUsers.length === 2
                      ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing…`
                      : `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing…`}
                </span>
              </div>
            )}

            {/* Input Area */}
            <div className="px-4 py-3 bg-white border-t border-[var(--color-border)]">
              {canPost ? (
                <div className="flex flex-col gap-2">

                {/* Attachment preview */}
                {chatAttachment && (
                  <>
                    <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)] bg-white">
                      {chatAttachment.type === 'image' && (
                        <img src={chatAttachment.previewUrl} alt="" className="max-h-40 w-full object-cover" />
                      )}
                      {chatAttachment.type === 'video' && (
                        <video src={chatAttachment.previewUrl} controls className="max-h-40 w-full bg-black" />
                      )}
                      {chatAttachment.type === 'pdf' && (
                        <div className="flex items-center gap-2.5 px-3 py-3">
                          <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-navy truncate">{chatAttachment.file.name}</span>
                        </div>
                      )}
                      <button
                        onClick={() => { setChatAttachment(null); setAttachmentCaption(''); }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {chatAttachment.type !== 'pdf' && (
                      <input
                        value={attachmentCaption}
                        onChange={e => setAttachmentCaption(e.target.value)}
                        placeholder="Add a caption..."
                        className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-white outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-400/20"
                      />
                    )}
                  </>
                )}

                {/* Upload progress */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div>
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

                {/* Reply / Edit Banner */}
                {(replyingTo || editingMessage) && (
                  <div className="flex items-center justify-between bg-[var(--color-parchment)] px-3 py-2 rounded-2xl mb-2 hover:bg-[#F2F2F2] transition-colors border border-[var(--color-amber)]/20 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3 overflow-hidden border-l-2 border-[var(--color-amber)] pl-2.5 py-0.5 w-full">
                      {replyingTo ? <Reply className="w-4 h-4 text-[var(--color-amber)] flex-shrink-0" /> : <Edit2 className="w-4 h-4 text-[var(--color-amber)] flex-shrink-0" />}
                      <div className="flex flex-col truncate flex-1 pr-2">
                        <span className="text-[11px] font-bold text-[var(--color-amber)] leading-tight">
                          {replyingTo ? `Replying to ${replyingTo.sender?.first_name || 'Member'}` : 'Editing Message'}
                        </span>
                        <span className="text-sm text-[var(--color-text-secondary)] truncate">
                          {replyingTo?.content || editingMessage?.content || 'Attachment'}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setReplyingTo(null); setEditingMessage(null); setNewMessage(''); }}
                      className="p-1.5 rounded-full hover:bg-white text-[var(--color-text-muted)] hover:text-navy transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Formatting Toolbar — shown when composer is focused */}
                {(composerFocused || newMessage.length > 0) && !isRecording && (
                  <div className="flex items-center gap-0.5 px-1 pb-1 animate-in fade-in duration-150">
                    {([
                      { label: 'B', title: 'Bold (wrap with **)',   syntax: '**', cls: 'font-bold' },
                      { label: 'I', title: 'Italic (wrap with *)',  syntax: '*',  cls: 'italic' },
                      { label: 'U', title: 'Underline (wrap with __)', syntax: '__', cls: 'underline' },
                      { label: 'S', title: 'Strikethrough (wrap with ~~)', syntax: '~~', cls: 'line-through' },
                      { label: 'M', title: 'Monospace (wrap with `)', syntax: '`',  cls: 'font-mono text-[11px]' },
                      { label: '||', title: 'Spoiler (wrap with ||)', syntax: '||', cls: 'text-[10px]' },
                    ] as const).map(({ label, title, syntax, cls }) => (
                      <button
                        key={label}
                        type="button"
                        title={title}
                        onMouseDown={e => { e.preventDefault(); applyFormat(syntax); }}
                        className="w-7 h-7 rounded text-[var(--color-text-muted)] hover:bg-black/8 hover:text-navy transition-colors flex items-center justify-center"
                      >
                        <span className={`text-[13px] ${cls}`}>{label}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2 rounded-3xl bg-[#F0F2F5] focus-within:bg-white focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all duration-200 p-1.5 pl-2 relative">

                  {/* Attachment Button & Menu */}
                  <div className="relative mb-0.5">
                    <button
                      onClick={() => setShowAttachMenu(!showAttachMenu)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:text-navy hover:bg-black/5 transition-colors"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*,video/*,.pdf,application/pdf"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setChatAttachment({ file, type: pendingAttachTypeRef.current, previewUrl: URL.createObjectURL(file) });
                        e.target.value = '';
                      }}
                    />

                    {/* Attachment Popup Menu */}
                    {showAttachMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)} />
                        <div className="absolute bottom-12 left-0 w-48 bg-white rounded-xl shadow-[var(--shadow-elevated)] border border-[var(--color-border)] py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2">
                          <button
                            onClick={() => { pendingAttachTypeRef.current = 'image'; setShowAttachMenu(false); fileInputRef.current!.accept = 'image/*'; fileInputRef.current?.click(); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                          >
                            <ImageIcon className="w-4 h-4 text-[var(--color-amber)]" /> Photo / Image
                          </button>
                          <button
                            onClick={() => { setShowAttachMenu(false); setVideoWizardFile(null); setVideoWizardPreview(''); setVideoTitle(''); setShowVideoWizard(true); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                          >
                            <PlayCircle className="w-4 h-4 text-purple-500" /> Video → Playlist
                          </button>
                          <button
                            onClick={() => { pendingAttachTypeRef.current = 'pdf'; setShowAttachMenu(false); fileInputRef.current!.accept = '.pdf,application/pdf'; fileInputRef.current?.click(); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                          >
                            <FileText className="w-4 h-4 text-red-400" /> PDF / File
                          </button>
                          <div className="h-px bg-[var(--color-border)] my-1" />
                          <button
                            onClick={() => { setShowAttachMenu(false); setShowProjectWizard(true); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                          >
                            <Code2 className="w-4 h-4 text-blue-500" /> Share Project
                          </button>
                          <button
                            onClick={() => { setShowAttachMenu(false); setEvtTitle(''); setShowEventWizard(true); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                          >
                            <Calendar className="w-4 h-4 text-green-500" /> Create Event
                          </button>
                          <button
                            onClick={() => { setShowAttachMenu(false); handleShareLocation(); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                          >
                            <MapPin className="w-4 h-4 text-cyan-500" /> Share Location
                          </button>
                          <button
                            onClick={() => { setShowAttachMenu(false); setPollQuestion(''); setPollOptions(['', '']); setShowPollWizard(true); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-parchment hover:text-navy transition-colors text-left"
                          >
                            <BarChart2 className="w-4 h-4 text-orange-500" /> Create Poll
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {isRecording ? (
                    <div className="flex-1 flex items-center justify-between px-2 text-sm text-navy animate-in slide-in-from-right-4 duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="font-mono text-red-500 font-bold">
                          {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                        </span>
                        <span className="text-[var(--color-text-muted)] animate-pulse">Recording Voice...</span>
                      </div>
                      <button onClick={cancelRecording} className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 text-red-500 transition-colors" title="Cancel">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <textarea
                      ref={textareaRef}
                      value={newMessage}
                      onChange={e => { setNewMessage(e.target.value); handleTypingStart(); }}
                      onFocus={() => setComposerFocused(true)}
                      onBlur={() => setComposerFocused(false)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder={`Message #${activeChannel.name}`}
                      rows={1}
                      className="flex-1 resize-none bg-transparent outline-none py-2.5 px-2 text-sm leading-relaxed text-navy placeholder-[var(--color-text-muted)]"
                      style={{ minHeight: '40px', height: '40px', overflowY: 'hidden' }}
                    />
                  )}

                  <button
                    onPointerDown={(e) => {
                      if (e.pointerType === 'mouse' && e.button !== 0) return;
                      longPressTimerRef.current = setTimeout(() => {
                        longPressFiredRef.current = true;
                        if (!isRecording && (newMessage.trim() || chatAttachment || editingMessage)) {
                          setShowScheduleModal(true);
                        }
                      }, 500);
                    }}
                    onPointerUp={() => {
                        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                    }}
                    onPointerLeave={() => {
                        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                    }}
                    onClick={() => {
                      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                      if (longPressFiredRef.current) {
                        longPressFiredRef.current = false;
                        return; // Modal opened, don't trigger regular send
                      }

                      if (isRecording) stopRecordingAndSend();
                      else if (!newMessage.trim() && !chatAttachment && !editingMessage) startRecording();
                      else handleSend();
                    }}
                    disabled={sending}
                    className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-40
                      ${isRecording ? 'bg-red-500 shadow-md scale-110' : 'bg-[var(--color-amber)]'}`}
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : isRecording ? (
                      <StopCircle className="w-4 h-4 text-white animate-in zoom-in" />
                    ) : (newMessage.trim() || chatAttachment || editingMessage) ? (
                      <Send className="w-4 h-4 text-white animate-in zoom-in spin-in-12 duration-200" />
                    ) : (
                      <Mic className="w-4 h-4 text-white animate-in zoom-in" />
                    )}
                  </button>
                </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--color-parchment)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]">
                  <AlertCircle className="w-4 h-4" />
                  Only Admins and Moderators can post in announcements.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Hash className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)] opacity-50" />
              <div className="font-heading text-xl text-navy mb-2">No channel selected</div>
              <p className="text-sm font-body text-[var(--color-text-secondary)]">
                Choose a channel from the left sidebar.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Right Details Sidebar ─── */}
      {showDetailsPanel && (
        <div className="w-[320px] flex-shrink-0 bg-[#FAFAFA] border-l border-[var(--color-border)] flex flex-col hidden lg:flex overflow-hidden animate-in slide-in-from-right-2 duration-300 relative z-20">
          <div className="p-6 flex flex-col items-center bg-white border-b border-[var(--color-border)] shrink-0">
            <Avatar className="w-20 h-20 mb-3 shadow-md border-4 border-white">
              <AvatarFallback className="text-3xl bg-[var(--color-parchment)] text-[var(--color-navy)] font-heading font-bold">{clubName[0]}</AvatarFallback>
            </Avatar>
            <h3 className="font-heading font-bold text-lg text-navy text-center flex items-center gap-1.5">{clubName} <CheckCheck className="w-4 h-4 text-blue-500" /></h3>
            <div className="flex items-center gap-4 mt-3 text-[13px] text-[var(--color-text-secondary)] font-medium">
              <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Members</div>
              <div className="w-1 h-1 bg-[var(--color-text-muted)] rounded-full"></div>
              <div className="flex items-center gap-1.5"><ImageIcon className="w-4 h-4" /> {messages.filter(m => m.image_url || m.video_url).length} Media</div>
            </div>
          </div>
          
          <div className="flex bg-white border-b border-[var(--color-border)] shrink-0">
            {(['images', 'videos', 'files'] as const).map(tab => (
              <button key={tab} onClick={() => setSharedMediaTab(tab)}
                className={`flex-1 py-3 text-[12px] font-bold tracking-wide uppercase transition-colors relative
                  ${sharedMediaTab === tab ? 'text-[var(--color-navy)]' : 'text-[var(--color-text-muted)] hover:text-navy hover:bg-[#F0F2F5]'}`}>
                {tab}
                {sharedMediaTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-amber)]" />}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-white">
            {sharedMediaTab === 'images' && (
              <div className="grid grid-cols-3 gap-1.5">
                {messages.filter(m => m.image_url).length === 0
                  ? <p className="col-span-3 text-center text-[13px] text-[var(--color-text-muted)] py-8">No images shared.</p>
                  : messages.filter(m => m.image_url).map(m => (
                    <div key={m.id} className="aspect-square bg-black/5 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setViewingImageMsg(m)}>
                      <img src={m.image_url!} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))
                }
              </div>
            )}
            {sharedMediaTab === 'videos' && (
              <div className="space-y-2">
                {messages.filter(m => m.video_url).length === 0
                  ? <p className="text-center text-[13px] text-[var(--color-text-muted)] py-8">No videos shared.</p>
                  : messages.filter(m => m.video_url).map(m => (
                    <div key={m.id} className="flex gap-3 items-center p-2 rounded-xl hover:bg-[#F0F2F5] transition-colors border border-transparent hover:border-[var(--color-border)] cursor-pointer">
                      <div className="w-16 h-12 rounded-lg bg-black flex-shrink-0 overflow-hidden relative">
                        <video src={m.video_url!} className="w-full h-full object-cover" />
                        <PlayCircle className="w-6 h-6 text-white absolute inset-0 m-auto opacity-80 pointer-events-none" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-navy truncate">{m.content || 'Video File'}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">{format(new Date(m.created_at), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
            {sharedMediaTab === 'files' && (
              <div className="space-y-2">
                {messages.filter(m => m.pdf_url).length === 0
                  ? <p className="text-center text-[13px] text-[var(--color-text-muted)] py-8">No files shared.</p>
                  : messages.filter(m => m.pdf_url).map(m => (
                    <a key={m.id} href={m.pdf_url!} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F0F2F5] transition-colors border border-transparent hover:border-[var(--color-border)]">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-navy truncate">{decodeURIComponent(m.pdf_url!.split('/').pop() ?? 'document.pdf')}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">{format(new Date(m.created_at), 'MMM d, yyyy')}</p>
                      </div>
                    </a>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Fullscreen Image Viewer Modal ─── */}
      {viewingImageMsg && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 animate-in fade-in duration-200">
          
          {/* Top Actions Bar */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-white/10">
                <AvatarImage src={viewingImageMsg.sender?.avatar_url} />
                <AvatarFallback className="bg-white/10 text-white">
                  {viewingImageMsg.sender?.first_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-white font-medium text-[15px]">
                  {viewingImageMsg.sender?.first_name} {viewingImageMsg.sender?.last_name}
                </span>
                <span className="text-white/60 text-xs">
                  {format(new Date(viewingImageMsg.created_at), 'MMMM d, yyyy • h:mm a')}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => toast.info('Share image coming soon')} 
                className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = viewingImageMsg.image_url;
                  link.download = `lumina_image_${viewingImageMsg.id}.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success('Downloading...');
                }} 
                className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewingImageMsg(null)} 
                className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors ml-2"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Image Container */}
          <div 
            className="flex-1 overflow-hidden flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setViewingImageMsg(null)}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <img 
              src={viewingImageMsg.image_url} 
              alt="Fullscreen view" 
              draggable={false}
              className="max-w-full max-h-full object-contain drop-shadow-2xl animate-in zoom-in-95 duration-200 select-none outline-none"
              onClick={e => e.stopPropagation()}
            />
          </div>
          
          {/* Caption Area (If message has text content) */}
          {viewingImageMsg.content && (
            <div className="p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center">
              <div className="max-w-3xl text-white text-[15px] font-body leading-relaxed text-center">
                {viewingImageMsg.content}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Chat Settings Modal ─── */}
      {showChatSettings && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-4 sm:zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-bold text-navy text-[17px] flex items-center gap-2">
                <Settings className="w-5 h-5 text-navy" /> Chat Settings
              </h3>
              <button onClick={() => setShowChatSettings(false)} className="p-2 rounded-full hover:bg-parchment text-[var(--color-text-muted)]"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="space-y-6">
              {/* Wallpaper */}
              <div>
                <label className="block text-sm font-bold text-navy mb-3">Wallpaper</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {['wall-default', 'wall-1', 'wall-2', 'wall-3'].map(w => (
                     <button 
                       title={w} 
                       key={w} 
                       onClick={() => updatePreference('wallpaper_class', w)} 
                       className={`w-[72px] h-[96px] rounded-xl flex-shrink-0 border-2 transition-all shadow-sm ${w} ${preferences?.wallpaper_class === w ? 'border-amber-500 scale-[1.02] shadow-md' : 'border-transparent opacity-70 hover:opacity-100 hover:-translate-y-1'}`} 
                     />
                  ))}
                </div>
              </div>

              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-navy">Dark Mode Bubbles</div>
                  <div className="text-[11px] text-[var(--color-text-muted)]">Toggle chat interface themes</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={preferences?.is_dark_mode || false} onChange={e => updatePreference('is_dark_mode', e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {isAdminOrMod && (
                <div className="pt-5 border-t border-[var(--color-border)]">
                  <label className="block text-sm font-bold text-navy mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" /> Slow Mode Delay
                  </label>
                  <p className="text-[11px] text-[var(--color-text-muted)] mb-3">Members will be restricted from sending consecutive messages within this interval.</p>
                  <select 
                    value={activeChannel?.slow_mode_delay || 0} 
                    onChange={async (e) => {
                      if (!activeChannelId) return;
                      const val = parseInt(e.target.value);
                      await supabase.from('club_channels').update({ slow_mode_delay: val }).eq('id', activeChannelId);
                      setChannels(channels.map(c => c.id === activeChannelId ? { ...c, slow_mode_delay: val } : c));
                      toast.success(`Slow mode set to ${e.target.options[e.target.selectedIndex].text}`);
                    }}
                    className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-sm font-medium"
                  >
                    <option value={0}>Off</option>
                    <option value={10}>10s</option>
                    <option value={30}>30s</option>
                    <option value={60}>1m</option>
                    <option value={300}>5m</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Schedule Message Modal ─── */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-4 sm:zoom-in-95">
            <h3 className="font-heading font-bold text-navy text-[17px] mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" /> Schedule Message
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase mb-1.5 ml-1">Date</label>
                <input type="date" min={new Date().toISOString().split('T')[0]} value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase mb-1.5 ml-1">Time</label>
                <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-sm font-medium" />
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer hover:bg-black/5 p-2 rounded-xl transition-colors bg-slate-50 border border-[var(--color-border)]">
                    <input type="checkbox" checked={isSilentSend} onChange={e => setIsSilentSend(e.target.checked)} className="w-4 h-4 rounded accent-orange-500" />
                    <span className="text-sm text-navy font-medium"><BellOff className="w-4 h-4 inline-block text-[var(--color-text-muted)] mr-1 mb-0.5" /> Send silently (no notification)</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-3 rounded-xl text-[var(--color-text-secondary)] bg-gray-100 hover:bg-gray-200 transition-colors font-semibold text-sm">Cancel</button>
              <button onClick={submitScheduledMessage} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-md text-sm hover:opacity-90 transition-opacity">Schedule Send</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Poll Wizard Modal ─── */}
      {showPollWizard && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-4 sm:zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-orange-500" />
                <h3 className="font-heading font-bold text-navy text-[17px]">Create a Poll</h3>
              </div>
              <button onClick={() => setShowPollWizard(false)} className="p-2 rounded-full hover:bg-parchment text-[var(--color-text-muted)]"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-3">
              <input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} placeholder="Ask a question *" className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-orange-400/30 font-medium text-navy" />
              
              <div className="space-y-2 pt-2">
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={opt}
                      onChange={e => {
                        const newOpts = [...pollOptions];
                        newOpts[i] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-orange-400/30"
                    />
                    {pollOptions.length > 2 && (
                      <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="p-2 text-[var(--color-text-muted)] hover:text-red-500"><X className="w-4 h-4"/></button>
                    )}
                  </div>
                ))}
              </div>
              {pollOptions.length < 10 && (
                <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-sm text-orange-500 font-medium hover:underline flex items-center gap-1 mt-1"><Plus className="w-3.5 h-3.5"/> Add an option</button>
              )}

              <div className="pt-4 border-t border-[var(--color-border)] space-y-2">
                <label className="flex items-center gap-3 cursor-pointer hover:bg-black/5 p-2 rounded-lg transition-colors">
                  <input type="checkbox" checked={pollIsAnonymous} onChange={e => setPollIsAnonymous(e.target.checked)} className="w-4 h-4 rounded accent-orange-500" />
                  <span className="text-sm text-navy">Anonymous Voting</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer hover:bg-black/5 p-2 rounded-lg transition-colors">
                  <input type="checkbox" checked={pollMultipleAnswers} onChange={e => setPollMultipleAnswers(e.target.checked)} className="w-4 h-4 rounded accent-orange-500" />
                  <span className="text-sm text-navy">Multiple Answers</span>
                </label>
              </div>
            </div>
            
            <button disabled={savingPoll || !pollQuestion.trim()} onClick={submitPollWizard} className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-[15px] hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2 shadow-md">
              {savingPoll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {savingPoll ? 'Creating…' : 'Send Poll'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Video Wizard Modal ─── */}
      {showVideoWizard && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-4 sm:zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-purple-500" />
                <h3 className="font-heading font-bold text-navy text-[17px]">Share Video to Playlist</h3>
              </div>
              <button onClick={() => setShowVideoWizard(false)} className="p-2 rounded-full hover:bg-parchment text-[var(--color-text-muted)]"><X className="w-5 h-5"/></button>
            </div>
            {!videoWizardFile ? (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-colors mb-4">
                <Film className="w-8 h-8 text-purple-400" />
                <span className="text-sm text-[var(--color-text-secondary)]">Click to select a video</span>
                <input type="file" accept="video/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setVideoWizardFile(f); setVideoWizardPreview(URL.createObjectURL(f)); }
                }} />
              </label>
            ) : (
              <div className="relative rounded-xl overflow-hidden mb-4 bg-black">
                <video src={videoWizardPreview} controls className="w-full max-h-48 object-contain" />
                <button onClick={() => { setVideoWizardFile(null); setVideoWizardPreview(''); }} className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white"><X className="w-4 h-4"/></button>
              </div>
            )}
            <div className="space-y-3">
              <input value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="Video title *" className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-purple-400/30" />
              <input value={videoDuration} onChange={e => setVideoDuration(e.target.value)} placeholder="Duration label (e.g. 12:30 — optional)" className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-purple-400/30" />
              <select value={videoPlaylistId} onChange={e => setVideoPlaylistId(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-purple-400/30 bg-white">
                <option value="">— Select existing playlist —</option>
                {playlists.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                <option value="__new__">+ Create new playlist</option>
              </select>
              {(videoPlaylistId === '__new__' || (!videoPlaylistId && playlists.length === 0)) && (
                <input value={videoNewPlaylistName} onChange={e => setVideoNewPlaylistName(e.target.value)} placeholder="New playlist name *" className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-purple-400/30" />
              )}
            </div>
            <button disabled={savingVideo || !videoWizardFile || !videoTitle.trim()} onClick={submitVideoWizard} className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold text-[15px] hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2">
              {savingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              {savingVideo ? 'Uploading…' : 'Save to Playlist & Share'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Project Wizard Modal ─── */}
      {showProjectWizard && (
        <ProjectWizard
          onClose={() => setShowProjectWizard(false)}
          onSubmit={submitProjectWizard}
          isSaving={savingProject}
        />
      )}

      {/* ─── Project Application Form ─── */}
      {applyingToProject && (
        <ProjectApplicationForm
          project={applyingToProject}
          onClose={() => setApplyingToProject(null)}
          onSubmit={(payload) => handleSubmitApplication(applyingToProject, payload)}
          isSubmitting={submittingApplication}
        />
      )}

      {/* ─── Project Applicants Dashboard (creator only) ─── */}
      {viewingApplicants && (
        <ProjectApplicantsDashboard
          project={viewingApplicants}
          onClose={() => setViewingApplicants(null)}
          onUpdateStatus={handleUpdateApplicationStatus}
        />
      )}

      {/* ─── Event Wizard Modal ─── */}
      {showEventWizard && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-4 sm:zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-500" />
                <h3 className="font-heading font-bold text-navy text-[17px]">Create an Event</h3>
              </div>
              <button onClick={() => setShowEventWizard(false)} className="p-2 rounded-full hover:bg-parchment text-[var(--color-text-muted)]"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-3">
              <input value={evtTitle} onChange={e => setEvtTitle(e.target.value)} placeholder="Event title *" className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-green-400/30" />
              <textarea value={evtDesc} onChange={e => setEvtDesc(e.target.value)} rows={2} placeholder="Description (optional)" className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-green-400/30 resize-none" />
              <input type="datetime-local" value={evtDate} onChange={e => setEvtDate(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-green-400/30 bg-white" />
              <input value={evtDuration} onChange={e => setEvtDuration(e.target.value)} placeholder="Duration in minutes (optional)" type="number" min="1" className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-green-400/30" />
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[var(--color-border)] cursor-pointer hover:bg-parchment transition-colors">
                <input type="checkbox" checked={evtOnline} onChange={e => setEvtOnline(e.target.checked)} className="w-4 h-4 rounded accent-green-500" />
                <span className="text-sm text-navy">Online Event</span>
              </label>
              {evtOnline && (
                <input value={evtLink} onChange={e => setEvtLink(e.target.value)} placeholder="Meeting link (Zoom, Teams…)" className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-green-400/30" />
              )}
            </div>
            <button disabled={savingEvent || !evtTitle.trim() || !evtDate} onClick={submitEventWizard} className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-[15px] hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2">
              {savingEvent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              {savingEvent ? 'Creating…' : 'Create Event & Share'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Shared Media Panel ─── */}
      {showSharedMedia && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-lg h-[85vh] sm:h-[75vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[var(--color-navy)]" />
                <h3 className="font-heading font-bold text-navy text-[17px]">Shared Media</h3>
              </div>
              <button onClick={() => setShowSharedMedia(false)} className="p-2 rounded-full hover:bg-parchment text-[var(--color-text-muted)]"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex border-b border-[var(--color-border)] shrink-0">
              {(['images', 'videos', 'files'] as const).map(tab => (
                <button key={tab} onClick={() => setSharedMediaTab(tab)}
                  className={`flex-1 py-2.5 text-[13px] font-medium capitalize transition-colors ${sharedMediaTab === tab ? 'border-b-2 border-[var(--color-navy)] text-navy' : 'text-[var(--color-text-muted)] hover:text-navy'}`}>
                  {tab === 'images' ? '📷 Images' : tab === 'videos' ? '🎬 Videos' : '📄 Files'}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {sharedMediaTab === 'images' && (
                <div className="grid grid-cols-3 gap-2">
                  {messages.filter(m => m.image_url).length === 0
                    ? <p className="col-span-3 text-center text-sm text-[var(--color-text-muted)] py-8">No images shared yet.</p>
                    : messages.filter(m => m.image_url).map(m => (
                      <div key={m.id} className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => { setShowSharedMedia(false); setViewingImageMsg(m); }}>
                        <img src={m.image_url!} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))
                  }
                </div>
              )}
              {sharedMediaTab === 'videos' && (
                <div className="space-y-3">
                  {messages.filter(m => m.video_url).length === 0
                    ? <p className="text-center text-sm text-[var(--color-text-muted)] py-8">No videos shared yet.</p>
                    : messages.filter(m => m.video_url).map(m => (
                      <div key={m.id} className="flex gap-3 items-center p-3 rounded-xl border border-[var(--color-border)] hover:bg-parchment transition-colors">
                        <div className="w-16 h-12 rounded-lg bg-black flex-shrink-0 overflow-hidden">
                          <video src={m.video_url!} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-navy truncate">{m.content || 'Video'}</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">{format(new Date(m.created_at), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
              {sharedMediaTab === 'files' && (
                <div className="space-y-2">
                  {messages.filter(m => m.pdf_url).length === 0
                    ? <p className="text-center text-sm text-[var(--color-text-muted)] py-8">No files shared yet.</p>
                    : messages.filter(m => m.pdf_url).map(m => (
                      <a key={m.id} href={m.pdf_url!} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] hover:bg-parchment transition-colors">
                        <FileText className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-navy truncate">{decodeURIComponent(m.pdf_url!.split('/').pop() ?? 'document.pdf')}</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">{format(new Date(m.created_at), 'MMM d, yyyy')}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                      </a>
                    ))
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Forward Channel Picker Modal ─── */}
      {showForwardModal && forwardingMessage && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-4 sm:zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <CornerUpLeft className="w-5 h-5 text-emerald-500" style={{ transform: 'scaleX(-1)' }} />
                <h3 className="font-heading font-bold text-navy text-[17px]">Forward to Channel</h3>
              </div>
              <button onClick={() => { setShowForwardModal(false); setForwardingMessage(null); }} className="p-2 rounded-full hover:bg-parchment text-[var(--color-text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview of message being forwarded */}
            <div className="mb-4 px-3 py-2 bg-[var(--color-parchment)] rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] truncate">
              <span className="font-medium text-navy mr-1">"{forwardingMessage.content || 'Attachment'}"</span>
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto">
              {channels.map(chan => {
                const Icon = chan.is_announcement_only ? Megaphone : Hash;
                const isCurrentChannel = chan.id === activeChannelId;
                return (
                  <button
                    key={chan.id}
                    disabled={isCurrentChannel && !forwardingMessage.forwarded_from_id}
                    onClick={() => handleForwardMessage(chan.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-[var(--color-parchment)] transition-colors text-left disabled:opacity-40"
                  >
                    <Icon className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                    <span className="font-medium text-navy truncate">#{chan.name}</span>
                    {isCurrentChannel && <span className="ml-auto text-[10px] text-[var(--color-text-muted)]">current</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
