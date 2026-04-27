/**
 * Typed query key factory for TanStack Query.
 *
 * Every cache key in the app must be defined here. Components and hooks import
 * from this module — no ad-hoc string arrays anywhere else.
 *
 * Key hierarchy:
 *   clubs.list()                           → ['clubs']
 *   clubs.detail(id)                       → ['club', id]
 *   clubs.members(clubId)                  → ['club', clubId, 'members']
 *   clubs.rooms(clubId)                    → ['club', clubId, 'rooms']
 *   ...
 *
 * Why `as const`: TanStack Query infers the exact tuple type for invalidation
 * matching. Without `as const`, keys widen to string[] and partial-key
 * invalidation (e.g. invalidating all keys under a club) stops working.
 */

export const queryKeys = {
  // ── Clubs ────────────────────────────────────────────────────────────────

  clubs: {
    /** All clubs list (Discover page) */
    list: () => ['clubs'] as const,

    /** Single club by id or slug (ClubHome) */
    detail: (idOrSlug: string) => ['club', idOrSlug] as const,

    /** Member list for a club */
    members: (clubId: string) => ['club', clubId, 'members'] as const,

    /** Quests for a club */
    quests: (clubId: string) => ['club', clubId, 'quests'] as const,

    /** Pending join requests for a club */
    requests: (clubId: string) => ['club', clubId, 'requests'] as const,

    /** Resources tab for a club */
    resources: (clubId: string) => ['club', clubId, 'resources'] as const,

    /** Voice rooms for a club (non-ended) */
    rooms: (clubId: string) => ['club', clubId, 'rooms'] as const,

    /** Boolean: does this club have an active (live) voice room? */
    hasActiveRoom: (clubId: string) => ['club', clubId, 'has-active-room'] as const,

    /** Count of pending join requests (used for badge in admin UI) */
    pendingCount: (clubId: string) => ['club', clubId, 'pending-count'] as const,

    /** Pinned posts for a club feed */
    pinnedPosts: (clubId: string) => ['club', clubId, 'pinned-posts'] as const,

    /** Upcoming events for a club */
    upcomingEvents: (clubId: string) => ['club', clubId, 'upcoming-events'] as const,

    /** Activity feed: parsed chat messages for a club */
    activity: (clubId: string) => ['club', clubId, 'activity'] as const,

    /** Active bans for a club */
    bans: (clubId: string) => ['club', clubId, 'bans'] as const,

    /** Active mutes for a club */
    mutes: (clubId: string) => ['club', clubId, 'mutes'] as const,
  },

  // ── Memberships ──────────────────────────────────────────────────────────

  memberships: {
    /** Current user's active memberships — used to render "Joined" badges */
    mine: (userId: string) => ['club_memberships', 'mine', userId] as const,

    /** Single membership row for (club, user) — used for role/status checks */
    one: (clubId: string, userId: string) => ['club', clubId, 'membership', userId] as const,

    /** Single pending join-request row for (club, user) */
    joinRequest: (clubId: string, userId: string) => ['club', clubId, 'join-request', userId] as const,
  },

  // ── Skills ───────────────────────────────────────────────────────────────

  skills: {
    /** All active skills (Browse page) */
    active: () => ['skills', 'active'] as const,

    /** Skills taught by a specific teacher (Profile page) */
    byTeacher: (teacherId: string) => ['skills', 'teacher', teacherId] as const,

    /** Single skill detail by slug (SkillDetail page) */
    detail: (slug: string) => ['skills', 'detail', slug] as const,

    /** Reviews for a skill */
    reviews: (skillId: string) => ['skills', skillId, 'reviews'] as const,
    /** Dismissed skills for a specific user (Feed page personalization) */
    dismissedByUser: (userId: string) => ['skills', 'dismissed', userId] as const,
  },

  // —— Feed ————————————————————————————————————————————————————————————————————————————————

  feed: {
    /** Latest feed events shown on home feed */
    events: () => ['feed', 'events'] as const,
  },

  // ── Conversations & Messages ─────────────────────────────────────────────

  conversations: {
    /** Conversation list for the current user */
    list: (userId: string) => ['conversations', userId] as const,

    /** Messages inside a single conversation */
    messages: (conversationId: string) => ['messages', conversationId] as const,
  },

  // ── Profiles ─────────────────────────────────────────────────────────────

  profiles: {
    /** Single user profile by id */
    one: (userId: string) => ['profile', userId] as const,
  },

  // ── Stories ──────────────────────────────────────────────────────────────

  stories: {
    /** Active stories, optionally scoped to a club */
    active: (clubId?: string) => ['stories', 'active', clubId ?? 'all'] as const,
  },

  // ── Projects ────────────────────────────────────────────────────────────

  projects: {
    /** All projects for a club (ProjectsTab) */
    list: (clubId: string) => ['projects', 'list', clubId] as const,

    /** Single project detail (ProjectDetails page) */
    detail: (projectId: string) => ['project', projectId] as const,

    /** Kanban board: tasks + members for a project */
    board: (projectId: string) => ['project', projectId, 'board'] as const,

    /** Chat messages for a project channel */
    chat: (channelId: string) => ['project-chat', channelId] as const,
  },

  // ── Student Learning ───────────────────────────────────────────────────────

  student: {
    /** Courses for a student club */
    courses: (clubId: string) => ['student', clubId, 'courses'] as const,

    /** Lessons for a course */
    lessons: (courseId: string) => ['student', 'lessons', courseId] as const,

    /** Shared files for a student club */
    sharedFiles: (
      clubId: string,
      courseId?: string,
      lessonId?: string,
      kindsKey?: string,
    ) =>
      ['student', clubId, 'files', courseId ?? 'all', lessonId ?? 'all', kindsKey ?? 'all'] as const,
  },
} as const;
