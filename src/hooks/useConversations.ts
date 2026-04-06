import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Conversation } from '@/types/messaging';

export type { Conversation };

interface UseConversationsResult {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  loading: boolean;
  error: string | null;
}

export function useConversations(userId: string | undefined, isDemo: boolean): UseConversationsResult {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(!isDemo && !!userId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || isDemo) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: convs, error: convError } = await supabase
          .from('conversations')
          .select('id, skill_id, participant_ids, updated_at')
          .contains('participant_ids', [userId])
          .order('updated_at', { ascending: false });

        if (cancelled) return;
        if (convError) throw new Error(convError.message);
        if (!convs || convs.length === 0) { setLoading(false); return; }

        const otherIds = convs.map(c =>
          c.participant_ids.find((pid: string) => pid !== userId) || c.participant_ids[0]
        );
        const skillIds = convs.filter(c => c.skill_id).map(c => c.skill_id);

        const [profilesRes, skillsRes, messagesRes] = await Promise.all([
          supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', otherIds),
          skillIds.length > 0
            ? supabase.from('skills').select('id, title').in('id', skillIds)
            : Promise.resolve({ data: [] as { id: string; title: string }[] }),
          supabase
            .from('messages')
            .select('conversation_id, content, created_at')
            .in('conversation_id', convs.map(c => c.id))
            .order('created_at', { ascending: false }),
        ]);

        if (cancelled) return;

        const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
        const skillMap = new Map((skillsRes.data || []).map(s => [s.id, s]));
        const latestMsgMap = new Map<string, { content: string; created_at: string }>();
        (messagesRes.data || []).forEach(m => {
          if (!latestMsgMap.has(m.conversation_id)) latestMsgMap.set(m.conversation_id, m);
        });

        const mapped: Conversation[] = convs.map(c => {
          const otherId = c.participant_ids.find((pid: string) => pid !== userId) || c.participant_ids[0];
          const profile = profileMap.get(otherId);
          const skill = c.skill_id ? skillMap.get(c.skill_id) : null;
          const latestMsg = latestMsgMap.get(c.id);
          return {
            id: c.id,
            skill_id: c.skill_id,
            participant_ids: c.participant_ids,
            updated_at: c.updated_at,
            skill_title: skill?.title,
            other_user: {
              id: otherId,
              firstName: profile?.first_name || 'Unknown',
              lastName: profile?.last_name || '',
              avatar: profile?.avatar_url || '',
            },
            last_message: latestMsg?.content,
            last_message_at: latestMsg?.created_at || c.updated_at,
            unread_count: 0,
          };
        });

        setConversations(mapped);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load messages';
          setError(message);
          toast.error('Failed to load conversations');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [userId, isDemo]);

  return { conversations, setConversations, loading, error };
}
