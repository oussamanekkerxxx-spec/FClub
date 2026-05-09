/**
 * clubTemplates.ts
 *
 * Per-category club page templates.
 *
 * Each template controls:
 *   defaultTab  — which tab is active when a user lands on the club page
 *   tabOrder    — the left-to-right order of the tab bar (only listed tabs appear)
 *   hiddenTabs  — tabs that are completely suppressed for this category
 *
 * Tabs not listed in tabOrder but not hidden will be appended at the end,
 * so adding a new tab to ClubHome won't silently break any template.
 *
 * The fallback template (used when a category has no entry) keeps all tabs
 * with 'feed' as default — same behaviour as before.
 */

/** All valid tab identifiers for the club page. */
export type Tab =
  | 'feed' | 'members' | 'projects' | 'quests' | 'rooms'
  | 'resources' | 'playlists' | 'events' | 'leaderboard' | 'requests'
  | 'battles' | 'tournaments';

export interface ClubCategoryTemplate {
  defaultTab: Tab;
  tabOrder: Tab[];
  hiddenTabs?: Tab[];
  /** One-line description shown nowhere in UI — just helps readers understand intent */
  rationale?: string;
}

const ALL_TABS: Tab[] = [
  'feed', 'members', 'projects', 'quests', 'rooms',
  'resources', 'playlists', 'events', 'leaderboard', 'requests',
];

export const FALLBACK_TEMPLATE: ClubCategoryTemplate = {
  defaultTab: 'feed',
  tabOrder: ALL_TABS,
};

export const CLUB_CATEGORY_TEMPLATES: Record<string, ClubCategoryTemplate> = {

  technology: {
    rationale: 'Builder clubs — ship things. Projects + quests front and centre.',
    defaultTab: 'projects',
    tabOrder: ['feed', 'projects', 'quests', 'rooms', 'resources', 'playlists', 'events', 'members', 'leaderboard'],
  },

  deve_sandbox: {
    rationale: 'Same as technology — heavy on projects and tooling.',
    defaultTab: 'projects',
    tabOrder: ['feed', 'projects', 'quests', 'rooms', 'resources', 'playlists', 'events', 'members', 'leaderboard'],
  },

  business: {
    rationale: 'Business clubs value structured collaboration and accountability.',
    defaultTab: 'projects',
    tabOrder: ['feed', 'projects', 'events', 'leaderboard', 'quests', 'members', 'rooms', 'resources'],
  },

  student: {
    // Student clubs use a completely separate immersive layout (StudentClubHome.tsx).
    // This template acts purely as a fallback/metadata reference if queried generically.
    rationale: 'Bypassed in UI — student clubs use custom StudentClubHome layout.',
    defaultTab: 'feed',
    tabOrder: ['feed', 'members', 'events', 'resources'],
  },

  music: {
    rationale: 'Music clubs share recordings and perform live — playlists + rooms first.',
    defaultTab: 'playlists',
    tabOrder: ['feed', 'playlists', 'rooms', 'events', 'members', 'resources', 'quests', 'leaderboard'],
    hiddenTabs: ['projects'],
  },

  art: {
    rationale: 'Art clubs showcase work — playlists (gallery) and resources lead.',
    defaultTab: 'playlists',
    tabOrder: ['feed', 'playlists', 'resources', 'events', 'members', 'rooms', 'quests', 'leaderboard'],
    hiddenTabs: ['projects'],
  },

  photography: {
    rationale: 'Photography clubs are visual — playlists and resources first.',
    defaultTab: 'playlists',
    tabOrder: ['feed', 'playlists', 'resources', 'events', 'members', 'rooms', 'quests', 'leaderboard'],
    hiddenTabs: ['projects'],
  },

  crafts: {
    rationale: 'Crafts clubs share tutorials and materials — playlists + resources.',
    defaultTab: 'playlists',
    tabOrder: ['feed', 'playlists', 'resources', 'events', 'members', 'rooms', 'quests', 'leaderboard'],
    hiddenTabs: ['projects'],
  },

  writing: {
    rationale: 'Writing clubs share documents and discuss — resources + rooms for feedback.',
    defaultTab: 'resources',
    tabOrder: ['feed', 'resources', 'events', 'members', 'rooms', 'quests', 'leaderboard'],
    hiddenTabs: ['projects', 'playlists'],
  },

  fitness: {
    rationale: 'Fitness clubs are event-driven (sessions, challenges) — no projects needed.',
    defaultTab: 'events',
    tabOrder: ['feed', 'events', 'quests', 'rooms', 'members', 'resources', 'leaderboard'],
    hiddenTabs: ['projects', 'playlists'],
  },

  cooking: {
    rationale: 'Cooking clubs share recipes and plan tastings — events + resources.',
    defaultTab: 'feed',
    tabOrder: ['feed', 'resources', 'events', 'members', 'rooms', 'quests', 'leaderboard'],
    hiddenTabs: ['projects', 'playlists'],
  },

  languages: {
    rationale: 'Language clubs practice conversation — voice rooms are the main feature.',
    defaultTab: 'rooms',
    tabOrder: ['feed', 'rooms', 'events', 'quests', 'members', 'resources', 'leaderboard'],
    hiddenTabs: ['projects', 'playlists'],
  },

  events: {
    rationale: 'Event-focused clubs — events pinned, light on collaboration tools.',
    defaultTab: 'events',
    tabOrder: ['feed', 'events', 'rooms', 'members', 'resources', 'leaderboard'],
    hiddenTabs: ['projects', 'playlists', 'quests'],
  },

  wellness_support: {
    rationale: 'Support spaces — minimal, human, no gamification pressure.',
    defaultTab: 'feed',
    tabOrder: ['feed', 'members', 'rooms', 'events', 'resources'],
    hiddenTabs: ['projects', 'playlists', 'quests', 'leaderboard'],
  },

  connection_lounge: {
    rationale: 'Social lounges — just hang out and chat, very light feature set.',
    defaultTab: 'rooms',
    tabOrder: ['feed', 'rooms', 'members', 'events', 'resources'],
    hiddenTabs: ['projects', 'playlists', 'quests', 'leaderboard'],
  },

  club_lounge: {
    rationale: 'General lounge — social first, light discovery mode.',
    defaultTab: 'feed',
    tabOrder: ['feed', 'members', 'rooms', 'events', 'resources', 'playlists', 'leaderboard'],
    hiddenTabs: ['projects', 'quests'],
  },
};

/**
 * Resolve the template for a given category ID.
 * Always returns a valid template (falls back gracefully).
 */
export function getClubTemplate(category: string): ClubCategoryTemplate {
  return CLUB_CATEGORY_TEMPLATES[category] ?? FALLBACK_TEMPLATE;
}
