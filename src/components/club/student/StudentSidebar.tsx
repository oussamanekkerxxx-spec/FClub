
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
    label: 'Communication',
    items: [
      { id: 'chat', icon: '💬', label: 'Group Chat', badge: 5 },
      { id: 'voice', icon: '🎙', label: 'Voice Rooms', dot: true },
      { id: 'notifs', icon: '🔔', label: 'Notifications', badge: 12 },
    ],
  },
  {
    label: 'Learning',
    items: [
      { id: 'courses', icon: '📚', label: 'Courses & Lessons' },
      { id: 'smart-explain', icon: '🧠', label: 'Smart Explanations' },
      { id: 'quizzes', icon: '✅', label: 'Quizzes & Tests' },
      { id: 'flashcards', icon: '🃏', label: 'Flashcards' },
      { id: 'notes', icon: '📝', label: 'Notes' },
    ],
  },
  {
    label: 'Collaboration',
    items: [
      { id: 'docs', icon: '📄', label: 'Shared Documents' },
      { id: 'tasks', icon: '☑', label: 'Group Tasks' },
      { id: 'files', icon: '📎', label: 'File Sharing' },
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
    label: 'Resources',
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
    label: 'Gamification',
    items: [
      { id: 'xp', icon: '⭐', label: 'XP & Points' },
      { id: 'leaderboard', icon: '🏆', label: 'Leaderboard' },
      { id: 'badges', icon: '🎖', label: 'Badges' },
      { id: 'challenges', icon: '⚔', label: 'Challenges' },
    ],
  },
  {
    label: 'AI / Smart',
    items: [
      { id: 'feed', icon: '🤖', label: 'Smart Feed' },
      { id: 'matching', icon: '🔗', label: 'Student Matching' },
    ],
  },
  {
    label: 'Mentoring',
    items: [
      { id: 'mentors', icon: '🧑‍🏫', label: 'Ask a Mentor' },
      { id: 'qa', icon: '❓', label: 'Q&A Board' },
    ],
  },
  {
    label: 'Management',
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
    <aside className="w-[260px] flex-shrink-0 bg-white border-r border-[var(--color-border)] flex flex-col h-full overflow-hidden">
      {/* Club & User Header */}
      <div className="p-5 pb-3.5 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-[38px] h-[38px] rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-[var(--color-border)]">
            {club?.avatar_url ? (
              <img src={club.avatar_url} alt={club.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white">
                🎓
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-bold text-navy truncate">{club?.name || 'Student Club'}</div>
            <div className="text-[10px] text-green-600 font-semibold tracking-wide">● Active</div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-gray-50/80 text-xs border border-gray-100">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
             <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}`} alt="User" className="w-full h-full object-cover" />
          </div>
          <span className="font-semibold text-navy flex-1 truncate">{user?.firstName} {user?.lastName}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded text-[var(--color-amber)] bg-[var(--color-amber)]/10 font-bold tracking-wider">Student</span>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-1.5">
            <div className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--color-text-muted)] px-2.5 pt-3 pb-1.5">
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`
                    group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium cursor-pointer transition-all select-none
                    ${isActive 
                      ? 'bg-parchment text-navy font-semibold shadow-sm border border-orange-100/50' 
                      : 'text-[var(--color-text-secondary)] hover:bg-gray-50 hover:text-navy'}
                  `}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] rounded-r-md bg-gradient-to-b from-[var(--color-amber)] to-orange-500" />
                  )}
                  <span className={`w-[18px] text-center text-[14px] transition-opacity ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                    {item.icon}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  
                  {item.badge && (
                    <span className="ml-auto min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1.5 shadow-sm">
                      {item.badge}
                    </span>
                  )}
                  {item.dot && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/40" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
