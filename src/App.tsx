import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

// Landing Page Sections
import Navigation from './sections/Navigation';
import Hero from './sections/Hero';
import DashboardPreview from './sections/DashboardPreview';
import FeaturesGrid from './sections/FeaturesGrid';
import CoursePage from './sections/CoursePage';
import AssignmentFlow from './sections/AssignmentFlow';
import CalendarPlanner from './sections/CalendarPlanner';
import Messaging from './sections/Messaging';
import StudyGroups from './sections/StudyGroups';
import ProgressAnalytics from './sections/ProgressAnalytics';
import Testimonials from './sections/Testimonials';
import Pricing from './sections/Pricing';
import Footer from './sections/Footer';

// App Pages
import Feed from './pages/Feed';
import Browse from './pages/Browse';
import SkillDetail from './pages/SkillDetail';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Teach from './pages/Teach';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import Board from './pages/Board';
import AppLayout from './components/layout/AppLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import VerifyEmail from './pages/auth/VerifyEmail';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Landing Page Component
function LandingPage() {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const pinned = ScrollTrigger.getAll()
        .filter(st => st.vars.pin)
        .sort((a, b) => a.start - b.start);
      
      const maxScroll = ScrollTrigger.maxScroll(window);
      if (!maxScroll || pinned.length === 0) return;

      const pinnedRanges = pinned.map(st => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      ScrollTrigger.create({
        snap: {
          snapTo: (value: number) => {
            const inPinned = pinnedRanges.some(
              r => value >= r.start - 0.02 && value <= r.end + 0.02
            );
            if (!inPinned) return value;
            const target = pinnedRanges.reduce(
              (closest, r) =>
                Math.abs(r.center - value) < Math.abs(closest - value) ? r.center : closest,
              pinnedRanges[0]?.center ?? 0
            );
            return target;
          },
          duration: { min: 0.15, max: 0.35 },
          delay: 0,
          ease: 'power2.out',
        },
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <div ref={mainRef} className="relative">
      <Navigation />
      <Hero className="z-10" />
      <DashboardPreview className="z-20" />
      <FeaturesGrid className="z-30" />
      <CoursePage className="z-40" />
      <AssignmentFlow className="z-50" />
      <CalendarPlanner className="z-60" />
      <Messaging className="z-70" />
      <StudyGroups className="z-80" />
      <ProgressAnalytics className="z-90" />
      <Testimonials className="z-100" />
      <Pricing className="z-110" />
      <Footer className="z-120" />
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
          <Route path="settings" element={<Settings />} />
          {/* Legacy dashboard redirect */}
          <Route path="dashboard" element={<Navigate to="/app/feed" replace />} />
        </Route>
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
