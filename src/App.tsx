import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

// Landing Page Sections
import Navigation from './sections/Navigation';
import Hero from './sections/Hero';
import LiveSkillsPreview from './sections/LiveSkillsPreview';
import HowItWorks from './sections/HowItWorks';
import Testimonials from './sections/Testimonials';
import JoinCTA from './sections/JoinCTA';
import Footer from './sections/Footer';

// App Pages
import Feed from './pages/Feed';
import Browse from './pages/Browse';
import SkillDetail from './pages/SkillDetail';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Teach from './pages/Teach';
import Admin from './pages/Admin';
import MemberProfile from './pages/MemberProfile';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import Board from './pages/Board';
import Welcome from './pages/Welcome';
import AppLayout from './components/layout/AppLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import VerifyEmail from './pages/auth/VerifyEmail';
import AuthCallback from './pages/auth/AuthCallback';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Landing Page Component — streamlined to 5 sections
function LandingPage() {
  return (
    <div className="relative">
      <Navigation />
      <Hero className="z-10" />
      <LiveSkillsPreview className="z-20" />
      <HowItWorks className="z-30" />
      <Testimonials className="z-40" />
      <JoinCTA className="z-50" />
      <Footer className="z-60" />
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
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Onboarding - Requires auth but no layout yet */}
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

        {/* App Routes with SKILLCLUB Layout */}
        <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          {/* Default → Feed */}
          <Route index element={<Navigate to="/app/feed" replace />} />
          <Route path="feed" element={<Feed />} />
          <Route path="browse" element={<Browse />} />
          <Route path="skill/:slug" element={<SkillDetail />} />
          <Route path="messages" element={<Messages />} />
          <Route path="profile" element={<Profile />} />
          <Route path="teach" element={<Teach />} />
          <Route path="board" element={<Board />} />
          <Route path="admin" element={<Admin />} />
          <Route path="member/:id" element={<MemberProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="welcome" element={<Welcome />} />
          {/* Legacy dashboard redirect */}
          <Route path="dashboard" element={<Navigate to="/app/feed" replace />} />
          {/* 404 fallback inside app */}
          <Route path="*" element={<Navigate to="/app/feed" replace />} />
        </Route>
        {/* Global 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
