


export function StudyRoomsView() {
  const ROOMS = [
    { name: 'Silent Focus Room', live: true, count: 4, users: [5, 22, 33, 44], mode: '🔇 Mics off · Cameras optional · Pomodoro synced' },
    { name: 'Group Study Room',  live: true, count: 6, users: [11, 15, 36, 55], mode: '🎙 Open mics · Video on · Discussion mode' },
  ];
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {ROOMS.map((r, i) => (
          <div key={i} className="bg-white border border-[var(--color-border)] rounded-2xl p-5 hover:border-orange-200 hover:shadow-sm transition-all">
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.live ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              <span className="text-[14px] font-bold text-navy flex-1">{r.name}</span>
              <span className="text-[11px] text-[var(--color-text-muted)]">{r.count} studying</span>
            </div>
            <div className="flex mb-3">
              {r.users.map((u, j) => (
                <img key={j} src={`https://i.pravatar.cc/40?img=${u}`} alt=""
                  className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm"
                  style={{ marginLeft: j === 0 ? 0 : '-8px' }}
                />
              ))}
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] mb-4 leading-relaxed">{r.mode}</p>
            <button className="w-full py-2.5 bg-gradient-to-r from-[var(--color-amber)] to-orange-500 text-white text-[12px] font-bold rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              Join Room
            </button>
          </div>
        ))}
      </div>
      <div className="p-5 border-2 border-dashed border-[var(--color-border)] rounded-2xl text-center cursor-pointer hover:border-orange-300 hover:bg-parchment transition-all group">
        <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">➕</span>
        <div className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Create a new study room</div>
        <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">Set your focus mode and invite study buddies</div>
      </div>
    </div>
  );
}
