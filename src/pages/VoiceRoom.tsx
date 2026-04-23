import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getLiveKitCredentials } from '@/lib/livekit';
import { toast } from 'sonner';
import {
  Room,
  RoomEvent,
  Track,
  type Participant,
  type RemoteTrack,
} from 'livekit-client';
import type { VoiceRoom } from '@/types/fightclub';
import { ArrowLeft, Loader2, Mic, MicOff, PhoneOff, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface VoiceParticipant {
  identity: string;
  name: string;
  avatarUrl: string | null;
  isHost: boolean;
  isLocal: boolean;
  isSpeaking: boolean;
}

function normalizeParticipantName(participant: Participant): string {
  return (participant.name || participant.identity || 'Member').trim();
}

export default function VoiceRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [roomMeta, setRoomMeta] = useState<VoiceRoom | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [micEnabled, setMicEnabled] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [ending, setEnding] = useState(false);

  const liveRoomRef = useRef<Room | null>(null);
  const audioElsRef = useRef<Map<string, HTMLMediaElement>>(new Map());
  const speakingRef = useRef<Set<string>>(new Set());

  const isHost = !!user && !!roomMeta?.host_id && roomMeta.host_id === user.id;
  const canJoin = roomMeta?.status === 'active';
  const roomTitle = roomMeta?.name || 'Voice room';

  const cleanupAudioElements = useCallback(() => {
    audioElsRef.current.forEach((el) => {
      try {
        el.pause();
      } catch {
        // no-op
      }
      el.remove();
    });
    audioElsRef.current.clear();
  }, []);

  const syncParticipants = useCallback(() => {
    const liveRoom = liveRoomRef.current;
    if (!liveRoom || !roomMeta) {
      setParticipants([]);
      return;
    }

    const next: VoiceParticipant[] = [];

    next.push({
      identity: liveRoom.localParticipant.identity,
      name: normalizeParticipantName(liveRoom.localParticipant),
      avatarUrl: user?.avatar || null,
      isHost: !!roomMeta.host_id && liveRoom.localParticipant.identity === roomMeta.host_id,
      isLocal: true,
      isSpeaking: speakingRef.current.has(liveRoom.localParticipant.identity),
    });

    for (const remote of liveRoom.remoteParticipants.values()) {
      next.push({
        identity: remote.identity,
        name: normalizeParticipantName(remote),
        avatarUrl: null,
        isHost: !!roomMeta.host_id && remote.identity === roomMeta.host_id,
        isLocal: false,
        isSpeaking: speakingRef.current.has(remote.identity),
      });
    }

    next.sort((a, b) => {
      if (a.isHost !== b.isHost) return a.isHost ? -1 : 1;
      if (a.isLocal !== b.isLocal) return a.isLocal ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    setParticipants(next);
  }, [roomMeta, user?.avatar]);

  const detachAudioTrack = useCallback((trackSid: string) => {
    const existing = audioElsRef.current.get(trackSid);
    if (!existing) return;
    try {
      existing.pause();
    } catch {
      // no-op
    }
    existing.remove();
    audioElsRef.current.delete(trackSid);
  }, []);

  const attachAudioTrack = useCallback((track: RemoteTrack) => {
    if (!track.sid) return;
    const existing = audioElsRef.current.get(track.sid);
    if (existing) return;
    const el = track.attach();
    el.autoplay = true;
    el.style.display = 'none';
    document.body.appendChild(el);
    audioElsRef.current.set(track.sid, el);
  }, []);

  const disconnectRoom = useCallback(() => {
    const liveRoom = liveRoomRef.current;
    if (liveRoom) {
      liveRoom.disconnect();
      liveRoomRef.current = null;
    }
    cleanupAudioElements();
    setConnected(false);
    setConnecting(false);
    setMicEnabled(false);
    speakingRef.current = new Set();
    setParticipants([]);
  }, [cleanupAudioElements]);

  useEffect(() => {
    if (!id) return;
    let active = true;

    const loadRoom = async () => {
      setLoadingMeta(true);
      const { data, error } = await supabase
        .from('voice_rooms')
        .select('*, host:profiles!voice_rooms_host_id_fkey(first_name, last_name, avatar_url)')
        .eq('id', id)
        .maybeSingle();

      if (!active) return;

      if (error || !data) {
        toast.error('Voice room not found');
        navigate(-1);
        return;
      }

      setRoomMeta(data as VoiceRoom);
      setLoadingMeta(false);
    };

    void loadRoom();
    return () => {
      active = false;
      disconnectRoom();
    };
  }, [disconnectRoom, id, navigate]);

  const joinRoom = useCallback(async () => {
    if (!id || !user || !roomMeta || !canJoin || connecting || connected) return;
    setConnecting(true);

    try {
      const displayName = `${user.firstName} ${user.lastName}`.trim() || user.email;
      const { token, wsUrl } = await getLiveKitCredentials({
        roomId: id,
        displayName,
      });

      const liveRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      liveRoom.on(RoomEvent.ParticipantConnected, () => syncParticipants());
      liveRoom.on(RoomEvent.ParticipantDisconnected, () => syncParticipants());
      liveRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
        speakingRef.current = new Set(speakers.map((s) => s.identity));
        syncParticipants();
      });
      liveRoom.on(
        RoomEvent.TrackSubscribed,
        (track: RemoteTrack) => {
          if (track.kind === Track.Kind.Audio) attachAudioTrack(track);
        }
      );
      liveRoom.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio && track.sid) detachAudioTrack(track.sid);
      });
      liveRoom.on(RoomEvent.Disconnected, () => {
        cleanupAudioElements();
        setConnected(false);
        setMicEnabled(false);
        speakingRef.current = new Set();
        setParticipants([]);
      });

      await liveRoom.connect(wsUrl, token);
      liveRoomRef.current = liveRoom;
      await liveRoom.localParticipant.setMicrophoneEnabled(true);
      setMicEnabled(true);
      setConnected(true);
      syncParticipants();
      toast.success('Connected to voice room');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join voice room';
      toast.error(message);
      disconnectRoom();
    } finally {
      setConnecting(false);
    }
  }, [
    attachAudioTrack,
    canJoin,
    cleanupAudioElements,
    connected,
    connecting,
    detachAudioTrack,
    disconnectRoom,
    id,
    roomMeta,
    syncParticipants,
    user,
  ]);

  const toggleMic = useCallback(async () => {
    const liveRoom = liveRoomRef.current;
    if (!liveRoom || !connected) return;
    try {
      const next = !micEnabled;
      await liveRoom.localParticipant.setMicrophoneEnabled(next);
      setMicEnabled(next);
    } catch {
      toast.error('Could not update microphone state');
    }
  }, [connected, micEnabled]);

  const leaveRoom = useCallback(() => {
    disconnectRoom();
    toast('You left the voice room');
  }, [disconnectRoom]);

  const endRoom = useCallback(async () => {
    if (!id || !isHost) return;
    setEnding(true);
    try {
      const { error } = await supabase
        .from('voice_rooms')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          participant_count: 0,
        })
        .eq('id', id);

      if (error) throw error;
      leaveRoom();
      toast.success('Room ended');
      navigate(-1);
    } catch {
      toast.error('Could not end room');
    } finally {
      setEnding(false);
    }
  }, [id, isHost, leaveRoom, navigate]);

  const subtitle = useMemo(() => {
    if (!roomMeta) return '';
    if (roomMeta.status === 'active') return 'Live audio room';
    if (roomMeta.status === 'scheduled') return 'Scheduled voice room';
    if (roomMeta.status === 'waiting') return 'Waiting for host to start';
    return 'Room ended';
  }, [roomMeta]);

  if (loadingMeta) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-7 h-7 animate-spin text-[var(--color-amber)]" />
      </div>
    );
  }

  if (!roomMeta) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-navy"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="sc-card p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl text-navy">{roomTitle}</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{subtitle}</p>
            {roomMeta.topic && (
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">{roomMeta.topic}</p>
            )}
          </div>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: roomMeta.status === 'active' ? '#DCFCE7' : '#F3F4F6',
              color: roomMeta.status === 'active' ? 'var(--color-forest)' : 'var(--color-text-muted)',
            }}
          >
            {roomMeta.status.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <Users className="w-4 h-4" />
          {connected ? participants.length : roomMeta.participant_count} participant{(connected ? participants.length : roomMeta.participant_count) !== 1 ? 's' : ''}
        </div>

        <div className="flex flex-wrap gap-2">
          {!connected ? (
            <button
              onClick={joinRoom}
              disabled={!canJoin || connecting}
              className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
              style={{ background: 'var(--color-forest)' }}
            >
              {connecting ? 'Joining...' : 'Join voice room'}
            </button>
          ) : (
            <>
              <button
                onClick={toggleMic}
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-1.5"
                style={{ background: micEnabled ? 'var(--color-navy)' : '#B91C1C' }}
              >
                {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                {micEnabled ? 'Mute mic' : 'Unmute mic'}
              </button>
              <button
                onClick={leaveRoom}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--color-border)] text-[var(--color-text-secondary)] inline-flex items-center gap-1.5"
              >
                <PhoneOff className="w-4 h-4" />
                Leave
              </button>
            </>
          )}

          {isHost && roomMeta.status !== 'ended' && (
            <button
              onClick={endRoom}
              disabled={ending}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-600 disabled:opacity-50"
            >
              {ending ? 'Ending...' : 'End room'}
            </button>
          )}
        </div>

        {!canJoin && (
          <div className="rounded-xl border border-[var(--color-border)] p-3 text-sm text-[var(--color-text-secondary)] bg-parchment">
            This room is not live yet. Join is available only when the host starts the room.
          </div>
        )}

        {connected && (
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-navy">In this room</h2>
            <div className="space-y-2">
              {participants.map((p) => (
                <div key={p.identity} className="flex items-center justify-between p-2 rounded-xl border border-[var(--color-border)] bg-white">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={p.avatarUrl ?? undefined} />
                      <AvatarFallback style={{ background: 'var(--color-navy)', color: 'white', fontSize: '11px' }}>
                        {p.name[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-navy truncate">
                        {p.name}
                        {p.isLocal ? ' (you)' : ''}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-muted)]">
                        {p.isHost ? 'Host' : 'Participant'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold">
                    {p.isSpeaking ? (
                      <span className="text-[var(--color-forest)]">Speaking</span>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">Listening</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
