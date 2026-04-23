import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

// Landing Page Sections (always needed on first load — keep eager)
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import VerifyEmail from './pages/auth/VerifyEmail';
import AuthCallback from './pages/auth/AuthCallback';
import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Heavy app pages — lazy loaded, only downloaded when visited
const Feed        = lazy(() => import('./pages/Feed'));
const Discover    = lazy(() => import('./pages/Discover'));
const ClubHome    = lazy(() => import('./pages/ClubHome'));
const ClubChat    = lazy(() => import('./pages/ClubChat'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const SkillDetail = lazy(() => import('./pages/SkillDetail'));
const Messages    = lazy(() => import('./pages/Messages'));
const Profile     = lazy(() => import('./pages/Profile'));
const Path       = lazy(() => import('./pages/Path'));
const Admin       = lazy(() => import('./pages/Admin'));
const MemberProfile = lazy(() => import('./pages/MemberProfile'));
const Settings    = lazy(() => import('./pages/Settings'));
const Onboarding  = lazy(() => import('./pages/Onboarding'));
const Board       = lazy(() => import('./pages/Board'));
const Welcome     = lazy(() => import('./pages/Welcome'));
const RoomCreate  = lazy(() => import('./pages/RoomCreate'));
const RoomChat    = lazy(() => import('./pages/RoomChat'));
const VoiceRoom   = lazy(() => import('./pages/VoiceRoom'));

// Minimal spinner shown while a lazy chunk is loading
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-parchment">
      <div className="w-8 h-8 rounded-full border-4 border-amber-300 border-t-amber-600 animate-spin" />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppRouter() {
  return (
    <Router>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Onboarding */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

          {/* Club routes — no app shell */}
          <Route path="/club/:id" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<ClubHome />} />
          </Route>

          {/* App Routes with Layout */}
          <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/app/discover" replace />} />
            <Route path="discover"        element={<Feed />} />
            <Route path="feed"            element={<Navigate to="/app/discover" replace />} />
            <Route path="clubs"           element={<Discover />} />
            <Route path="skill/:slug"     element={<SkillDetail />} />
            <Route path="messages"        element={<Messages />} />
            <Route path="profile"         element={<Profile />} />
            <Route path="path"           element={<Path />} />
            <Route path="board"           element={<Board />} />
            <Route path="room/new"        element={<RoomCreate />} />
            <Route path="room/:id"        element={<RoomChat />} />
            <Route path="voice-room/:id"  element={<VoiceRoom />} />
            <Route path="admin"           element={<Admin />} />
            <Route path="club/:id/chat"   element={<ClubChat />} />
            <Route path="club/:clubId/projects/:projectId" element={<ProjectDetails />} />
            <Route path="member/:id"      element={<MemberProfile />} />
            <Route path="settings"        element={<Settings />} />
            <Route path="welcome"         element={<Welcome />} />
            <Route path="dashboard"       element={<Navigate to="/app/discover" replace />} />
            <Route path="*"               element={<Navigate to="/app/discover" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" richColors />
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
