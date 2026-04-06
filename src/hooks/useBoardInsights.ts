import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { User } from '@/contexts/AuthContext';
import type { BoardAuthor, BoardLocationPrecision, BoardPost, BoardRelationshipSignals } from '@/types/board';

type BoardPostRow = {
  id: string;
  author_id: string;
  type: BoardPost['type'];
  title: string;
  content: string;
  neighborhood: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  location_precision?: BoardLocationPrecision | null;
  expires_at: string | null;
  created_at: string;
  author: BoardAuthor | BoardAuthor[] | null;
};

type ConversationRow = { id: string; participant_ids: string[] };
type MessageRow = { conversation_id: string };
type BookingRow = { student_id: string | null; teacher_id: string | null; status: string };
type SessionRow = { teacher_id: string; learner_id: string };
type VouchRow = { voucher_id: string; recipient_id: string };
type RelationshipSignalRow = { actor_id: string; target_id: string };

function normalizeAuthor(author: BoardPostRow['author']): BoardAuthor | undefined {
  const base = Array.isArray(author) ? author[0] : author;
  if (!base) return undefined;
  return {
    ...base,
    what_i_teach: base.what_i_teach ?? [],
    what_i_learn: base.what_i_learn ?? [],
    languages: base.languages ?? [],
  };
}

function intersectionCount(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const left = new Set(a.map((v) => v.trim().toLowerCase()).filter(Boolean));
  let count = 0;
  for (const value of b) {
    const normalized = value.trim().toLowerCase();
    if (normalized && left.has(normalized)) count += 1;
  }
  return count;
}

function withDefaultSignals(): BoardRelationshipSignals {
  return {
    sharedSkillCount: 0,
    sharedLanguageCount: 0,
    hasDirectConversation: false,
    messagesExchanged: 0,
    sharedActivityCount: 0,
    trustSignalsCount: 0,
    boardActionSignalsCount: 0,
  };
}

async function fetchBoardPostRows(): Promise<BoardPostRow[]> {
  const now = new Date().toISOString();
  const withGeoSelect =
    'id, author_id, type, title, content, neighborhood, location_lat, location_lng, location_precision, expires_at, created_at, author:profiles!board_posts_author_id_fkey(id, first_name, last_name, avatar_url, trust_tier, what_i_teach, what_i_learn, languages, city, neighborhood)';
  const legacySelect =
    'id, author_id, type, title, content, neighborhood, expires_at, created_at, author:profiles!board_posts_author_id_fkey(id, first_name, last_name, avatar_url, trust_tier, what_i_teach, what_i_learn, languages, city, neighborhood)';

  const withGeo = await supabase
    .from('board_posts')
    .select(withGeoSelect)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false });

  if (!withGeo.error) {
    return (withGeo.data ?? []) as BoardPostRow[];
  }

  const legacy = await supabase
    .from('board_posts')
    .select(legacySelect)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false });

  if (legacy.error) throw new Error(legacy.error.message);
  return (legacy.data ?? []) as BoardPostRow[];
}

function otherParticipant(participants: string[], currentUserId: string): string | null {
  const other = participants.find((id) => id !== currentUserId);
  return other ?? null;
}

async function fetchSignalsForUser(userId: string) {
  const [conversationsRes, bookingsRes, sessionsRes, vouchesRes, relationshipSignalsRes] = await Promise.all([
    supabase.from('conversations').select('id, participant_ids').contains('participant_ids', [userId]),
    supabase
      .from('bookings')
      .select('student_id, teacher_id, status')
      .or(`student_id.eq.${userId},teacher_id.eq.${userId}`),
    supabase
      .from('session_ledger')
      .select('teacher_id, learner_id')
      .or(`teacher_id.eq.${userId},learner_id.eq.${userId}`),
    supabase
      .from('vouches')
      .select('voucher_id, recipient_id')
      .or(`voucher_id.eq.${userId},recipient_id.eq.${userId}`),
    supabase
      .from('relationship_signals')
      .select('actor_id, target_id')
      .or(`actor_id.eq.${userId},target_id.eq.${userId}`),
  ]);

  const conversations = (conversationsRes.data ?? []) as ConversationRow[];
  const conversationIdToOther = new Map<string, string>();
  const userToConversationCount = new Map<string, number>();

  for (const conv of conversations) {
    const other = otherParticipant(conv.participant_ids, userId);
    if (!other) continue;
    conversationIdToOther.set(conv.id, other);
    userToConversationCount.set(other, (userToConversationCount.get(other) ?? 0) + 1);
  }

  let messageRows: MessageRow[] = [];
  if (conversations.length > 0) {
    const messageRes = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', conversations.map((c) => c.id));
    if (!messageRes.error) {
      messageRows = (messageRes.data ?? []) as MessageRow[];
    }
  }

  const userToMessageCount = new Map<string, number>();
  for (const message of messageRows) {
    const other = conversationIdToOther.get(message.conversation_id);
    if (!other) continue;
    userToMessageCount.set(other, (userToMessageCount.get(other) ?? 0) + 1);
  }

  const userToActivityCount = new Map<string, number>();
  const bookings = (bookingsRes.data ?? []) as BookingRow[];
  for (const booking of bookings) {
    if (booking.status === 'cancelled') continue;
    const other = booking.student_id === userId ? booking.teacher_id : booking.student_id;
    if (!other) continue;
    userToActivityCount.set(other, (userToActivityCount.get(other) ?? 0) + 1);
  }

  const sessions = (sessionsRes.data ?? []) as SessionRow[];
  for (const session of sessions) {
    const other = session.teacher_id === userId ? session.learner_id : session.teacher_id;
    userToActivityCount.set(other, (userToActivityCount.get(other) ?? 0) + 1);
  }

  const userToTrustSignalCount = new Map<string, number>();
  const vouches = (vouchesRes.data ?? []) as VouchRow[];
  for (const vouch of vouches) {
    const other = vouch.voucher_id === userId ? vouch.recipient_id : vouch.voucher_id;
    userToTrustSignalCount.set(other, (userToTrustSignalCount.get(other) ?? 0) + 1);
  }

  const userToBoardSignalCount = new Map<string, number>();
  if (!relationshipSignalsRes.error) {
    const rows = (relationshipSignalsRes.data ?? []) as RelationshipSignalRow[];
    for (const row of rows) {
      const other = row.actor_id === userId ? row.target_id : row.actor_id;
      userToBoardSignalCount.set(other, (userToBoardSignalCount.get(other) ?? 0) + 1);
    }
  }

  return {
    userToConversationCount,
    userToMessageCount,
    userToActivityCount,
    userToTrustSignalCount,
    userToBoardSignalCount,
  };
}

function mapRowsToPosts(rows: BoardPostRow[]): BoardPost[] {
  return rows.map((row) => ({
    id: row.id,
    author_id: row.author_id,
    type: row.type,
    title: row.title,
    content: row.content,
    neighborhood: row.neighborhood,
    location_lat: row.location_lat ?? null,
    location_lng: row.location_lng ?? null,
    location_precision: row.location_precision ?? 'unknown',
    expires_at: row.expires_at,
    created_at: row.created_at,
    author: normalizeAuthor(row.author),
    signals: withDefaultSignals(),
  }));
}

function enrichWithSignals(posts: BoardPost[], user: User): BoardPost[] {
  const viewerSkills = [...user.what_i_teach, ...user.what_i_learn];
  const viewerLanguages = user.languages;

  return posts.map((post) => {
    const authorSkills = [...(post.author?.what_i_teach ?? []), ...(post.author?.what_i_learn ?? [])];
    const sharedSkillCount = intersectionCount(viewerSkills, authorSkills);
    const sharedLanguageCount = intersectionCount(viewerLanguages, post.author?.languages ?? []);

    return {
      ...post,
      signals: {
        ...post.signals,
        sharedSkillCount,
        sharedLanguageCount,
      },
    };
  });
}

export function useBoardInsights(user: User | null) {
  const query = useQuery<BoardPost[]>({
    queryKey: ['board', 'insights', user?.id ?? 'guest'],
    queryFn: async () => {
      const rows = await fetchBoardPostRows();
      const posts = mapRowsToPosts(rows);
      if (!user || user.isDemo) return posts;

      const {
        userToConversationCount,
        userToMessageCount,
        userToActivityCount,
        userToTrustSignalCount,
        userToBoardSignalCount,
      } = await fetchSignalsForUser(user.id);

      return enrichWithSignals(posts, user).map((post) => {
        const authorId = post.author_id;
        return {
          ...post,
          signals: {
            ...post.signals,
            hasDirectConversation: (userToConversationCount.get(authorId) ?? 0) > 0,
            messagesExchanged: userToMessageCount.get(authorId) ?? 0,
            sharedActivityCount: userToActivityCount.get(authorId) ?? 0,
            trustSignalsCount: userToTrustSignalCount.get(authorId) ?? 0,
            boardActionSignalsCount: userToBoardSignalCount.get(authorId) ?? 0,
          },
        };
      });
    },
  });

  return useMemo(
    () => ({
      posts: query.data ?? [],
      loading: query.isPending,
      error: query.error ?? null,
      refetch: query.refetch,
    }),
    [query.data, query.isPending, query.error, query.refetch]
  );
}
