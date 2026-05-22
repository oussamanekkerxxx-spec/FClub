import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChatStore } from '@/features/club-chat/store/chatStore';
import { useChatStoreInit } from '@/features/club-chat/hooks/useChatStoreInit';
import ChannelList from '@/components/club-chat/ChannelList';
import ClubChatMainPane from '@/features/club-chat/workspace/ClubChatMainPane';
import ClubChatDetailsSidebar from '@/features/club-chat/workspace/ClubChatDetailsSidebar';
import ClubChatModalStack from '@/features/club-chat/workspace/ClubChatModalStack';
import { useChatRealtime } from '@/features/club-chat/hooks/useChatRealtime';
import { useChatWizards } from '@/features/club-chat/hooks/useChatWizards';
import { useChatUi } from '@/features/club-chat/hooks/useChatUi';
import { parseMessageContent as cachedParseMessageContent } from '@/features/club-chat/lib/parseMessageContent';
import StartRoomModal from '@/components/club/StartRoomModal';
import LearningFileMetadataModal from '@/components/club/student/LearningFileMetadataModal';
import { MessageSharedFileProvider } from '@/components/club-chat/media/MessageSharedFileContext';
import type {
  ChatAttachType,
  Message,
} from '@/features/club-chat/workspace/types';

export interface ClubChatWorkspaceProps {
  isEmbedded?: boolean;
  clubId?: string;
  clubCategory?: string;
  allowStartRoomFromComposer?: boolean;
  composerRoomHostId?: string;
}

export default function ClubChatWorkspace({
  isEmbedded,
  clubId: propClubId,
  clubCategory,
  allowStartRoomFromComposer = false,
  composerRoomHostId,
}: ClubChatWorkspaceProps = {}) {
  const params = useParams<{ id: string }>();
  const clubId = propClubId || params.id;
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as any) ?? {};
  const clubName = locationState.clubName || 'Club Chat';
  const focusChannelId = locationState.focusChannelId as string | undefined;
  const focusMessageId = locationState.focusMessageId as string | undefined;

  // ── Store init ──
  useChatStoreInit({ clubId, clubCategory });

  // ── Store selectors (UI + Channels domains for Step 1) ──
  const storeLoading = useChatStore((s) => s.ui.loading);
  const storeSetUi = useChatStore((s) => s.setUi);
  const storeChannels = useChatStore((s) => s.channels);
  const storeSetChannels = useChatStore((s) => s.setChannels);
  const storeActiveChannelId = useChatStore((s) => s.activeChannelId);
  const storeSetActiveChannelId = useChatStore((s) => s.setActiveChannelId);
  const storeChannelUnreads = useChatStore((s) => s.channelUnreads);
  const storeSetChannelUnreads = useChatStore((s) => s.setChannelUnreads);
  const storeUserChannelPrefs = useChatStore((s) => s.userChannelPrefs);
  const storeSetUserChannelPrefs = useChatStore((s) => s.setUserChannelPrefs);
  const storeIsAdminOrMod = useChatStore((s) => s.ui.isAdminOrMod);
  const storePreferences = useChatStore((s) => s.preferences);
  const storeSetPreferences = useChatStore((s) => s.setPreferences);
  const storePlaylists = useChatStore((s) => s.playlists);
  const storeSetPlaylists = useChatStore((s) => s.setPlaylists);
  const storeShowScrollBottom = useChatStore((s) => s.ui.showScrollBottom);

  // ── Step 2: Message domain (store-backed) ──
  const storeMessages = useChatStore((s) => s.messages);
  const storeSetMessages = useChatStore((s) => s.setMessages);
  const storeHasMore = useChatStore((s) => s.hasMore);
  const storeSetHasMore = useChatStore((s) => s.setHasMore);
  const storeLoadingMore = useChatStore((s) => s.loadingMore);
  const storeSetLoadingMore = useChatStore((s) => s.setLoadingMore);
  const storePinnedMessage = useChatStore((s) => s.pinnedMessage);
  const storeSetPinnedMessage = useChatStore((s) => s.setPinnedMessage);
  const storeTypingUsers = useChatStore((s) => s.typingUsers);
  const storeSetTypingUsers = useChatStore((s) => s.setTypingUsers);
  const storeChannelReads = useChatStore((s) => s.channelReads);
  const storeSetChannelReads = useChatStore((s) => s.setChannelReads);
  const storeLoadMore = useChatStore((s) => s.loadMore);

  // ── Sync user to store dynamically ──
  useEffect(() => {
    if (user) {
      useChatStore.setState({ user });
    }
  }, [user]);

  // Store composer actions (stable references)
  const storeHandleSend = useChatStore((s) => s.handleSend);
  const storeSubmitScheduledMessage = useChatStore((s) => s.submitScheduledMessage);
  const storeHandleLearningFileSubmit = useChatStore((s) => s.handleLearningFileSubmit);
  const storeSendAttachmentCasually = useChatStore((s) => s.sendAttachmentCasually);

  // ── Steps 4-5: Wizard + UI domain (store-backed) ──
  const storeUi = useChatStore((s) => s.ui);
  const storeVideoWizard = useChatStore((s) => s.videoWizard);
  const storeSetVideoWizard = useChatStore((s) => s.setVideoWizard);
  const storePollWizard = useChatStore((s) => s.pollWizard);
  const storeSetPollWizard = useChatStore((s) => s.setPollWizard);
  const storeEventWizard = useChatStore((s) => s.eventWizard);
  const storeSetEventWizard = useChatStore((s) => s.setEventWizard);
  const storeProjectWizard = useChatStore((s) => s.projectWizard);
  const storeSetProjectWizard = useChatStore((s) => s.setProjectWizard);
  const storeScheduleModal = useChatStore((s) => s.scheduleModal);
  const storeSetScheduleModal = useChatStore((s) => s.setScheduleModal);
  const storeLearningFileModal = useChatStore((s) => s.learningFileModal);
  const storeSetLearningFileModal = useChatStore((s) => s.setLearningFileModal);

  // ── DOM refs (stay in component) ──
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingAttachTypeRef = useRef<ChatAttachType>('image');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);
  const didFocusMessageRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Window events ──
  useEffect(() => {
    const handleOpenSettings = () => storeSetUi({ showChatSettings: true });
    const handleFocusMessage = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { channelId } = customEvent.detail;
      if (channelId) storeSetActiveChannelId(channelId);
    };

    window.addEventListener('open-chat-settings', handleOpenSettings);
    window.addEventListener('focus-chat-message', handleFocusMessage);

    return () => {
      window.removeEventListener('open-chat-settings', handleOpenSettings);
      window.removeEventListener('focus-chat-message', handleFocusMessage);
    };
  }, [storeSetActiveChannelId, storeSetUi]);

  // ── Auto-select first channel ──
  useEffect(() => {
    if (storeChannels.length > 0 && !storeActiveChannelId) {
      storeSetActiveChannelId(storeChannels[0].id);
    }
  }, [storeChannels, storeActiveChannelId, storeSetActiveChannelId]);

  const filteredMessages = useMemo(() => {
    if (!storeUi.searchQuery.trim()) return storeMessages;
    const q = storeUi.searchQuery.toLowerCase();
    return storeMessages.filter((m) => m.content?.toLowerCase().includes(q));
  }, [storeMessages, storeUi.searchQuery]);

  const activeChannel = useMemo(() => storeChannels.find((c) => c.id === storeActiveChannelId), [storeChannels, storeActiveChannelId]);
  const canPost = useMemo(() => activeChannel && (!activeChannel.is_announcement_only || storeIsAdminOrMod), [activeChannel, storeIsAdminOrMod]);

  // ── Parse message content (LRU-cached pure utility) ──
  const parseMessageContent = useCallback(
    (text: string, query: string) => cachedParseMessageContent(text, query),
    []
  );

  // ── Controller ref (bridges store + local state for legacy hooks) ──
  const baseControllerRef = useRef<any>({});
  baseControllerRef.current = {
    clubId, clubCategory, user, clubName, focusChannelId, focusMessageId,

    // UI domain (store-backed)
    loading: storeLoading,
    setLoading: (val: boolean) => storeSetUi({ loading: val }),
    isAdminOrMod: storeIsAdminOrMod,
    setIsAdminOrMod: (val: boolean) => storeSetUi({ isAdminOrMod: val }),

    // Channels domain (store-backed)
    channels: storeChannels,
    setChannels: storeSetChannels,
    activeChannelId: storeActiveChannelId,
    setActiveChannelId: storeSetActiveChannelId,
    channelUnreads: storeChannelUnreads,
    setChannelUnreads: storeSetChannelUnreads,
    userChannelPrefs: storeUserChannelPrefs,
    setUserChannelPrefs: storeSetUserChannelPrefs,

    // Playlists (store-backed)
    playlists: storePlaylists,
    setPlaylists: storeSetPlaylists,

    // Preferences (store-backed)
    preferences: storePreferences,
    setPreferences: storeSetPreferences,

    // Scroll bottom (store-backed via UI)
    setShowScrollBottom: (val: boolean) => storeSetUi({ showScrollBottom: val }),

    // Message domain (store-backed)
    messages: storeMessages,
    setMessages: storeSetMessages,
    hasMore: storeHasMore,
    setHasMore: storeSetHasMore,
    loadingMore: storeLoadingMore,
    setLoadingMore: storeSetLoadingMore,
    pinnedMessage: storePinnedMessage,
    setPinnedMessage: storeSetPinnedMessage,
    typingUsers: storeTypingUsers,
    setTypingUsers: storeSetTypingUsers,
    channelReads: storeChannelReads,
    setChannelReads: storeSetChannelReads,
    loadMore: () => storeLoadMore(messagesAreaRef),

    // Composer actions that need DOM refs (still bridged for legacy hooks)
    handleSend: (overrides?: any) => storeHandleSend(overrides, typingTimerRef),
    submitScheduledMessage: storeSubmitScheduledMessage,
    handleLearningFileSubmit: storeHandleLearningFileSubmit,
    sendAttachmentCasually: storeSendAttachmentCasually,

    // UI domain (store-backed)
    viewingImageMsg: storeUi.viewingImageMsg,
    setViewingImageMsg: (msg: any | null) => storeSetUi({ viewingImageMsg: msg }),
    viewingVideoMsg: storeUi.viewingVideoMsg,
    setViewingVideoMsg: (msg: any | null) => storeSetUi({ viewingVideoMsg: msg }),
    showSearch: storeUi.showSearch,
    setShowSearch: (val: boolean) => storeSetUi({ showSearch: val }),
    searchQuery: storeUi.searchQuery,
    setSearchQuery: (q: string) => storeSetUi({ searchQuery: q }),
    showOptionsMenu: storeUi.showOptionsMenu,
    setShowOptionsMenu: (val: boolean) => storeSetUi({ showOptionsMenu: val }),
    showSharedMedia: storeUi.showSharedMedia,
    setShowSharedMedia: (val: boolean) => storeSetUi({ showSharedMedia: val }),
    sharedMediaTab: storeUi.sharedMediaTab,
    setSharedMediaTab: (tab: 'images' | 'videos' | 'files') => storeSetUi({ sharedMediaTab: tab }),
    forwardingMessage: storeUi.forwardingMessage,
    setForwardingMessage: (msg: Message | null) => storeSetUi({ forwardingMessage: msg }),
    showForwardModal: storeUi.showForwardModal,
    setShowForwardModal: (val: boolean) => storeSetUi({ showForwardModal: val }),
    showDetailsPanel: storeUi.showDetailsPanel,
    setShowDetailsPanel: (val: boolean) => storeSetUi({ showDetailsPanel: val }),
    showChatSettings: storeUi.showChatSettings,
    setShowChatSettings: (val: boolean) => storeSetUi({ showChatSettings: val }),
    mobileView: storeUi.mobileView,
    setMobileView: (view: 'channels' | 'chat') => storeSetUi({ mobileView: view }),
    showStartRoomModal: storeUi.showStartRoomModal,
    setShowStartRoomModal: (val: boolean) => storeSetUi({ showStartRoomModal: val }),
    showScrollBottom: storeShowScrollBottom,

    // Wizard domain (store-backed)
    showVideoWizard: storeVideoWizard.open,
    setShowVideoWizard: (val: boolean) => storeSetVideoWizard({ open: val }),
    videoWizardFile: storeVideoWizard.file,
    setVideoWizardFile: (file: File | null) => storeSetVideoWizard({ file }),
    videoWizardPreview: storeVideoWizard.preview,
    setVideoWizardPreview: (preview: string) => storeSetVideoWizard({ preview }),
    videoTitle: storeVideoWizard.title,
    setVideoTitle: (title: string) => storeSetVideoWizard({ title }),
    videoPlaylistId: storeVideoWizard.playlistId,
    setVideoPlaylistId: (id: string) => storeSetVideoWizard({ playlistId: id }),
    videoNewPlaylistName: storeVideoWizard.newPlaylistName,
    setVideoNewPlaylistName: (name: string) => storeSetVideoWizard({ newPlaylistName: name }),
    videoDuration: storeVideoWizard.duration,
    setVideoDuration: (duration: string) => storeSetVideoWizard({ duration }),
    savingVideo: storeVideoWizard.saving,
    setSavingVideo: (saving: boolean) => storeSetVideoWizard({ saving }),

    showPollWizard: storePollWizard.open,
    setShowPollWizard: (val: boolean) => storeSetPollWizard({ open: val }),
    pollQuestion: storePollWizard.question,
    setPollQuestion: (q: string) => storeSetPollWizard({ question: q }),
    pollOptions: storePollWizard.options,
    setPollOptions: (options: string[]) => storeSetPollWizard({ options }),
    pollIsAnonymous: storePollWizard.isAnonymous,
    setPollIsAnonymous: (val: boolean) => storeSetPollWizard({ isAnonymous: val }),
    pollMultipleAnswers: storePollWizard.multipleAnswers,
    setPollMultipleAnswers: (val: boolean) => storeSetPollWizard({ multipleAnswers: val }),
    savingPoll: storePollWizard.saving,
    setSavingPoll: (saving: boolean) => storeSetPollWizard({ saving }),

    showEventWizard: storeEventWizard.open,
    setShowEventWizard: (val: boolean) => storeSetEventWizard({ open: val }),
    evtTitle: storeEventWizard.title,
    setEvtTitle: (title: string) => storeSetEventWizard({ title }),
    evtDesc: storeEventWizard.description,
    setEvtDesc: (desc: string) => storeSetEventWizard({ description: desc }),
    evtDate: storeEventWizard.date,
    setEvtDate: (date: string) => storeSetEventWizard({ date }),
    evtOnline: storeEventWizard.online,
    setEvtOnline: (online: boolean) => storeSetEventWizard({ online }),
    evtStyle: storeEventWizard.style,
    setEvtStyle: (style: 'workshop' | 'sprint' | 'showcase') => storeSetEventWizard({ style }),
    evtLink: storeEventWizard.link,
    setEvtLink: (link: string) => storeSetEventWizard({ link }),
    evtDuration: storeEventWizard.duration,
    setEvtDuration: (duration: string) => storeSetEventWizard({ duration }),
    savingEvent: storeEventWizard.saving,
    setSavingEvent: (saving: boolean) => storeSetEventWizard({ saving }),

    showProjectWizard: storeProjectWizard.open,
    setShowProjectWizard: (val: boolean) => storeSetProjectWizard({ open: val }),
    savingProject: storeProjectWizard.saving,
    setSavingProject: (saving: boolean) => storeSetProjectWizard({ saving }),
    applyingToProject: storeProjectWizard.applyingTo,
    setApplyingToProject: (project: any | null) => storeSetProjectWizard({ applyingTo: project }),
    submittingApplication: storeProjectWizard.submittingApplication,
    setSubmittingApplication: (submitting: boolean) => storeSetProjectWizard({ submittingApplication: submitting }),
    viewingApplicants: storeProjectWizard.viewingApplicants,
    setViewingApplicants: (applicants: any | null) => storeSetProjectWizard({ viewingApplicants: applicants }),

    // Schedule modal (store-backed)
    showScheduleModal: storeScheduleModal.open,
    setShowScheduleModal: (val: boolean) => storeSetScheduleModal({ open: val }),
    scheduledDate: storeScheduleModal.date,
    setScheduledDate: (date: string) => storeSetScheduleModal({ date }),
    scheduledTime: storeScheduleModal.time,
    setScheduledTime: (time: string) => storeSetScheduleModal({ time }),
    isSilentSend: storeScheduleModal.isSilent,
    setIsSilentSend: (val: boolean) => storeSetScheduleModal({ isSilent: val }),

    // Learning file modal (store-backed)
    showLearningFileModal: storeLearningFileModal.open,
    setShowLearningFileModal: (val: boolean) => storeSetLearningFileModal({ open: val }),
    learningFileData: storeLearningFileModal.data,
    setLearningFileData: (data: { file: File; fileKind: string; caption?: string } | null) => storeSetLearningFileModal({ data }),

    // DOM refs
    fileInputRef, textareaRef, pendingAttachTypeRef,
    mediaRecorderRef, audioChunksRef, recordingTimerRef,
    messagesAreaRef,
    longPressTimerRef, longPressFiredRef,
    didFocusMessageRef,
    messagesEndRef,
    allowStartRoomFromComposer, composerRoomHostId,
    canPost,
    parseMessageContent,
    activeChannel,
    filteredMessages,
  };

  const realtimeActions = useChatRealtime({
    focusChannelId,
    focusMessageId,
    messagesEndRef,
    textareaRef,
    typingTimerRef,
    didFocusMessageRef,
  });
  const projectActions = useChatWizards();
  const uiActions = useChatUi();

  // Build controller for children (still needed during migration)
  const controller = useMemo(() => ({
    ...baseControllerRef.current,
    ...realtimeActions,
    ...projectActions,
    ...uiActions,
  }), [
    clubId, clubCategory, user, clubName, focusChannelId, focusMessageId,
    storeLoading, storeIsAdminOrMod, storeChannels, storeActiveChannelId,
    storeChannelUnreads, storeUserChannelPrefs, storePreferences, storePlaylists, storeShowScrollBottom,
    storeMessages, storeHasMore, storeLoadingMore, storePinnedMessage, storeTypingUsers, storeChannelReads,
    storeUi,
    storeVideoWizard, storePollWizard, storeEventWizard, storeProjectWizard,
    storeScheduleModal, storeLearningFileModal,
    allowStartRoomFromComposer, composerRoomHostId,
    parseMessageContent,
    activeChannel,
    filteredMessages,
    realtimeActions, projectActions, uiActions,
  ]);

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-amber)]" />
      </div>
    );
  }

  return (
    <div className={`flex min-h-0 overflow-hidden ${isEmbedded ? 'h-full w-full' : 'h-[calc(100vh-80px)] max-w-6xl mx-auto bg-white shadow-sm border border-[var(--color-border)] rounded-2xl'}`}>
      <ChannelList
        isEmbedded={isEmbedded}
        clubName={clubName}
        onNavigateBack={() => navigate(-1)}
      />

      <MessageSharedFileProvider clubId={clubId || ''}>
        <ClubChatMainPane c={controller} />
        <ClubChatDetailsSidebar c={controller} />
        <ClubChatModalStack c={controller} />
      </MessageSharedFileProvider>
      {controller.showStartRoomModal && clubId && composerRoomHostId ? (
        <StartRoomModal
          clubId={clubId}
          hostId={composerRoomHostId}
          onClose={() => controller.setShowStartRoomModal(false)}
          onCreated={(room) => {
            controller.setShowStartRoomModal(false);
            navigate(`/app/voice-room/${room.id}`);
          }}
        />
      ) : null}
      {controller.showLearningFileModal && controller.learningFileData && clubId && storeActiveChannelId ? (
        <LearningFileMetadataModal
          file={controller.learningFileData.file}
          fileKind={controller.learningFileData.fileKind}
          caption={controller.learningFileData.caption}
          clubId={clubId}
          user={user ?? undefined}
          onSubmit={async (data) => {
            if (controller.handleLearningFileSubmit) {
              await controller.handleLearningFileSubmit(data);
            }
          }}
          onClose={() => {
            controller.setShowLearningFileModal(false);
            controller.setLearningFileData(null);
          }}
          onSkip={async (data) => {
            if (controller.learningFileData && controller.sendAttachmentCasually) {
              await controller.sendAttachmentCasually(
                controller.learningFileData.file,
                controller.learningFileData.fileKind,
                data?.caption ?? controller.learningFileData.caption
              );
            }
            controller.setShowLearningFileModal(false);
            controller.setLearningFileData(null);
          }}
        />
      ) : null}
    </div>
  );
}
