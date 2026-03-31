/**
 * StartRoomModal
 *
 * Available to: moderators and admins only.
 * Evaluation: [authenticated] + [moderator | admin] + [any] -> Opens modal -> Room status: 'active' | 'scheduled'
 */
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Mic2, X, Loader2, Users, Clock } from 'lucide-react';

interface Props {
  clubId: string;
  hostId: string;
  onClose: () => void;
  onCreated: (room: any) => void;
}

export default function StartRoomModal({ clubId, hostId, onClose, onCreated }: Props) {
  const [name, setName]                 = useState('');
  const [topic, setTopic]               = useState('');
  const [maxParticipants, setMax]       = useState(20);
  const [mode, setMode]                 = useState<'active' | 'scheduled'>('active');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading]           = useState(false);

  const isValid = name.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;
    setLoading(true);

    let scheduled_at: string | null = null;
    if (mode === 'scheduled' && scheduledDate && scheduledTime) {
      scheduled_at = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    }

    const { data, error } = await supabase
      .from('voice_rooms')
      .insert({
        club_id:          clubId,
        name:             name.trim(),
        topic:            topic.trim() || null,
        host_id:          hostId,
        status:           mode === 'active' ? 'active' : 'scheduled',
        max_participants: maxParticipants,
        participant_count: mode === 'active' ? 1 : 0,
        scheduled_at,
        started_at: mode === 'active' ? new Date().toISOString() : null,
      })
      .select('*, host:profiles!voice_rooms_host_id_fkey(first_name, last_name, avatar_url)')
      .single();

    if (error) {
      toast.error('Could not create room. Please try again.');
    } else {
      toast.success(
        mode === 'active'
          ? `Room "${name}" is now live!`
          : `Room "${name}" scheduled.`
      );
      onCreated(data);
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">

        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: 'var(--color-navy)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <Mic2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-white">Start a Live Room</h2>
              <p className="text-white/50 text-xs mt-0.5">Members will be notified immediately</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Room name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Room Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Weekly Guitar Jam"
              className="input-sc w-full"
              autoFocus
              maxLength={80}
            />
          </div>

          {/* Topic */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Topic <span className="text-[var(--color-text-muted)] font-normal normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="What will you discuss?"
              className="input-sc w-full"
              maxLength={120}
            />
          </div>

          {/* Max participants */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Max Participants
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={2}
                max={50}
                step={1}
                value={maxParticipants}
                onChange={e => setMax(Number(e.target.value))}
                className="flex-1 accent-amber-500"
              />
              <div className="flex items-center gap-1.5 text-sm font-bold text-navy w-14 flex-shrink-0">
                <Users className="w-4 h-4 text-[var(--color-text-muted)]" />
                {maxParticipants}
              </div>
            </div>
          </div>

          {/* Mode: active vs scheduled */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              When
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'active',    label: '🎙 Start Now',     desc: 'Goes live immediately' },
                { value: 'scheduled', label: '📅 Schedule Later', desc: 'Pick a date & time' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMode(opt.value as 'active' | 'scheduled')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    mode === opt.value
                      ? 'border-[var(--color-navy)] bg-[var(--color-navy)]/5'
                      : 'border-[var(--color-border)] hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-sm text-navy">{opt.label}</div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Scheduled date/time pickers */}
          {mode === 'scheduled' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="input-sc w-full"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Time
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className="input-sc w-full"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:border-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || loading}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: mode === 'active' ? 'var(--color-forest)' : 'var(--color-navy)' }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'active' ? (
                <><Mic2 className="w-4 h-4" /> Go Live</>
              ) : (
                <><Clock className="w-4 h-4" /> Schedule</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
