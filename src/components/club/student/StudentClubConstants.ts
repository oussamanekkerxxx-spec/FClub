export type StudentTabId = 
  | 'chat' | 'voice' | 'notifs'
  | 'courses' | 'smart-explain' | 'quizzes' | 'flashcards' | 'notes'
  | 'docs' | 'tasks' | 'files' | 'images'
  | 'studyrooms' | 'pomodoro'
  | 'library' | 'exams' | 'career'
  | 'events' | 'workshops' | 'liveclasses'
  | 'xp' | 'leaderboard' | 'badges' | 'challenges'
  | 'feed' | 'matching'
  | 'mentors' | 'qa'
  | 'roles';

export interface TabMeta {
  icon: string;
  title: string;
  subtitle: string;
}

export const STUDENT_TABS_META: Record<StudentTabId, TabMeta> = {
  chat: { icon: '💬', title: 'Group Chat', subtitle: '128 members' },
  voice: { icon: '🎙', title: 'Voice Rooms', subtitle: '2 live' },
  notifs: { icon: '🔔', title: 'Notifications', subtitle: '5 new' },
  courses: { icon: '📚', title: 'Courses & Lessons', subtitle: '3 courses' },
  'smart-explain': { icon: '🧠', title: 'Smart Explanations', subtitle: 'AI-powered' },
  quizzes: { icon: '✅', title: 'Quizzes & Tests', subtitle: 'Quiz mode' },
  flashcards: { icon: '🃏', title: 'Flashcards', subtitle: '18 cards' },
  notes: { icon: '📝', title: 'Notes', subtitle: '6 notes' },
  docs: { icon: '📄', title: 'Shared Documents', subtitle: '3 docs' },
  tasks: { icon: '☑', title: 'Group Tasks', subtitle: '4 tasks' },
  files: { icon: '📎', title: 'File Sharing', subtitle: '8 files' },
  images: { icon: '🖼', title: 'Images & Gallery', subtitle: 'Learning images' },
  studyrooms: { icon: '🏠', title: 'Study Rooms', subtitle: '2 active' },
  pomodoro: { icon: '🍅', title: 'Pomodoro Timer', subtitle: 'Focus mode' },
  library: { icon: '📖', title: 'Notes Library', subtitle: 'Resources' },
  exams: { icon: '📋', title: 'Past Exams', subtitle: 'Archive' },
  career: { icon: '🧭', title: 'Career Guides', subtitle: 'Roadmaps' },
  events: { icon: '🎪', title: 'Events', subtitle: '3 upcoming' },
  workshops: { icon: '🔧', title: 'Workshops', subtitle: '2 available' },
  liveclasses: { icon: '🎥', title: 'Live Classes', subtitle: '1 live now' },
  xp: { icon: '⭐', title: 'XP & Points', subtitle: '1,280 XP' },
  leaderboard: { icon: '🏆', title: 'Leaderboard', subtitle: 'This month' },
  badges: { icon: '🎖', title: 'Badges', subtitle: '8 earned' },
  challenges: { icon: '⚔', title: 'Challenges', subtitle: '2 active' },
  feed: { icon: '🤖', title: 'Smart Feed', subtitle: 'AI-powered' },
  matching: { icon: '🔗', title: 'Student Matching', subtitle: '3 matches' },
  mentors: { icon: '🧑‍🏫', title: 'Ask a Mentor', subtitle: '3 available' },
  qa: { icon: '❓', title: 'Q&A Board', subtitle: '2 questions' },
  roles: { icon: '👑', title: 'Roles & Members', subtitle: '4 roles' },
};
