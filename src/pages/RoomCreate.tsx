import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';

export default function RoomCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!user || !roomName.trim()) return;
    setLoading(true);

    // Create a conversation that acts as a "room" — use current user as sole initial participant
    const { data, error } = await supabase
      .from('conversations')
      .insert({ participant_ids: [user.id], room_name: roomName.trim() })
      .select()
      .single();

    setLoading(false);

    if (error || !data) {
      // room_name column might not exist — try without it and pass name in state
      const { data: d2, error: e2 } = await supabase
        .from('conversations')
        .insert({ participant_ids: [user.id] })
        .select()
        .single();
      if (e2 || !d2) { toast.error('Failed to create room'); return; }
      navigate(`/app/room/${d2.id}`, { state: { roomName: roomName.trim() } });
      return;
    }

    navigate(`/app/room/${data.id}`, { state: { roomName: roomName.trim() } });
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="sc-card p-8 space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-navy)] flex items-center justify-center mx-auto">
          <MessageSquare className="w-8 h-8 text-white" />
        </div>

        <div>
          <h1 className="font-heading text-2xl text-navy mb-1">Create a Room</h1>
          <p className="font-body text-sm text-[var(--color-text-secondary)]">
            A simple space to chat and share ideas.
          </p>
        </div>

        <div className="text-left space-y-2">
          <label className="text-sm font-semibold font-body text-navy">Room Name</label>
          <input
            autoFocus
            value={roomName}
            onChange={e => setRoomName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            className="input-sc"
            placeholder="e.g. Jazz Enthusiasts Chat"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !roomName.trim()}
          className="btn-amber w-full disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create Room →'}
        </button>
      </div>
    </div>
  );
}
