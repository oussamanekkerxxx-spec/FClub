import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';
import { useRef } from 'react';
import { DatabaseError } from '@/lib/errors';

type SupabaseError = { message?: string; code?: string; details?: string } | null;

interface QueryOptions<TRaw, TResult> {
  /** Skip execution entirely when false. */
  enabled?: boolean;
  /** Map each raw row to the desired shape before storing. */
  transform?: (raw: TRaw) => TResult;
  /**
   * Toast message shown on error. Pass false to suppress.
   * Handled globally via QueryCache.onError in main.tsx.
   */
  errorMessage?: string | false;
  /** How long (ms) data is considered fresh. Default: 5 min. */
  staleTime?: number;
  /** How long (ms) unused cache entries are kept. Default: 10 min. */
  gcTime?: number;
}

interface QueryResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

const DEFAULT_STALE = 5 * 60 * 1000;
const DEFAULT_GC    = 10 * 60 * 1000;

/**
 * Generic hook for Supabase list queries backed by TanStack Query.
 * Provides caching, stale-while-revalidate, deduplication, and GC.
 *
 * Usage (simple):
 *   const { data: clubs, loading, error, refetch } = useSupabaseQuery<Club>(
 *     ['clubs'],
 *     () => supabase.from('clubs').select('*'),
 *   );
 *
 * Usage (conditional, with transform):
 *   const { data: skills } = useSupabaseQuery<RawRow, Skill>(
 *     ['skills', 'teacher', userId],
 *     () => supabase.from('skills').select('*, profiles(...)').eq('teacher_id', userId),
 *     { enabled: !!userId, transform: mapRowToSkill }
 *   );
 */
export function useSupabaseQuery<TRaw, TResult = TRaw>(
  key: QueryKey,
  queryFn: () => PromiseLike<{ data: TRaw[] | null; error: SupabaseError }>,
  options: QueryOptions<TRaw, TResult> = {}
): QueryResult<TResult> {
  const {
    enabled = true,
    transform,
    errorMessage,
    staleTime = DEFAULT_STALE,
    gcTime = DEFAULT_GC,
  } = options;

  const { data, isPending, error, refetch } = useQuery<TResult[]>({
    queryKey: key as QueryKey,
    queryFn: async () => {
      const { data: result, error: queryError } = await queryFn();
      if (queryError) throw new DatabaseError(queryError);
      const rows = result ?? [];
      return transform ? rows.map(transform) : (rows as unknown as TResult[]);
    },
    enabled,
    staleTime,
    gcTime,
    meta: { errorMessage },
  });

  return {
    data: data ?? [],
    loading: isPending && enabled,
    error: error as Error | null,
    refetch: () => { refetch(); },
  };
}

/**
 * Like useSupabaseQuery but fires only once per key change.
 * Designed for lazy-loaded tab content: loads when `active` first becomes
 * true, does NOT re-fetch when the user switches tabs back and forth.
 *
 * - `setData` is exposed so callers can apply optimistic updates.
 * - Cache invalidated automatically when the key changes (e.g. club.id changes).
 *
 * Usage:
 *   const { data: members, loading, setData: setMembers } = useLazyQuery<ClubMembership>(
 *     ['club', clubId, 'members'],
 *     () => supabase.from('club_memberships').select('*').eq('club_id', clubId),
 *     activeTab === 'members',
 *   );
 */
export function useLazyQuery<TRaw, TResult = TRaw>(
  key: QueryKey,
  queryFn: () => PromiseLike<{ data: TRaw[] | null; error: SupabaseError }>,
  active: boolean,
  options: Pick<QueryOptions<TRaw, TResult>, 'transform' | 'errorMessage'> = {}
): QueryResult<TResult> & { setData: (updater: TResult[] | ((prev: TResult[]) => TResult[])) => void } {
  const qc = useQueryClient();
  // Use a ref so setData closure always sees the latest key without being
  // listed in useCallback deps (avoids stale-closure bugs with array keys).
  const keyRef = useRef(key);
  keyRef.current = key;

  const result = useSupabaseQuery<TRaw, TResult>(key, queryFn, {
    ...options,
    enabled: active,
    staleTime: Infinity, // load once; never background-refetch on tab switch
    gcTime: DEFAULT_GC,
  });

  const setData = (updater: TResult[] | ((prev: TResult[]) => TResult[])) => {
    qc.setQueryData<TResult[]>(keyRef.current as QueryKey, (prev) => {
      const current = prev ?? [];
      return typeof updater === 'function' ? updater(current) : updater;
    });
  };

  return { ...result, setData };
}

/**
 * Generic hook for a single-row Supabase query, backed by TanStack Query.
 */
export function useSupabaseSingle<T>(
  key: QueryKey,
  queryFn: () => PromiseLike<{ data: T | null; error: SupabaseError }>,
  options: Pick<QueryOptions<unknown, unknown>, 'enabled' | 'errorMessage' | 'staleTime' | 'gcTime'> = {}
): { data: T | null; loading: boolean; error: Error | null; refetch: () => void } {
  const {
    enabled = true,
    errorMessage,
    staleTime = DEFAULT_STALE,
    gcTime = DEFAULT_GC,
  } = options;

  const { data, isPending, error, refetch } = useQuery<T | null>({
    queryKey: key as QueryKey,
    queryFn: async () => {
      const { data: result, error: queryError } = await queryFn();
      if (queryError) throw new DatabaseError(queryError);
      return result;
    },
    enabled,
    staleTime,
    gcTime,
    meta: { errorMessage },
  });

  return {
    data: data ?? null,
    loading: isPending && enabled,
    error: error as Error | null,
    refetch: () => { refetch(); },
  };
}
