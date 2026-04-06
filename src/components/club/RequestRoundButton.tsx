/**
 * RequestRoundButton
 *
 * Available to: active members who cannot start rooms (non-mod/admin).
 * Evaluation: [authenticated] + [member] + [no active room] -> Notifies Moderators -> Tooltip confirmation
 */
import { useState, useRef, useEffect } from 'react';
import { Loader2, Check } from 'lucide-react';

interface Props {
  clubId: string;
  onRequest: (clubId: string, hint?: string) => Promise<void>;
}

type State = 'idle' | 'loading' | 'sent';

export default function RequestRoundButton({ clubId, onRequest }: Props) {
  const [state, setState] = useState<State>('idle');
  const [showInput, setShowInput] = useState(false);
  const [hint, setHint]           = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when shown
  useEffect(() => {
    if (showInput) inputRef.current?.focus();
  }, [showInput]);

  // Auto-reset "sent" state after 4s
  useEffect(() => {
    if (state !== 'sent') return;
    const t = setTimeout(() => setState('idle'), 4000);
    return () => clearTimeout(t);
  }, [state]);

  const handleSend = async () => {
    setState('loading');
    await onRequest(clubId, hint.trim() || undefined);
    setHint('');
    setShowInput(false);
    setState('sent');
  };

  if (state === 'sent') {
    return (
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold animate-fade-in"
        style={{ background: '#DCFCE7', color: 'var(--color-forest)' }}
      >
        <Check className="w-4 h-4" />
        Request sent to moderators!
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {!showInput ? (
        <button
          onClick={() => setShowInput(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 text-navy transition-all hover:scale-105"
          style={{ borderColor: 'var(--color-amber)', background: '#FFF8EE' }}
        >
          <span className="text-base">🙋</span>
          Request a Live Room
        </button>
      ) : (
        <div className="flex items-center gap-2 w-full max-w-sm animate-fade-in">
          <input
            ref={inputRef}
            type="text"
            value={hint}
            onChange={e => setHint(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); if (e.key === 'Escape') setShowInput(false); }}
            placeholder="What's the topic? (optional)"
            className="input-sc flex-1 text-sm"
            maxLength={80}
          />
          <button
            onClick={handleSend}
            disabled={state === 'loading'}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-navy flex-shrink-0 disabled:opacity-60"
            style={{ background: 'var(--color-amber)' }}
          >
            {state === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
          </button>
          <button
            onClick={() => { setShowInput(false); setHint(''); }}
            className="text-[var(--color-text-muted)] hover:text-navy transition-colors text-sm"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
