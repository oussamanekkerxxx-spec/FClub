import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { VoiceRoom } from '@/types/fightclub';
import { useLazyQuery } from '@/hooks/useSupabaseQuery';
import { queryKeys } from '@/lib/queryKeys';
import { Users, Mic2, Mic, MicOff, Clock } from 'lucide-react';
import { format } from 'date-fns';
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

  const { data: rooms, loading, setData: setRooms } = useLazyQuery<VoiceRoom>(
    queryKeys.clubs.rooms(clubId),
    () => supabase
      .from('voice_rooms')
      .select('*, host:profiles!voice_rooms_host_id_fkey(first_name, last_name, avatar_url)')
      .eq('club_id', clubId).neq('status', 'ended').order('created_at', { ascending: false }),
    isMember && !!clubId,
    { errorMessage: 'Failed to load voice rooms' }
  );

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
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="sc-card p-5 animate-pulse flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="sc-card p-10 text-center">
          <Mic2 className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-muted)]" />
          <p className="text-[var(--color-text-secondary)] text-sm">No voice rooms open right now.</p>
        </div>
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
                    onClick={() => toast.info('Voice rooms require WebRTC — coming in Phase 4!')}>
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
          onCreated={(room) => {
            setRooms(prev => [room, ...prev]);
            setShowRoomModal(false);
          }}
        />
      )}
    </div>
  );
}
