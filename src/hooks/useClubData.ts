import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';
import type { Club, ClubMembership, ClubPost, ClubEvent } from '@/types/fightclub';

interface UseClubDataOptions {
  /** Route param — can be either a UUID or a slug */
  id: string | undefined;
  userId: string | undefined;
}

interface UseClubDataResult {
  club: Club | null;
  membership: ClubMembership | null;
  joinRequestPending: boolean;
  pendingRequestCount: number;
  /** Pinned posts for header preview */
  pinnedPosts: ClubPost[];
  /** Upcoming events for sidebar preview */
  upcomingEvents: ClubEvent[];
  loading: boolean;
  /** Optimistically update the club record in the cache */
  setClub: (updater: Club | null | ((prev: Club | null) => Club | null)) => void;
  /** Optimistically update the membership record in the cache */
  setMembership: (updater: ClubMembership | null | ((prev: ClubMembership | null) => ClubMembership | null)) => void;
  /** Flip joinRequestPending flag in the cache */
  setJoinRequestPending: (value: boolean) => void;
  /** Update pending request count in the cache */
  setPendingRequestCount: (updater: number | ((prev: number) => number)) => void;
}

/** Resolves a route param (uuid or slug) to a Club row, or null on miss. */
async function fetchClub(id: string): Promise<Club | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const { data, error } = isUuid
    ? await supabase.from('clubs').select('*').eq('id', id).single()
    : await supabase.from('clubs').select('*').eq('slug', id).single();
  if (error) return null;
  return data as Club;
}

/**
 * Loads club data, the current user's membership, pending join-request count,
 * and header-preview data (pinned posts + upcoming events) via TanStack Query.
 *
 * Each slice is its own query so the cache can be invalidated independently.
 * Setters are wrappers over qc.setQueryData for optimistic updates.
 */
export function useClubData({ id, userId }: UseClubDataOptions): UseClubDataResult {
  const navigate = useNavigate();
  const qc = useQueryClient();

  // ── Core club record ───────────────────────────────────────────────────────

  const clubQuery = useQuery({
    queryKey: id ? queryKeys.clubs.detail(id) : ['club', '__disabled__'],
    queryFn: () => fetchClub(id!),
    enabled: !!id,
    staleTime: 60_000,
  });

  const club = clubQuery.data ?? null;
  const clubId = club?.id;

  // Navigate away when the club is not found (after query settles)
  useEffect(() => {
    if (clubQuery.isFetched && club === null && !clubQuery.isLoading) {
      toast.error('Club not found');
      navigate('/app/discover');
    }
  }, [clubQuery.isFetched, clubQuery.isLoading, club, navigate]);

  // ── Membership ────────────────────────────────────────────────────────────

  const membershipQuery = useQuery({
    queryKey: userId && clubId ? queryKeys.memberships.one(clubId, userId) : ['membership', '__disabled__'],
    queryFn: async () => {
      const { data } = await supabase
        .from('club_memberships')
        .select('*')
        .eq('club_id', clubId!)
        .eq('user_id', userId!)
        .maybeSingle();
      return (data as ClubMembership) ?? null;
    },
    enabled: !!clubId && !!userId,
    staleTime: 30_000,
  });

  const membership = membershipQuery.data ?? null;

  // ── Join-request flag ─────────────────────────────────────────────────────

  const joinRequestQuery = useQuery({
    queryKey: userId && clubId ? queryKeys.memberships.joinRequest(clubId, userId) : ['join-request', '__disabled__'],
    queryFn: async () => {
      const { data } = await supabase
        .from('join_requests')
        .select('id')
        .eq('club_id', clubId!)
        .eq('user_id', userId!)
        .eq('status', 'pending')
        .maybeSingle();
      return !!data;
    },
    enabled: !!clubId && !!userId,
    staleTime: 30_000,
  });

  const joinRequestPending = joinRequestQuery.data ?? false;

  // ── Pending request count (mods/admins only) ──────────────────────────────

  const isMod = membership?.role === 'moderator' || membership?.role === 'admin';

  const pendingCountQuery = useQuery({
    queryKey: clubId ? queryKeys.clubs.pendingCount(clubId) : ['pending-count', '__disabled__'],
    queryFn: async () => {
      const { count: joinCount, error: joinError } = await supabase
        .from('join_requests')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId!)
        .eq('status', 'pending');
      if (joinError) throw joinError;

      const { count: unifiedCount, error: unifiedError } = await supabase
        .from('club_requests')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId!)
        .eq('status', 'pending');

      if (unifiedError && unifiedError.code !== '42P01') throw unifiedError;
      const safeUnifiedCount = unifiedError?.code === '42P01' ? 0 : (unifiedCount ?? 0);

      const { data: pendingProjectApps, error: projectError } = await supabase
        .from('project_applications')
        .select('id, project:club_projects!project_applications_project_id_fkey(club_id)')
        .eq('status', 'pending');

      const safeProjectCount = projectError
        ? 0
        : (pendingProjectApps ?? []).filter((row: any) => {
            const project = Array.isArray(row.project) ? row.project[0] : row.project;
            return project?.club_id === clubId;
          }).length;

      return (joinCount ?? 0) + safeUnifiedCount + safeProjectCount;
    },
    enabled: !!clubId && isMod,
    staleTime: 30_000,
  });

  const pendingRequestCount = pendingCountQuery.data ?? 0;

  // ── Pinned posts ──────────────────────────────────────────────────────────

  const pinnedPostsQuery = useQuery({
    queryKey: clubId ? queryKeys.clubs.pinnedPosts(clubId) : ['pinned-posts', '__disabled__'],
    queryFn: async () => {
      const { data } = await supabase
        .from('club_posts')
        .select('id, content, is_pinned, created_at')
        .eq('club_id', clubId!)
        .eq('is_pinned', true)
        .limit(3);
      return (data ?? []) as ClubPost[];
    },
    enabled: !!clubId,
    staleTime: 60_000,
  });

  const pinnedPosts = pinnedPostsQuery.data ?? [];

  // ── Upcoming events ───────────────────────────────────────────────────────

  const upcomingEventsQuery = useQuery({
    queryKey: clubId ? queryKeys.clubs.upcomingEvents(clubId) : ['upcoming-events', '__disabled__'],
    queryFn: async () => {
      const { data } = await supabase
        .from('club_events')
        .select('id, title, starts_at')
        .eq('club_id', clubId!)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at')
        .limit(3);
      return (data ?? []) as ClubEvent[];
    },
    enabled: !!clubId,
    staleTime: 60_000,
  });

  const upcomingEvents = upcomingEventsQuery.data ?? [];

  // ── Aggregate loading state ───────────────────────────────────────────────

  const loading =
    clubQuery.isLoading ||
    (!!userId && membershipQuery.isLoading) ||
    (!!userId && joinRequestQuery.isLoading);

  // ── Cache setters (optimistic update API) ─────────────────────────────────

  function setClub(updater: Club | null | ((prev: Club | null) => Club | null)) {
    if (!id) return;
    qc.setQueryData<Club | null>(queryKeys.clubs.detail(id), (prev) => {
      const current = prev ?? null;
      return typeof updater === 'function' ? updater(current) : updater;
    });
  }

  function setMembership(updater: ClubMembership | null | ((prev: ClubMembership | null) => ClubMembership | null)) {
    if (!clubId || !userId) return;
    qc.setQueryData<ClubMembership | null>(queryKeys.memberships.one(clubId, userId), (prev) => {
      const current = prev ?? null;
      return typeof updater === 'function' ? updater(current) : updater;
    });
  }

  function setJoinRequestPending(value: boolean) {
    if (!clubId || !userId) return;
    qc.setQueryData<boolean>(queryKeys.memberships.joinRequest(clubId, userId), value);
  }

  function setPendingRequestCount(updater: number | ((prev: number) => number)) {
    if (!clubId) return;
    qc.setQueryData<number>(queryKeys.clubs.pendingCount(clubId), (prev) => {
      const current = prev ?? 0;
      return typeof updater === 'function' ? updater(current) : updater;
    });
  }

  return {
    club, membership, joinRequestPending, pendingRequestCount,
    pinnedPosts, upcomingEvents, loading,
    setClub, setMembership, setJoinRequestPending, setPendingRequestCount,
  };
}
