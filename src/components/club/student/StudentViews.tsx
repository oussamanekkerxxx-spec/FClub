import { lazy, Suspense } from 'react';
import { type StudentTabId } from './StudentClubConstants';

// ── Lazy-loaded student views ──
// Each view is code-split and loaded on-demand when its tab is selected.

const ChatView = lazy(() => import('./views/ChatView').then(m => ({ default: m.ChatView })));
const VoiceRoomsView = lazy(() => import('./views/VoiceRoomsView').then(m => ({ default: m.VoiceRoomsView })));
const NotifsView = lazy(() => import('./views/NotifsView').then(m => ({ default: m.NotifsView })));
const CoursesView = lazy(() => import('./views/CoursesView').then(m => ({ default: m.CoursesView })));
const SmartExplainView = lazy(() => import('./views/SmartExplainView').then(m => ({ default: m.SmartExplainView })));
const QuizzesView = lazy(() => import('./views/QuizzesView').then(m => ({ default: m.QuizzesView })));
const FlashcardsView = lazy(() => import('./views/FlashcardsView').then(m => ({ default: m.FlashcardsView })));
const NotesView = lazy(() => import('./views/NotesView').then(m => ({ default: m.NotesView })));
const DocsView = lazy(() => import('./views/DocsView').then(m => ({ default: m.DocsView })));
const TasksView = lazy(() => import('./views/TasksView').then(m => ({ default: m.TasksView })));
const FilesView = lazy(() => import('./views/FilesView').then(m => ({ default: m.FilesView })));
const StudyRoomsView = lazy(() => import('./views/StudyRoomsView').then(m => ({ default: m.StudyRoomsView })));
const PomodoroView = lazy(() => import('./views/PomodoroView').then(m => ({ default: m.PomodoroView })));
const LibraryView = lazy(() => import('./views/LibraryView').then(m => ({ default: m.LibraryView })));
const ExamsView = lazy(() => import('./views/ExamsView').then(m => ({ default: m.ExamsView })));
const CareerView = lazy(() => import('./views/CareerView').then(m => ({ default: m.CareerView })));
const EventsView = lazy(() => import('./views/EventsView').then(m => ({ default: m.EventsView })));
const WorkshopsView = lazy(() => import('./views/WorkshopsView').then(m => ({ default: m.WorkshopsView })));
const LiveClassesView = lazy(() => import('./views/LiveClassesView').then(m => ({ default: m.LiveClassesView })));
const XpView = lazy(() => import('./views/XpView').then(m => ({ default: m.XpView })));
const LeaderboardView = lazy(() => import('./views/LeaderboardView').then(m => ({ default: m.LeaderboardView })));
const BadgesView = lazy(() => import('./views/BadgesView').then(m => ({ default: m.BadgesView })));
const ChallengesView = lazy(() => import('./views/ChallengesView').then(m => ({ default: m.ChallengesView })));
const FeedView = lazy(() => import('./views/FeedView').then(m => ({ default: m.FeedView })));
const MatchingView = lazy(() => import('./views/MatchingView').then(m => ({ default: m.MatchingView })));
const MentorsView = lazy(() => import('./views/MentorsView').then(m => ({ default: m.MentorsView })));
const QaView = lazy(() => import('./views/QaView').then(m => ({ default: m.QaView })));
const RolesView = lazy(() => import('./views/RolesView').then(m => ({ default: m.RolesView })));

function ViewFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );
}

export default function StudentViews({
  activeTab,
  clubId,
  isMember,
  canModerate,
  userId,
}: {
  activeTab: StudentTabId;
  clubId: string;
  isMember: boolean;
  canModerate: boolean;
  userId?: string;
}) {
  const view = (() => {
    switch (activeTab) {
      case 'chat': return <ChatView clubId={clubId} isMember={isMember} userId={userId} />;
      case 'voice': return <VoiceRoomsView clubId={clubId} isMember={isMember} userId={userId} />;
      case 'notifs': return <NotifsView clubId={clubId} isMember={isMember} canModerate={canModerate} />;
      case 'courses': return <CoursesView clubId={clubId} />;
      case 'smart-explain': return <SmartExplainView />;
      case 'quizzes': return <QuizzesView />;
      case 'flashcards': return <FlashcardsView />;
      case 'notes': return <NotesView />;
      case 'docs': return <DocsView clubId={clubId} />;
      case 'tasks': return <TasksView />;
      case 'files': return <FilesView clubId={clubId} />;
      case 'studyrooms': return <StudyRoomsView />;
      case 'pomodoro': return <PomodoroView />;
      case 'library': return <LibraryView />;
      case 'exams': return <ExamsView />;
      case 'career': return <CareerView />;
      case 'events': return <EventsView clubId={clubId} />;
      case 'workshops': return <WorkshopsView />;
      case 'liveclasses': return <LiveClassesView />;
      case 'xp': return <XpView />;
      case 'leaderboard': return <LeaderboardView />;
      case 'badges': return <BadgesView />;
      case 'challenges': return <ChallengesView />;
      case 'feed': return <FeedView />;
      case 'matching': return <MatchingView />;
      case 'mentors': return <MentorsView />;
      case 'qa': return <QaView />;
      case 'roles': return <RolesView clubId={clubId} />;
      default: return null;
    }
  })();

  return <Suspense fallback={<ViewFallback />}>{view}</Suspense>;
}
