/**
 * Club Chat Theme System
 *
 * One theme entry per club category. Every visual decision that was previously
 * encoded as `isTechClub ? A : B` lives here instead.
 *
 * ClubChat.tsx:
 *   1. Fetches { name, category } from the club record.
 *   2. Calls getChatTheme(category) → ClubChatTheme.
 *   3. Passes theme tokens into JSX. No category booleans anywhere.
 *
 * Adding a new category: add one entry to THEMES. Nothing else changes.
 */

// ── Theme contract ─────────────────────────────────────────────────────────

export interface ClubChatTheme {
  readonly key: string;
  /** Dark themes suppress user wallpapers and use their own background. */
  readonly dark: boolean;

  // ── Text formatters ──────────────────────────────────────────────────────
  /** How the club name appears in the sidebar header. */
  readonly formatClubName: (name: string) => string;
  /** How a channel name appears in the chat header. */
  readonly formatChannelHeader: (name: string) => string;
  /** The "CHANNELS" section label text. */
  readonly channelSectionText: string;
  /** How a sender's name appears above their bubble group. */
  readonly formatSenderName: (name: string) => string;
  /** Pinned banner label. */
  readonly formatPinnedLabel: (firstName: string) => string;
  /** Empty-state heading. */
  readonly emptyHeadingText: (channelName: string) => string;
  /** Empty-state subtext. */
  readonly emptyBodyText: (isAnnouncement: boolean) => string;
  /** Date divider text transform. */
  readonly formatDateDivider: (text: string) => string;

  // ── CSS token groups ─────────────────────────────────────────────────────
  readonly sidebar: {
    readonly root: string;
    readonly header: string;
    readonly backBtn: string;
    readonly clubName: string;
    readonly sectionLabel: string;
    readonly addBtn: string;
    readonly chActive: string;
    readonly chInactive: string;
    readonly chIconActive: string;
    readonly chIconInactive: string;
    readonly chNameClass: string;
    readonly badgeActive: string;
    readonly badgeInactive: string;
    readonly dateDivider: string;
  };
  readonly header: {
    readonly root: string;
    readonly mobileBack: string;
    readonly mobileBackIcon: string;
    readonly avatar: string;
    readonly channelName: string;
    readonly channelDesc: string;
  };
  readonly pinned: {
    readonly root: string;
    readonly accent: string;
    readonly icon: string;
    readonly label: string;
    readonly content: string;
  };
  readonly wall: {
    readonly getBg: (wallpaperClass: string, isDark: boolean) => string;
    readonly emptyIcon: string;
    readonly emptyHeading: string;
    readonly emptyBody: string;
    readonly dateDivider: string;
  };
  readonly typing: {
    readonly root: string;
    readonly dot: string;
  };
  readonly composer: {
    readonly root: string;
    readonly shell: string;
    readonly textarea: string;
    readonly sendBtn: string;
  };
  readonly bubble: {
    readonly own: string;
    readonly other: string;
    readonly pollOwn: string;
    readonly pollOther: string;
    readonly pollIconOther: string;
    readonly pollFill: string;
    readonly pollVoteDot: string;
    readonly pollVoteText: string;
    readonly pollPercent: string;
    readonly pollFooter: string;
    readonly replyOther: string;
    readonly reactionActive: string;
    readonly reactionInactive: string;
    readonly avatarFallback: string;
    readonly senderName: string;
    readonly timeOwn: string;
    readonly timeOther: string;
    readonly readCheck: string;
  };
}

// ── Helper: build a theme object with overrides on top of a base ──────────

function buildTheme(t: ClubChatTheme): ClubChatTheme {
  return t;
}

// ── Base (default) theme — warm, friendly, navy + amber ───────────────────

const DEFAULT = buildTheme({
  key: 'default',
  dark: false,

  formatClubName:      (n) => n,
  formatChannelHeader: (n) => n,
  channelSectionText:  'Channels',
  formatSenderName:    (n) => n,
  formatPinnedLabel:   (firstName) => `Pinned · ${firstName || 'Message'}`,
  emptyHeadingText:    (ch) => `Welcome to #${ch}`,
  emptyBodyText:       (isAnn) => isAnn
    ? 'Only moderators can post here.'
    : 'This is the start of the channel. Send a message to say hello!',
  formatDateDivider:   (t) => t,

  sidebar: {
    root:           'bg-[#FAFAFA]',
    header:         'bg-white border-[var(--color-border)]',
    backBtn:        'text-[var(--color-text-muted)] hover:text-navy',
    clubName:       'text-navy font-heading',
    sectionLabel:   'text-[var(--color-text-muted)]',
    addBtn:         'hover:text-[var(--color-amber)]',
    chActive:       'bg-[var(--color-navy)] text-white',
    chInactive:     'text-[var(--color-text-secondary)] hover:bg-[#F0F0F0] hover:text-navy',
    chIconActive:   'text-white/70',
    chIconInactive: 'text-[var(--color-text-muted)]',
    chNameClass:    '',
    badgeActive:    'bg-white/25 text-white',
    badgeInactive:  'bg-[var(--color-amber)] text-white',
    dateDivider:    'px-3 py-1 bg-black/5 text-[var(--color-text-secondary)] text-[11px] font-bold uppercase tracking-wider rounded-full',
  },
  header: {
    root:            'bg-white border-[var(--color-border)]',
    mobileBack:      'hover:bg-parchment',
    mobileBackIcon:  'text-navy',
    avatar:          'bg-[var(--color-navy)]',
    channelName:     'font-heading text-navy',
    channelDesc:     'text-[var(--color-text-secondary)]',
  },
  pinned: {
    root:    'border-[var(--color-border)] bg-[#FAFAFA] hover:bg-[#F0F2F5]',
    accent:  'bg-[var(--color-amber)]',
    icon:    'text-[var(--color-amber)]',
    label:   'text-[var(--color-amber)]',
    content: 'text-[var(--color-text-secondary)]',
  },
  wall: {
    getBg:      (wc, dark) => `${wc} ${dark ? 'bg-[#121212]' : 'bg-[#FAFAFA]'}`,
    emptyIcon:  'opacity-50 text-[var(--color-text-muted)]',
    emptyHeading: 'text-navy opacity-50 font-semibold',
    emptyBody:  'text-[var(--color-text-secondary)] opacity-50 font-body',
    dateDivider: 'px-3 py-1 bg-black/5 text-[var(--color-text-secondary)] text-[11px] font-bold uppercase tracking-wider rounded-full',
  },
  typing: {
    root: 'text-[var(--color-text-muted)] bg-white border-[var(--color-border)]/50',
    dot:  'bg-[var(--color-text-muted)]',
  },
  composer: {
    root:     'bg-white border-[var(--color-border)]',
    shell:    'bg-[#F0F2F5] focus-within:bg-white focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.08)]',
    textarea: 'text-navy placeholder-[var(--color-text-muted)]',
    sendBtn:  'bg-[var(--color-amber)]',
  },
  bubble: {
    own:             'bg-gradient-to-br from-[var(--color-navy)] to-slate-800 text-white font-body',
    other:           'bg-white text-[#1E293B] border border-gray-100/50 font-body',
    pollOwn:         'bg-gradient-to-br from-orange-500 to-amber-600 text-white',
    pollOther:       'bg-white text-navy border border-[var(--color-border)]',
    pollIconOther:   'text-orange-500',
    pollFill:        'bg-orange-100',
    pollVoteDot:     'bg-orange-500',
    pollVoteText:    'text-navy',
    pollPercent:     'text-[var(--color-text-secondary)]',
    pollFooter:      'text-[var(--color-text-muted)]',
    replyOther:      'border-[var(--color-amber)] text-navy',
    reactionActive:  'bg-blue-50 border-blue-200 text-blue-600',
    reactionInactive:'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-black/5',
    avatarFallback:  'var(--color-navy)',
    senderName:      'text-[13px] font-bold text-slate-700 tracking-tight',
    timeOwn:         'text-white/60',
    timeOther:       'text-gray-400',
    readCheck:       'text-blue-300',
  },
});

// ── Technology — dark indigo terminal ─────────────────────────────────────

const TECHNOLOGY = buildTheme({
  key: 'technology',
  dark: true,

  formatClubName:      (n) => `{ ${n} }`,
  formatChannelHeader: (n) => `#${n}`,
  channelSectionText:  '// channels',
  formatSenderName:    (n) => `<${n} />`,
  formatPinnedLabel:   (firstName) => `// pinned · ${firstName || 'message'}`,
  emptyHeadingText:    (ch) => `// Welcome to #${ch}`,
  emptyBodyText:       (isAnn) => isAnn
    ? '/* announcements only */'
    : '$ send a message to start the conversation...',
  formatDateDivider:   (t) => `/* ${t} */`,

  sidebar: {
    root:           'bg-[#0D1117]',
    header:         'bg-[#161B22] border-indigo-900/40',
    backBtn:        'text-indigo-400 hover:text-indigo-200',
    clubName:       'text-indigo-100 font-mono',
    sectionLabel:   'text-indigo-500 font-mono',
    addBtn:         'hover:text-indigo-300',
    chActive:       'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30',
    chInactive:     'text-slate-400 hover:bg-white/5 hover:text-indigo-300',
    chIconActive:   'text-indigo-400',
    chIconInactive: 'text-slate-500',
    chNameClass:    'font-mono text-[13px]',
    badgeActive:    'bg-indigo-500/40 text-indigo-200',
    badgeInactive:  'bg-indigo-600 text-white',
    dateDivider:    'px-3 py-1 bg-indigo-900/30 text-indigo-400 text-[11px] font-mono tracking-wider rounded border border-indigo-800/40',
  },
  header: {
    root:           'bg-[#161B22] border-indigo-900/40',
    mobileBack:     'hover:bg-white/5',
    mobileBackIcon: 'text-indigo-300',
    avatar:         'bg-indigo-700 shadow-indigo-900/50',
    channelName:    'text-indigo-100 font-mono',
    channelDesc:    'text-slate-400',
  },
  pinned: {
    root:    'border-indigo-900/40 bg-[#161B22] hover:bg-indigo-900/20',
    accent:  'bg-indigo-500',
    icon:    'text-indigo-400',
    label:   'text-indigo-400 font-mono',
    content: 'text-slate-400 font-mono text-[12px]',
  },
  wall: {
    getBg:      () => 'bg-[#0D1117]',
    emptyIcon:  'text-indigo-500 opacity-70',
    emptyHeading: 'text-indigo-300 font-mono font-semibold',
    emptyBody:  'text-slate-500 font-mono text-[13px]',
    dateDivider: 'px-3 py-1 bg-indigo-900/30 text-indigo-400 text-[11px] font-mono tracking-wider rounded border border-indigo-800/40',
  },
  typing: {
    root: 'text-indigo-400 bg-[#161B22] border-indigo-900/40 font-mono',
    dot:  'bg-indigo-500',
  },
  composer: {
    root:     'bg-[#161B22] border-indigo-900/40',
    shell:    'bg-[#0D1117] border border-indigo-900/50 focus-within:border-indigo-600/60 focus-within:shadow-[0_0_12px_rgba(99,102,241,0.15)]',
    textarea: 'text-slate-200 placeholder-slate-600 font-mono text-[13px]',
    sendBtn:  'bg-indigo-600 shadow-indigo-900/40',
  },
  bubble: {
    own:             'bg-gradient-to-br from-indigo-700 to-violet-900 text-indigo-50 font-mono text-[13px]',
    other:           'bg-[#1C2333] text-slate-200 border border-indigo-900/40 font-mono text-[13px]',
    pollOwn:         'bg-gradient-to-br from-indigo-700 to-violet-900 text-white',
    pollOther:       'bg-[#1C2333] text-slate-200 border border-indigo-900/40',
    pollIconOther:   'text-indigo-400',
    pollFill:        'bg-indigo-600/20',
    pollVoteDot:     'bg-indigo-400',
    pollVoteText:    'text-slate-200 font-mono',
    pollPercent:     'text-indigo-400',
    pollFooter:      'text-slate-500',
    replyOther:      'border-indigo-400 text-indigo-200',
    reactionActive:  'bg-indigo-900/40 border-indigo-500/50 text-indigo-300',
    reactionInactive:'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10',
    avatarFallback:  '#4338CA',
    senderName:      'text-[12px] font-mono text-indigo-400 tracking-tight',
    timeOwn:         'text-indigo-300/70',
    timeOther:       'text-slate-500',
    readCheck:       'text-indigo-300',
  },
});

// ── Music — deep stage: dark velvet + warm gold ───────────────────────────

const MUSIC = buildTheme({
  key: 'music',
  dark: true,

  formatClubName:      (n) => `♪ ${n}`,
  formatChannelHeader: (n) => n,
  channelSectionText:  'Channels',
  formatSenderName:    (n) => n,
  formatPinnedLabel:   (firstName) => `♪ Pinned · ${firstName || 'Message'}`,
  emptyHeadingText:    (ch) => `Welcome to #${ch}`,
  emptyBodyText:       (isAnn) => isAnn
    ? 'Only moderators can post here.'
    : 'The stage is set. Drop the first message.',
  formatDateDivider:   (t) => `♩ ${t} ♩`,

  sidebar: {
    root:           'bg-[#0A0714]',
    header:         'bg-[#14092E] border-purple-900/40',
    backBtn:        'text-purple-400 hover:text-purple-200',
    clubName:       'text-purple-100 font-heading',
    sectionLabel:   'text-purple-500',
    addBtn:         'hover:text-yellow-400',
    chActive:       'bg-purple-700/30 text-purple-100 border border-purple-500/30',
    chInactive:     'text-purple-300/60 hover:bg-white/5 hover:text-purple-200',
    chIconActive:   'text-yellow-400',
    chIconInactive: 'text-purple-500/60',
    chNameClass:    '',
    badgeActive:    'bg-yellow-500/30 text-yellow-200',
    badgeInactive:  'bg-yellow-500 text-black',
    dateDivider:    'px-3 py-1 bg-purple-900/40 text-purple-300 text-[11px] tracking-wider rounded-full border border-purple-700/30',
  },
  header: {
    root:           'bg-[#14092E] border-purple-900/40',
    mobileBack:     'hover:bg-white/5',
    mobileBackIcon: 'text-purple-300',
    avatar:         'bg-purple-700 shadow-purple-900/50',
    channelName:    'text-purple-100 font-heading',
    channelDesc:    'text-purple-300/70',
  },
  pinned: {
    root:    'border-purple-900/40 bg-[#14092E] hover:bg-purple-900/20',
    accent:  'bg-yellow-500',
    icon:    'text-yellow-400',
    label:   'text-yellow-400',
    content: 'text-purple-300/70',
  },
  wall: {
    getBg:      () => 'bg-[#0A0714]',
    emptyIcon:  'text-purple-500 opacity-70',
    emptyHeading: 'text-purple-300 font-heading font-semibold',
    emptyBody:  'text-purple-400/60',
    dateDivider: 'px-3 py-1 bg-purple-900/40 text-purple-300 text-[11px] tracking-wider rounded-full border border-purple-700/30',
  },
  typing: {
    root: 'text-purple-400 bg-[#14092E] border-purple-900/40',
    dot:  'bg-yellow-500',
  },
  composer: {
    root:     'bg-[#14092E] border-purple-900/40',
    shell:    'bg-[#0A0714] border border-purple-900/50 focus-within:border-purple-600/60 focus-within:shadow-[0_0_14px_rgba(147,51,234,0.20)]',
    textarea: 'text-purple-100 placeholder-purple-700',
    sendBtn:  'bg-yellow-500 shadow-yellow-900/40',
  },
  bubble: {
    own:             'bg-gradient-to-br from-purple-700 to-violet-900 text-purple-50',
    other:           'bg-[#1A0D2E] text-purple-100 border border-purple-900/40',
    pollOwn:         'bg-gradient-to-br from-purple-700 to-fuchsia-800 text-white',
    pollOther:       'bg-[#1A0D2E] text-purple-100 border border-purple-900/40',
    pollIconOther:   'text-yellow-400',
    pollFill:        'bg-purple-700/25',
    pollVoteDot:     'bg-yellow-400',
    pollVoteText:    'text-purple-100',
    pollPercent:     'text-yellow-400',
    pollFooter:      'text-purple-500',
    replyOther:      'border-yellow-500/60 text-purple-200',
    reactionActive:  'bg-purple-900/50 border-purple-500/50 text-purple-200',
    reactionInactive:'bg-white/5 border-white/10 text-purple-400 hover:bg-white/10',
    avatarFallback:  '#7C3AED',
    senderName:      'text-[13px] font-semibold text-yellow-400/90 tracking-tight',
    timeOwn:         'text-purple-300/60',
    timeOther:       'text-purple-500',
    readCheck:       'text-purple-300',
  },
});

// ── Art — gallery editorial: light cream + vivid coral accent ─────────────

const ART = buildTheme({
  key: 'art',
  dark: false,

  formatClubName:      (n) => n,
  formatChannelHeader: (n) => n,
  channelSectionText:  'Spaces',
  formatSenderName:    (n) => n,
  formatPinnedLabel:   (firstName) => `Pinned · ${firstName || 'Work'}`,
  emptyHeadingText:    (ch) => `${ch}`,
  emptyBodyText:       (isAnn) => isAnn
    ? 'Only curators can post here.'
    : 'Empty canvas. Be the first to make a mark.',
  formatDateDivider:   (t) => t,

  sidebar: {
    root:           'bg-[#FAF8F5]',
    header:         'bg-white border-stone-200',
    backBtn:        'text-stone-400 hover:text-stone-800',
    clubName:       'text-stone-900 font-heading tracking-tight',
    sectionLabel:   'text-stone-400 tracking-widest',
    addBtn:         'hover:text-rose-500',
    chActive:       'bg-rose-600 text-white',
    chInactive:     'text-stone-500 hover:bg-stone-100 hover:text-stone-900',
    chIconActive:   'text-white/80',
    chIconInactive: 'text-stone-400',
    chNameClass:    'tracking-wide',
    badgeActive:    'bg-white/30 text-white',
    badgeInactive:  'bg-rose-500 text-white',
    dateDivider:    'px-3 py-1 bg-stone-100 text-stone-500 text-[11px] font-medium uppercase tracking-widest rounded',
  },
  header: {
    root:           'bg-white border-stone-200',
    mobileBack:     'hover:bg-stone-100',
    mobileBackIcon: 'text-stone-800',
    avatar:         'bg-rose-600',
    channelName:    'text-stone-900 font-heading font-bold tracking-tight',
    channelDesc:    'text-stone-400',
  },
  pinned: {
    root:    'border-stone-200 bg-[#FAF8F5] hover:bg-stone-100',
    accent:  'bg-rose-500',
    icon:    'text-rose-500',
    label:   'text-rose-500',
    content: 'text-stone-500',
  },
  wall: {
    getBg:      (wc, dark) => `${wc} ${dark ? 'bg-[#1A1A1A]' : 'bg-[#FDFAF7]'}`,
    emptyIcon:  'opacity-30 text-stone-500',
    emptyHeading: 'text-stone-800 font-heading text-xl font-semibold opacity-40 tracking-tight',
    emptyBody:  'text-stone-500 opacity-50',
    dateDivider: 'px-3 py-1 bg-stone-100 text-stone-500 text-[11px] font-medium uppercase tracking-widest rounded',
  },
  typing: {
    root: 'text-stone-500 bg-white border-stone-200/80',
    dot:  'bg-rose-400',
  },
  composer: {
    root:     'bg-white border-stone-200',
    shell:    'bg-stone-100 focus-within:bg-white focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.06)]',
    textarea: 'text-stone-900 placeholder-stone-400',
    sendBtn:  'bg-rose-600',
  },
  bubble: {
    own:             'bg-gradient-to-br from-rose-500 to-red-600 text-white',
    other:           'bg-white text-stone-800 border border-stone-200',
    pollOwn:         'bg-gradient-to-br from-rose-500 to-red-600 text-white',
    pollOther:       'bg-white text-stone-900 border border-stone-200',
    pollIconOther:   'text-rose-500',
    pollFill:        'bg-rose-100',
    pollVoteDot:     'bg-rose-500',
    pollVoteText:    'text-stone-800',
    pollPercent:     'text-stone-400',
    pollFooter:      'text-stone-400',
    replyOther:      'border-rose-400 text-stone-700',
    reactionActive:  'bg-rose-50 border-rose-200 text-rose-600',
    reactionInactive:'bg-white border-stone-200 text-stone-500 hover:bg-stone-50',
    avatarFallback:  '#E11D48',
    senderName:      'text-[13px] font-semibold text-stone-700 tracking-tight',
    timeOwn:         'text-white/60',
    timeOther:       'text-stone-400',
    readCheck:       'text-rose-300',
  },
});

// ── Cooking — warm kitchen: terracotta + cream ────────────────────────────

const COOKING = buildTheme({
  key: 'cooking',
  dark: false,

  formatClubName:      (n) => n,
  formatChannelHeader: (n) => n,
  channelSectionText:  'Channels',
  formatSenderName:    (n) => n,
  formatPinnedLabel:   (firstName) => `Pinned · ${firstName || 'Recipe'}`,
  emptyHeadingText:    (ch) => `Welcome to #${ch}`,
  emptyBodyText:       (isAnn) => isAnn
    ? 'Only moderators can post here.'
    : 'The kitchen is open. Start the conversation!',
  formatDateDivider:   (t) => t,

  sidebar: {
    root:           'bg-[#FEF6E9]',
    header:         'bg-[#FFFAF2] border-orange-100',
    backBtn:        'text-amber-600/70 hover:text-amber-800',
    clubName:       'text-amber-900 font-heading',
    sectionLabel:   'text-amber-500/80',
    addBtn:         'hover:text-orange-500',
    chActive:       'bg-orange-500 text-white',
    chInactive:     'text-amber-800/60 hover:bg-orange-50 hover:text-amber-900',
    chIconActive:   'text-white/80',
    chIconInactive: 'text-amber-400',
    chNameClass:    '',
    badgeActive:    'bg-white/30 text-white',
    badgeInactive:  'bg-orange-400 text-white',
    dateDivider:    'px-3 py-1 bg-orange-50 text-amber-600 text-[11px] font-bold uppercase tracking-wider rounded-full border border-orange-100',
  },
  header: {
    root:           'bg-[#FFFAF2] border-orange-100',
    mobileBack:     'hover:bg-orange-50',
    mobileBackIcon: 'text-amber-800',
    avatar:         'bg-orange-500',
    channelName:    'text-amber-900 font-heading font-bold',
    channelDesc:    'text-amber-600/70',
  },
  pinned: {
    root:    'border-orange-100 bg-[#FEF6E9] hover:bg-orange-50',
    accent:  'bg-orange-400',
    icon:    'text-orange-400',
    label:   'text-orange-500',
    content: 'text-amber-700/70',
  },
  wall: {
    getBg:      (wc, dark) => `${wc} ${dark ? 'bg-[#201206]' : 'bg-[#FFFAF2]'}`,
    emptyIcon:  'opacity-40 text-amber-400',
    emptyHeading: 'text-amber-800 font-heading font-semibold opacity-50',
    emptyBody:  'text-amber-600/50',
    dateDivider: 'px-3 py-1 bg-orange-50 text-amber-600 text-[11px] font-bold uppercase tracking-wider rounded-full border border-orange-100',
  },
  typing: {
    root: 'text-amber-600 bg-[#FFFAF2] border-orange-100',
    dot:  'bg-orange-400',
  },
  composer: {
    root:     'bg-[#FFFAF2] border-orange-100',
    shell:    'bg-orange-50 focus-within:bg-white focus-within:shadow-[0_2px_12px_rgba(234,88,12,0.08)]',
    textarea: 'text-amber-900 placeholder-amber-400',
    sendBtn:  'bg-orange-500',
  },
  bubble: {
    own:             'bg-gradient-to-br from-orange-500 to-amber-600 text-white',
    other:           'bg-white text-amber-900 border border-orange-100',
    pollOwn:         'bg-gradient-to-br from-orange-500 to-red-500 text-white',
    pollOther:       'bg-white text-amber-900 border border-orange-100',
    pollIconOther:   'text-orange-500',
    pollFill:        'bg-orange-100',
    pollVoteDot:     'bg-orange-500',
    pollVoteText:    'text-amber-900',
    pollPercent:     'text-amber-500',
    pollFooter:      'text-amber-400',
    replyOther:      'border-orange-400 text-amber-800',
    reactionActive:  'bg-orange-50 border-orange-200 text-orange-600',
    reactionInactive:'bg-white border-orange-100 text-amber-600 hover:bg-orange-50',
    avatarFallback:  '#EA580C',
    senderName:      'text-[13px] font-bold text-amber-700 tracking-tight',
    timeOwn:         'text-white/60',
    timeOther:       'text-amber-400',
    readCheck:       'text-amber-300',
  },
});

// ── Fitness — energetic: near-black + vivid lime ──────────────────────────

const FITNESS = buildTheme({
  key: 'fitness',
  dark: true,

  formatClubName:      (n) => n.toUpperCase(),
  formatChannelHeader: (n) => n.toUpperCase(),
  channelSectionText:  'CHANNELS',
  formatSenderName:    (n) => n.toUpperCase(),
  formatPinnedLabel:   (firstName) => `PINNED · ${(firstName || 'POST').toUpperCase()}`,
  emptyHeadingText:    (ch) => `#${ch.toUpperCase()}`,
  emptyBodyText:       (isAnn) => isAnn
    ? 'COACHES ONLY.'
    : 'NO MESSAGES YET. START THE CHALLENGE.',
  formatDateDivider:   (t) => `— ${t.toUpperCase()} —`,

  sidebar: {
    root:           'bg-[#050A10]',
    header:         'bg-[#0A1019] border-green-900/30',
    backBtn:        'text-green-400 hover:text-green-200',
    clubName:       'text-white font-heading font-black uppercase tracking-wider',
    sectionLabel:   'text-green-600 font-bold tracking-widest',
    addBtn:         'hover:text-green-400',
    chActive:       'bg-green-500/20 text-green-200 border border-green-500/40',
    chInactive:     'text-gray-400 hover:bg-white/5 hover:text-green-300',
    chIconActive:   'text-green-400',
    chIconInactive: 'text-gray-600',
    chNameClass:    'font-bold tracking-wide uppercase text-[12px]',
    badgeActive:    'bg-green-500/30 text-green-200',
    badgeInactive:  'bg-green-500 text-black font-bold',
    dateDivider:    'px-3 py-0.5 bg-green-950/60 text-green-500 text-[10px] font-black uppercase tracking-[0.2em] rounded border border-green-900/40',
  },
  header: {
    root:           'bg-[#0A1019] border-green-900/30',
    mobileBack:     'hover:bg-white/5',
    mobileBackIcon: 'text-green-400',
    avatar:         'bg-green-600 shadow-green-900/50',
    channelName:    'text-white font-black uppercase tracking-wider',
    channelDesc:    'text-gray-400',
  },
  pinned: {
    root:    'border-green-900/30 bg-[#0A1019] hover:bg-green-950/40',
    accent:  'bg-green-500',
    icon:    'text-green-400',
    label:   'text-green-400 font-bold uppercase tracking-wider',
    content: 'text-gray-400 uppercase text-[11px] tracking-wide',
  },
  wall: {
    getBg:      () => 'bg-[#050A10]',
    emptyIcon:  'text-green-600 opacity-60',
    emptyHeading: 'text-white font-black uppercase tracking-wider opacity-30',
    emptyBody:  'text-green-700 text-[11px] font-bold uppercase tracking-wider opacity-60',
    dateDivider: 'px-3 py-0.5 bg-green-950/60 text-green-500 text-[10px] font-black uppercase tracking-[0.2em] rounded border border-green-900/40',
  },
  typing: {
    root: 'text-green-400 bg-[#0A1019] border-green-900/30 font-bold uppercase tracking-wide text-[11px]',
    dot:  'bg-green-500',
  },
  composer: {
    root:     'bg-[#0A1019] border-green-900/30',
    shell:    'bg-[#050A10] border border-green-900/40 focus-within:border-green-500/50 focus-within:shadow-[0_0_14px_rgba(34,197,94,0.12)]',
    textarea: 'text-white placeholder-gray-700 font-medium',
    sendBtn:  'bg-green-500',
  },
  bubble: {
    own:             'bg-gradient-to-br from-green-500 to-teal-600 text-white font-semibold',
    other:           'bg-[#0F1A24] text-gray-100 border border-green-900/30 font-medium',
    pollOwn:         'bg-gradient-to-br from-green-500 to-emerald-600 text-white',
    pollOther:       'bg-[#0F1A24] text-gray-100 border border-green-900/30',
    pollIconOther:   'text-green-400',
    pollFill:        'bg-green-900/40',
    pollVoteDot:     'bg-green-400',
    pollVoteText:    'text-gray-100 font-semibold',
    pollPercent:     'text-green-400 font-bold',
    pollFooter:      'text-gray-600',
    replyOther:      'border-green-500/60 text-green-200',
    reactionActive:  'bg-green-900/40 border-green-500/40 text-green-300',
    reactionInactive:'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10',
    avatarFallback:  '#16A34A',
    senderName:      'text-[12px] font-bold text-green-400 uppercase tracking-wide',
    timeOwn:         'text-white/60',
    timeOther:       'text-gray-600',
    readCheck:       'text-green-400',
  },
});

// ── Languages — travel notebook: sky-blue + clean structure ──────────────

const LANGUAGES = buildTheme({
  key: 'languages',
  dark: false,

  formatClubName:      (n) => n,
  formatChannelHeader: (n) => n,
  channelSectionText:  'Channels',
  formatSenderName:    (n) => n,
  formatPinnedLabel:   (firstName) => `Pinned · ${firstName || 'Message'}`,
  emptyHeadingText:    (ch) => `Welcome to #${ch}`,
  emptyBodyText:       (isAnn) => isAnn
    ? 'Only moderators can post here.'
    : 'Start the conversation — every language welcome.',
  formatDateDivider:   (t) => t,

  sidebar: {
    root:           'bg-[#EFF6FF]',
    header:         'bg-white border-sky-100',
    backBtn:        'text-sky-400 hover:text-sky-700',
    clubName:       'text-sky-900 font-heading',
    sectionLabel:   'text-sky-400',
    addBtn:         'hover:text-sky-500',
    chActive:       'bg-sky-600 text-white',
    chInactive:     'text-sky-700/60 hover:bg-sky-100 hover:text-sky-800',
    chIconActive:   'text-white/80',
    chIconInactive: 'text-sky-400',
    chNameClass:    '',
    badgeActive:    'bg-white/30 text-white',
    badgeInactive:  'bg-sky-500 text-white',
    dateDivider:    'px-3 py-1 bg-sky-50 text-sky-500 text-[11px] font-bold uppercase tracking-wider rounded-full border border-sky-100',
  },
  header: {
    root:           'bg-white border-sky-100',
    mobileBack:     'hover:bg-sky-50',
    mobileBackIcon: 'text-sky-700',
    avatar:         'bg-sky-600',
    channelName:    'text-sky-900 font-heading font-bold',
    channelDesc:    'text-sky-400',
  },
  pinned: {
    root:    'border-sky-100 bg-[#EFF6FF] hover:bg-sky-100',
    accent:  'bg-sky-500',
    icon:    'text-sky-500',
    label:   'text-sky-500',
    content: 'text-sky-600/70',
  },
  wall: {
    getBg:      (wc, dark) => `${wc} ${dark ? 'bg-[#0C1A2E]' : 'bg-[#F0F7FF]'}`,
    emptyIcon:  'opacity-40 text-sky-400',
    emptyHeading: 'text-sky-800 font-heading font-semibold opacity-50',
    emptyBody:  'text-sky-600/50',
    dateDivider: 'px-3 py-1 bg-sky-50 text-sky-500 text-[11px] font-bold uppercase tracking-wider rounded-full border border-sky-100',
  },
  typing: {
    root: 'text-sky-500 bg-white border-sky-100',
    dot:  'bg-sky-400',
  },
  composer: {
    root:     'bg-white border-sky-100',
    shell:    'bg-sky-50 focus-within:bg-white focus-within:shadow-[0_2px_12px_rgba(14,165,233,0.1)]',
    textarea: 'text-sky-900 placeholder-sky-300',
    sendBtn:  'bg-sky-600',
  },
  bubble: {
    own:             'bg-gradient-to-br from-sky-500 to-cyan-600 text-white',
    other:           'bg-white text-sky-900 border border-sky-100',
    pollOwn:         'bg-gradient-to-br from-sky-500 to-blue-600 text-white',
    pollOther:       'bg-white text-sky-900 border border-sky-100',
    pollIconOther:   'text-sky-500',
    pollFill:        'bg-sky-100',
    pollVoteDot:     'bg-sky-500',
    pollVoteText:    'text-sky-800',
    pollPercent:     'text-sky-400',
    pollFooter:      'text-sky-300',
    replyOther:      'border-sky-400 text-sky-700',
    reactionActive:  'bg-sky-50 border-sky-200 text-sky-600',
    reactionInactive:'bg-white border-sky-100 text-sky-500 hover:bg-sky-50',
    avatarFallback:  '#0284C7',
    senderName:      'text-[13px] font-bold text-sky-700 tracking-tight',
    timeOwn:         'text-white/60',
    timeOther:       'text-sky-300',
    readCheck:       'text-sky-300',
  },
});

// ── Photography — dark editorial: near-black + silver ────────────────────

const PHOTOGRAPHY = buildTheme({
  key: 'photography',
  dark: true,

  formatClubName:      (n) => n,
  formatChannelHeader: (n) => n,
  channelSectionText:  'Channels',
  formatSenderName:    (n) => n,
  formatPinnedLabel:   (firstName) => `Pinned · ${firstName || 'Shot'}`,
  emptyHeadingText:    (ch) => `#${ch}`,
  emptyBodyText:       (isAnn) => isAnn
    ? 'Only moderators can post here.'
    : 'Every frame tells a story. Share yours.',
  formatDateDivider:   (t) => t,

  sidebar: {
    root:           'bg-[#0C0C0C]',
    header:         'bg-[#141414] border-neutral-800',
    backBtn:        'text-neutral-400 hover:text-white',
    clubName:       'text-white font-heading',
    sectionLabel:   'text-neutral-600',
    addBtn:         'hover:text-neutral-300',
    chActive:       'bg-white/10 text-white border border-white/20',
    chInactive:     'text-neutral-500 hover:bg-white/5 hover:text-neutral-200',
    chIconActive:   'text-neutral-300',
    chIconInactive: 'text-neutral-600',
    chNameClass:    '',
    badgeActive:    'bg-white/20 text-white',
    badgeInactive:  'bg-neutral-300 text-black',
    dateDivider:    'px-3 py-1 bg-neutral-900 text-neutral-500 text-[11px] uppercase tracking-widest rounded border border-neutral-800',
  },
  header: {
    root:           'bg-[#141414] border-neutral-800',
    mobileBack:     'hover:bg-white/5',
    mobileBackIcon: 'text-neutral-300',
    avatar:         'bg-neutral-700',
    channelName:    'text-white font-heading font-bold',
    channelDesc:    'text-neutral-500',
  },
  pinned: {
    root:    'border-neutral-800 bg-[#141414] hover:bg-neutral-900',
    accent:  'bg-neutral-400',
    icon:    'text-neutral-400',
    label:   'text-neutral-400',
    content: 'text-neutral-500',
  },
  wall: {
    getBg:      () => 'bg-[#0C0C0C]',
    emptyIcon:  'text-neutral-600 opacity-80',
    emptyHeading: 'text-neutral-600 font-heading font-semibold',
    emptyBody:  'text-neutral-700',
    dateDivider: 'px-3 py-1 bg-neutral-900 text-neutral-500 text-[11px] uppercase tracking-widest rounded border border-neutral-800',
  },
  typing: {
    root: 'text-neutral-400 bg-[#141414] border-neutral-800',
    dot:  'bg-neutral-400',
  },
  composer: {
    root:     'bg-[#141414] border-neutral-800',
    shell:    'bg-[#0C0C0C] border border-neutral-800 focus-within:border-neutral-600',
    textarea: 'text-neutral-100 placeholder-neutral-700',
    sendBtn:  'bg-neutral-300',
  },
  bubble: {
    own:             'bg-white text-black font-medium',
    other:           'bg-[#1C1C1C] text-neutral-100 border border-neutral-800',
    pollOwn:         'bg-white text-black',
    pollOther:       'bg-[#1C1C1C] text-neutral-100 border border-neutral-800',
    pollIconOther:   'text-neutral-400',
    pollFill:        'bg-white/10',
    pollVoteDot:     'bg-neutral-300',
    pollVoteText:    'text-neutral-200',
    pollPercent:     'text-neutral-400',
    pollFooter:      'text-neutral-600',
    replyOther:      'border-neutral-500 text-neutral-300',
    reactionActive:  'bg-white/10 border-white/30 text-white',
    reactionInactive:'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10',
    avatarFallback:  '#525252',
    senderName:      'text-[13px] font-semibold text-neutral-400 tracking-tight',
    timeOwn:         'text-black/50',
    timeOther:       'text-neutral-600',
    readCheck:       'text-neutral-400',
  },
});

// ── Theme map ──────────────────────────────────────────────────────────────

const THEMES: Record<string, ClubChatTheme> = {
  technology:  TECHNOLOGY,
  music:       MUSIC,
  art:         ART,
  cooking:     COOKING,
  fitness:     FITNESS,
  languages:   LANGUAGES,
  photography: PHOTOGRAPHY,
};

/**
 * Returns the ClubChatTheme for the given category id.
 * Falls back to the default (navy/amber) theme for unknown categories.
 */
export function getChatTheme(category: string | null | undefined): ClubChatTheme {
  return THEMES[category ?? ''] ?? DEFAULT;
}
