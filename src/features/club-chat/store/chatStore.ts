import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  ChatStoreState,
  ChatStoreBasicSetters,
  ChatStoreMessageActions,
  ChatStoreComposerActions,
  UiState,
  ComposerState,
  VideoWizardState,
  PollWizardState,
  EventWizardState,
  ProjectWizardState,
  ScheduleModalState,
  LearningFileModalState,
} from './types';
import { createMessageActions } from './messageActions';
import { createComposerActions } from './composerActions';

// ── Initial State ──

const initialUiState: UiState = {
  loading: true,
  showSearch: false,
  searchQuery: '',
  showOptionsMenu: false,
  showDetailsPanel: false,
  showSharedMedia: false,
  sharedMediaTab: 'images',
  showChatSettings: false,
  showAddChannel: false,
  showForwardModal: false,
  showStartRoomModal: false,
  mobileView: 'chat',
  showScrollBottom: false,
  isAdminOrMod: false,
  viewingImageMsg: null,
  viewingVideoMsg: null,
  forwardingMessage: null,
};

const initialComposerState: ComposerState = {
  text: '',
  attachment: null,
  caption: '',
  replyingTo: null,
  editing: null,
  sending: false,
  uploadProgress: 0,
  isRecording: false,
  recordingTime: 0,
  focused: false,
  showAttachMenu: false,
};

const initialVideoWizard: VideoWizardState = {
  open: false,
  file: null,
  preview: '',
  title: '',
  playlistId: '',
  newPlaylistName: '',
  duration: '',
  saving: false,
};

const initialPollWizard: PollWizardState = {
  open: false,
  question: '',
  options: ['', ''],
  isAnonymous: false,
  multipleAnswers: false,
  saving: false,
};

const initialEventWizard: EventWizardState = {
  open: false,
  title: '',
  description: '',
  date: '',
  online: true,
  style: 'workshop',
  link: '',
  duration: '',
  saving: false,
};

const initialProjectWizard: ProjectWizardState = {
  open: false,
  saving: false,
  applyingTo: null,
  submittingApplication: false,
  viewingApplicants: null,
};

const initialScheduleModal: ScheduleModalState = {
  open: false,
  date: '',
  time: '',
  isSilent: false,
};

const initialLearningFileModal: LearningFileModalState = {
  open: false,
  data: null,
};

const initialState: Omit<ChatStoreState, keyof ChatStoreBasicSetters> = {
  clubId: '',
  clubCategory: undefined,
  user: null,
  initialized: false,

  channels: [],
  activeChannelId: null,
  channelUnreads: {},
  channelReads: [],
  userChannelPrefs: [],

  messages: [],
  hasMore: false,
  loadingMore: false,
  pinnedMessage: null,
  typingUsers: [],

  composer: initialComposerState,

  videoWizard: initialVideoWizard,
  pollWizard: initialPollWizard,
  eventWizard: initialEventWizard,
  projectWizard: initialProjectWizard,
  scheduleModal: initialScheduleModal,
  learningFileModal: initialLearningFileModal,

  ui: initialUiState,

  preferences: null,

  playlists: [],

  lastSentAt: 0,
};

// ── Helper to apply updater or direct value ──

function applyUpdater<T>(draftValue: T, updater: T | ((prev: T) => T)): T {
  return typeof updater === 'function' ? (updater as (prev: T) => T)(draftValue) : updater;
}

// ── Store ──

export const useChatStore = create<ChatStoreState & ChatStoreBasicSetters & ChatStoreMessageActions & ChatStoreComposerActions>()(
  immer((set, get) => ({
    ...createMessageActions(set, get),
    ...createComposerActions(set, get),
    ...initialState,

    // ── Init ──
    initStore: (payload) =>
      set((draft) => {
        draft.clubId = payload.clubId;
        draft.clubCategory = payload.clubCategory;
        draft.initialized = true;
      }),

    // ── Channels ──
    setChannels: (updater) =>
      set((draft) => {
        draft.channels = applyUpdater(draft.channels, updater);
      }),

    setActiveChannelId: (id) =>
      set((draft) => {
        draft.activeChannelId = id;
      }),

    setChannelUnreads: (updater) =>
      set((draft) => {
        draft.channelUnreads = applyUpdater(draft.channelUnreads, updater);
      }),

    setChannelReads: (updater) =>
      set((draft) => {
        draft.channelReads = applyUpdater(draft.channelReads, updater);
      }),

    setUserChannelPrefs: (updater) =>
      set((draft) => {
        draft.userChannelPrefs = applyUpdater(draft.userChannelPrefs, updater);
      }),

    // ── Messages ──
    setMessages: (updater) =>
      set((draft) => {
        draft.messages = applyUpdater(draft.messages, updater);
      }),

    setHasMore: (hasMore) =>
      set((draft) => {
        draft.hasMore = hasMore;
      }),

    setLoadingMore: (loading) =>
      set((draft) => {
        draft.loadingMore = loading;
      }),

    setPinnedMessage: (msg) =>
      set((draft) => {
        draft.pinnedMessage = msg;
      }),

    setTypingUsers: (updater) =>
      set((draft) => {
        draft.typingUsers = applyUpdater(draft.typingUsers, updater);
      }),

    // ── UI ──
    setUi: (updater) =>
      set((draft) => {
        const partial = typeof updater === 'function' ? updater(draft.ui) : updater;
        Object.assign(draft.ui, partial);
      }),

    setPreferences: (prefs) =>
      set((draft) => {
        draft.preferences = prefs;
      }),

    // ── Composer ──
    setComposer: (updater) =>
      set((draft) => {
        const partial = typeof updater === 'function' ? updater(draft.composer) : updater;
        Object.assign(draft.composer, partial);
      }),

    // ── Wizards ──
    setVideoWizard: (partial) =>
      set((draft) => {
        Object.assign(draft.videoWizard, partial);
      }),

    setPollWizard: (partial) =>
      set((draft) => {
        Object.assign(draft.pollWizard, partial);
      }),

    setEventWizard: (partial) =>
      set((draft) => {
        Object.assign(draft.eventWizard, partial);
      }),

    setProjectWizard: (partial) =>
      set((draft) => {
        Object.assign(draft.projectWizard, partial);
      }),

    setScheduleModal: (partial) =>
      set((draft) => {
        Object.assign(draft.scheduleModal, partial);
      }),

    setLearningFileModal: (partial) =>
      set((draft) => {
        Object.assign(draft.learningFileModal, partial);
      }),

    // ── Playlists ──
    setPlaylists: (updater) =>
      set((draft) => {
        draft.playlists = applyUpdater(draft.playlists, updater);
      }),
  }))
);

// ── Convenience export for non-hook usage (inside action files) ──

export const getChatStore = () => useChatStore.getState();
