import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ChannelList from '@/components/club-chat/ChannelList';
import ClubChatMainPane from '@/features/club-chat/workspace/ClubChatMainPane';
import ClubChatDetailsSidebar from '@/features/club-chat/workspace/ClubChatDetailsSidebar';
import ClubChatModalStack from '@/features/club-chat/workspace/ClubChatModalStack';
import { useClubChatRealtime } from '@/features/club-chat/workspace/useClubChatRealtime';
import { useClubChatProjectActions } from '@/features/club-chat/workspace/useClubChatProjectActions';
import { useClubChatComposerActions } from '@/features/club-chat/workspace/useClubChatComposerActions';
import { useClubChatUiActions } from '@/features/club-chat/workspace/useClubChatUiActions';
import { normalizeHttpUrl } from '@/lib/safeUrl';
import type {
  Channel,
  ChannelRead,
  ChatAttachType,
  ChatAttachment,
  Message,
  TypingUser,
  UserPreferences,
} from '@/features/club-chat/workspace/types';

export interface ClubChatWorkspaceProps {
  isEmbedded?: boolean;
  clubId?: string;
}

export default function ClubChatWorkspace({ isEmbedded, clubId: propClubId }: ClubChatWorkspaceProps = {}) {
  const params = useParams<{ id: string }>();
  const clubId = propClubId || params.id;
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as any) ?? {};
  const clubName = locationState.clubName || 'Club Chat';
  const focusChannelId = locationState.focusChannelId as string | undefined;
  const focusMessageId = locationState.focusMessageId as string | undefined;

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

  const [showSharedMedia, setShowSharedMedia] = useState(false);
  const [sharedMediaTab, setSharedMediaTab] = useState<'images' | 'videos' | 'files'>('images');

  const [showVideoWizard, setShowVideoWizard] = useState(false);
  const [videoWizardFile, setVideoWizardFile] = useState<File | null>(null);
  const [videoWizardPreview, setVideoWizardPreview] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoPlaylistId, setVideoPlaylistId] = useState('');
  const [videoNewPlaylistName, setVideoNewPlaylistName] = useState('');
  const [videoDuration, setVideoDuration] = useState('');
  const [playlists, setPlaylists] = useState<{ id: string; title: string }[]>([]);
  const [savingVideo, setSavingVideo] = useState(false);

  const [showPollWizard, setShowPollWizard] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollIsAnonymous, setPollIsAnonymous] = useState(false);
  const [pollMultipleAnswers, setPollMultipleAnswers] = useState(false);
  const [savingPoll, setSavingPoll] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [channelUnreads, setChannelUnreads] = useState<Record<string, number>>({});
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
  const [channelReads, setChannelReads] = useState<ChannelRead[]>([]);

  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesAreaRef = useRef<HTMLDivElement>(null);

  const [composerFocused, setComposerFocused] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSilentSend, setIsSilentSend] = useState(false);
  const [userChannelPrefs, setUserChannelPrefs] = useState<any[]>([]);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);
  const lastSentAtRef = useRef<number>(0);

  const [showProjectWizard, setShowProjectWizard] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [applyingToProject, setApplyingToProject] = useState<any | null>(null);
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [viewingApplicants, setViewingApplicants] = useState<any | null>(null);

  const [showEventWizard, setShowEventWizard] = useState(false);
  const [evtTitle, setEvtTitle] = useState('');
  const [evtDesc, setEvtDesc] = useState('');
  const [evtDate, setEvtDate] = useState('');
  const [evtOnline, setEvtOnline] = useState(true);
  const [evtStyle, setEvtStyle] = useState<'workshop' | 'sprint' | 'showcase'>('workshop');
  const [evtLink, setEvtLink] = useState('');
  const [evtDuration, setEvtDuration] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const didFocusMessageRef = useRef(false);

  const [mobileView, setMobileView] = useState<'channels' | 'chat'>('channels');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [isAnnouncements, setIsAnnouncements] = useState(false);
  const [addingChannel, setAddingChannel] = useState(false);

  useEffect(() => {
    const handleOpenSettings = () => setShowChatSettings(true);
    const handleFocusMessage = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { channelId } = customEvent.detail;
      if (channelId) setActiveChannelId(channelId);
      // Let the realtime hook or component handle the message focusing/scrolling
      // This is a placeholder since the actual scrolling depends on pagination.
    };

    window.addEventListener('open-chat-settings', handleOpenSettings);
    window.addEventListener('focus-chat-message', handleFocusMessage);
    
    return () => {
      window.removeEventListener('open-chat-settings', handleOpenSettings);
      window.removeEventListener('focus-chat-message', handleFocusMessage);
    };
  }, []);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(m => m.content?.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const canPost = activeChannel && (!activeChannel.is_announcement_only || isAdminOrMod);

  function parseMessageContent(text: string, query: string) {
    if (!text) return null;
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

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
    escaped = escaped.replace(/((?:https?:\/\/)[^\s<]+)/g, (rawUrl) => {
      const urlValue = rawUrl.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      const safeUrl = normalizeHttpUrl(urlValue);
      if (!safeUrl) return rawUrl;
      const escapedHref = safeUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      return `<a href="${escapedHref}" target="_blank" rel="noopener noreferrer nofollow" class="text-blue-500 hover:underline break-all">${rawUrl}</a>`;
    });

    return <span dangerouslySetInnerHTML={{ __html: escaped }} />;
  }

  const controller: any = {
    clubId, user, clubName, focusChannelId, focusMessageId,
    loading, setLoading,
    isAdminOrMod, setIsAdminOrMod,
    channels, setChannels,
    activeChannelId, setActiveChannelId,
    activeChannel,
    messages, setMessages, filteredMessages,
    newMessage, setNewMessage, sending, setSending,
    showAttachMenu, setShowAttachMenu,
    chatAttachment, setChatAttachment,
    attachmentCaption, setAttachmentCaption,
    uploadProgress, setUploadProgress,
    fileInputRef, textareaRef, pendingAttachTypeRef,
    viewingImageMsg, setViewingImageMsg,
    showSearch, setShowSearch, searchQuery, setSearchQuery, showOptionsMenu, setShowOptionsMenu,
    showSharedMedia, setShowSharedMedia, sharedMediaTab, setSharedMediaTab,
    showVideoWizard, setShowVideoWizard, videoWizardFile, setVideoWizardFile, videoWizardPreview, setVideoWizardPreview, videoTitle, setVideoTitle, videoPlaylistId, setVideoPlaylistId, videoNewPlaylistName, setVideoNewPlaylistName, videoDuration, setVideoDuration, playlists, setPlaylists, savingVideo, setSavingVideo,
    showPollWizard, setShowPollWizard, pollQuestion, setPollQuestion, pollOptions, setPollOptions, pollIsAnonymous, setPollIsAnonymous, pollMultipleAnswers, setPollMultipleAnswers, savingPoll, setSavingPoll,
    isRecording, setIsRecording, recordingTime, setRecordingTime, mediaRecorderRef, audioChunksRef, recordingTimerRef,
    channelUnreads, setChannelUnreads, typingUsers, setTypingUsers, typingTimerRef, pinnedMessage, setPinnedMessage, channelReads, setChannelReads,
    forwardingMessage, setForwardingMessage, showForwardModal, setShowForwardModal,
    hasMore, setHasMore, loadingMore, setLoadingMore, messagesAreaRef,
    composerFocused, setComposerFocused, showDetailsPanel, setShowDetailsPanel,
    showChatSettings, setShowChatSettings, preferences, setPreferences,
    showScheduleModal, setShowScheduleModal, scheduledDate, setScheduledDate, scheduledTime, setScheduledTime, isSilentSend, setIsSilentSend,
    userChannelPrefs, setUserChannelPrefs,
    longPressTimerRef, longPressFiredRef, lastSentAtRef,
    showProjectWizard, setShowProjectWizard, savingProject, setSavingProject, applyingToProject, setApplyingToProject, submittingApplication, setSubmittingApplication, viewingApplicants, setViewingApplicants,
    showEventWizard, setShowEventWizard, evtTitle, setEvtTitle, evtDesc, setEvtDesc, evtDate, setEvtDate, evtOnline, setEvtOnline, evtStyle, setEvtStyle, evtLink, setEvtLink, evtDuration, setEvtDuration, savingEvent, setSavingEvent,
    replyingTo, setReplyingTo, editingMessage, setEditingMessage, showScrollBottom, setShowScrollBottom, didFocusMessageRef,
    mobileView, setMobileView, messagesEndRef,
    showAddChannel, setShowAddChannel, newChannelName, setNewChannelName, newChannelDesc, setNewChannelDesc, isAnnouncements, setIsAnnouncements, addingChannel, setAddingChannel,
    canPost,
    parseMessageContent,
  };

  const realtimeActions = useClubChatRealtime(controller);
  const projectActions = useClubChatProjectActions(controller);
  const composerActions = useClubChatComposerActions(controller);
  const uiActions = useClubChatUiActions(controller);

  Object.assign(controller, realtimeActions, projectActions, composerActions, uiActions);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-amber)]" />
      </div>
    );
  }

  return (
    <div className={`flex bg-white overflow-hidden ${isEmbedded ? 'h-full w-full' : 'h-[calc(100vh-80px)] max-w-6xl mx-auto shadow-sm border border-[var(--color-border)] rounded-2xl'}`}>
      <ChannelList
        isEmbedded={isEmbedded}
        clubName={clubName}
        channels={channels}
        activeChannelId={activeChannelId}
        channelUnreads={channelUnreads}
        isAdminOrMod={isAdminOrMod}
        mobileView={mobileView}
        showAddChannel={showAddChannel}
        newChannelName={newChannelName}
        newChannelDesc={newChannelDesc}
        isAnnouncements={isAnnouncements}
        addingChannel={addingChannel}
        userChannelPrefs={userChannelPrefs}
        onNavigateBack={() => navigate(-1)}
        onSelectChannel={(channelId) => {
          setActiveChannelId(channelId);
          setMobileView('chat');
          setChannelUnreads((prev) => ({ ...prev, [channelId]: 0 }));
        }}
        onToggleAddChannel={() => setShowAddChannel((prev) => !prev)}
        onNewChannelNameChange={setNewChannelName}
        onNewChannelDescChange={setNewChannelDesc}
        onIsAnnouncementsChange={setIsAnnouncements}
        onAddChannel={uiActions.handleAddChannel}
        onRenameChannel={uiActions.handleRenameChannel}
        onDeleteChannel={uiActions.handleDeleteChannel}
        onTogglePinChannel={uiActions.handleTogglePinChannel}
        onToggleArchiveChannel={uiActions.handleToggleArchiveChannel}
        onCancelAddChannel={() => {
          setShowAddChannel(false);
          setNewChannelName('');
          setNewChannelDesc('');
          setIsAnnouncements(false);
        }}
      />

      <ClubChatMainPane c={controller} />
      <ClubChatDetailsSidebar c={controller} />
      <ClubChatModalStack c={controller} />
    </div>
  );
}
