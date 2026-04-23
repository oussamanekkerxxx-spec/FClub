import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import type { User } from '@/contexts/AuthContext';

interface UseProfileDataOptions {
  authUser: User | null;
  updateUser: (updates: Partial<User>) => void;
}

interface SaveProfileInput {
  bio: string;
  city: string;
  region: string;
  phone: string;
  languages: string[];
  what_i_teach: string[];
  what_i_learn: string[];
}

interface UseProfileDataResult {
  user: User | null;
  loading: boolean;
  setLocalUser: (updates: Partial<User>) => void;
  saveProfile: (input: SaveProfileInput) => Promise<void>;
  updateCover: (coverUrl: string) => Promise<void>;
  markIdPending: () => Promise<void>;
}

type ProfileRow = {
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  bio?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  region?: string | null;
  phone?: string | null;
  trust_tier?: number | null;
  trust_score?: number | null;
  archetype?: string | null;
  phone_verified?: boolean | null;
  id_verified?: boolean | null;
  id_card_status?: User['id_card_status'] | null;
  onboarding_completed?: boolean | null;
  what_i_teach?: string[] | null;
  what_i_learn?: string[] | null;
  languages?: string[] | null;
  role?: string | null;
  sessions_completed?: number | null;
  reviews_count?: number | null;
};

function mergeProfileIntoUser(authUser: User, profile: ProfileRow): User {
  return {
    ...authUser,
    firstName: profile.first_name ?? authUser.firstName,
    lastName: profile.last_name ?? authUser.lastName,
    avatar: profile.avatar_url ?? authUser.avatar,
    cover_url: profile.cover_url ?? authUser.cover_url,
    bio: profile.bio ?? authUser.bio,
    location: profile.city ?? profile.neighborhood ?? authUser.location,
    city: profile.city ?? authUser.city,
    region: profile.region ?? authUser.region,
    phone: profile.phone ?? authUser.phone,
    trust_tier: (profile.trust_tier ?? authUser.trust_tier) as User['trust_tier'],
    trust_score: profile.trust_score ?? authUser.trust_score,
    archetype: (profile.archetype ?? authUser.archetype) as User['archetype'],
    phone_verified: profile.phone_verified ?? authUser.phone_verified,
    id_verified: profile.id_verified ?? authUser.id_verified,
    id_card_status: profile.id_card_status ?? authUser.id_card_status,
    onboarding_completed: profile.onboarding_completed ?? authUser.onboarding_completed,
    what_i_teach: profile.what_i_teach ?? authUser.what_i_teach,
    what_i_learn: profile.what_i_learn ?? authUser.what_i_learn,
    languages: profile.languages ?? authUser.languages,
    role: profile.role ?? authUser.role,
    sessions_completed: profile.sessions_completed ?? authUser.sessions_completed,
    reviews_count: profile.reviews_count ?? authUser.reviews_count,
  };
}

export function useProfileData({ authUser, updateUser }: UseProfileDataOptions): UseProfileDataResult {
  const qc = useQueryClient();
  const profileKey = useMemo(
    () => (authUser ? queryKeys.profiles.one(authUser.id) : (['profile', '__disabled__'] as const)),
    [authUser?.id]
  );

  const profileQuery = useQuery<User | null>({
    queryKey: profileKey,
    queryFn: async () => {
      if (!authUser) return null;
      if (authUser.isDemo) return authUser;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return authUser;
      return mergeProfileIntoUser(authUser, data as ProfileRow);
    },
    enabled: !!authUser,
    initialData: authUser ?? null,
    staleTime: 60 * 1000,
    meta: { errorMessage: false },
  });

  const setLocalUser = useCallback((updates: Partial<User>) => {
    if (!authUser) return;
    updateUser(updates);
    qc.setQueryData<User | null>(profileKey, (previous) => {
      const base = previous ?? authUser;
      return { ...base, ...updates };
    });
  }, [authUser, profileKey, qc, updateUser]);

  const saveProfileMutation = useMutation({
    mutationFn: async (input: SaveProfileInput) => {
      if (!authUser) return;
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: input.bio,
          city: input.city || null,
          region: input.region || null,
          phone: input.phone || null,
          languages: input.languages,
          what_i_teach: input.what_i_teach,
          what_i_learn: input.what_i_learn,
        })
        .eq('id', authUser.id);
      if (error) throw error;

      setLocalUser({
        bio: input.bio,
        city: input.city || undefined,
        region: input.region || undefined,
        location: input.city || undefined,
        phone: input.phone || undefined,
        languages: input.languages,
        what_i_teach: input.what_i_teach,
        what_i_learn: input.what_i_learn,
      });
    },
  });

  const coverMutation = useMutation({
    mutationFn: async (coverUrl: string) => {
      if (!authUser) return;
      const { error } = await supabase
        .from('profiles')
        .update({ cover_url: coverUrl })
        .eq('id', authUser.id);
      if (error) throw error;
      setLocalUser({ cover_url: coverUrl });
    },
  });

  const markIdPendingMutation = useMutation({
    mutationFn: async () => {
      if (!authUser) return;
      const { error } = await supabase
        .from('profiles')
        .update({ id_card_status: 'pending' })
        .eq('id', authUser.id);
      if (error) throw error;
      setLocalUser({ id_card_status: 'pending' });
    },
  });

  return {
    user: profileQuery.data ?? authUser ?? null,
    loading: profileQuery.isPending,
    setLocalUser,
    saveProfile: async (input: SaveProfileInput) => {
      await saveProfileMutation.mutateAsync(input);
    },
    updateCover: async (coverUrl: string) => {
      await coverMutation.mutateAsync(coverUrl);
    },
    markIdPending: async () => {
      await markIdPendingMutation.mutateAsync();
    },
  };
}
