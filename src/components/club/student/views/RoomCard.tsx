import type { VoiceRoom } from '@/types/clubs';


export function RoomCard({ room, onJoin }: { room: VoiceRoom; onJoin: () => void }) {
  const isLive = room.status === 'active';
  const host = room.host as { first_name?: string; last_name?: string; avatar_url?: string | null } | null;

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-2xl p-4.5 hover:border-orange-200 transition-colors">
      <div className="flex items-center gap-2 mb-3.5">
        <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
        <span className="text-[14px] font-bold text-navy flex-1 truncate">
          {room.name || 'Voice Room'}
        </span>
        <span className="text-[11px] text-[var(--color-text-muted)]">
          {isLive ? 'Live' : room.status}
        </span>
      </div>

      {host ? (
        <div className="flex items-center gap-2 mb-3">
          <img
            src={host.avatar_url ?? `https://ui-avatars.com/api/?name=${host.first_name}+${host.last_name}&background=random`}
            className="w-8 h-8 rounded-full object-cover"
            alt=""
          />
          <span className="text-xs text-[var(--color-text-secondary)]">
            {host.first_name} {host.last_name}
          </span>
        </div>
      ) : null}

      <button
        onClick={onJoin}
        className={`w-full py-2.5 rounded-xl text-[12px] font-bold transition-all ${
          isLive
            ? 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
            : 'bg-gray-50 text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-gray-100'
        }`}
      >
        {isLive ? 'Join Voice' : 'Join'}
      </button>
    </div>
  );
}
