import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { VoiceRoom } from '@/types/fightclub';
import { Users, Mic2, Mic, MicOff, Clock } from 'lucide-react';
import { format } from 'date-fns';
import EmptyState from './EmptyState';
import SkeletonCard from './SkeletonCard';
import StartRoomModal from '@/components/club/StartRoomModal';
import RequestRoundButton from '@/components/club/RequestRoundButton';
import MemberGate from './MemberGate';

interface RoomsTabProps {
  clubId: string;
  isMember: boolean;
  isPrivate: boolean;
  canStartRoom: boolean;
  canRequestRoom: boolean;
  userId: string | undefined;
  onRequestRoom: (clubId: string, hint?: string) => Promise<void>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active:    { label: 'Live',      color: 'var(--color-forest)', bg: '#DCFCE7', dot: 'bg-green-500 animate-pulse' },
  waiting:   { label: 'Waiting',   color: 'var(--color-amber)',  bg: '#FFF3E0', dot: 'bg-amber-400' },
  scheduled: { label: 'Scheduled', color: 'var(--color-plum)',   bg: '#F3E8FF', dot: 'bg-purple-400' },
  ended:     { label: 'Ended',     color: '#9CA3AF',             bg: '#F3F4F6', dot: 'bg-gray-300' },
};

export default function RoomsTab({
  clubId, isMember, isPrivate, canStartRoom, canRequestRoom, userId, onRequestRoom,
}: RoomsTabProps) {
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!isMember || !clubId) return;

    const loadRooms = async () => {
      const { data } = await supabase
        .from('voice_rooms')
        .select('*, host:profiles!voice_rooms_host_id_fkey(first_name, last_name, avatar_url)')
        .eq('club_id', clubId).neq('status', 'ended')
        .order('created_at', { ascending: false });
      setRooms((data ?? []) as VoiceRoom[]);
      setLoading(false);
    };
    loadRooms();

    const ch = supabase
      .channel(`rooms:${clubId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'voice_rooms',
        filter: `club_id=eq.${clubId}`,
      }, (payload) => {
        const room = payload.new as VoiceRoom;
        if (room.status === 'ended') return;
        setRooms(prev => {
          if (prev.some(r => r.id === room.id)) return prev;
          return [room, ...prev];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'voice_rooms',
        filter: `club_id=eq.${clubId}`,
      }, (payload) => {
        const room = payload.new as VoiceRoom;
        setRooms(prev => {
          if (room.status === 'ended') {
            const next = prev.filter(r => r.id !== room.id);
            return next;
          }
          return prev.map(r => r.id === room.id ? { ...r, ...room } : r);
        });
      });
    ch.subscribe();
    channelRef.current = ch;

    return () => { supabase.removeChannel(ch); };
  }, [isMember, clubId]);

  const handleCreated = (room: VoiceRoom) => {
    setRooms(prev => {
      if (prev.some(r => r.id === room.id)) return prev;
      return [room, ...prev];
    });
    setShowRoomModal(false);
  };

  if (!isMember) return <MemberGate isPrivate={isPrivate} />;

  return (
    <div className="space-y-3">
      {canStartRoom && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowRoomModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ background: 'var(--color-forest)' }}>
            <Mic2 className="w-4 h-4" /> Start a Room
          </button>
        </div>
      )}
      {canRequestRoom && <RequestRoundButton clubId={clubId} onRequest={onRequestRoom} />}

      {loading ? (
        <SkeletonCard />
      ) : rooms.length === 0 ? (
        <EmptyState icon={<Mic2 className="w-6 h-6 text-[var(--color-text-muted)]" />} title="No voice rooms open" subtitle="Start one to bring members together." />
      ) : (
        rooms.map(room => {
          const cfg = STATUS_CONFIG[room.status] ?? STATUS_CONFIG.ended;
          return (
            <div key={room.id} className="sc-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                  {room.status === 'active'
                    ? <Mic className="w-5 h-5" style={{ color: cfg.color }} />
                    : <MicOff className="w-5 h-5" style={{ color: cfg.color }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-navy">{room.name}</h3>
                    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: cfg.color }}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>
                  {room.topic && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{room.topic}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {room.participant_count}/{room.max_participants}
                    </span>
                    {room.host && <span>Host: {room.host.first_name} {room.host.last_name}</span>}
                    {room.scheduled_at && room.status === 'scheduled' && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {format(new Date(room.scheduled_at), 'MMM d, HH:mm')}
                      </span>
                    )}
                  </div>
                </div>
                {isMember && room.status === 'active' && (
                  <button
                    className="text-sm font-semibold px-4 py-1.5 rounded-xl text-white flex-shrink-0 transition-all hover:scale-105"
                    style={{ background: 'var(--color-forest)' }}
                    onClick={() => navigate(`/app/voice-room/${room.id}`)}>
                    Join
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      {showRoomModal && userId && (
        <StartRoomModal
          clubId={clubId}
          hostId={userId}
          onClose={() => setShowRoomModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}