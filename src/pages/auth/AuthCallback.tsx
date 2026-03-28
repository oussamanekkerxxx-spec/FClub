import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

/**
 * Handles the OAuth callback from Supabase (PKCE flow).
 * Supabase redirects here with ?code=... after Google OAuth.
 * The Supabase client exchanges the code for a session, then we
 * redirect to onboarding (new users) or feed (returning users).
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const handleCallback = async () => {
      // Supabase automatically exchanges the code from the URL when
      // detectSessionInUrl is true (the default). We just need to wait
      // for the session to be available.
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        // Exchange may not have happened yet — listen for the auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe();
            redirectAfterAuth(session.user.id);
          } else if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
            subscription.unsubscribe();
            navigate('/login?error=oauth_failed', { replace: true });
          }
        });

        // Timeout fallback — if nothing happens in 10s, send to login
        setTimeout(() => {
          subscription.unsubscribe();
          navigate('/login?error=oauth_timeout', { replace: true });
        }, 10000);
        return;
      }

      redirectAfterAuth(data.session.user.id);
    };

    const redirectAfterAuth = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .maybeSingle();

      if (!profile || !profile.onboarding_completed) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/app/feed', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--color-amber)] mx-auto" />
        <p className="text-[var(--color-text-secondary)] text-sm">Signing you in…</p>
      </div>
    </div>
  );
}
