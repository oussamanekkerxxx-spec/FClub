import type { User } from '@/contexts/AuthContext';
import type {
  Channel,
  ChannelRead,
  ChatAttachment,
  Message,
  Reaction,
  TypingUser,
  UserChannelPreference,
  UserPreferences,
} from '@/features/club-chat/workspace/types';

import type { PollVote } from '@/types/messaging';

// ── Wizard States ──

export interface VideoWizardState {
  open: boolean;
  file: File | null;
  preview: string;
  title: string;
  playlistId: string;
  newPlaylistName: string;
  duration: string;
  saving: boolean;
}

export interface PollWizardState {
  open: boolean;
  question: string;
  options: string[];
  isAnonymous: boolean;
  multipleAnswers: boolean;
  saving: boolean;
}

export interface EventWizardState {
  open: boolean;
  title: string;
  description: string;
  date: string;
  online: boolean;
  style: 'workshop' | 'sprint' | 'showcase';
  link: string;
  duration: string;
  saving: boolean;
}

export interface ProjectWizardState {
  open: boolean;
  saving: boolean;
  applyingTo: any | null;
  submittingApplication: boolean;
  viewingApplicants: any | null;
}

export interface ScheduleModalState {
  open: boolean;
  date: string;
  time: string;
  isSilent: boolean;
}

export interface LearningFileModalState {
  open: boolean;
  data: { file: File; fileKind: string } | null;
}

// ── Composer State ──

export interface ComposerState {
  text: string;
  attachment: ChatAttachment | null;
  caption: string;
  replyingTo: Message | null;
  editing: Message | null;
  sending: boolean;
  uploadProgress: number;
  isRecording: boolean;
  recordingTime: number;
  focused: boolean;
  showAttachMenu: boolean;
}

// ── UI State ──

export interface UiState {
  loading: boolean;
  showSearch: boolean;
  searchQuery: string;
  showOptionsMenu: boolean;
  showDetailsPanel: boolean;
  showSharedMedia: boolean;
  sharedMediaTab: 'images' | 'videos' | 'files';
  showChatSettings: boolean;
  showAddChannel: boolean;
  showForwardModal: boolean;
  showStartRoomModal: boolean;
  mobileView: 'channels' | 'chat';
  showScrollBottom: boolean;
  isAdminOrMod: boolean;
  viewingImageMsg: any | null;
  forwardingMessage: Message | null;
}

// ── Full Store State ──

export interface ChatStoreState {
  // Init / context
  clubId: string;
  clubCategory?: string;
  user: User | null;
  initialized: boolean;

  // Channels
  channels: Channel[];
  activeChannelId: string | null;
  channelUnreads: Record<string, number>;
  channelReads: ChannelRead[];
  userChannelPrefs: UserChannelPreference[];

  // Messages
  messages: Message[];
  hasMore: boolean;
  loadingMore: boolean;
  pinnedMessage: Message | null;
  typingUsers: TypingUser[];

  // Composer
  composer: ComposerState;

  // Wizards
  videoWizard: VideoWizardState;
  pollWizard: PollWizardState;
  eventWizard: EventWizardState;
  projectWizard: ProjectWizardState;
  scheduleModal: ScheduleModalState;
  learningFileModal: LearningFileModalState;

  // UI
  ui: UiState;

  // Settings
  preferences: UserPreferences | null;

  // Playlists (for video wizard)
  playlists: { id: string; title: string }[];

  // Composer / send gate
  lastSentAt: number;
}

// ── Basic Setters (Step 1) ──

export interface ChatStoreBasicSetters {
  initStore: (payload: { clubId: string; clubCategory?: string }) => void;

  // Channels
  setChannels: (channels: Channel[] | ((prev: Channel[]) => Channel[])) => void;
  setActiveChannelId: (id: string | null) => void;
  setChannelUnreads: (unreads: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;
  setChannelReads: (reads: ChannelRead[] | ((prev: ChannelRead[]) => ChannelRead[])) => void;
  setUserChannelPrefs: (prefs: UserChannelPreference[] | ((prev: UserChannelPreference[]) => UserChannelPreference[])) => void;

  // Messages (basic)
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setHasMore: (hasMore: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  setPinnedMessage: (msg: Message | null) => void;
  setTypingUsers: (users: TypingUser[] | ((prev: TypingUser[]) => TypingUser[])) => void;

  // UI
  setUi: (ui: Partial<UiState> | ((prev: UiState) => Partial<UiState>)) => void;
  setPreferences: (prefs: UserPreferences | null) => void;

  // Composer (basic)
  setComposer: (composer: Partial<ComposerState> | ((prev: ComposerState) => Partial<ComposerState>)) => void;

  // Wizards (basic open/close)
  setVideoWizard: (wizard: Partial<VideoWizardState>) => void;
  setPollWizard: (wizard: Partial<PollWizardState>) => void;
  setEventWizard: (wizard: Partial<EventWizardState>) => void;
  setProjectWizard: (wizard: Partial<ProjectWizardState>) => void;
  setScheduleModal: (modal: Partial<ScheduleModalState>) => void;
  setLearningFileModal: (modal: Partial<LearningFileModalState>) => void;

  // Playlists
  setPlaylists: (playlists: { id: string; title: string }[] | ((prev: { id: string; title: string }[]) => { id: string; title: string }[])) => void;
}

// ── Message Actions (Step 2) ──

export interface ChatStoreMessageActions {
  loadMessages: (channelId: string) => Promise<void>;
  loadMore: (messagesAreaRef: React.RefObject<HTMLDivElement | null>) => Promise<void>;
  appendRealtimeMessage: (msg: Message) => void;
  replaceMessageSender: (messageId: string, sender: { first_name: string; last_name: string; avatar_url: string }) => void;
  setMessageEvent: (messageId: string, event: any) => void;
  addMessageReaction: (react: Reaction) => void;
  removeMessageReaction: (reactionId: string) => void;
  updatePollVote: (vote: PollVote, eventType: 'INSERT' | 'DELETE') => void;
  updateChannelRead: (cr: ChannelRead, eventType: string) => void;
  addTypingUser: (userId: string, name: string) => void;
  removeTypingUser: (userId: string) => void;
  clearTypingUsers: () => void;
}

// ── Composer Actions (Step 3) ──

export interface ChatStoreComposerActions {
  // Direct field setters
  setComposerText: (text: string) => void;
  setComposerAttachment: (attachment: ChatAttachment | null) => void;
  setComposerCaption: (caption: string) => void;
  setComposerReplyingTo: (msg: Message | null) => void;
  setComposerEditing: (msg: Message | null) => void;
  setComposerSending: (sending: boolean) => void;
  setComposerUploadProgress: (progress: number) => void;
  setComposerShowAttachMenu: (show: boolean) => void;
  setComposerIsRecording: (recording: boolean) => void;
  setComposerRecordingTime: (time: number) => void;
  setComposerFocused: (focused: boolean) => void;
  setLastSentAt: (time: number) => void;

  // Complex actions
  applyFormat: (syntax: string, textareaRef: React.RefObject<HTMLTextAreaElement | null>) => void;
  handleShareLocation: () => Promise<void>;
  startRecording: (
    mediaRecorderRef: React.RefObject<MediaRecorder | null>,
    audioChunksRef: React.RefObject<BlobPart[]>,
    recordingTimerRef: React.RefObject<ReturnType<typeof setInterval> | null>
  ) => Promise<void>;
  cancelRecording: (
    mediaRecorderRef: React.RefObject<MediaRecorder | null>,
    recordingTimerRef: React.RefObject<ReturnType<typeof setInterval> | null>
  ) => void;
  stopRecordingAndSend: (
    mediaRecorderRef: React.RefObject<MediaRecorder | null>,
    audioChunksRef: React.RefObject<BlobPart[]>,
    recordingTimerRef: React.RefObject<ReturnType<typeof setInterval> | null>
  ) => Promise<void>;
  handleSend: (overrides?: any, typingTimerRef?: React.RefObject<ReturnType<typeof setTimeout> | null>) => Promise<void>;
  submitScheduledMessage: () => void;
  handleLearningFileSubmit: (data: {
    file: File;
    fileKind: string;
    title: string;
    description: string;
    courseId: string;
    lessonId: string | null;
    category: string;
    mathField: import('@/types/clubs').MathField | null;
  }) => Promise<void>;
  sendAttachmentCasually: (file: File, fileKind: string) => Promise<void>;
}
