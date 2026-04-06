export const COMPLETE_TEST_ACCOUNT = {
  email: 'oussama.nekker.xxx@gmail.com',
  password: 'skillclub2025',
  userId: 'f1b9e0f6-3f0a-4f4d-9a29-4d92de9df4a1',
} as const;

export const COMPLETE_FIXTURE_IDS = {
  clubId: '31084af2-9b91-4e14-84f3-9fe7f7a5f001',
  channels: {
    general: '31084af2-9b91-4e14-84f3-9fe7f7a5f011',
    announcements: '31084af2-9b91-4e14-84f3-9fe7f7a5f012',
    projects: '31084af2-9b91-4e14-84f3-9fe7f7a5f013',
  },
  projects: {
    mentorMatchApi: '31084af2-9b91-4e14-84f3-9fe7f7a5f061',
    questBoard: '31084af2-9b91-4e14-84f3-9fe7f7a5f062',
  },
  events: {
    workshop: '31084af2-9b91-4e14-84f3-9fe7f7a5f051',
    sprint: '31084af2-9b91-4e14-84f3-9fe7f7a5f052',
    showcase: '31084af2-9b91-4e14-84f3-9fe7f7a5f053',
  },
  quests: {
    starterTaskforce: '31084af2-9b91-4e14-84f3-9fe7f7a5f0b1',
    demoShowcase: '31084af2-9b91-4e14-84f3-9fe7f7a5f0b2',
  },
  requests: {
    room: '31084af2-9b91-4e14-84f3-9fe7f7a5f111',
    projectHelp: '31084af2-9b91-4e14-84f3-9fe7f7a5f112',
    eventHelp: '31084af2-9b91-4e14-84f3-9fe7f7a5f113',
    joinPending: '31084af2-9b91-4e14-84f3-9fe7f7a5f121',
  },
} as const;

export const COMPLETE_FIXTURE_EXPECTATIONS = {
  pollOptions: ['Python', 'React', 'Vite', 'SQL'],
  eventStyles: ['workshop', 'sprint', 'showcase'],
  requestTypes: ['room', 'project_help', 'event_help'],
  leaderboardMinRows: 6,
} as const;

export function buildClubTabUrl(clubId: string, tab: string, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams({ tab, ...extra });
  return `/app/club/${clubId}?${params.toString()}`;
}
