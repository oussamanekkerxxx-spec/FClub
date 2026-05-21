import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen, Loader2, MessageCircle, MessageSquarePlus, Search, AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DmChatMainPane from '@/features/dm-chat/DmChatMainPane';
import DmModalStack from '@/features/dm-chat/DmModalStack';
import { useDMRealtime } from '@/features/dm-chat/useDMRealtime';
import { useDMComposerActions } from '@/features/dm-chat/useDMComposerActions';
import type { DmMessage, ChatAttachment, ChatAttachType, TypingUser } from '@/features/dm-chat/types';
import type { Conversation } from '@/types/messaging';

type ConversationFilter = 'all' | 'skills' | 'people';

function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.trim().toUpperCase() || '?';
}

function conversationTimeLabel(dateStr?: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  if (diffHours < 48) return '1d';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DmChatWorkspace() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { conversations, setConversations, loading: convsLoading, error: convsError } = useConversations(
    user?.id,
    user?.isDemo ?? false
  );

  // ── Selected conversation ────────────────────────────────────────────────────
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const selectedConversation = useMemo(() => conversations.find((c) => c.id === selectedConvId) ?? null, [conversations, selectedConvId]);

  // ── Message state ────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // ── Composer state ───────────────────────────────────────────────────────────
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [chatAttachment, setChatAttachment] = useState<ChatAttachment | null>(null);
  const [attachmentCaption, setAttachmentCaption] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [replyingTo, setReplyingTo] = useState<DmMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<DmMessage | null>(null);
  const [composerFocused, setComposerFocused] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // ── Voice recording ──────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [convSearchQuery, setConvSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ConversationFilter>('all');
  const [showSearch, setShowSearch] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [viewingImageMsg, setViewingImageMsg] = useState<any | null>(null);
  const [showSharedMedia, setShowSharedMedia] = useState(false);
  const [sharedMediaTab, setSharedMediaTab] = useState<'images' | 'videos' | 'files'>('images');
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingAttachTypeRef = useRef<ChatAttachType>('image');
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── URL param → auto-select conversation ─────────────────────────────────────
  useEffect(() => {
    const convParam = searchParams.get('conv');
    if (convParam && conversations.some((c) => c.id === convParam)) {
      setSelectedConvId(convParam);
      setMobileView('chat');
      return;
    }
    if (!selectedConvId && conversations.length > 0) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations, searchParams, selectedConvId]);

  // ── Sync selected conversation ↔ URL (so AppLayout can detect active chat) ─────
  useEffect(() => {
    if (mobileView === 'chat' && selectedConvId) {
      setSearchParams({ conv: selectedConvId }, { replace: true });
    } else if (mobileView === 'list') {
      setSearchParams({}, { replace: true });
    }
  }, [mobileView, selectedConvId, setSearchParams]);

  // ── Fetch a conversation that isn't in the list yet (e.g. newly created from MemberProfile) ──
  useEffect(() => {
    const convParam = searchParams.get('conv');
    if (!convParam || !user || convsLoading) return;
    if (conversations.some((c) => c.id === convParam)) return;

    let cancelled = false;
    (async () => {
      const { data: conv } = await supabase
        .from('conversations')
        .select('id, skill_id, participant_ids, updated_at')
        .eq('id', convParam)
        .single();
      if (cancelled || !conv) return;

      const otherId =
        (conv.participant_ids as string[]).find((pid) => pid !== user.id) ||
        conv.participant_ids[0];

      const [profileRes, skillRes] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name, avatar_url').eq('id', otherId).single(),
        conv.skill_id
          ? supabase.from('skills').select('id, title').eq('id', conv.skill_id).single()
          : Promise.resolve({ data: null }),
      ]);

      if (cancelled) return;

      const profile = profileRes.data;
      const skill = skillRes.data;
      const newConv: Conversation = {
        id: conv.id,
        skill_id: conv.skill_id,
        participant_ids: conv.participant_ids,
        updated_at: conv.updated_at,
        skill_title: skill?.title,
        other_user: {
          id: otherId,
          firstName: profile?.first_name || 'Unknown',
          lastName: profile?.last_name || '',
          avatar: profile?.avatar_url || '',
        },
        unread_count: 0,
      };

      setConversations((prev) => {
        if (prev.some((c) => c.id === conv.id)) return prev;
        return [newConv, ...prev];
      });
      setSelectedConvId(conv.id);
      setMobileView('chat');
    })();
    return () => { cancelled = true; };
  }, [searchParams, conversations, user, convsLoading, setConversations]);

  // ── Mark conversation as read when it becomes active ─────────────────────────
  useEffect(() => {
    if (!selectedConvId || !user) return;
    // Clear local unread badge
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConvId ? { ...c, unread_count: 0 } : c))
    );
    // Persist to DB (graceful: no-op if dm_reads table doesn't exist yet)
    supabase
      .from('dm_reads')
      .upsert(
        { user_id: user.id, conversation_id: selectedConvId, last_read_at: new Date().toISOString() },
        { onConflict: 'user_id,conversation_id' }
      )
      .then();
  }, [selectedConvId, user, setConversations]);

  // ── Conversation filtering ───────────────────────────────────────────────────
  const skillThreadCount = conversations.filter((c) => !!c.skill_title).length;
  const peopleCount = conversations.length - skillThreadCount;
  const normalizedSearch = convSearchQuery.trim().toLowerCase();

  const filteredConversations = conversations.filter((conv) => {
    if (activeFilter === 'skills' && !conv.skill_title) return false;
    if (activeFilter === 'people' && conv.skill_title) return false;
    if (!normalizedSearch) return true;
    const haystack = [conv.other_user.firstName, conv.other_user.lastName, conv.skill_title, conv.last_message]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  // ── Build controller object ───────────────────────────────────────────────────
  const controller: any = {
    user,
    selectedConvId,
    selectedConversation,
    conversations,
    setConversations,
    messages,
    setMessages,
    loading,
    setLoading,
    hasMore,
    setHasMore,
    loadingMore,
    setLoadingMore,
    newMessage,
    setNewMessage,
    sending,
    setSending,
    chatAttachment,
    setChatAttachment,
    attachmentCaption,
    setAttachmentCaption,
    uploadProgress,
    setUploadProgress,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    composerFocused,
    setComposerFocused,
    showAttachMenu,
    setShowAttachMenu,
    isRecording,
    setIsRecording,
    recordingTime,
    setRecordingTime,
    mediaRecorderRef,
    audioChunksRef,
    recordingTimerRef,
    mobileView,
    setMobileView,
    searchQuery,
    setSearchQuery,
    showSearch,
    setShowSearch,
    showOptionsMenu,
    setShowOptionsMenu,
    showScrollBottom,
    setShowScrollBottom,
    viewingImageMsg,
    setViewingImageMsg,
    showSharedMedia,
    setShowSharedMedia,
    sharedMediaTab,
    setSharedMediaTab,
    typingUsers,
    setTypingUsers,
    messagesEndRef,
    messagesAreaRef,
    textareaRef,
    fileInputRef,
    pendingAttachTypeRef,
    longPressTimerRef,
    longPressFiredRef,
    typingTimerRef,
  };

  const realtimeActions = useDMRealtime(controller);
  const composerActions = useDMComposerActions(controller);
  Object.assign(controller, realtimeActions, composerActions);

  // ── Loading / error states ────────────────────────────────────────────────────
  if (convsLoading) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <div className="rounded-[28px] border border-[rgba(196,135,58,0.16)] bg-white/85 px-8 py-8 shadow-[0_24px_65px_rgba(196,135,58,0.12)] backdrop-blur-sm">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--color-amber)]" />
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Loading your conversations…</p>
        </div>
      </div>
    );
  }

  if (convsError) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <div className="rounded-[28px] border border-[rgba(196,135,58,0.16)] bg-white/90 px-8 py-8 text-center shadow-[0_24px_65px_rgba(196,135,58,0.12)]">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
          <div className="font-heading text-lg text-navy">Could not load conversations</div>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{convsError}</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <div className="max-w-md rounded-[32px] border border-[rgba(196,135,58,0.16)] bg-[linear-gradient(135deg,#FFF9F3_0%,#F9EEDD_100%)] px-8 py-9 text-center shadow-[0_24px_65px_rgba(196,135,58,0.14)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(196,135,58,0.12)] text-[var(--color-amber)]">
            <MessageCircle className="h-7 w-7" />
          </div>
          <div className="mt-5 font-heading text-2xl text-navy">No messages yet</div>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
            Find a skill, reach out to a teacher, and your first conversation will appear here.
          </p>
          <Link to="/app/board" className="btn-amber mt-6 inline-flex">
            <BookOpen className="h-4 w-4" />
            Browse skills
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden rounded-[32px] border border-[rgba(196,135,58,0.16)] bg-[linear-gradient(135deg,#FFF8F1_0%,#F8EEDF_54%,#F7ECE7_100%)] shadow-[0_24px_65px_rgba(196,135,58,0.14)] md:h-[calc(100vh-3.5rem-3rem)]">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute -left-20 top-0 h-48 w-48 rounded-full bg-[rgba(225,107,59,0.1)] blur-[90px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 rounded-full bg-[rgba(92,61,143,0.12)] blur-[100px]" />

      <div className="relative grid h-full md:grid-cols-[340px_minmax(0,1fr)]">
        {/* ── Conversation list sidebar ─────────────────────────────────────── */}
        <aside
          className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} min-h-0 flex-col border-r border-[rgba(196,135,58,0.12)] bg-white/72 backdrop-blur-sm`}
        >
          <div className="border-b border-[rgba(196,135,58,0.12)] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                  Inbox
                </div>
                <h1 className="mt-1 font-heading text-2xl text-[var(--color-navy)]">Messages</h1>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Warm, focused conversations with people in the community.
                </p>
              </div>
              <Link
                to="/app/board"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#C4873A_0%,#E16B3B_100%)] text-white shadow-[0_8px_24px_rgba(225,107,59,0.22)]"
                aria-label="Start a new conversation from browse"
              >
                <MessageSquarePlus className="h-5 w-5" />
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { label: 'All', count: conversations.length },
                { label: 'Skills', count: skillThreadCount },
                { label: 'People', count: peopleCount },
              ].map(({ label, count }) => (
                <div key={label} className="rounded-[20px] border border-white/70 bg-white/80 px-3 py-3 text-center shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">{label}</div>
                  <div className="mt-1 text-lg font-semibold text-[var(--color-navy)]">{count}</div>
                </div>
              ))}
            </div>

            {/* Search */}
            <label className="relative mt-5 block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={convSearchQuery}
                onChange={(e) => setConvSearchQuery(e.target.value)}
                placeholder="Search conversations…"
                aria-label="Search conversations"
                className="w-full rounded-[18px] border border-[rgba(196,135,58,0.14)] bg-[rgba(255,250,245,0.95)] py-3 pl-11 pr-4 text-sm text-[var(--color-navy)] outline-none transition focus:border-[var(--color-amber)] focus:ring-4 focus:ring-[rgba(196,135,58,0.12)]"
              />
            </label>

            {/* Filters */}
            <div className="mt-4 flex gap-2">
              {([
                { id: 'all', label: 'All' },
                { id: 'skills', label: 'Skill threads' },
                { id: 'people', label: 'People' },
              ] as { id: ConversationFilter; label: string }[]).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={activeFilter === tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                    activeFilter === tab.id
                      ? 'bg-[linear-gradient(135deg,#C4873A_0%,#E16B3B_100%)] text-white shadow-[0_8px_20px_rgba(225,107,59,0.18)]'
                      : 'bg-white/75 text-[var(--color-text-secondary)] hover:text-[var(--color-navy)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation rows */}
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {filteredConversations.length > 0 ? (
              <div className="space-y-2">
                {filteredConversations.map((conv) => {
                  const isActive = selectedConvId === conv.id;
                  const participantName = `${conv.other_user.firstName} ${conv.other_user.lastName}`.trim();
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => {
                        setSelectedConvId(conv.id);
                        setMobileView('chat');
                      }}
                      className={`w-full rounded-[24px] border px-3.5 py-3 text-left transition ${
                        isActive
                          ? 'border-[rgba(196,135,58,0.18)] bg-[linear-gradient(135deg,#FFF9F3_0%,#FFF1E5_100%)] shadow-[0_14px_34px_rgba(196,135,58,0.14)]'
                          : 'border-transparent bg-white/55 hover:border-[rgba(196,135,58,0.12)] hover:bg-white/85'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-12 w-12 border-2 border-white/80 shadow-sm">
                            <AvatarImage src={conv.other_user.avatar} alt={participantName} />
                            <AvatarFallback className="bg-[var(--color-plum)] text-sm font-semibold text-white">
                              {initials(conv.other_user.firstName, conv.other_user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          {conv.unread_count > 0 && !isActive && (
                            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-amber)] px-1.5 text-[10px] font-bold text-white shadow-sm">
                              {conv.unread_count > 99 ? '99+' : conv.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className={`truncate text-sm text-[var(--color-navy)] ${conv.unread_count > 0 && !isActive ? 'font-bold' : 'font-semibold'}`}>
                              {participantName}
                            </div>
                            <div className="flex-shrink-0 text-[11px] text-[var(--color-text-muted)]">
                              {conversationTimeLabel(conv.last_message_at)}
                            </div>
                          </div>
                          {conv.skill_title ? (
                            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[rgba(196,135,58,0.12)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-amber)]">
                              <BookOpen className="h-3 w-3" />
                              {conv.skill_title}
                            </div>
                          ) : (
                            <div className="mt-1 text-[11px] font-medium text-[var(--color-text-muted)]">Direct conversation</div>
                          )}
                          <p className={`mt-1.5 truncate text-[12px] leading-5 ${conv.unread_count > 0 && !isActive ? 'font-semibold text-[var(--color-navy)]' : 'text-[var(--color-text-secondary)]'}`}>
                            {conv.last_message || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-[rgba(196,135,58,0.18)] bg-white/55 px-5 py-10 text-center">
                <Search className="mx-auto h-8 w-8 text-[var(--color-text-muted)]" />
                <div className="mt-4 font-heading text-lg text-[var(--color-navy)]">No matches</div>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                  Try a different name, message snippet, or switch the filter.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* ── Chat pane ──────────────────────────────────────────────────────── */}
        <DmChatMainPane c={controller} />
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────────── */}
      <DmModalStack c={controller} />
    </div>
  );
}
