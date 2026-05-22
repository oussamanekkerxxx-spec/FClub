
import { type StudentTabId } from './StudentClubConstants';

interface NavGroup {
  label: string;
  items: {
    id: StudentTabId;
    icon: string;
    label: string;
    badge?: number;
    dot?: boolean;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Comm',
    items: [
      { id: 'chat', icon: '💬', label: 'Group Chat', badge: 5 },
      { id: 'voice', icon: '🎙', label: 'Voice Rooms', dot: true },
      { id: 'notifs', icon: '🔔', label: 'Notifications', badge: 12 },
    ],
  },
  {
    label: 'Learn',
    items: [
      { id: 'courses', icon: '📚', label: 'Courses & Lessons' },
      { id: 'smart-explain', icon: '🧠', label: 'Smart Explanations' },
      { id: 'quizzes', icon: '✅', label: 'Quizzes & Tests' },
      { id: 'flashcards', icon: '🃏', label: 'Flashcards' },
      { id: 'notes', icon: '📝', label: 'Notes' },
    ],
  },
  {
    label: 'Collab',
    items: [
      { id: 'docs', icon: '📄', label: 'Shared Documents' },
      { id: 'tasks', icon: '☑', label: 'Group Tasks' },
      { id: 'files', icon: '📎', label: 'File Sharing' },
      { id: 'images', icon: '🖼', label: 'Images & Gallery' },
    ],
  },
  {
    label: 'Study',
    items: [
      { id: 'studyrooms', icon: '🏠', label: 'Study Rooms' },
      { id: 'pomodoro', icon: '🍅', label: 'Pomodoro Timer' },
    ],
  },
  {
    label: 'Res',
    items: [
      { id: 'library', icon: '📖', label: 'Notes Library' },
      { id: 'exams', icon: '📋', label: 'Past Exams' },
      { id: 'career', icon: '🧭', label: 'Career Guides' },
    ],
  },
  {
    label: 'Events',
    items: [
      { id: 'events', icon: '🎪', label: 'Events' },
      { id: 'workshops', icon: '🔧', label: 'Workshops' },
      { id: 'liveclasses', icon: '🎥', label: 'Live Classes' },
    ],
  },
  {
    label: 'Game',
    items: [
      { id: 'xp', icon: '⭐', label: 'XP & Points' },
      { id: 'leaderboard', icon: '🏆', label: 'Leaderboard' },
      { id: 'badges', icon: '🎖', label: 'Badges' },
      { id: 'challenges', icon: '⚔', label: 'Challenges' },
    ],
  },
  {
    label: 'AI',
    items: [
      { id: 'feed', icon: '🤖', label: 'Smart Feed' },
      { id: 'matching', icon: '🔗', label: 'Student Matching' },
    ],
  },
  {
    label: 'Mentor',
    items: [
      { id: 'mentors', icon: '🧑\u200d🏫', label: 'Ask a Mentor' },
      { id: 'qa', icon: '❓', label: 'Q&A Board' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { id: 'roles', icon: '👑', label: 'Roles & Members' },
    ],
  },
];

interface StudentSidebarProps {
  activeTab: StudentTabId;
  onTabChange: (tab: StudentTabId) => void;
  club: any;
  user: any;
}

export default function StudentSidebar({ activeTab, onTabChange, club, user }: StudentSidebarProps) {
  return (
    <aside className="w-16 flex-shrink-0 bg-white border-r border-[var(--color-border)] flex flex-col h-full overflow-hidden">
      {/* Club Avatar */}
      <div className="flex items-center justify-center py-3 border-b border-[var(--color-border)]">
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-[var(--color-border)] cursor-pointer hover:ring-2 hover:ring-amber-300/50 transition-all">
          {club?.avatar_url ? (
            <img src={club.avatar_url} alt={club.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg bg-gradient-to-br from-indigo-500 to-blue-500 text-white">
              🎓
            </div>
          )}
        </div>
      </div>

      {/* Navigation Icons */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={group.label}>
            {/* Tiny group label */}
            <div className="text-[8px] font-bold tracking-wider uppercase text-[var(--color-text-muted)] text-center py-1">
              {group.label}
            </div>
            <div className="px-1.5 space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    title={item.label}
                    className={`
                      relative w-full flex items-center justify-center h-10 rounded-xl text-[18px] transition-all select-none
                      ${isActive
                        ? 'bg-parchment text-navy shadow-sm ring-1 ring-orange-100'
                        : 'text-[var(--color-text-secondary)] hover:bg-gray-50 hover:text-navy'}
                    `}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] rounded-r-md bg-gradient-to-b from-[var(--color-amber)] to-orange-500" />
                    )}
                    <span className="relative">
                      {item.icon}
                      {(item.badge ?? 0) > 0 && (
                        <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center px-0.5 shadow-sm">
                          {item.badge! > 9 ? '9+' : item.badge}
                        </span>
                      )}
                      {item.dot && !item.badge && (
                        <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/40" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            {groupIdx < NAV_GROUPS.length - 1 && (
              <div className="mx-3 my-1.5 h-px bg-gray-100" />
            )}
          </div>
        ))}
      </div>

      {/* User Avatar */}
      <div className="flex items-center justify-center py-3 border-t border-[var(--color-border)]">
        <div
          className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 ring-2 ring-transparent hover:ring-amber-300/50 transition-all cursor-pointer"
          title={`${user?.firstName} ${user?.lastName}`}
        >
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}`}
            alt="User"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </aside>
  );
}
