


export function XpView() {
  const STATS = [
    { label: 'Sessions', value: '47', color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Reviews',  value: '12', color: 'text-blue-500',  bg: 'bg-blue-50' },
    { label: 'Badges',  value: '8',  color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Streaks', value: '5',  color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ];
  return (
    <div className="p-6">
      <div className="max-w-md space-y-4">
        {/* Main XP card */}
        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-8 text-center shadow-sm">
          <div className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-[2px] mb-3">Your XP</div>
          <div className="text-[64px] font-black leading-none bg-gradient-to-r from-[var(--color-amber)] to-orange-500 bg-clip-text text-transparent mb-2">1,280</div>
          <div className="text-[13px] text-[var(--color-text-muted)]">Rank #1 in Frontend Guild</div>

          <div className="h-px bg-gray-100 my-6" />

          <div className="grid grid-cols-4 gap-3">
            {STATS.map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-3`}>
                <div className={`text-[22px] font-black ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-[var(--color-text-muted)] font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Level progress */}
        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Progress to Level 4</div>
            <div className="text-[11px] font-bold text-[var(--color-amber)]">64%</div>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[12px] font-bold text-navy whitespace-nowrap">Level 3</span>
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[var(--color-amber)] to-orange-500 rounded-full transition-all" style={{ width: '64%' }} />
            </div>
            <span className="text-[12px] font-bold text-[var(--color-text-muted)] whitespace-nowrap">Level 4</span>
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] text-center">1,280 / 2,000 XP · 720 XP remaining</div>
        </div>

        {/* Recent XP log */}
        <div className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-[var(--color-border)]">
            <div className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Recent Activity</div>
          </div>
          {[
            { label: 'Quiz completed: React Hooks', xp: '+45', color: 'text-green-500', when: '2h ago' },
            { label: 'Attended Workshop: GSAP', xp: '+30', color: 'text-blue-500', when: 'Yesterday' },
            { label: 'Badge unlocked: Code Reviewer', xp: '+20', color: 'text-purple-500', when: '2d ago' },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--color-border)] last:border-b-0">
              <div className="flex-1 text-[12px] text-navy font-medium">{r.label}</div>
              <div className={`text-[13px] font-black ${r.color}`}>{r.xp}</div>
              <div className="text-[10px] text-[var(--color-text-muted)] w-16 text-right">{r.when}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
