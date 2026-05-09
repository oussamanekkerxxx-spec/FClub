import { useEffect, useState } from 'react';



export function PomodoroView() {
  const FOCUS_SECS = 25 * 60;
  const BREAK_SECS =  5 * 60;
  const [secs,       setSecs]      = useState(FOCUS_SECS);
  const [running,    setRunning]   = useState(false);
  const [mode,       setMode]      = useState<'focus' | 'break'>('focus');
  const [sessionNum, setSessionNum]= useState(1);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          clearInterval(id);
          setRunning(false);
          if (mode === 'focus') { setMode('break'); setSecs(BREAK_SECS); setSessionNum(n => n + 1); }
          else                  { setMode('focus'); setSecs(FOCUS_SECS); }
          return s;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, mode]);

  const total  = mode === 'focus' ? FOCUS_SECS : BREAK_SECS;
  const pct    = ((total - secs) / total) * 100;
  const radius = 80;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  const mm     = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss     = String(secs % 60).padStart(2, '0');

  const reset = () => { setRunning(false); setSecs(total); };
  const skip  = () => {
    setRunning(false);
    if (mode === 'focus') { setMode('break'); setSecs(BREAK_SECS); }
    else                  { setMode('focus'); setSecs(FOCUS_SECS); }
  };

  return (
    <div className="p-6 flex flex-col items-center">
      {/* Ring */}
      <div className="relative flex items-center justify-center mb-8">
        <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id="pomoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10" />
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={mode === 'focus' ? 'url(#pomoGrad)' : '#22c55e'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.95s linear, stroke 0.4s' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-[48px] font-black text-navy leading-none tabular-nums">{mm}:{ss}</span>
          <span className={`text-[11px] font-bold uppercase tracking-wider mt-1.5 ${
            mode === 'focus' ? 'text-[var(--color-amber)]' : 'text-green-500'
          }`}>
            {mode === 'focus' ? 'Focus Session' : '☕ Break Time'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-5">
        <button onClick={reset} className="px-5 py-2.5 bg-white border border-[var(--color-border)] text-navy text-[12px] font-semibold rounded-xl hover:bg-gray-50 transition-colors">Reset</button>
        <button
          onClick={() => setRunning(r => !r)}
          className={`px-8 py-2.5 text-white text-[12px] font-bold rounded-xl shadow-md hover:shadow-lg transition-all ${
            running
              ? 'bg-gray-700 hover:bg-gray-800'
              : 'bg-gradient-to-r from-[var(--color-amber)] to-orange-500'
          }`}
        >{running ? '⏸ Pause' : '▶ Start'}</button>
        <button onClick={skip} className="px-5 py-2.5 bg-white border border-[var(--color-border)] text-navy text-[12px] font-semibold rounded-xl hover:bg-gray-50 transition-colors">Skip</button>
      </div>

      <div className="text-[12px] text-[var(--color-text-muted)] mb-6 text-center">
        Session {sessionNum} of 4 · 25 min focus / 5 min break
      </div>

      {/* Session dots */}
      <div className="flex gap-2 mb-6">
        {[1,2,3,4].map(n => (
          <div key={n} className={`w-2.5 h-2.5 rounded-full transition-colors ${
            n < sessionNum ? 'bg-[var(--color-amber)]' : n === sessionNum ? 'bg-orange-300 ring-2 ring-orange-300/40' : 'bg-gray-200'
          }`} />
        ))}
      </div>

      {/* Co-study buddies */}
      <div className="flex items-center gap-3 p-4 bg-white border border-[var(--color-border)] rounded-2xl shadow-sm w-full max-w-xs">
        <div className="flex">
          {[5, 22].map((u, i) => (
            <img key={i} src={`https://i.pravatar.cc/40?img=${u}`}
              className="w-8 h-8 rounded-full border-2 border-white object-cover"
              style={{ marginLeft: i === 0 ? 0 : '-6px' }} alt="" />
          ))}
        </div>
        <span className="text-[12px] text-[var(--color-text-muted)] flex-1">2 studying with you</span>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-green-50 text-green-600 border border-green-200 rounded-full">In Sync</span>
      </div>
    </div>
  );
}
