import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type TrustTier = 0 | 1 | 2 | 3 | 4;
export type UserArchetype = 'giver' | 'seeker' | 'connector' | 'mixed';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  cover_url?: string;
  bio?: string;
  location?: string;
  city?: string;
  region?: string;
  phone?: string;
  trust_tier: TrustTier;
  trust_score: number;
  archetype: UserArchetype;
  phone_verified: boolean;
  id_verified: boolean;
  id_card_status?: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  onboarding_completed: boolean;
  what_i_teach: string[];
  what_i_learn: string[];
  languages: string[];
  role: string;
  isDemo: boolean;
  sessions_completed: number;
  reviews_count: number;
}

const TRUST_TIER_LABELS: Record<TrustTier, string> = {
  0: 'Explorer',
  1: 'Member',
  2: 'Verified',
  3: 'Teacher',
  4: 'Connector',
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isEmailVerified: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  getTrustLabel: (tier: TrustTier) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapProfileToUser(profile: Record<string, unknown>, authId: string, email: string): User {
  return {
    id: authId,
    email,
    firstName: (profile.first_name as string) || '',
    lastName: (profile.last_name as string) || '',
    avatar: (profile.avatar_url as string) || undefined,
    cover_url: (profile.cover_url as string) || undefined,
    bio: (profile.bio as string) || undefined,
    location: (profile.city as string) || (profile.neighborhood as string) || undefined,
    city: (profile.city as string) || undefined,
    region: (profile.region as string) || undefined,
    phone: (profile.phone as string) || undefined,
    trust_tier: ((profile.trust_tier as number) || 0) as TrustTier,
    trust_score: (profile.trust_score as number) || 0,
    archetype: ((profile.archetype as string) || 'mixed') as UserArchetype,
    phone_verified: (profile.phone_verified as boolean) || false,
    id_verified: (profile.id_verified as boolean) || false,
    id_card_status: ((profile.id_card_status as string) || 'not_submitted') as User['id_card_status'],
    onboarding_completed: (profile.onboarding_completed as boolean) || false,
    what_i_teach: (profile.what_i_teach as string[]) || [],
    what_i_learn: (profile.what_i_learn as string[]) || [],
    languages: (profile.languages as string[]) || [],
    role: (profile.role as string) || 'member',
    isDemo: false,
    sessions_completed: (profile.sessions_completed as number) || 0,
    reviews_count: (profile.reviews_count as number) || 0,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadedUserIdRef = useRef<string | null>(null);

  const loadProfile = async (supabaseSession: Session) => {
    // Skip reload if we already loaded this user's profile (e.g. tab focus re-triggers onAuthStateChange)
    if (loadedUserIdRef.current === supabaseSession.user.id) {
      setIsLoading(false);
      return;
    }
    loadedUserIdRef.current = supabaseSession.user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseSession.user.id)
      .maybeSingle();

    if (profile) {
      setUser(mapProfileToUser(profile as Record<string, unknown>, supabaseSession.user.id, supabaseSession.user.email || ''));
    } else {
      // Profile row not yet created (trigger may not have run, or schema not migrated)
      // Set minimal user so they can still access onboarding
      setUser({
        id: supabaseSession.user.id,
        email: supabaseSession.user.email || '',
        firstName: (supabaseSession.user.user_metadata?.first_name as string) || '',
        lastName: (supabaseSession.user.user_metadata?.last_name as string) || '',
        trust_tier: 0,
        trust_score: 0,
        archetype: 'mixed',
        phone_verified: false,
        id_verified: false,
        onboarding_completed: false,
        what_i_teach: [],
        what_i_learn: [],
        languages: [],
        role: 'member',
        isDemo: false,
        sessions_completed: 0,
        reviews_count: 0,
      });
    }
  };

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        loadProfile(s).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (s) {
        // Only re-enter loading for a fresh SIGNED_IN where we haven't loaded
        // this user yet (e.g. OAuth callback). TOKEN_REFRESHED / USER_UPDATED
        // etc. must NOT flip isLoading=true — that causes an infinite spinner.
        if (event === 'SIGNED_IN' && loadedUserIdRef.current !== s.user.id) {
          setIsLoading(true);
        }
        loadProfile(s).finally(() => setIsLoading(false));
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEmailVerified = !!session?.user?.email_confirmed_at;

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const demoEmail = import.meta.env.VITE_DEMO_EMAIL;
    const demoPassword = import.meta.env.VITE_DEMO_PASSWORD;

    if (import.meta.env.DEV && demoEmail && demoPassword && email === demoEmail && password === demoPassword) {
      // Demo bypass logic
      const demoUser: User = {
        id: 'demo-user-bypass',
        email: demoEmail,
        firstName: 'Demo',
        lastName: 'Fighter',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
        bio: 'I am here to test the platform.',
        location: undefined,
        city: undefined,
        region: undefined,
        trust_tier: 2,
        trust_score: 85,
        archetype: 'mixed',
        phone_verified: true,
        id_verified: true,
        onboarding_completed: true,
        what_i_teach: ['React', 'TypeScript'],
        what_i_learn: ['Boxing', 'Arabic'],
        languages: ['English', 'French'],
        role: 'member',
        isDemo: true,
        sessions_completed: 5,
        reviews_count: 3,
      };
      
      setUser(demoUser);
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIsLoading(false);
      throw error;
    }
    // onAuthStateChange will handle setUser via loadProfile
  }, []);

  const logout = useCallback(async () => {
    loadedUserIdRef.current = null;
    await supabase.auth.signOut();
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const getTrustLabel = useCallback((tier: TrustTier) => {
    return TRUST_TIER_LABELS[tier];
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    isEmailVerified,
    login,
    logout,
    updateUser,
    getTrustLabel,
  }), [user, isLoading, isEmailVerified, login, logout, updateUser, getTrustLabel]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export { TRUST_TIER_LABELS };
