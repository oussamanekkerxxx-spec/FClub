import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { reportError } from '@/lib/errors';
import type { VoiceRoom } from '@/types/clubs';

interface UseClubRoomsOptions {
  clubId: string | undefined;
  enabled?: boolean;
}

export function useClubRooms({ clubId, enabled = true }: UseClubRoomsOptions) {
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const refetch = useCallback(async () => {
    if (!clubId || !enabled) {
      setRooms([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('voice_rooms')
        .select('*, host:profiles!voice_rooms_host_id_fkey(first_name, last_name, avatar_url)')
        .eq('club_id', clubId)
        .neq('status', 'ended')
        .order('created_at', { ascending: false });

      if (error) {
        reportError('useClubRooms:load', error);
        setRooms([]);
      } else {
        setRooms((data ?? []) as VoiceRoom[]);
      }
    } catch (err) {
        reportError('useClubRooms:load', err);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [clubId, enabled]);

  useEffect(() => {
    if (!clubId || !enabled) {
      setRooms([]);
      setLoading(false);
      return;
    }

    refetch();

    try {
      const ch = supabase
        .channel(`student-rooms:${clubId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'voice_rooms', filter: `club_id=eq.${clubId}` },
          (payload) => {
            const room = payload.new as VoiceRoom;
            if (room.status !== 'ended') {
              setRooms(prev => {
                if (prev.some(r => r.id === room.id)) return prev;
                return [room, ...prev];
              });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'voice_rooms', filter: `club_id=eq.${clubId}` },
          (payload) => {
            const room = payload.new as VoiceRoom;
            setRooms(prev => {
              if (room.status === 'ended') {
                return prev.filter(r => r.id !== room.id);
              }
              return prev.map(r => (r.id === room.id ? { ...r, ...room } : r));
            });
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            reportError('useClubRooms:realtime', new Error(`Realtime ${status}`), { status });
          }
        });

      channelRef.current = ch;
    } catch (err) {
      reportError('useClubRooms:realtime', err);
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [clubId, enabled, refetch]);

  return { rooms, loading, refetch };
}
