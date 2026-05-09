import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClubRooms } from '@/hooks/useClubRooms';
import { Mic2 } from 'lucide-react';
import EmptyState from '@/components/club/EmptyState';
import SkeletonCard from '@/components/club/SkeletonCard';
import type { VoiceRoom } from '@/types/clubs';
import StartRoomModal from '@/components/club/StartRoomModal';
import { RoomCard } from './RoomCard';


export function VoiceRoomsView({
  clubId,
  isMember,
  userId,
}: {
  clubId: string;
  isMember: boolean;
  userId?: string;
}) {
  const navigate = useNavigate();
  const { rooms, loading } = useClubRooms({ clubId, enabled: isMember });
  const [showRoomModal, setShowRoomModal] = useState(false);

  const handleCreated = (room: VoiceRoom) => {
    setShowRoomModal(false);
    navigate(`/app/voice-room/${room.id}`);
  };

  if (!isMember) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Mic2 className="w-6 h-6 text-[var(--color-text-muted)]" />}
          title="Join the club to use voice rooms"
          subtitle="Voice study sessions and live room discussions are available to members."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonCard count={3} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-navy">Voice Rooms</h2>
        {userId ? (
          <button
            onClick={() => setShowRoomModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--color-forest)] text-white hover:opacity-90 transition-opacity"
          >
            <Mic2 className="w-4 h-4" /> Start Room
          </button>
        ) : null}
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={<Mic2 className="w-6 h-6 text-[var(--color-text-muted)]" />}
          title="No voice rooms open"
          subtitle="Start one to bring members together."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onJoin={() => navigate(`/app/voice-room/${room.id}`)} />
          ))}
        </div>
      )}

      {showRoomModal && userId ? (
        <StartRoomModal
          clubId={clubId}
          hostId={userId}
          onClose={() => setShowRoomModal(false)}
          onCreated={handleCreated}
        />
      ) : null}
    </div>
  );
}
