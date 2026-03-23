import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isEmailVerified } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-amber)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if email is verified (skip check for onboarding and verify-email pages)
  const publicPaths = ['/verify-email', '/onboarding'];
  const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));
  
  if (!isEmailVerified && !isPublicPath) {
    // Redirect to verify email page with user's email
    return <Navigate to="/verify-email" state={{ email: location.state?.email }} replace />;
  }

  return <>{children}</>;
}
