import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

/**
 * Handles the OAuth callback from Supabase (PKCE flow).
 *
 * NOTE: No "handled" ref guard here — React StrictMode mounts→unmounts→remounts
 * in dev, and a guard on the first mount would leave the second (real) mount
 * with no listener, causing an infinite spinner.
 *
 * Instead we use a `cancelled` flag that is set on cleanup, so any in-flight
 * async work from a superseded mount is safely discarded.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const redirectAfterAuth = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .maybeSingle();

      if (cancelled) return; // component unmounted or StrictMode re-cycle

      if (!profile || !profile.onboarding_completed) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/app/discover', { replace: true });
      }
    };

    // Subscribe before anything else so we never miss the session event:
    //   • PKCE exchange already done  → INITIAL_SESSION fires with session
    //   • PKCE exchange still pending → SIGNED_IN fires once it completes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        subscription.unsubscribe();
        clearTimeout(timeout);
        // Strip the OAuth tokens from the URL hash so they don't linger in the address bar
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        redirectAfterAuth(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        subscription.unsubscribe();
        clearTimeout(timeout);
        if (!cancelled) navigate('/login?error=oauth_failed', { replace: true });
      }
      // INITIAL_SESSION with null = exchange still in progress, keep waiting
    });

    // Safety net — if nothing resolves in 10 s, bail to login
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      if (!cancelled) navigate('/login?error=oauth_timeout', { replace: true });
    }, 10000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
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
